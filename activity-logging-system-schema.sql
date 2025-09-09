-- Activity Logging System Schema
-- This creates tables to track all user CRUD actions and notifications

-- 1. Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE', 'REQUEST', 'APPROVE', 'REJECT')),
  table_name TEXT NOT NULL,
  record_id TEXT, -- Can be UUID or other identifier
  old_data JSONB, -- For updates/deletes, store previous state
  new_data JSONB, -- For creates/updates, store new state
  description TEXT NOT NULL, -- Human-readable description
  ip_address INET,
  user_agent TEXT,
  viewed BOOLEAN DEFAULT FALSE, -- Track if user has viewed this activity log
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add viewed column if table already exists (migration)
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS viewed BOOLEAN DEFAULT FALSE;

-- 2. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_log_id UUID REFERENCES public.activity_logs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_table_name ON public.activity_logs(table_name);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 4. Row Level Security (RLS) Policies
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Activity Logs Policies
-- Users can only see their own activity logs, admins can see all
CREATE POLICY "Users can view own activity logs" ON public.activity_logs
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only system can insert activity logs (through functions)
CREATE POLICY "System can insert activity logs" ON public.activity_logs
  FOR INSERT
  WITH CHECK (true);

-- Notifications Policies
-- Users can view and update their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- 5. Function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id UUID,
  p_action_type TEXT,
  p_table_name TEXT,
  p_record_id TEXT DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  -- Insert activity log
  INSERT INTO public.activity_logs (
    user_id, action_type, table_name, record_id,
    old_data, new_data, description, ip_address, user_agent
  ) VALUES (
    p_user_id, p_action_type, p_table_name, p_record_id,
    p_old_data, p_new_data, p_description, p_ip_address, p_user_agent
  ) RETURNING id INTO log_id;

  -- Create notification for the user
  INSERT INTO public.notifications (
    user_id, activity_log_id, title, message, type
  ) VALUES (
    p_user_id,
    log_id,
    CASE p_action_type
      WHEN 'CREATE' THEN 'New Item Created'
      WHEN 'UPDATE' THEN 'Item Updated'
      WHEN 'DELETE' THEN 'Item Deleted'
      WHEN 'REQUEST' THEN 'Request Submitted'
      WHEN 'APPROVE' THEN 'Request Approved'
      WHEN 'REJECT' THEN 'Request Rejected'
      ELSE 'Activity Recorded'
    END,
    COALESCE(p_description, 'Activity recorded for ' || p_table_name),
    CASE p_action_type
      WHEN 'CREATE' THEN 'success'
      WHEN 'UPDATE' THEN 'info'
      WHEN 'DELETE' THEN 'warning'
      WHEN 'REQUEST' THEN 'info'
      WHEN 'APPROVE' THEN 'success'
      WHEN 'REJECT' THEN 'error'
      ELSE 'info'
    END
  );

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE id = notification_id AND user_id = auth.uid();

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE user_id = auth.uid() AND is_read = FALSE;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.notifications
    WHERE user_id = auth.uid() AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. View for activity logs with user information
CREATE OR REPLACE VIEW public.activity_logs_with_user AS
SELECT
  al.*,
  p.username,
  p.email,
  p.role as user_role
FROM public.activity_logs al
JOIN public.profiles p ON al.user_id = p.id;

-- Grant necessary permissions
GRANT SELECT ON public.activity_logs TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_activity TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count TO authenticated;
GRANT SELECT ON public.activity_logs_with_user TO authenticated;
