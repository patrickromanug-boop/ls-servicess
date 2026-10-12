-- 007_trial_starts_on_plan_pick.sql
-- Run this in the Supabase SQL editor AFTER 006. Safe to re-run.
-- Do NOT re-run 006 afterwards (its backfill would start every pending trial).
--
-- WHY: the 9-day trial used to start the moment someone registered, so users
-- who signed up and came back later had already lost days. Now:
--   * signup / first visit creates a subscription row with status 'trial' and
--     trial_ends_at = NULL  -> "trial not started yet" (no paid features)
--   * the clock starts only when the user picks a plan (web_start_trial)
--   * repeat phone numbers still get an 'expired' row straight away.

-- 1. Row creator: no longer starts the clock, no longer "repairs" null dates.
create or replace function public.web_ensure_subscription()
returns public.web_subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _row public.web_subscriptions;
  _phone text;
  _abused boolean := false;
begin
  if _uid is null then raise exception 'Not authenticated'; end if;

  perform public.web_ensure_profile();

  select * into _row from public.web_subscriptions where user_id = _uid;
  if found then return _row; end if;

  select nullif(trim(phone), '') into _phone from public.profiles where id = _uid;
  if _phone is not null then
    select exists (
      select 1 from public.profiles p
      join public.web_subscriptions s on s.user_id = p.id
      where p.id <> _uid and nullif(trim(p.phone), '') = _phone
    ) into _abused;
  end if;

  insert into public.web_subscriptions (user_id, status, trial_ends_at)
  values (_uid, case when _abused then 'expired' else 'trial' end, null)
  on conflict (user_id) do nothing;

  select * into _row from public.web_subscriptions where user_id = _uid;
  return _row;
end;
$$;

-- 2. Starts the 9-day clock the first time the user picks a plan. Idempotent:
--    an already-running or expired trial is left untouched.
create or replace function public.web_start_trial()
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

  perform public.web_ensure_subscription();

  update public.web_subscriptions
     set trial_ends_at = now() + interval '9 days',
         period_started_at = now(),
         updated_at = now()
   where user_id = _uid
     and status = 'trial'
     and trial_ends_at is null;

  select * into _row from public.web_subscriptions where user_id = _uid;
  return _row;
end;
$$;

revoke all on function public.web_start_trial() from public;
grant execute on function public.web_start_trial() to authenticated;
grant execute on function public.web_ensure_subscription() to authenticated;

-- 3. Plan selection also starts the trial.
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

  perform public.web_start_trial();

  update public.web_subscriptions
     set tier = _tier, billing_cycle = _cycle, updated_at = now()
   where user_id = _uid
  returning * into _row;

  if _row.id is null then
    raise exception 'Could not save your plan — no subscription row for this account';
  end if;
  return _row;
end;
$$;

-- 4. Document allowance: a trial that has not started is NOT unlimited.

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
  if _sub.status = 'trial' and _sub.trial_ends_at is not null and _sub.trial_ends_at > now() then
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

