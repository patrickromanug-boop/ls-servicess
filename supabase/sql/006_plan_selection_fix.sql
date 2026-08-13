-- 006_plan_selection_fix.sql
-- Run this in the Supabase SQL editor. Safe to re-run.
--
-- WHY: choosing a plan failed for some users. web_subscriptions.user_id has a
-- foreign key to public.profiles(id), so if a user has no profile row yet
-- (Google sign-in, trigger added after they signed up, or profile deleted),
-- web_ensure_subscription() blew up with a foreign-key violation and the
-- "Choose plan" button errored out.
--
-- FIX: both functions now self-heal the profile row first, then guarantee the
-- trial row exists, then save the chosen tier/cycle.

-- ---------------------------------------------------------------------------
-- 0. Helper: make sure the signed-in user has a profile row.
-- ---------------------------------------------------------------------------
create or replace function public.web_ensure_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _row public.profiles;
  _u record;
begin
  if _uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into _row from public.profiles where id = _uid;
  if found then
    return _row;
  end if;

  select id, email, raw_user_meta_data into _u from auth.users where id = _uid;

  insert into public.profiles (id, full_name, phone)
  values (
    _uid,
    nullif(trim(coalesce(_u.raw_user_meta_data ->> 'full_name',
                         _u.raw_user_meta_data ->> 'name',
                         split_part(coalesce(_u.email, ''), '@', 1))), ''),
    nullif(trim(coalesce(_u.raw_user_meta_data ->> 'phone', '')), '')
  )
  on conflict (id) do nothing;

  select * into _row from public.profiles where id = _uid;
  return _row;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Trial creator (idempotent, repairs null trial_ends_at, self-heals profile)
-- ---------------------------------------------------------------------------
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
  if _uid is null then
    raise exception 'Not authenticated';
  end if;

  perform public.web_ensure_profile();

  select * into _row from public.web_subscriptions where user_id = _uid;
  if found then
    if _row.status = 'trial' and _row.trial_ends_at is null then
      update public.web_subscriptions
         set trial_ends_at = coalesce(_row.period_started_at, now()) + interval '9 days'
       where user_id = _uid
      returning * into _row;
    end if;
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
  on conflict (user_id) do nothing;

  select * into _row from public.web_subscriptions where user_id = _uid;
  return _row;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Plan selection — never returns a null row, never depends on a
--    pre-existing profile/subscription.
-- ---------------------------------------------------------------------------
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
     set tier = _tier,
         billing_cycle = _cycle,
         updated_at = now()
   where user_id = _uid
  returning * into _row;

  if _row.id is null then
    raise exception 'Could not save your plan — no subscription row for this account';
  end if;

  return _row;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Grants
-- ---------------------------------------------------------------------------
revoke all on function public.web_ensure_profile() from public;
revoke all on function public.web_ensure_subscription() from public;
revoke all on function public.web_select_plan(text, text) from public;

grant execute on function public.web_ensure_profile() to authenticated;
grant execute on function public.web_ensure_subscription() to authenticated;
grant execute on function public.web_select_plan(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Backfill: profiles missing for existing auth users, and trial rows with
--    a null trial_ends_at.
-- ---------------------------------------------------------------------------
insert into public.profiles (id, full_name, phone)
select u.id,
       nullif(trim(coalesce(u.raw_user_meta_data ->> 'full_name',
                            u.raw_user_meta_data ->> 'name',
                            split_part(coalesce(u.email, ''), '@', 1))), ''),
       nullif(trim(coalesce(u.raw_user_meta_data ->> 'phone', '')), '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

update public.web_subscriptions
   set trial_ends_at = coalesce(period_started_at, now()) + interval '9 days'
 where status = 'trial'
   and trial_ends_at is null;
