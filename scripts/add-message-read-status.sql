-- Add read status tracking to messages table
ALTER TABLE messages 
ADD COLUMN is_read BOOLEAN DEFAULT FALSE,
ADD COLUMN read_at TIMESTAMPTZ NULL;

-- Create index for faster queries on unread messages
CREATE INDEX idx_messages_unread ON messages (sender_auth_id, is_read) WHERE is_read = FALSE;

-- Create index for booking-specific message queries
CREATE INDEX idx_messages_booking_read ON messages (booking_id, sender_auth_id, is_read);
