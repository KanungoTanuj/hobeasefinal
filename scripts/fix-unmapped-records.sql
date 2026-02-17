-- Script to fix unmapped records after diagnosis

-- Fix case-sensitive email mismatches for learners
UPDATE learners 
SET auth_id = au.id
FROM auth.users au
WHERE LOWER(learners.email) = LOWER(au.email) 
  AND learners.email != au.email 
  AND learners.auth_id IS NULL;

-- Fix case-sensitive email mismatches for Teachers
UPDATE "Teachers" 
SET auth_id = au.id
FROM auth.users au
WHERE LOWER("Teachers".email) = LOWER(au.email) 
  AND "Teachers".email != au.email 
  AND "Teachers".auth_id IS NULL;

-- Manual mapping template (replace with actual values after diagnosis)
-- UPDATE learners SET auth_id = 'actual-uuid-from-auth-users' WHERE email = 'user@example.com';
-- UPDATE "Teachers" SET auth_id = 'actual-uuid-from-auth-users' WHERE email = 'teacher@example.com';

-- Verification query after fixes
SELECT 
    'learners' as table_name,
    COUNT(*) as total_records,
    COUNT(auth_id) as mapped_records,
    COUNT(*) - COUNT(auth_id) as unmapped_records
FROM learners
UNION ALL
SELECT 
    'Teachers' as table_name,
    COUNT(*) as total_records,
    COUNT(auth_id) as mapped_records,
    COUNT(*) - COUNT(auth_id) as unmapped_records
FROM "Teachers";
