-- Update all existing pending bookings to confirmed status
-- This allows video calling features to work for existing bookings

UPDATE bookings 
SET status = 'confirmed', 
    updated_at = NOW()
WHERE status = 'pending';

-- Verify the update
SELECT 
  COUNT(*) as total_confirmed_bookings,
  COUNT(DISTINCT teacher_id) as unique_teachers,
  COUNT(DISTINCT learner_id) as unique_learners
FROM bookings 
WHERE status = 'confirmed';
