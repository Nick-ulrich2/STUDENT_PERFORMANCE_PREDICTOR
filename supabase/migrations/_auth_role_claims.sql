create or replace function public.sync_user_role_to_app_metadata()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if jsonb_typeof(coalesce(new.raw_user_meta_data, '{}'::jsonb)) = 'object'
     and new.raw_user_meta_data ? 'role'
     and new.raw_user_meta_data->>'role' in ('student', 'admin')
  then
    new.app_metadata = coalesce(new.app_metadata, '{}'::jsonb)
      || jsonb_build_object('role', new.raw_user_meta_data->>'role');
  end if;
  return new;
end;
$$;

drop trigger if exists sync_user_role_to_app_metadata on auth.users;
create trigger sync_user_role_to_app_metadata
before insert or update of raw_user_meta_data on auth.users
for each row
execute function public.sync_user_role_to_app_metadata();
