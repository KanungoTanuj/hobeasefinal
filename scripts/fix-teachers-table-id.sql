-- Fix the Teachers table ID column to be properly auto-incrementing
-- This will resolve the duplicate key constraint error

-- First, check if the table has an id column and fix its configuration
DO $$
BEGIN
    -- Check if id column exists and is not properly configured
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Teachers' AND column_name = 'id'
    ) THEN
        -- Drop the existing constraint if it exists
        ALTER TABLE "Teachers" DROP CONSTRAINT IF EXISTS "Teachers_id_key";
        
        -- Drop the id column if it exists
        ALTER TABLE "Teachers" DROP COLUMN IF EXISTS "id";
    END IF;
    
    -- Add a proper auto-incrementing primary key
    ALTER TABLE "Teachers" ADD COLUMN "id" BIGSERIAL PRIMARY KEY;
    
    -- Ensure the sequence starts from a safe number
    SELECT setval(pg_get_serial_sequence('"Teachers"', 'id'), COALESCE(MAX("id"), 0) + 1, false) FROM "Teachers";
    
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "Teachers_email_idx" ON "Teachers" ("email");
CREATE INDEX IF NOT EXISTS "Teachers_skill_idx" ON "Teachers" ("skill");
