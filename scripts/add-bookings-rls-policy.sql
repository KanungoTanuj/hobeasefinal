-- Allow anonymous users to create bookings (temporary solution)
-- For production, you should require authentication
CREATE POLICY "Allow anonymous bookings" 
ON bookings FOR INSERT 
TO anon 
WITH CHECK (true);

-- Optional: Also allow authenticated users to create bookings
CREATE POLICY "Allow authenticated bookings" 
ON bookings FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Optional: Allow users to read all bookings (for admin purposes)
CREATE POLICY "Allow reading bookings" 
ON bookings FOR SELECT 
TO anon, authenticated 
USING (true);
