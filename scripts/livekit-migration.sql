-- ============================================================================
-- LiveKit Migration Script for Hobease
-- ============================================================================
-- This script is OPTIONAL - the migration works with your existing schema
-- You only need to run this if you want to add analytics columns
-- 
-- IMPORTANT: These columns are optional for tracking call analytics
-- The system works without them - tokens are generated on-demand
-- ============================================================================

-- STEP 1: OPTIONAL - Add analytics columns to classes table
-- Uncomment and run if you want to track which provider is used
/*
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'livekit' CHECK (provider IN ('livekit', 'daily')),
ADD COLUMN IF NOT EXISTS call_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS call_ended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS call_duration_seconds INTEGER;

COMMENT ON COLUMN public.classes.provider IS 'Video provider: livekit (new) or daily (legacy)';
COMMENT ON COLUMN public.classes.call_started_at IS 'When the video call actually started';
COMMENT ON COLUMN public.classes.call_ended_at IS 'When the video call ended';
COMMENT ON COLUMN public.classes.call_duration_seconds IS 'Total call duration in seconds';
*/

-- STEP 2: OPTIONAL - Create indexes for better performance
-- Uncomment if you added the columns above
/*
CREATE INDEX IF NOT EXISTS idx_classes_provider 
ON public.classes(provider);

CREATE INDEX IF NOT EXISTS idx_classes_call_started_at 
ON public.classes(call_started_at DESC);
*/

-- ============================================================================
-- IMPORTANT NOTES ABOUT THIS MIGRATION
-- ============================================================================
--
-- 1. NO DATABASE SCHEMA CHANGES REQUIRED
--    - The existing classes table with room_id is sufficient
--    - LiveKit uses room_id as the room name
--
-- 2. NO TOKEN STORAGE
--    - Tokens are generated on-demand via /api/video/token
--    - Tokens expire after 30 minutes
--    - No tokens stored in database = better security
--
-- 3. EXISTING DATA COMPATIBILITY
--    - All existing classes, bookings, and user data work as-is
--    - room_id column is reused for LiveKit
--
-- 4. OPTIONAL ANALYTICS ONLY
--    - The columns above are purely for tracking/analytics
--    - They don't affect functionality at all
--    - Only add them if you need call analytics
--
-- ============================================================================
