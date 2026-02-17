-- Fix Classes table foreign keys to reference Teachers and Learners tables
-- instead of auth.users

-- Drop existing foreign key constraints
ALTER TABLE classes 
  DROP CONSTRAINT IF EXISTS classes_teacher_id_fkey,
  DROP CONSTRAINT IF EXISTS classes_student_id_fkey;

-- Using correct case: Teachers (capital T) and learners (lowercase)
-- Add correct foreign key constraints
ALTER TABLE classes
  ADD CONSTRAINT classes_teacher_id_fkey 
    FOREIGN KEY (teacher_id) REFERENCES "Teachers"(id) ON DELETE CASCADE,
  ADD CONSTRAINT classes_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES learners(id) ON DELETE CASCADE;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Teachers can insert their own classes" ON classes;
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
DROP POLICY IF EXISTS "Students can view their own classes" ON classes;
DROP POLICY IF EXISTS "Teachers can update their own classes" ON classes;

-- Updated RLS policies to use "Teachers" (capital T)
-- Create new RLS policies that work with the corrected foreign keys
CREATE POLICY "Teachers can insert their own classes"
  ON classes FOR INSERT
  WITH CHECK (
    teacher_id IN (
      SELECT id FROM "Teachers" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view their own classes"
  ON classes FOR SELECT
  USING (
    teacher_id IN (
      SELECT id FROM "Teachers" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own classes"
  ON classes FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM learners WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update their own classes"
  ON classes FOR UPDATE
  USING (
    teacher_id IN (
      SELECT id FROM "Teachers" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Students can update their own classes"
  ON classes FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM learners WHERE auth_id = auth.uid()
    )
  );
