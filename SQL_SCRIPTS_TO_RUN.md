# SQL Scripts for LiveKit Migration

## ⚠️ IMPORTANT: These Scripts Are OPTIONAL

The LiveKit integration works **without any database changes**. 

The existing `classes` table with `room_id` is all you need.

Only run these SQL scripts if you want **optional analytics columns** to track which provider is used and call duration.

---

## SQL Script 1: Add Analytics Columns (OPTIONAL)

**When to run this:** If you want to track call analytics and duration

**How to run:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy the script below
3. Click "Run"

```sql
-- ============================================================================
-- OPTIONAL: Add analytics columns for LiveKit migration
-- These columns are NOT required for the system to work
-- They are purely for tracking/reporting
-- ============================================================================

ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'livekit' CHECK (provider IN ('livekit', 'daily')),
ADD COLUMN IF NOT EXISTS call_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS call_ended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS call_duration_seconds INTEGER;

-- Add helpful comments to columns
COMMENT ON COLUMN public.classes.provider IS 'Video provider: livekit (new) or daily (legacy)';
COMMENT ON COLUMN public.classes.call_started_at IS 'When the video call actually started';
COMMENT ON COLUMN public.classes.call_ended_at IS 'When the video call ended';
COMMENT ON COLUMN public.classes.call_duration_seconds IS 'Total call duration in seconds';
```

---

## SQL Script 2: Create Indexes (OPTIONAL)

**When to run this:** After Script 1, if you want better query performance

**How to run:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy the script below
3. Click "Run"

```sql
-- ============================================================================
-- OPTIONAL: Create indexes for better query performance
-- Only run this AFTER Script 1 (after adding the columns above)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_classes_provider 
ON public.classes(provider);

CREATE INDEX IF NOT EXISTS idx_classes_call_started_at 
ON public.classes(call_started_at DESC);
```

---

## SQL Script 3: Verify Migration (OPTIONAL)

**When to run this:** After running Scripts 1 & 2, to verify the changes

**How to run:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy the script below
3. Click "Run"

This will show you the new columns and confirm everything worked.

```sql
-- ============================================================================
-- Check the schema of classes table after migration
-- This just reads data - it won't modify anything
-- ============================================================================

-- Show all columns in the classes table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'classes'
ORDER BY ordinal_position;

-- Show all indexes on classes table
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'classes'
ORDER BY indexname;
```

---

## Summary

- **Script 1:** Adds 4 optional columns for analytics ✓
- **Script 2:** Creates 2 indexes for performance ✓
- **Script 3:** Verifies the migration worked ✓

**All are OPTIONAL** - The app works without running any of these.

---

## If You Don't Run Any SQL Scripts

The system will still work perfectly because:
- ✅ The `classes.room_id` column already exists
- ✅ LiveKit uses room_id as the room name
- ✅ No tokens are stored in database
- ✅ All authentication is token-based

**You only need SQL if you want to track:**
- Which provider is being used (livekit vs daily)
- When calls started and ended
- Total call duration

---

## Need Rollback? 

To remove these columns if you change your mind:

```sql
-- Remove the analytics columns
ALTER TABLE public.classes
DROP COLUMN IF EXISTS provider,
DROP COLUMN IF EXISTS call_started_at,
DROP COLUMN IF EXISTS call_ended_at,
DROP COLUMN IF EXISTS call_duration_seconds;

-- Drop the indexes
DROP INDEX IF EXISTS idx_classes_provider;
DROP INDEX IF EXISTS idx_classes_call_started_at;
```

---

## That's It!

No SQL scripts need to be run for LiveKit to work. These are optional analytics only.

The actual setup only requires:
1. Setting 3 environment variables in Vercel (LIVEKIT_API_KEY, LIVEKIT_API_SECRET, NEXT_PUBLIC_LIVEKIT_URL)
2. Deploying to main branch

See `LIVEKIT_MIGRATION_COMPLETE.md` for full setup instructions.
