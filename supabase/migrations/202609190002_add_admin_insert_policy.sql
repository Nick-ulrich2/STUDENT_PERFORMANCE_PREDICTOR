-- Allow admins to insert prediction snapshots while preserving user ownership.
create policy "admins can insert predictions"
on public.predictions
for insert
to authenticated
with check (
    auth.uid() = user_id
    and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'user_role') = 'admin'
);
