-- Enable RLS on Teachers table (if not already enabled)
ALTER TABLE "Teachers" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous users to insert teacher applications
CREATE POLICY "Allow anonymous teacher applications" ON "Teachers"
FOR INSERT 
TO anon
WITH CHECK (true);

-- Create policy to allow authenticated users to view all teachers
CREATE POLICY "Allow authenticated users to view teachers" ON "Teachers"
FOR SELECT 
TO authenticated
USING (true);

-- Create policy to allow service role full access (for admin operations)
CREATE POLICY "Allow service role full access" ON "Teachers"
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);
