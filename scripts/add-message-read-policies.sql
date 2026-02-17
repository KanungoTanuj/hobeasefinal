-- Update RLS policies for messages table to handle read status
CREATE POLICY "Users can update read status of messages sent to them" ON messages
    FOR UPDATE USING (
        -- User can mark messages as read if they are the recipient
        -- (messages sent by others in their bookings)
        booking_id IN (
            SELECT id FROM bookings 
            WHERE learner_auth_id = auth.uid() OR teacher_auth_id = auth.uid()
        )
        AND sender_auth_id != auth.uid()
    );
