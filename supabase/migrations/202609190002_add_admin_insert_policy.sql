-- Student Performance Predictor: complete predictions RLS policies.

drop policy if exists "students can read their own predictions"
on public.predictions;
drop policy if exists "admins can read all predictions"
on public.predictions;
create policy "students can read their own predictions"
on public.predictions
for select
to authenticated
using (
    auth.uid() = user_id
    and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'user_role') = 'student'
);
create policy "admins can read all predictions"
on public.predictions
for select
to authenticated
using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'user_role') = 'admin'
);

drop policy if exists "students can insert their own predictions"
on public.predictions;
drop policy if exists "admins can insert predictions"
on public.predictions;
create policy "students can insert their own predictions"
on public.predictions
for insert
to authenticated
with check (
    auth.uid() = user_id
    and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'user_role') = 'student'
);
create policy "admins can insert predictions"
on public.predictions
for insert
to authenticated
with check (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'user_role') = 'admin'
);
