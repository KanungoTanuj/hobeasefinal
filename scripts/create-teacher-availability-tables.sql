-- Create teacher_availability table for recurring weekly availability
CREATE TABLE IF NOT EXISTS teacher_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES "Teachers"(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create teacher_availability_exceptions table for specific date overrides
CREATE TABLE IF NOT EXISTS teacher_availability_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES "Teachers"(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT false, -- Default to unavailable (blocking time)
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_exception_time_range CHECK (
    (is_available = false) OR 
    (is_available = true AND end_time > start_time)
  )
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_teacher_availability_teacher_id ON teacher_availability(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_availability_day ON teacher_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_teacher_availability_exceptions_teacher_id ON teacher_availability_exceptions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_availability_exceptions_date ON teacher_availability_exceptions(exception_date);

-- Enable RLS
ALTER TABLE teacher_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_availability_exceptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teacher_availability
CREATE POLICY "Teachers can view their own availability"
  ON teacher_availability FOR SELECT
  USING (
    teacher_id IN (
      SELECT id FROM "Teachers" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert their own availability"
  ON teacher_availability FOR INSERT
  WITH CHECK (
    teacher_id IN (
      SELECT id FROM "Teachers" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update their own availability"
  ON teacher_availability FOR UPDATE
  USING (
    teacher_id IN (
      SELECT id FROM "Teachers" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete their own availability"
  ON teacher_availability FOR DELETE
  USING (
    teacher_id IN (
      SELECT id FROM "Teachers" WHERE auth_id = auth.uid()
    )
  );

-- Allow learners to view teacher availability (for booking)
CREATE POLICY "Learners can view all teacher availability"
  ON teacher_availability FOR SELECT
  USING (true);

-- RLS Policies for teacher_availability_exceptions
CREATE POLICY "Teachers can view their own exceptions"
  ON teacher_availability_exceptions FOR SELECT
  USING (
    teacher_id IN (
      SELECT id FROM "Teachers" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert their own exceptions"
  ON teacher_availability_exceptions FOR INSERT
  WITH CHECK (
    teacher_id IN (
      SELECT id FROM "Teachers" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update their own exceptions"
  ON teacher_availability_exceptions FOR UPDATE
  USING (
    teacher_id IN (
      SELECT id FROM "Teachers" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete their own exceptions"
  ON teacher_availability_exceptions FOR DELETE
  USING (
    teacher_id IN (
      SELECT id FROM "Teachers" WHERE auth_id = auth.uid()
    )
  );

-- Allow learners to view teacher exceptions (for booking)
CREATE POLICY "Learners can view all teacher exceptions"
  ON teacher_availability_exceptions FOR SELECT
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_teacher_availability_updated_at
  BEFORE UPDATE ON teacher_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_availability_exceptions_updated_at
  BEFORE UPDATE ON teacher_availability_exceptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
