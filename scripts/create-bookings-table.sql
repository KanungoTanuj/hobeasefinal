-- Create bookings table with foreign keys to teachers and learners
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id UUID REFERENCES learners(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES "Teachers"(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  learner_name VARCHAR(255) NOT NULL,
  learner_email VARCHAR(255) NOT NULL,
  teacher_name VARCHAR(255) NOT NULL,
  teacher_skill VARCHAR(255) NOT NULL,
  price_per_hour DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_bookings_learner_id ON bookings(learner_id);
CREATE INDEX idx_bookings_teacher_id ON bookings(teacher_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
