-- Create classes table for video call sessions
-- This table tracks actual video call sessions between teachers and students

CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  room_id text NOT NULL UNIQUE,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_student_id ON classes(student_id);
CREATE INDEX IF NOT EXISTS idx_classes_booking_id ON classes(booking_id);
CREATE INDEX IF NOT EXISTS idx_classes_room_id ON classes(room_id);
CREATE INDEX IF NOT EXISTS idx_classes_start_time ON classes(start_time DESC);

-- Enable Row Level Security
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Teachers can view and manage their own classes
CREATE POLICY "Teachers can view their own classes"
  ON classes
  FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert their own classes"
  ON classes
  FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own classes"
  ON classes
  FOR UPDATE
  USING (auth.uid() = teacher_id);

-- RLS Policy: Students can view classes they're enrolled in
CREATE POLICY "Students can view their enrolled classes"
  ON classes
  FOR SELECT
  USING (auth.uid() = student_id);

-- RLS Policy: Students can update end_time when they leave
CREATE POLICY "Students can update their enrolled classes"
  ON classes
  FOR UPDATE
  USING (auth.uid() = student_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_classes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER update_classes_updated_at_trigger
  BEFORE UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION update_classes_updated_at();

-- Add comment for documentation
COMMENT ON TABLE classes IS 'Tracks video call sessions between teachers and students using Jitsi Meet';
COMMENT ON COLUMN classes.room_id IS 'Unique Jitsi Meet room identifier for the video call';
COMMENT ON COLUMN classes.booking_id IS 'Optional reference to the booking that initiated this class';
