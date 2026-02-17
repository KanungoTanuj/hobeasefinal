-- Create teacher_skills table for multiple skills per teacher
CREATE TABLE IF NOT EXISTS public.teacher_skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES "Teachers"(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    skill_category TEXT NOT NULL,
    proficiency_level TEXT DEFAULT 'intermediate' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    years_experience INTEGER DEFAULT 1 CHECK (years_experience >= 0 AND years_experience <= 50),
    price_per_hour DECIMAL(10,2) NOT NULL CHECK (price_per_hour >= 100 AND price_per_hour <= 10000),
    description TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teacher_skills_teacher_id ON public.teacher_skills(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_skills_skill_name ON public.teacher_skills(skill_name);
CREATE INDEX IF NOT EXISTS idx_teacher_skills_category ON public.teacher_skills(skill_category);
CREATE INDEX IF NOT EXISTS idx_teacher_skills_primary ON public.teacher_skills(is_primary);

-- Ensure only one primary skill per teacher
CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_skills_one_primary 
ON public.teacher_skills(teacher_id) 
WHERE is_primary = true;

-- Enable RLS
ALTER TABLE public.teacher_skills ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teacher_skills
CREATE POLICY "Anyone can view teacher skills" ON public.teacher_skills
FOR SELECT USING (true);

CREATE POLICY "Teachers can manage their own skills" ON public.teacher_skills
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM "Teachers" t 
        WHERE t.id = teacher_skills.teacher_id 
        AND t.email = auth.jwt() ->> 'email'
    )
);

CREATE POLICY "Anonymous can view teacher skills" ON public.teacher_skills
FOR SELECT USING (true);
