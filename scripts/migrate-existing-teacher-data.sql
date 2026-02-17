-- Step 1: Migrate existing teacher data into teacher_skills
INSERT INTO public.teacher_skills (
    teacher_id,
    skill_name,
    skill_category,
    proficiency_level,
    years_experience,
    price_per_hour,
    description,
    is_primary
)
SELECT 
    t.id as teacher_id,
    t.skill as skill_name,
    COALESCE(t.category, 'Other') as skill_category,
    CASE 
        WHEN t.experience = '1-2' THEN 'beginner'
        WHEN t.experience = '3-5' THEN 'intermediate'
        WHEN t.experience = '6-10' THEN 'advanced'
        WHEN t.experience = '10+' THEN 'expert'
        ELSE 'intermediate'
    END as proficiency_level,
    CASE 
        WHEN t.experience = '1-2' THEN 2
        WHEN t.experience = '3-5' THEN 4
        WHEN t.experience = '6-10' THEN 8
        WHEN t.experience = '10+' THEN 15
        ELSE 3
    END as years_experience,
    COALESCE(t.price_hour, 1000) as price_per_hour,
    LEFT(t.bio, 200) as description, -- first 200 chars of bio
    true as is_primary
FROM public."Teachers" t
WHERE t.migrated_to_skills = false
  AND t.skill IS NOT NULL
  AND t.skill != '';

-- Step 2: Update Teachers with primary_skill_id + mark migrated
UPDATE public."Teachers" 
SET primary_skill_id = (
    SELECT ts.id 
    FROM public.teacher_skills ts 
    WHERE ts.teacher_id = "Teachers".id 
      AND ts.is_primary = true 
    LIMIT 1
),
migrated_to_skills = true
WHERE migrated_to_skills = false;

-- Step 3: Deduplicate Teachers by email (since Teachers table has no created_at)
-- Keep lowest UUID (arbitrary but deterministic)
WITH ranked_teachers AS (
    SELECT id, email, 
           ROW_NUMBER() OVER (PARTITION BY email ORDER BY id ASC) as rn
    FROM public."Teachers"
),
teachers_to_delete AS (
    SELECT id FROM ranked_teachers WHERE rn > 1
)
DELETE FROM public."Teachers" 
WHERE id IN (SELECT id FROM teachers_to_delete);

-- Step 4: Enforce unique constraint on email
ALTER TABLE public."Teachers" 
ADD CONSTRAINT unique_teacher_email UNIQUE (email);
