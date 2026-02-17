-- Enable anonymous users to insert into Teachers table
-- This allows teacher signup without authentication

-- First, ensure RLS is enabled on the Teachers table
ALTER TABLE "Teachers" ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anonymous inserts for teacher signup
CREATE POLICY "Allow anonymous teacher signup" ON "Teachers"
FOR INSERT 
TO anon
WITH CHECK (true);

-- Optional: Allow users to read teacher profiles (for public teacher directory)
CREATE POLICY "Allow public read access to teachers" ON "Teachers"
FOR SELECT 
TO anon, authenticated
USING (true);
