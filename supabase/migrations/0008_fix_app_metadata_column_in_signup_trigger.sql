-- Bug fix: 20260922_02_remove_insecure_role_sync_trigger.sql introduced
-- assign_default_role_on_signup(), a BEFORE INSERT trigger on auth.users
-- meant to unconditionally stamp every new user with role = 'student' in
-- their app_metadata JWT claim.
--
-- That function wrote `new.app_metadata := ...`, but `auth.users` has no
-- column literally named `app_metadata`. The real column Supabase Auth
-- (GoTrue) reads from when it mints the `app_metadata` JWT claim is
-- `raw_app_meta_data` (jsonb) -- `app_metadata` only exists as the claim
-- name, never as a row/column you can assign to in PL/pgSQL.
--
-- Effect in production: every single signup failed. Postgres raised
--   42703: record "new" has no field "app_metadata"
-- inside the trigger, aborting the transaction (visible right after as
--   25P02: current transaction is aborted, commands ignored until end of
--   transaction block
-- ), which Supabase Auth surfaced to the client as a generic 500
--   "Database error saving new user"
-- on POST /auth/v1/signup.
--
-- This migration replaces the function with a corrected version that
-- writes to the actual `raw_app_meta_data` column. Behavior is otherwise
-- identical to 20260922_02: still BEFORE INSERT only (so it can never
-- reset an existing admin's role back to student on a later UPDATE), and
-- it still ignores whatever role value the client submitted at signup,
-- unconditionally assigning 'student'. There is still no public path to
-- the 'admin' role: promotion remains a manual, server-side action.

create or replace function public.assign_default_role_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  -- Always 'student', regardless of any role the client sent at signup.
  -- raw_app_meta_data is the real column on auth.users; `app_metadata` is
  -- only the JWT claim name GoTrue derives from it -- it does not exist as
  -- a column/record field, which is exactly the bug this migration fixes.
  new.raw_app_meta_data = coalesce(new.raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', 'student');
  return new;
end;
$$;

drop trigger if exists assign_default_role_on_signup on auth.users;
create trigger assign_default_role_on_signup
before insert on auth.users
for each row
execute function public.assign_default_role_on_signup();
