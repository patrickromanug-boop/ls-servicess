-- 005_trial_ends_at_fix.sql
-- Run this in the Supabase SQL editor.
--
-- 1) Guarantees every NEW trial subscription row gets trial_ends_at = created + 9 days.
-- 2) Backfills trial_ends_at for existing trial rows where it is currently null.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Canonical trial creator used by the website (src/lib/account.ts →
--    ensureWebSubscription()). Repeat phone numbers get an already-expired row.
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

  select * into _row from public.web_subscriptions where user_id = _uid;
  if found then
    -- Repair legacy rows that were created without a trial end date.
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
  returning * into _row;

  return _row;
end;
$$;

grant execute on function public.web_ensure_subscription() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Backfill: existing trial rows with a null trial_ends_at.
--    9 days from the user's profile creation date (falls back to the
--    subscription row's own start date, then now()).
-- ---------------------------------------------------------------------------
update public.web_subscriptions s
   set trial_ends_at = coalesce(p.created_at, s.period_started_at, now()) + interval '9 days'
  from public.profiles p
 where p.id = s.user_id
   and s.status = 'trial'
   and s.trial_ends_at is null;

-- Any trial rows with no matching profile row at all.
update public.web_subscriptions
   set trial_ends_at = coalesce(period_started_at, now()) + interval '9 days'
 where status = 'trial'
   and trial_ends_at is null;
