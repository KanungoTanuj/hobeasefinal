-- Enable RLS on learners table (if not already enabled)
ALTER TABLE learners ENABLE ROW LEVEL SECURITY;

-- Using DROP IF EXISTS then CREATE to avoid duplicate policy errors
-- Policy to allow anonymous users to insert learners (for booking system)
DROP POLICY IF EXISTS "Allow anonymous insert on learners" ON learners;
CREATE POLICY "Allow anonymous insert on learners"
ON learners FOR INSERT
TO anon
WITH CHECK (true);

-- Policy to allow authenticated users to insert learners
DROP POLICY IF EXISTS "Allow authenticated insert on learners" ON learners;
CREATE POLICY "Allow authenticated insert on learners"
ON learners FOR INSERT
TO authenticated
WITH CHECK (true);

-- Adding UPDATE policies to support upsert operations
-- Policy to allow anonymous users to update learners (for wishlist updates)
DROP POLICY IF EXISTS "Allow anonymous update on learners" ON learners;
CREATE POLICY "Allow anonymous update on learners"
ON learners FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Policy to allow authenticated users to update learners
DROP POLICY IF EXISTS "Allow authenticated update on learners" ON learners;
CREATE POLICY "Allow authenticated update on learners"
ON learners FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy to allow anonymous users to select learners (for checking existing learners)
DROP POLICY IF EXISTS "Allow anonymous select on learners" ON learners;
CREATE POLICY "Allow anonymous select on learners"
ON learners FOR SELECT
TO anon
USING (true);

-- Policy to allow authenticated users to select learners
DROP POLICY IF EXISTS "Allow authenticated select on learners" ON learners;
CREATE POLICY "Allow authenticated select on learners"
ON learners FOR SELECT
TO authenticated
USING (true);
