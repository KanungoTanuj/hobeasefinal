-- Check 1: Count of teachers and skills
SELECT 
    'Teachers' as table_name,
    COUNT(*) as count
FROM public."Teachers"
UNION ALL
SELECT 
    'Teacher Skills' as table_name,
    COUNT(*) as count
FROM public.teacher_skills
UNION ALL
SELECT 
    'Teachers with Skills' as table_name,
    COUNT(*) as count
FROM public."Teachers"
WHERE primary_skill_id IS NOT NULL;

-- Check 2: Teachers with multiple skills
SELECT 
    t.name,
    t.email,
    COUNT(ts.id) as skill_count,
    STRING_AGG(ts.skill_name, ', ') as skills
FROM public."Teachers" t
JOIN public.teacher_skills ts ON t.id = ts.teacher_id
GROUP BY t.id, t.name, t.email
ORDER BY skill_count DESC;

-- Check 3: Primary skills verification
SELECT 
    t.name,
    t.email,
    ts.skill_name as primary_skill,
    ts.price_per_hour
FROM public."Teachers" t
JOIN public.teacher_skills ts ON t.primary_skill_id = ts.id
ORDER BY t.name;

-- Check 4: Skills by category
SELECT 
    skill_category,
    COUNT(*) as skill_count,
    AVG(price_per_hour) as avg_price
FROM public.teacher_skills
GROUP BY skill_category
ORDER BY skill_count DESC;

-- Check 5: Duplicate email check (should return 0 rows)
SELECT 
    email,
    COUNT(*) as duplicate_count
FROM public."Teachers"
GROUP BY email
HAVING COUNT(*) > 1;

-- Check 6: Teachers without skills (should return 0 rows)
SELECT 
    t.name,
    t.email
FROM public."Teachers" t
LEFT JOIN public.teacher_skills ts ON t.id = ts.teacher_id
WHERE ts.id IS NULL;

-- Check 7: Skills without primary flag per teacher (each teacher should have exactly 1 primary)
SELECT 
    t.name,
    t.email,
    COUNT(CASE WHEN ts.is_primary THEN 1 END) as primary_count
FROM public."Teachers" t
JOIN public.teacher_skills ts ON t.id = ts.teacher_id
GROUP BY t.id, t.name, t.email
HAVING COUNT(CASE WHEN ts.is_primary THEN 1 END) != 1;
