-- Create teachers table for teacher registration
CREATE TABLE IF NOT EXISTS public."Teachers" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    skill TEXT NOT NULL,
    experience TEXT NOT NULL,
    bio TEXT NOT NULL,
    photo_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for teacher photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('teacher-photos', 'teacher-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for teacher photos bucket
CREATE POLICY "Anyone can upload teacher photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'teacher-photos');

CREATE POLICY "Anyone can view teacher photos" ON storage.objects
FOR SELECT USING (bucket_id = 'teacher-photos');

-- Add RLS policies for teachers table
ALTER TABLE public."Teachers" ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert new teacher applications
CREATE POLICY "Anyone can submit teacher applications" ON public."Teachers"
FOR INSERT WITH CHECK (true);

-- Allow reading teacher data (for admin purposes later)
CREATE POLICY "Anyone can view teacher profiles" ON public."Teachers"
FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teachers_email ON public."Teachers"(email);
CREATE INDEX IF NOT EXISTS idx_teachers_status ON public."Teachers"(status);
CREATE INDEX IF NOT EXISTS idx_teachers_created_at ON public."Teachers"(created_at);
