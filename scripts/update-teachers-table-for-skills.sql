-- ✅ Step 1: Add migration flags and reference to primary skill
ALTER TABLE public."Teachers"
ADD COLUMN IF NOT EXISTS migrated_to_skills BOOLEAN DEFAULT false;

ALTER TABLE public."Teachers"
ADD COLUMN IF NOT EXISTS primary_skill_id UUID REFERENCES public.teacher_skills(id);

-- ✅ Step 2: Keep price_hour for backward compatibility but mark as deprecated
-- Commented out DROP until migration complete
-- ALTER TABLE public."Teachers" DROP COLUMN IF EXISTS price_hour;

-- ✅ Step 3: Trigger to auto-update updated_at in teacher_skills
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_teacher_skills_updated_at ON public.teacher_skills;

CREATE TRIGGER update_teacher_skills_updated_at 
    BEFORE UPDATE ON public.teacher_skills 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ✅ Step 4: Create a clean view for querying teachers with their skills
-- Removed t.created_at (not present in your Teachers table)
CREATE OR REPLACE VIEW teacher_skills_view AS
SELECT 
    t.id AS teacher_id,
    t.name AS teacher_name,
    t.email AS teacher_email,
    t.bio AS teacher_bio,
    t.photo_url AS teacher_photo,
    t.rating AS teacher_rating,
    t.experience AS teacher_experience,
    ts.id AS skill_id,
    ts.skill_name,
    ts.skill_category,
    ts.proficiency_level,
    ts.years_experience AS skill_years_experience,
    ts.price_per_hour,
    ts.description AS skill_description,
    ts.is_primary,
    ts.created_at AS skill_created_at
FROM public."Teachers" t
LEFT JOIN public.teacher_skills ts ON t.id = ts.teacher_id;
