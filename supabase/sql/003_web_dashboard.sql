-- ===========================================================================
-- LS Services — website subscriptions / payments / document requests
-- Run this ONCE in the Supabase SQL editor of the existing LS Services project.
--
-- Design notes
-- * The client can only READ its own rows. Every write goes through a
--   SECURITY DEFINER function below, so a user cannot grant themselves a plan,
--   fake a payment, or bypass document-generation limits by editing requests.
-- * Account deletion is a HARD delete of all app rows (profile,
--   web_subscriptions, payments, document_requests). The auth.users row itself
--   can only be removed with the service key, so it is left in place; the user
--   is signed out and has no profile, which is the practical equivalent.
-- ===========================================================================

-- ---------------------------------------------------------------- tables ----
create table if not exists public.web_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  tier text check (tier in ('basic', 'pro', 'premium')),
  billing_cycle text check (billing_cycle in ('weekly', 'monthly')),
  status text not null default 'trial' check (status in ('trial', 'active', 'expired')),
  trial_ends_at timestamptz,
  renewal_date timestamptz,
  document_generations_used_this_period integer not null default 0,
  period_started_at timestamptz not null default now(),
  payment_provider_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12, 2) not null,
  tier text check (tier in ('basic', 'pro', 'premium')),
  billing_cycle text check (billing_cycle in ('weekly', 'monthly')),
  status text not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.document_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null,
  form_data jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'sent_to_admin', 'completed')),
  pdf_url text,
  created_at timestamptz not null default now()
);

create index if not exists document_requests_user_idx on public.document_requests (user_id, created_at desc);
create index if not exists payments_user_idx on public.payments (user_id, created_at desc);

-- ---------------------------------------------------------------- grants ----
-- READ ONLY for the client. All writes happen in the functions further down.
grant select on public.web_subscriptions to authenticated;
grant select on public.payments to authenticated;
grant select on public.document_requests to authenticated;
grant all on public.web_subscriptions to service_role;
grant all on public.payments to service_role;
grant all on public.document_requests to service_role;

-- ------------------------------------------------------------------- RLS ----
alter table public.web_subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.document_requests enable row level security;

drop policy if exists "own web_subscriptions" on public.web_subscriptions;
create policy "own web_subscriptions" on public.web_subscriptions
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own payments" on public.payments;
create policy "own payments" on public.payments
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own document_requests" on public.document_requests;
create policy "own document_requests" on public.document_requests
  for select to authenticated using (auth.uid() = user_id);

-- ------------------------------------------------------------- functions ----

-- Creates the subscription row for the signed-in user if it does not exist.
-- Trial-abuse guard: if ANY other profile sharing this user's phone number has
-- ever had a web_subscriptions row, the new row starts as 'expired' instead of
-- getting a fresh 9-day trial.
create or replace function public.web_ensure_subscription()
returns public.web_subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _phone text;
  _abused boolean := false;
  _row public.web_subscriptions;
begin
  if _uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into _row from public.web_subscriptions where user_id = _uid;
  if found then
    return _row;
  end if;

  select nullif(trim(phone), '') into _phone from public.profiles where id = _uid;

  if _phone is not null then
    select exists (
      select 1
      from public.profiles p
      join public.web_subscriptions s on s.user_id = p.id
      where p.id <> _uid
        and nullif(trim(p.phone), '') = _phone
    ) into _abused;
  end if;

  insert into public.web_subscriptions (user_id, status, trial_ends_at)
  values (
    _uid,
    case when _abused then 'expired' else 'trial' end,
    case when _abused then null else now() + interval '9 days' end
  )
  returning * into _row;

  return _row;
end;
$$;

-- Records the tier/billing cycle the user picked. Deliberately does NOT set
-- status = 'active': that only happens once a real payment is confirmed
-- (server-side, when Pesapal is wired up).
create or replace function public.web_select_plan(_tier text, _cycle text)
returns public.web_subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _row public.web_subscriptions;
begin
  if _uid is null then raise exception 'Not authenticated'; end if;
  if _tier not in ('basic', 'pro', 'premium') then raise exception 'Invalid tier'; end if;
  if _cycle not in ('weekly', 'monthly') then raise exception 'Invalid billing cycle'; end if;

  perform public.web_ensure_subscription();

  update public.web_subscriptions
     set tier = _tier, billing_cycle = _cycle, updated_at = now()
   where user_id = _uid
  returning * into _row;

  return _row;
