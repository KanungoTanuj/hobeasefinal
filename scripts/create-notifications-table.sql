-- Create notifications table for broader notification system
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_auth_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'message', 'booking', 'system', etc.
    title TEXT NOT NULL,
    content TEXT,
    related_id UUID, -- booking_id, message_id, etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ NULL
);

-- Create indexes for efficient notification queries
CREATE INDEX idx_notifications_user_unread ON notifications (user_auth_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_user_created ON notifications (user_auth_id, created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_auth_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_auth_id = auth.uid());

-- Allow system to insert notifications
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);
