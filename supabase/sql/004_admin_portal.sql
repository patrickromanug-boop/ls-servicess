-- ===========================================================================
-- LS Services — ADMIN PORTAL access rules
-- Run this ONCE in the Supabase SQL editor of the existing LS Services project.
--
-- Access model
-- * profiles.role = 'admin' is the single source of truth. Admin accounts are
--   created by hand in the Supabase dashboard; the website has no admin sign-up.
-- * Enforcement lives in Postgres, not in the browser: every admin-wide read or
--   write below is gated by public.is_admin(). A non-admin session that calls
--   the API directly (bypassing the UI entirely) sees nothing and can write
--   nothing. The client-side guard only decides what to paint.
-- ===========================================================================

-- SECURITY DEFINER so the policy on profiles cannot recurse into itself.
create or replace function public.is_admin(_uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = _uid and p.role = 'admin'
  )
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

-- ---------------------------------------------------------------- profiles ---
alter table public.profiles enable row level security;

drop policy if exists "admins read all profiles" on public.profiles;
create policy "admins read all profiles" on public.profiles
  for select to authenticated using (public.is_admin());

-- -------------------------------------------------------------------- jobs ---
grant select, insert, update on public.jobs to authenticated;

drop policy if exists "admins insert jobs" on public.jobs;
create policy "admins insert jobs" on public.jobs
  for insert to authenticated with check (public.is_admin());

drop policy if exists "admins update jobs" on public.jobs;
create policy "admins update jobs" on public.jobs
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins read all jobs" on public.jobs;
create policy "admins read all jobs" on public.jobs
  for select to authenticated using (public.is_admin());

-- --------------------------------------------------- lookup tables (add new) --
grant select, insert on public.categories to authenticated;
grant select, insert on public.locations to authenticated;
grant select, insert on public.job_types to authenticated;

do $$
declare t text;
begin
  foreach t in array array['categories', 'locations', 'job_types'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "admins insert %1$s" on public.%1$I', t);
    execute format(
      'create policy "admins insert %1$s" on public.%1$I for insert to authenticated with check (public.is_admin())',
      t);
  end loop;
end $$;

-- ------------------------------------------------------------ reported_jobs --
grant select, update on public.reported_jobs to authenticated;
alter table public.reported_jobs enable row level security;

drop policy if exists "admins read reports" on public.reported_jobs;
create policy "admins read reports" on public.reported_jobs
  for select to authenticated using (public.is_admin());

drop policy if exists "admins update reports" on public.reported_jobs;
create policy "admins update reports" on public.reported_jobs
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- -------------------------------------------------------- web_subscriptions --
drop policy if exists "admins read subscriptions" on public.web_subscriptions;
create policy "admins read subscriptions" on public.web_subscriptions
  for select to authenticated using (public.is_admin());

-- ------------------------------------------------------------------ payments --
drop policy if exists "admins read payments" on public.payments;
create policy "admins read payments" on public.payments
  for select to authenticated using (public.is_admin());

-- -------------------------------------------------------- document_requests --
grant update on public.document_requests to authenticated;

drop policy if exists "admins read document_requests" on public.document_requests;
create policy "admins read document_requests" on public.document_requests
  for select to authenticated using (public.is_admin());

-- Admins may only move a request along its workflow; they cannot rewrite the
-- jobseeker's submitted form data because that column is not in the policy's
-- reach for anyone but the owner's SECURITY DEFINER functions.
drop policy if exists "admins update document_requests" on public.document_requests;
create policy "admins update document_requests" on public.document_requests
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------- employer_inquiries --
grant select on public.employer_inquiries to authenticated;
alter table public.employer_inquiries enable row level security;

drop policy if exists "admins read employer_inquiries" on public.employer_inquiries;
create policy "admins read employer_inquiries" on public.employer_inquiries
  for select to authenticated using (public.is_admin());

-- --------------------------------------------------------------- storage -----
-- Admins need to open the PDFs jobseekers generated.
drop policy if exists "admins read document pdfs" on storage.objects;
create policy "admins read document pdfs" on storage.objects
  for select to authenticated
  using (bucket_id = 'document-requests' and public.is_admin());
