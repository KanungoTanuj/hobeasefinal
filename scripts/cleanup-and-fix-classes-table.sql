-- Step 1: Clean up existing invalid data in classes table
-- This removes any classes that reference non-existent teachers or learners
DELETE FROM classes 
WHERE teacher_id NOT IN (SELECT id FROM "Teachers")
   OR student_id NOT IN (SELECT id FROM learners);

-- Step 2: Drop existing foreign key constraints if they exist
ALTER TABLE classes 
DROP CONSTRAINT IF EXISTS classes_teacher_id_fkey;

ALTER TABLE classes 
DROP CONSTRAINT IF EXISTS classes_student_id_fkey;

-- Step 3: Add correct foreign key constraints
ALTER TABLE classes 
ADD CONSTRAINT classes_teacher_id_fkey 
FOREIGN KEY (teacher_id) REFERENCES "Teachers"(id) ON DELETE CASCADE;

ALTER TABLE classes 
ADD CONSTRAINT classes_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES learners(id) ON DELETE CASCADE;

-- Step 4: Update RLS policies for classes table
DROP POLICY IF EXISTS "Teachers can insert their own classes" ON classes;
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
DROP POLICY IF EXISTS "Students can view their own classes" ON classes;
DROP POLICY IF EXISTS "Teachers can update their own classes" ON classes;

-- Allow teachers to insert classes for their bookings
CREATE POLICY "Teachers can insert their own classes" ON classes
FOR INSERT
WITH CHECK (
  teacher_id IN (
    SELECT id FROM "Teachers" WHERE auth_id = auth.uid()
  )
);

-- Allow teachers to view their classes
CREATE POLICY "Teachers can view their own classes" ON classes
FOR SELECT
USING (
  teacher_id IN (
    SELECT id FROM "Teachers" WHERE auth_id = auth.uid()
  )
);

-- Allow students to view their classes
CREATE POLICY "Students can view their own classes" ON classes
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM learners WHERE auth_id = auth.uid()
  )
);

-- Allow teachers to update their classes
CREATE POLICY "Teachers can update their own classes" ON classes
FOR UPDATE
USING (
  teacher_id IN (
    SELECT id FROM "Teachers" WHERE auth_id = auth.uid()
  )
);
