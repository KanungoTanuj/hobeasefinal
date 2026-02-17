/*
  Allow message senders to delete their own messages (RLS)
  Idempotent migration: safe to run multiple times.
*/

-- Ensure RLS is ON for messages
alter table if exists public.messages enable row level security;

-- Clean up older conflicting policies if they exist
drop policy if exists "messages_delete_by_sender" on public.messages;
drop policy if exists "messages_delete_own" on public.messages;

-- Only the original sender (by auth uid) can delete their message
create policy "messages_delete_own"
on public.messages
for delete
using (
  sender_auth_id = auth.uid()
);

-- Optional: helpful index if you don't have it yet
do $$
begin
  if not exists (
    select 1 from pg_indexes 
    where schemaname = 'public' and indexname = 'idx_messages_booking_created'
  ) then
    create index idx_messages_booking_created
      on public.messages (booking_id, created_at desc);
  end if;
end$$;

-- Optional: ensure created_at defaults to now() if not already set
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'messages'
      and column_name = 'created_at'
      and column_default is not null
  ) then
    alter table public.messages
      alter column created_at set default timezone('utc', now());
  end if;
end$$;

-- Note: If you also want to restrict delete to booking participants,
-- you can replace the USING clause with:
-- using (
--   sender_auth_id = auth.uid()
--   and exists (
--     select 1
--     from public.bookings b
--     where b.id = messages.booking_id
--       and (b.learner_auth_id = auth.uid() or b.teacher_auth_id = auth.uid())
--   )
-- );
