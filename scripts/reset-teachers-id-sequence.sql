-- Reset the Teachers table ID sequence to avoid duplicate key conflicts
-- This fixes the issue when the sequence is out of sync with existing data

DO $$
BEGIN
    -- Reset the sequence for the Teachers table ID column
    -- This will set the sequence to the next available value after the highest existing ID
    -- Fixed table name quoting for case-sensitive PostgreSQL table names
    PERFORM setval(
        pg_get_serial_sequence('"Teachers"', 'id'),
        COALESCE((SELECT MAX(id) FROM "Teachers"), 0) + 1,
        false
    );
    
    RAISE NOTICE 'Teachers ID sequence has been reset successfully';
END $$;
