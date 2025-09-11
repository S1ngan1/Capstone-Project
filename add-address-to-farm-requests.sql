-- Add address column to farm_requests table
-- This migration adds the missing address field that the CreateFarmRequest component requires

-- Add address column if it doesn't exist
ALTER TABLE public.farm_requests ADD COLUMN IF NOT EXISTS address TEXT;

-- Update any existing requests to have null address (this is safe since it's optional)
-- No data migration needed since address is optional

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'farm_requests'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test insert to verify the fix
-- (This is commented out - uncomment to test after running the migration)
-- INSERT INTO public.farm_requests (farm_name, location, address, notes, requested_by, status)
-- VALUES ('Test Farm', 'Test Province', 'Test Address', 'Test Notes', auth.uid(), 'pending');
