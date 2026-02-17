/*
  Idempotent migration to ensure realtime chat works on public.messages

  What it does:
  - Adds public.messages to supabase_realtime publication (required for postgres_changes)
  - Enables RLS with participant-scoped policies via public.bookings
  - Sets sane defaults and indexes for performance
  - Safe to run multiple times
*/

begin;

-- 1) Ensure created_at has a UTC default (won't overwrite existing values)
alter table if exists public.messages
  alter column created_at set default timezone('utc'::text, now());

-- 2) Helpful indexes for chat queries and realtime consumers
create index if not exists messages_booking_created_idx
  on public.messages (booking_id, created_at desc);

create index if not exists messages_sender_created_idx
  on public.messages (sender_auth_id, created_at desc);

-- 3) Ensure updates can be replicated reliably (helpful if you support edits)
alter table if exists public.messages
  replica identity full;

-- 4) Add table to the supabase_realtime publication if missing
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
end
$$;

-- 5) Enable row level security
alter table if exists public.messages enable row level security;

-- 6) Participant-based RLS policies via bookings
--    Learner or Teacher associated with the booking can read/insert/update

drop policy if exists "messages_read_by_participants" on public.messages;
create policy "messages_read_by_participants" on public.messages
for select
using (
  exists (
    select 1
    from public.bookings b
    where b.id = messages.booking_id
      and (
        b.learner_auth_id = auth.uid()
        or b.teacher_auth_id = auth.uid()
      )
  )
);

drop policy if exists "messages_insert_by_participants" on public.messages;
create policy "messages_insert_by_participants" on public.messages
for insert
with check (
  exists (
    select 1
    from public.bookings b
    where b.id = messages.booking_id
      and (
        b.learner_auth_id = auth.uid()
        or b.teacher_auth_id = auth.uid()
      )
  )
);

drop policy if exists "messages_update_by_participants" on public.messages;
create policy "messages_update_by_participants" on public.messages
for update
using (
  exists (
    select 1
    from public.bookings b
    where b.id = messages.booking_id
      and (
        b.learner_auth_id = auth.uid()
        or b.teacher_auth_id = auth.uid()
      )
  )
)
with check (
  exists (
    select 1
    from public.bookings b
    where b.id = messages.booking_id
      and (
        b.learner_auth_id = auth.uid()
        or b.teacher_auth_id = auth.uid()
      )
  )
);

commit;

/* Optional verification queries (run manually after the migration):
-- Check publication:
select pubname, schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime' and tablename = 'messages';

-- Quick RLS sanity: should return rows only for the current user's bookings
select count(*) from public.messages;
*/
