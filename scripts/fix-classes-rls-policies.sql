-- Fix RLS policies for classes table to work with Teachers and Learners tables
-- The issue: classes table references auth.users but we're using Teachers/Learners table IDs

-- First, drop existing policies
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
DROP POLICY IF EXISTS "Teachers can insert their own classes" ON classes;
DROP POLICY IF EXISTS "Teachers can update their own classes" ON classes;
DROP POLICY IF EXISTS "Students can view their enrolled classes" ON classes;
DROP POLICY IF EXISTS "Students can update their enrolled classes" ON classes;

-- Modify the classes table to reference Teachers and Learners tables instead of auth.users
-- First drop the existing foreign key constraints
ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_teacher_id_fkey;
ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_student_id_fkey;

-- Add new foreign key constraints to Teachers and Learners tables
ALTER TABLE classes 
  ADD CONSTRAINT classes_teacher_id_fkey 
  FOREIGN KEY (teacher_id) 
  REFERENCES teachers(id) 
  ON DELETE CASCADE;

ALTER TABLE classes 
  ADD CONSTRAINT classes_student_id_fkey 
  FOREIGN KEY (student_id) 
  REFERENCES learners(id) 
  ON DELETE CASCADE;

-- Create new RLS policies that check against Teachers and Learners tables
-- Policy: Teachers can view their own classes
CREATE POLICY "Teachers can view their own classes"
  ON classes
  FOR SELECT
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE auth_id = auth.uid()
    )
  );

-- Policy: Teachers can insert their own classes
CREATE POLICY "Teachers can insert their own classes"
  ON classes
  FOR INSERT
  WITH CHECK (
    teacher_id IN (
      SELECT id FROM teachers WHERE auth_id = auth.uid()
    )
  );

-- Policy: Teachers can update their own classes
CREATE POLICY "Teachers can update their own classes"
  ON classes
  FOR UPDATE
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE auth_id = auth.uid()
    )
  );

-- Policy: Students can view classes they're enrolled in
CREATE POLICY "Students can view their enrolled classes"
  ON classes
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM learners WHERE auth_id = auth.uid()
    )
  );

-- Policy: Students can update their enrolled classes (e.g., to set end_time)
CREATE POLICY "Students can update their enrolled classes"
  ON classes
  FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM learners WHERE auth_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON TABLE classes IS 'Tracks video call sessions between teachers and students. References Teachers and Learners tables.';
