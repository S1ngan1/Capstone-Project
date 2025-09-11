-- Add address field to farms table
-- This script adds an address column to the farms table for more detailed location information

-- Add address column to farms table
ALTER TABLE public.farms
ADD COLUMN address TEXT;

-- Update RLS policies to include address field
DROP POLICY IF EXISTS "Users can view farms they have access to" ON public.farms;
CREATE POLICY "Users can view farms they have access to" ON public.farms
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.farm_users
            WHERE farm_users.farm_id = farms.id
            AND farm_users.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Farm owners and managers can update their farms" ON public.farms;
CREATE POLICY "Farm owners and managers can update their farms" ON public.farms
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.farm_users
            WHERE farm_users.farm_id = farms.id
            AND farm_users.user_id = auth.uid()
            AND farm_users.farm_role IN ('owner', 'manager')
        )
    );

-- Comment explaining the address field
COMMENT ON COLUMN public.farms.address IS 'Detailed address of the farm (separate from general location/province)';

-- Update any existing farms to have empty address initially
UPDATE public.farms SET address = '' WHERE address IS NULL;
