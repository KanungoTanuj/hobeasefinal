-- 2025-08-30: Enable realtime for messages + secure RLS + indexes
-- Add publication, indexes, defaults, and RLS policies for realtime chat.

-- 1) Ensure created_at has a sane default
alter table public.messages
  alter column created_at set default timezone('utc'::text, now());

-- 2) Helpful index for fast chronological reads per booking
create index if not exists idx_messages_booking_id_created_at
  on public.messages (booking_id, created_at);

-- 3) Add messages to the realtime publication so `postgres_changes` fires
--    Safe to run repeatedly; subsequent runs will no-op.
alter publication supabase_realtime add table public.messages;

-- 4) Row Level Security: restrict access to booking participants
alter table public.messages enable row level security;

-- Drop existing policies if they exist (idempotent changes)
drop policy if exists "messages_select_participants" on public.messages;
drop policy if exists "messages_insert_participants" on public.messages;
drop policy if exists "messages_update_sender_only" on public.messages;

-- Allow SELECT for participants (learner or teacher) of the booking
create policy "messages_select_participants"
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

-- Allow INSERT for participants only, and require sender_auth_id = auth.uid()
create policy "messages_insert_participants"
on public.messages
for insert
to authenticated
with check (
  exists (
    select 1
    from public.bookings b
    where b.id = booking_id
      and (b.learner_auth_id = auth.uid() or b.teacher_auth_id = auth.uid())
  )
  and sender_auth_id = auth.uid()
);

-- Optional: Allow UPDATE by the original sender (e.g., edits/read flags if you add them)
create policy "messages_update_sender_only"
on public.messages
for update
to authenticated
using (sender_auth_id = auth.uid())
with check (sender_auth_id = auth.uid());

-- 5) (Optional) If you plan to soft-delete or mark messages read later, add columns here
-- alter table public.messages add column if not exists read_at timestamptz;

-- Notes:
-- - Realtime events will only be delivered if the client is authenticated and RLS allows SELECT.
-- - Your client subscription filter `booking_id=eq.<uuid>` will work once publication and RLS are in place.
