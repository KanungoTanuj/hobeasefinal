-- Purpose: Make messages truly realtime and secure.
-- - Adds messages (and bookings) to the supabase_realtime publication
-- - Ensures created_at default
-- - Adds performant indexes
-- - Enables RLS with scoped policies (participants of a booking only)
-- - Optional grants for 'authenticated' role

set check_function_bodies = off;

-- 1) Ensure created_at has a sane default
alter table if exists public.messages
  alter column created_at set default now();

-- 2) Helpful composite index for fast retrieval by booking and time
create index if not exists idx_messages_booking_created_at
  on public.messages (booking_id, created_at desc);

-- 3) Add messages (and bookings) to the realtime publication
--    This enables Postgres logical replication events for these tables.
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

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bookings'
  ) then
    execute 'alter publication supabase_realtime add table public.bookings';
  end if;
end$$;

-- 4) Ensure a foreign key from messages.booking_id -> bookings.id (if not already)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_booking_id_fkey'
  ) then
    alter table public.messages
      add constraint messages_booking_id_fkey
      foreign key (booking_id) references public.bookings(id)
      on delete cascade;
  end if;
end$$;

-- 5) Enable Row Level Security (RLS) on messages
alter table if exists public.messages enable row level security;

-- 6) Policies:
--    Only participants of a booking (learner or teacher matched by auth.uid()) can read/send.
--    We also assert that sender_auth_id = auth.uid() on insert.
drop policy if exists "read own booking messages" on public.messages;
create policy "read own booking messages"
  on public.messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.bookings b
      where b.id = messages.booking_id
        and (b.learner_auth_id = auth.uid() or b.teacher_auth_id = auth.uid())
    )
  );

drop policy if exists "send message in own booking" on public.messages;
create policy "send message in own booking"
  on public.messages
  for insert
  to authenticated
  with check (
    messages.sender_auth_id = auth.uid()
    and exists (
      select 1
      from public.bookings b
      where b.id = messages.booking_id
        and (b.learner_auth_id = auth.uid() or b.teacher_auth_id = auth.uid())
    )
  );

-- Optional: allow editing/deleting own message (usually not needed; comment out if undesired)
-- drop policy if exists "edit own message" on public.messages;
-- create policy "edit own message"
--   on public.messages
--   for update
--   to authenticated
--   using (sender_auth_id = auth.uid())
--   with check (sender_auth_id = auth.uid());

-- 7) Optional grants (RLS still applies)
grant usage on schema public to authenticated;
grant select, insert on public.messages to authenticated;

-- 8) Verify publication membership (for debugging)
-- select * from pg_publication_tables where pubname = 'supabase_realtime';
