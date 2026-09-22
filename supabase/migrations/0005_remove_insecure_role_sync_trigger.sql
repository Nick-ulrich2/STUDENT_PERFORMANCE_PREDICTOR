-- Security fix: sync_user_role_to_app_metadata (see _auth_role_claims.sql)
-- copied raw_user_meta_data.role -- a value the CLIENT supplies at signup via
-- supabase.auth.signUp({ options: { data: { role: '...' } } }) -- straight
-- into app_metadata.role, the claim that both this backend (app/auth.py) and
-- every RLS policy in this schema treat as trusted. Combined with the
-- backend previously also reading user_metadata.role as a fallback, this
-- meant anyone could call Supabase Auth signup directly (bypassing the
-- Next.js frontend, which only ever sends role: 'student') with
-- data: { role: 'admin' } and be granted a real admin account.
--
-- This migration removes that trigger/function and replaces it with one that
-- unconditionally assigns 'student' on INSERT only, ignoring whatever role
-- value the client submitted. It never fires on UPDATE, so a user editing
-- their own profile metadata later (full_name, etc.) cannot reset an
-- admin's role back to student. There is still no public path to the
-- 'admin' role: promotion remains a manual, server-side action (Supabase
-- dashboard or the Admin API with the service_role key), exactly as decided
-- in docs/ADR-001-supabase-auth-and-roles.md.

drop trigger if exists sync_user_role_to_app_metadata on auth.users;
drop function if exists public.sync_user_role_to_app_metadata();

create or replace function public.assign_default_role_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  -- Always 'student', regardless of any role the client sent at signup.
  new.app_metadata = coalesce(new.app_metadata, '{}'::jsonb)
    || jsonb_build_object('role', 'student');
  return new;
end;
$$;

drop trigger if exists assign_default_role_on_signup on auth.users;
create trigger assign_default_role_on_signup
before insert on auth.users
for each row
execute function public.assign_default_role_on_signup();
