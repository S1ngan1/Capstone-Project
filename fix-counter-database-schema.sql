-- Fix notification and activity counters by adding missing database columns
-- This migration script adds the required columns for proper counter functionality

-- 1. Add 'viewed' column to activity_logs table for activity counter tracking
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS viewed BOOLEAN DEFAULT FALSE;

-- 2. Add 'address' column to farm_requests table (if not already added)
ALTER TABLE public.farm_requests ADD COLUMN IF NOT EXISTS address TEXT;

-- 3. Create index for better performance on viewed column
CREATE INDEX IF NOT EXISTS idx_activity_logs_viewed ON public.activity_logs(viewed) WHERE viewed = FALSE;

-- 4. Create index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

-- 5. Update existing activity logs to set viewed = false (safe default)
UPDATE public.activity_logs SET viewed = FALSE WHERE viewed IS NULL;

-- 6. Verify the changes
SELECT
    'activity_logs' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'activity_logs'
AND table_schema = 'public'
AND column_name IN ('viewed', 'user_id', 'created_at')
ORDER BY ordinal_position;

SELECT
    'notifications' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
AND table_schema = 'public'
AND column_name IN ('is_read', 'user_id', 'created_at')
ORDER BY ordinal_position;

SELECT
    'farm_requests' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'farm_requests'
AND table_schema = 'public'
AND column_name IN ('address', 'farm_name', 'location')
ORDER BY ordinal_position;
