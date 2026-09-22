-- Security hardening: several RLS policies still trusted auth.jwt() ->> 'user_role'
-- and/or auth.jwt() ->> 'role' as fallbacks alongside app_metadata.role. Neither is
-- a trustworthy source of the application role: 'user_role' mirrors data a client
-- can set at signup (the same bug class already fixed in app/auth.py::_extract_role
-- and in 20260922_02_remove_insecure_role_sync_trigger.sql), and 'role' is the
-- Postgres/PostgREST session role claim ("authenticated"), not an application
-- permission level. Only app_metadata.role is written exclusively by trusted
-- server-side code (the signup trigger, or a manual admin promotion) and is safe
-- to authorize on.
--
-- This migration is a plain drop + recreate of every policy that used the old
-- coalesce(...) pattern, so it is safe to run standalone and wins regardless of
-- the order earlier migrations were applied in.

-- 1. predictions (originally defined in _predictions_policies.sql)
drop policy if exists "students can read their own predictions" on public.predictions;
create policy "students can read their own predictions"
on public.predictions
for select
to authenticated
using (
    auth.uid() = user_id
    and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'student'
);

drop policy if exists "admins can read all predictions" on public.predictions;
create policy "admins can read all predictions"
on public.predictions
for select
to authenticated
using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
);

drop policy if exists "students can insert their own predictions" on public.predictions;
create policy "students can insert their own predictions"
on public.predictions
for insert
to authenticated
with check (
    auth.uid() = user_id
    and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'student'
);

drop policy if exists "admins can insert predictions" on public.predictions;
create policy "admins can insert predictions"
on public.predictions
for insert
to authenticated
with check (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
);

-- 2. model_versions (originally defined in _create_model_versions.sql, then
-- re-defined with a wider coalesce in 20260922_fix_profiles_rls_and_model_versions.sql)
drop policy if exists "admins can insert model versions" on public.model_versions;
create policy "admins can insert model versions"
on public.model_versions
for insert
to authenticated
with check (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
);

drop policy if exists "admins can update model versions" on public.model_versions;
create policy "admins can update model versions"
on public.model_versions
for update
to authenticated
using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
)
with check (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
);

drop policy if exists "admins can delete model versions" on public.model_versions;
create policy "admins can delete model versions"
on public.model_versions
for delete
to authenticated
using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
);

-- 3. profiles: same bug, same fix. Outside the originally reported scope
-- (predictions/model_versions) but the identical vulnerability class on the
-- same auth boundary, found while hardening the rest of the schema -- left
-- unfixed, a forged top-level "user_role"/"role" claim could still read every
-- student's profile. profiles_users_can_insert_own_profile and
-- profiles_users_can_update_own_profile were already corrected by
-- 20260922_03_activity_logs_and_profile_attributes.sql and are not touched here.
drop policy if exists "profiles_admin_can_read_all" on public.profiles;
create policy "profiles_admin_can_read_all"
on public.profiles
for select
to authenticated
using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
);
