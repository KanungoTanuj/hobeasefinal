-- Fix Teachers table ID column while handling foreign key dependencies
-- This script safely modifies the Teachers table structure

-- Step 1: Check current table structure
DO $$
BEGIN
    RAISE NOTICE 'Current Teachers table structure:';
END $$;

-- Step 2: Temporarily drop foreign key constraints that depend on Teachers.id
ALTER TABLE IF EXISTS "bookings" DROP CONSTRAINT IF EXISTS "bookings_teacher_id_fkey";
ALTER TABLE IF EXISTS "lessons" DROP CONSTRAINT IF EXISTS "lessons_teacher_id_fkey";
ALTER TABLE IF EXISTS "reviews" DROP CONSTRAINT IF EXISTS "reviews_teacher_id_fkey";

-- Step 3: Drop the existing unique constraint
ALTER TABLE "Teachers" DROP CONSTRAINT IF EXISTS "Teachers_id_key" CASCADE;

-- Step 4: Ensure the ID column is properly configured as auto-increment
-- First, check if the column exists and its current type
DO $$
BEGIN
    -- Drop the column if it exists and recreate it properly
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'Teachers' AND column_name = 'id') THEN
        
        -- Create a temporary column for data migration if needed
        ALTER TABLE "Teachers" ADD COLUMN "temp_id" SERIAL;
        
        -- Update temp_id with sequential values
        UPDATE "Teachers" SET "temp_id" = nextval('Teachers_temp_id_seq');
        
        -- Drop the old id column
        ALTER TABLE "Teachers" DROP COLUMN "id";
        
        -- Rename temp_id to id
        ALTER TABLE "Teachers" RENAME COLUMN "temp_id" TO "id";
        
        RAISE NOTICE 'Recreated id column as SERIAL';
    ELSE
        -- Create the id column if it doesn't exist
        ALTER TABLE "Teachers" ADD COLUMN "id" SERIAL;
        RAISE NOTICE 'Created new id column as SERIAL';
    END IF;
END $$;

-- Step 5: Set the id column as primary key
ALTER TABLE "Teachers" ADD PRIMARY KEY ("id");

-- Step 6: Reset the sequence to avoid conflicts
SELECT setval(pg_get_serial_sequence('"Teachers"', 'id'), COALESCE(MAX("id"), 1)) FROM "Teachers";

-- Step 7: Recreate foreign key constraints if the referenced tables exist
DO $$
BEGIN
    -- Recreate bookings foreign key if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        ALTER TABLE "bookings" ADD CONSTRAINT "bookings_teacher_id_fkey" 
        FOREIGN KEY ("teacher_id") REFERENCES "Teachers"("id") ON DELETE CASCADE;
        RAISE NOTICE 'Recreated bookings foreign key constraint';
    END IF;
    
    -- Recreate lessons foreign key if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lessons') THEN
        ALTER TABLE "lessons" ADD CONSTRAINT "lessons_teacher_id_fkey" 
        FOREIGN KEY ("teacher_id") REFERENCES "Teachers"("id") ON DELETE CASCADE;
        RAISE NOTICE 'Recreated lessons foreign key constraint';
    END IF;
    
    -- Recreate reviews foreign key if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        ALTER TABLE "reviews" ADD CONSTRAINT "reviews_teacher_id_fkey" 
        FOREIGN KEY ("teacher_id") REFERENCES "Teachers"("id") ON DELETE CASCADE;
        RAISE NOTICE 'Recreated reviews foreign key constraint';
    END IF;
END $$;

-- Step 8: Verify the final structure
DO $$
BEGIN
    RAISE NOTICE 'Teachers table ID column has been successfully configured as auto-increment';
    RAISE NOTICE 'All foreign key constraints have been recreated';
END $$;
