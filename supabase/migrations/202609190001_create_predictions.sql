-- Student Performance Predictor: prediction persistence and RLS.
-- Run this file in the Supabase Dashboard SQL Editor.

create table if not exists public.predictions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    "Attendance" double precision not null,
    "Hours_Studied" double precision not null,
    "Previous_Scores" double precision not null,
    "Tutoring_Sessions" integer not null,
    "Access_to_Resources" text not null,
    "Parental_Involvement" text not null,
    predicted_score double precision not null,
    model_name text not null,
    created_at timestamptz not null default now()
);

alter table public.predictions enable row level security;

-- Students can read only predictions belonging to their authenticated user.
create policy "students can read their own predictions"
on public.predictions
for select
to authenticated
using (
    auth.uid() = user_id
    and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'user_role') = 'student'
);

-- Students can insert only a prediction whose owner is the authenticated user.
create policy "students can insert their own predictions"
on public.predictions
for insert
to authenticated
with check (
    auth.uid() = user_id
    and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'user_role') = 'student'
);

-- Admins can read every prediction, but this migration grants no admin write policy.
create policy "admins can read all predictions"
on public.predictions
for select
to authenticated
using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'user_role') = 'admin'
);

comment on table public.predictions is
    'Immutable prediction snapshots owned by Supabase Auth users.';
comment on column public.predictions.user_id is
    'Owner from auth.users; RLS derives ownership from auth.uid().';
