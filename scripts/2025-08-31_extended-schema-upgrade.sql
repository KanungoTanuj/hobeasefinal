-- Hobease Extended Schema Upgrade
-- Safe to run multiple times (idempotent patterns used where supported)

-- Requirements for gen_random_uuid()
create extension if not exists pgcrypto;

-- 1) Search history: track what learners search for
create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid references public.learners(id) on delete cascade,
  query text not null,
  created_at timestamptz default now()
);

-- 2) Learner preferences: user-tunable search filters
create table if not exists public.learner_preferences (
  learner_id uuid primary key references public.learners(id) on delete cascade,
  skill_level text check (skill_level in ('Beginner','Intermediate','Advanced')),
  price_sensitivity int check (price_sensitivity between 1 and 5),
  preferred_categories text[]
);

-- 3) Teacher ratings (per booking)
create table if not exists public.teacher_ratings (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public."Teachers"(id) on delete cascade,
  learner_id uuid references public.learners(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- 4) Indexes for performance
create index if not exists idx_search_history_learner on public.search_history(learner_id, created_at desc);
create index if not exists idx_teacher_ratings_teacher on public.teacher_ratings(teacher_id, created_at desc);
create index if not exists idx_teacher_ratings_booking on public.teacher_ratings(booking_id);

-- 5) Learners activity tracking (columns may already exist based on your schema)
alter table public.learners
  add column if not exists last_active timestamptz default now(),
  add column if not exists total_searches int default 0,
  add column if not exists total_bookings int default 0;

-- ============================
-- Row Level Security (RLS)
-- ============================

-- Ensure RLS is enabled
alter table public.search_history enable row level security;
alter table public.learner_preferences enable row level security;
alter table public.teacher_ratings enable row level security;

-- Helper: quick lookup of current learner/teacher id via auth.uid()
-- NOTE: These are used inside policy EXISTS subqueries.

-- Policies for search_history (learner can insert/select their own)
drop policy if exists sh_select_own on public.search_history;
create policy sh_select_own on public.search_history
  for select
  using (
    exists (
      select 1
      from public.learners l
      where l.id = search_history.learner_id
        and l.auth_id = auth.uid()
    )
  );

drop policy if exists sh_insert_own on public.search_history;
create policy sh_insert_own on public.search_history
  for insert
  with check (
    exists (
      select 1
      from public.learners l
      where l.id = search_history.learner_id
        and l.auth_id = auth.uid()
    )
  );

-- Policies for learner_preferences (learner can read/update their own)
drop policy if exists lp_select_own on public.learner_preferences;
create policy lp_select_own on public.learner_preferences
  for select
  using (
    exists (
      select 1
      from public.learners l
      where l.id = learner_preferences.learner_id
        and l.auth_id = auth.uid()
    )
  );

drop policy if exists lp_insert_own on public.learner_preferences;
create policy lp_insert_own on public.learner_preferences
  for insert
  with check (
    exists (
      select 1
      from public.learners l
      where l.id = learner_preferences.learner_id
        and l.auth_id = auth.uid()
    )
  );

drop policy if exists lp_update_own on public.learner_preferences;
create policy lp_update_own on public.learner_preferences
  for update
  using (
    exists (
      select 1
      from public.learners l
      where l.id = learner_preferences.learner_id
        and l.auth_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.learners l
      where l.id = learner_preferences.learner_id
        and l.auth_id = auth.uid()
    )
  );

-- Policies for teacher_ratings
-- Select: visible to the learner who rated OR the teacher who received the rating
drop policy if exists tr_select_participants on public.teacher_ratings;
create policy tr_select_participants on public.teacher_ratings
  for select
  using (
    exists (
      select 1
      from public.learners l
      where l.id = teacher_ratings.learner_id
        and l.auth_id = auth.uid()
    )
    or
    exists (
      select 1
      from public."Teachers" t
      where t.id = teacher_ratings.teacher_id
        and t.auth_id = auth.uid()
    )
  );

-- Insert: only the learner in the related booking may rate
drop policy if exists tr_insert_by_booking_learner on public.teacher_ratings;
create policy tr_insert_by_booking_learner on public.teacher_ratings
  for insert
  with check (
    exists (
      select 1
      from public.bookings b
      join public.learners l on l.id = b.learner_id
      where b.id = teacher_ratings.booking_id
        and l.id = teacher_ratings.learner_id
        and l.auth_id = auth.uid()
    )
  );

-- (Optional) prevent updates/deletes by users; rely on admins/service role
-- If you do want learners to edit/delete their own ratings, add policies similar to above.

-- ============================
-- Optional helpers
-- ============================

-- a) RPC to increment total_searches (used by frontend example)
create or replace function public.increment_total_searches(p_learner_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.learners
  set total_searches = coalesce(total_searches, 0) + 1
  where id = p_learner_id;
$$;

-- Allow calling the function (RLS does not apply to functions with SECURITY DEFINER)
revoke all on function public.increment_total_searches(uuid) from public;
grant execute on function public.increment_total_searches(uuid) to authenticated;

-- b) Trigger to increment total_bookings whenever a booking is created
create or replace function public.inc_learner_total_bookings()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.learners
  set total_bookings = coalesce(total_bookings, 0) + 1
  where id = new.learner_id;
  return new;
end;
$$;

drop trigger if exists trg_bookings_inc_total on public.bookings;
create trigger trg_bookings_inc_total
after insert on public.bookings
for each row
execute procedure public.inc_learner_total_bookings();

-- c) (Optional) Aggregated view for teacher average rating
create or replace view public.teacher_rating_stats as
select
  teacher_id,
  avg(rating)::numeric(10,2) as avg_rating,
  count(*)::int as ratings_count
from public.teacher_ratings
group by teacher_id;
