-- LiveKit Migration SQL Scripts for Hobease
-- Run these scripts manually in your Supabase dashboard

-- OPTIONAL: Add analytics columns to classes table
-- This helps track which provider is used and session timing
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'livekit',
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Add comment documenting the provider column
COMMENT ON COLUMN public.classes.provider IS 'Video provider: livekit or daily';
COMMENT ON COLUMN public.classes.started_at IS 'When the class session started';
COMMENT ON COLUMN public.classes.ended_at IS 'When the class session ended';
COMMENT ON COLUMN public.classes.duration_minutes IS 'Total session duration in minutes';

-- Create index on status and started_at for faster queries
CREATE INDEX IF NOT EXISTS idx_classes_status_started_at 
ON public.classes(status, started_at DESC);

-- Note: We do NOT store tokens in the database
-- Tokens are generated on-demand and expire after 30 minutes
-- This keeps the database clean and secure