end;
$$;

-- Enforces the tier's monthly document allowance and increments the counter in
-- the same transaction as the insert, so the limit cannot be raced or bypassed.
create or replace function public.web_create_document_request(_type text, _form jsonb)
returns public.document_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _sub public.web_subscriptions;
  _allowance integer;
  _req public.document_requests;
begin
  if _uid is null then raise exception 'Not authenticated'; end if;
  if _type not in ('cv', 'cover_letter', 'application_letter') then
    raise exception 'Invalid document type';
  end if;

  _sub := public.web_ensure_subscription();

  -- roll the counting period forward monthly
  if _sub.period_started_at < now() - interval '30 days' then
    update public.web_subscriptions
       set document_generations_used_this_period = 0,
           period_started_at = now(),
           updated_at = now()
     where user_id = _uid
    returning * into _sub;
  end if;

  -- allowance: null means unlimited
  if _sub.status = 'trial' and (_sub.trial_ends_at is null or _sub.trial_ends_at > now()) then
    _allowance := null;                       -- unlimited during the free trial
  elsif _sub.tier = 'premium' then
    _allowance := null;                       -- unlimited
  elsif _sub.tier = 'pro' then
    _allowance := 3;
  elsif _sub.tier = 'basic' then
    _allowance := 1;
  else
    _allowance := 0;                          -- no plan, no trial
  end if;

  if _allowance is not null
     and _sub.document_generations_used_this_period >= _allowance then
    raise exception 'DOCUMENT_LIMIT_REACHED';
  end if;

  insert into public.document_requests (user_id, document_type, form_data, status)
  values (_uid, _type, coalesce(_form, '{}'::jsonb), 'pending')
  returning * into _req;

  update public.web_subscriptions
     set document_generations_used_this_period = document_generations_used_this_period + 1,
         updated_at = now()
   where user_id = _uid;

  return _req;
end;
$$;

-- Attaches the generated PDF's storage path and flags the request for admin.
create or replace function public.web_attach_document_pdf(_id uuid, _pdf_url text)
returns public.document_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _req public.document_requests;
begin
  if _uid is null then raise exception 'Not authenticated'; end if;

  update public.document_requests
     set pdf_url = _pdf_url, status = 'sent_to_admin'
   where id = _id and user_id = _uid
  returning * into _req;

  if not found then raise exception 'Request not found'; end if;
  return _req;
end;
$$;

-- Hard delete of every app row belonging to the signed-in user.
create or replace function public.web_delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
begin
  if _uid is null then raise exception 'Not authenticated'; end if;

  delete from public.document_requests where user_id = _uid;
  delete from public.payments where user_id = _uid;
  delete from public.web_subscriptions where user_id = _uid;
  delete from public.profiles where id = _uid;
end;
$$;

revoke all on function public.web_ensure_subscription() from public;
revoke all on function public.web_select_plan(text, text) from public;
revoke all on function public.web_create_document_request(text, jsonb) from public;
revoke all on function public.web_attach_document_pdf(uuid, text) from public;
revoke all on function public.web_delete_account() from public;

grant execute on function public.web_ensure_subscription() to authenticated;
grant execute on function public.web_select_plan(text, text) to authenticated;
grant execute on function public.web_create_document_request(text, jsonb) to authenticated;
grant execute on function public.web_attach_document_pdf(uuid, text) to authenticated;
grant execute on function public.web_delete_account() to authenticated;

-- --------------------------------------------------------------- storage ----
-- Create a PRIVATE bucket named "document-requests" in Storage first, then:
drop policy if exists "own folder upload" on storage.objects;
create policy "own folder upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'document-requests'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "own folder read" on storage.objects;
create policy "own folder read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'document-requests'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
