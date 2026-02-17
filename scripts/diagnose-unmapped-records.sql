-- Diagnostic script to identify unmapped records and their issues

-- 1. Find unmapped learners and their details
SELECT 
    'unmapped_learners' as issue_type,
    l.id,
    l.email,
    l.name,
    CASE 
        WHEN au.email IS NULL THEN 'No auth.users record found'
        WHEN au.email != l.email THEN 'Email mismatch'
        ELSE 'Unknown issue'
    END as issue_reason
FROM learners l
LEFT JOIN auth.users au ON l.email = au.email
WHERE l.auth_id IS NULL;

-- 2. Find unmapped Teachers and their details  
SELECT 
    'unmapped_teachers' as issue_type,
    t.id,
    t.email,
    t.name,
    CASE 
        WHEN au.email IS NULL THEN 'No auth.users record found'
        WHEN au.email != t.email THEN 'Email mismatch'
        ELSE 'Unknown issue'
    END as issue_reason
FROM "Teachers" t
LEFT JOIN auth.users au ON t.email = au.email
WHERE t.auth_id IS NULL;

-- 3. Check for case-sensitive email mismatches
SELECT 
    'case_mismatch_learners' as issue_type,
    l.email as learner_email,
    au.email as auth_email
FROM learners l
JOIN auth.users au ON LOWER(l.email) = LOWER(au.email)
WHERE l.email != au.email AND l.auth_id IS NULL;

SELECT 
    'case_mismatch_teachers' as issue_type,
    t.email as teacher_email,
    au.email as auth_email
FROM "Teachers" t
JOIN auth.users au ON LOWER(t.email) = LOWER(au.email)
WHERE t.email != au.email AND t.auth_id IS NULL;

-- 4. Show all auth.users to help identify potential matches
SELECT 
    'all_auth_users' as reference,
    id,
    email,
    created_at
FROM auth.users
ORDER BY email;
