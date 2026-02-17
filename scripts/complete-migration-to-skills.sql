-- ============================================
-- Hobease Teacher Skills Migration Script
-- From single-skill Teachers → multi-skill system
-- ============================================

-- ✅ Step 1: Create teacher_skills table (if not exists)
CREATE TABLE IF NOT EXISTS public.teacher_skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES public."Teachers"(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    skill_category TEXT NOT NULL,
    proficiency_level TEXT DEFAULT 'intermediate' CHECK (
        proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')
    ),
    years_experience INTEGER DEFAULT 1 CHECK (years_experience >= 0 AND years_experience <= 50),
    price_per_hour DECIMAL(10,2) NOT NULL CHECK (price_per_hour >= 100 AND price_per_hour <= 10000),
    description TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_teacher_skills_teacher_id ON public.teacher_skills(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_skills_skill_name ON public.teacher_skills(skill_name);
CREATE INDEX IF NOT EXISTS idx_teacher_skills_category ON public.teacher_skills(skill_category);
CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_skills_one_primary 
    ON public.teacher_skills(teacher_id) WHERE is_primary = true;

-- ✅ Step 1b: Update Teachers table to support multi-skill
ALTER TABLE public."Teachers"
ADD COLUMN IF NOT EXISTS migrated_to_skills BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS primary_skill_id UUID REFERENCES public.teacher_skills(id);

-- ============================================
-- ✅ Step 2: Migrate existing teacher data
-- ============================================
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
    LEFT(t.bio, 200) as description,
    true as is_primary
FROM public."Teachers" t
WHERE (t.migrated_to_skills IS NULL OR t.migrated_to_skills = false)
  AND t.skill IS NOT NULL
  AND t.skill != ''
ON CONFLICT DO NOTHING;

-- ============================================
-- ✅ Step 3: Update Teachers with primary_skill_id
-- ============================================
UPDATE public."Teachers" 
SET primary_skill_id = (
    SELECT ts.id 
    FROM public.teacher_skills ts 
    WHERE ts.teacher_id = "Teachers".id 
      AND ts.is_primary = true 
    LIMIT 1
),
migrated_to_skills = true
WHERE migrated_to_skills IS NULL OR migrated_to_skills = false;

-- ============================================
-- ✅ Step 4a: Move skills from duplicate teachers → primary teacher
-- ============================================
WITH ranked_teachers AS (
    SELECT id, email, ROW_NUMBER() OVER (PARTITION BY email ORDER BY id ASC) as rn
    FROM public."Teachers"
),
primary_teachers AS (
    SELECT id, email FROM ranked_teachers WHERE rn = 1
),
duplicate_teachers AS (
    SELECT id, email FROM ranked_teachers WHERE rn > 1
)
UPDATE public.teacher_skills ts
SET teacher_id = pt.id
FROM primary_teachers pt
JOIN duplicate_teachers dt ON pt.email = dt.email
WHERE ts.teacher_id = dt.id;

-- ✅ Step 4b: Update bookings to reference the primary teacher
WITH ranked_teachers AS (
    SELECT id, email, ROW_NUMBER() OVER (PARTITION BY email ORDER BY id ASC) as rn
    FROM public."Teachers"
),
primary_teachers AS (
    SELECT id, email FROM ranked_teachers WHERE rn = 1
),
duplicate_teachers AS (
    SELECT id, email FROM ranked_teachers WHERE rn > 1
)
UPDATE public.bookings b
SET teacher_id = pt.id
FROM primary_teachers pt
JOIN duplicate_teachers dt ON pt.email = dt.email
WHERE b.teacher_id = dt.id;
-- ============================================
-- ✅ Step 4c: Delete duplicate teacher records
-- ============================================
WITH ranked_teachers AS (
    SELECT id, email, ROW_NUMBER() OVER (PARTITION BY email ORDER BY id ASC) as rn
    FROM public."Teachers"
),
teachers_to_delete AS (
    SELECT id FROM ranked_teachers WHERE rn > 1
)
DELETE FROM public."Teachers" t
USING teachers_to_delete td
WHERE t.id = td.id;

-- ============================================
-- ✅ Step 5: Enforce unique email constraint
-- ============================================
-- Step 5: Add unique constraint on email after cleanup (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'unique_teacher_email'
    ) THEN
        ALTER TABLE public."Teachers"
        ADD CONSTRAINT unique_teacher_email UNIQUE (email);
    END IF;
END;
$$;


-- ============================================
-- ✅ Step 6: Remove duplicate skills per teacher
-- ============================================
WITH duplicate_skills AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY teacher_id, skill_name 
               ORDER BY created_at ASC
           ) as rn
    FROM public.teacher_skills
)
DELETE FROM public.teacher_skills 
WHERE id IN (
    SELECT id FROM duplicate_skills WHERE rn > 1
);

-- ============================================
-- ✅ Step 7: Ensure each teacher has a primary skill
-- ============================================
UPDATE public.teacher_skills 
SET is_primary = true 
WHERE id IN (
    SELECT DISTINCT ON (teacher_id) id
    FROM public.teacher_skills ts1
    WHERE NOT EXISTS (
        SELECT 1 FROM public.teacher_skills ts2 
        WHERE ts2.teacher_id = ts1.teacher_id 
        AND ts2.is_primary = true
    )
    ORDER BY teacher_id, created_at ASC
);

-- ============================================
-- ✅ Step 8: Fix any missing primary_skill_id in Teachers
-- ============================================
UPDATE public."Teachers" 
SET primary_skill_id = (
    SELECT ts.id 
    FROM public.teacher_skills ts 
    WHERE ts.teacher_id = "Teachers".id 
      AND ts.is_primary = true 
    LIMIT 1
)
WHERE primary_skill_id IS NULL;

-- ============================================
-- ✅ Verification Queries
-- ============================================
-- SELECT COUNT(*) as total_teachers FROM public."Teachers";
-- SELECT COUNT(*) as total_skills FROM public.teacher_skills;
-- SELECT COUNT(*) as teachers_with_skills FROM public."Teachers" WHERE primary_skill_id IS NOT NULL;
-- SELECT email, COUNT(*) as skill_count 
-- FROM public."Teachers" t 
-- JOIN public.teacher_skills ts ON t.id = ts.teacher_id 
-- GROUP BY email ORDER BY skill_count DESC;
