-- Add metadata column to notifications table
-- This script adds the missing metadata column that's needed for storing navigation information

-- Add the metadata column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'notifications'
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN metadata JSONB;

        -- Add a comment to document the column
        COMMENT ON COLUMN public.notifications.metadata IS 'Stores additional notification data like navigation screen, request IDs, etc.';

        RAISE NOTICE 'Added metadata column to notifications table';
    ELSE
        RAISE NOTICE 'metadata column already exists in notifications table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'notifications'
AND column_name = 'metadata';

-- Show current notifications table structure using proper SQL
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'notifications'
ORDER BY ordinal_position;
