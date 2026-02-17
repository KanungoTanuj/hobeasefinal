-- Create storage bucket for teacher photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('teacher-photos', 'teacher-photos', true);

-- Create policy to allow public uploads to teacher-photos bucket
CREATE POLICY "Allow public uploads to teacher-photos bucket"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'teacher-photos');

-- Create policy to allow public access to teacher-photos bucket
CREATE POLICY "Allow public access to teacher-photos bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'teacher-photos');

-- Create policy to allow public updates to teacher-photos bucket
CREATE POLICY "Allow public updates to teacher-photos bucket"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'teacher-photos');

-- Create policy to allow public deletes from teacher-photos bucket
CREATE POLICY "Allow public deletes from teacher-photos bucket"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'teacher-photos');
