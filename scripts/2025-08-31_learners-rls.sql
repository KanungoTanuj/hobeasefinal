-- Enable RLS on learners (safe if already enabled)
alter table public.learners enable row level security;

-- Allow a user to see their own learner row
drop policy if exists learners_select_own on public.learners;
create policy learners_select_own on public.learners
for select
using (auth.uid() = auth_id);

-- Allow a user to insert their own learner row
drop policy if exists learners_insert_self on public.learners;
create policy learners_insert_self on public.learners
for insert
with check (auth.uid() = auth_id);

-- Allow a user to update their own learner row
drop policy if exists learners_update_own on public.learners;
create policy learners_update_own on public.learners
for update
using (auth.uid() = auth_id)
with check (auth.uid() = auth_id);

-- Helpful index for lookups by auth_id
create index if not exists idx_learners_auth_id on public.learners(auth_id);
