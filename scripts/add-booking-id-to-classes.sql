-- Migration: Add booking_id column to classes table
-- This links video call sessions to their corresponding bookings

-- Add the booking_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'classes' AND column_name = 'booking_id'
  ) THEN
    ALTER TABLE classes 
    ADD COLUMN booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL;
    
    -- Add index for better query performance
    CREATE INDEX idx_classes_booking_id ON classes(booking_id);
    
    -- Add comment for documentation
    COMMENT ON COLUMN classes.booking_id IS 'Optional reference to the booking that initiated this class';
  END IF;
END $$;
