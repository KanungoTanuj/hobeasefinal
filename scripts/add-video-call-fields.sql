-- Add video calling fields to existing bookings table
-- This is minimal and leverages your existing booking structure

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS room_id TEXT,
ADD COLUMN IF NOT EXISTS call_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS call_ended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS call_duration_minutes INTEGER;

-- Add index for faster room lookups
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);

-- Add index for active calls
CREATE INDEX IF NOT EXISTS idx_bookings_active_calls ON bookings(call_started_at) 
WHERE call_started_at IS NOT NULL AND call_ended_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN bookings.room_id IS 'Jitsi Meet room identifier for video calls';
COMMENT ON COLUMN bookings.call_started_at IS 'Timestamp when the video call actually started';
COMMENT ON COLUMN bookings.call_ended_at IS 'Timestamp when the video call ended';
COMMENT ON COLUMN bookings.call_duration_minutes IS 'Actual duration of the call in minutes';
