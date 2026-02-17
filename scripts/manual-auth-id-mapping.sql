-- Manual SQL script to map existing users' emails to their Supabase auth.users.id values
-- Run this script in your Supabase SQL editor after the migration

-- Step 1: Update learners table with auth_id from auth.users
UPDATE learners 
SET auth_id = auth_users.id
FROM auth.users AS auth_users
WHERE learners.email = auth_users.email
  AND learners.auth_id IS NULL;

-- Step 2: Update Teachers table with auth_id from auth.users  
UPDATE "Teachers"
SET auth_id = auth_users.id
FROM auth.users AS auth_users
WHERE "Teachers".email = auth_users.email
  AND "Teachers".auth_id IS NULL;

-- Step 3: Update bookings table with auth_id references
UPDATE bookings
SET learner_auth_id = l.auth_id,
    teacher_auth_id = t.auth_id
FROM learners l, "Teachers" t
WHERE bookings.learner_id = l.id 
  AND bookings.teacher_id = t.id
  AND (bookings.learner_auth_id IS NULL OR bookings.teacher_auth_id IS NULL);

-- Step 4: Update messages table with sender_auth_id
UPDATE messages
SET sender_auth_id = 
  CASE 
    WHEN messages.sender_role = 'learner' THEN l.auth_id
    WHEN messages.sender_role = 'teacher' THEN t.auth_id
  END
FROM learners l, "Teachers" t
WHERE ((messages.sender_role = 'learner' AND messages.sender_id = l.id)
   OR (messages.sender_role = 'teacher' AND messages.sender_id = t.id))
  AND messages.sender_auth_id IS NULL;

-- Step 5: Verify the mapping results
SELECT 'learners' as table_name, 
       COUNT(*) as total_records,
       COUNT(auth_id) as mapped_records,
       COUNT(*) - COUNT(auth_id) as unmapped_records
FROM learners
UNION ALL
SELECT 'Teachers' as table_name,
       COUNT(*) as total_records, 
       COUNT(auth_id) as mapped_records,
       COUNT(*) - COUNT(auth_id) as unmapped_records
FROM "Teachers"
UNION ALL
SELECT 'bookings' as table_name,
       COUNT(*) as total_records,
       COUNT(CASE WHEN learner_auth_id IS NOT NULL AND teacher_auth_id IS NOT NULL THEN 1 END) as mapped_records,
       COUNT(CASE WHEN learner_auth_id IS NULL OR teacher_auth_id IS NULL THEN 1 END) as unmapped_records
FROM bookings
UNION ALL
SELECT 'messages' as table_name,
       COUNT(*) as total_records,
       COUNT(sender_auth_id) as mapped_records, 
       COUNT(*) - COUNT(sender_auth_id) as unmapped_records
FROM messages;
