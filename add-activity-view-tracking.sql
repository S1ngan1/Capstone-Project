-- Add last_activity_view column to profiles table for tracking activity log views
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_activity_view TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_activity_view ON public.profiles(last_activity_view);

-- Update existing users to have initial timestamp (optional - can be omitted to start fresh)
-- UPDATE public.profiles SET last_activity_view = NOW() WHERE last_activity_view IS NULL;

COMMENT ON COLUMN public.profiles.last_activity_view IS 'Timestamp when user last viewed their activity logs - used to calculate new activity count';
