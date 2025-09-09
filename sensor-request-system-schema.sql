-- Sensor Request System Database Schema
-- Enhanced version of farm request system with better approach

-- Create sensor_requests table
CREATE TABLE IF NOT EXISTS public.sensor_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    sensor_type TEXT NOT NULL CHECK (sensor_type IN ('ph', 'ec', 'moisture', 'temperature', 'light', 'humidity')),
    sensor_brand TEXT,
    sensor_model TEXT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 10),
    installation_location TEXT NOT NULL,
    justification TEXT NOT NULL,
    technical_requirements TEXT,
    budget_range TEXT CHECK (budget_range IN ('under_100', '100_500', '500_1000', '1000_plus')),
    priority_level TEXT NOT NULL DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'urgent')),
    requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'installed', 'cancelled')),
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    admin_feedback TEXT,
    estimated_cost DECIMAL(10,2),
    installation_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Metadata for better tracking
    approval_notes TEXT,
    rejection_reason TEXT,
    installation_notes TEXT
);

-- Create sensor_request_attachments table for supporting documents/images
CREATE TABLE IF NOT EXISTS public.sensor_request_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_request_id UUID NOT NULL REFERENCES public.sensor_requests(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sensor_request_status_history table for audit trail
CREATE TABLE IF NOT EXISTS public.sensor_request_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_request_id UUID NOT NULL REFERENCES public.sensor_requests(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sensor_requests_farm_id ON public.sensor_requests(farm_id);
CREATE INDEX IF NOT EXISTS idx_sensor_requests_requested_by ON public.sensor_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_sensor_requests_status ON public.sensor_requests(status);
CREATE INDEX IF NOT EXISTS idx_sensor_requests_sensor_type ON public.sensor_requests(sensor_type);
CREATE INDEX IF NOT EXISTS idx_sensor_requests_priority ON public.sensor_requests(priority_level);
CREATE INDEX IF NOT EXISTS idx_sensor_requests_created_at ON public.sensor_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_request_attachments_request_id ON public.sensor_request_attachments(sensor_request_id);
CREATE INDEX IF NOT EXISTS idx_sensor_request_history_request_id ON public.sensor_request_status_history(sensor_request_id);

-- Add RLS (Row Level Security)
ALTER TABLE public.sensor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_request_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_request_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sensor_requests
-- Users can view requests for farms they have access to
CREATE POLICY "Users can view sensor requests for their farms" ON public.sensor_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.farm_users
            WHERE farm_users.farm_id = sensor_requests.farm_id
            AND farm_users.user_id = auth.uid()
        )
    );

-- Users can create requests for farms they own or manage
CREATE POLICY "Users can create sensor requests for their farms" ON public.sensor_requests
    FOR INSERT WITH CHECK (
        auth.uid() = requested_by
        AND EXISTS (
            SELECT 1 FROM public.farm_users
            WHERE farm_users.farm_id = sensor_requests.farm_id
            AND farm_users.user_id = auth.uid()
            AND farm_users.farm_role IN ('owner', 'manager')
        )
    );

-- Users can update their own pending requests
CREATE POLICY "Users can update own pending sensor requests" ON public.sensor_requests
    FOR UPDATE USING (
        auth.uid() = requested_by
        AND status = 'pending'
        AND EXISTS (
            SELECT 1 FROM public.farm_users
            WHERE farm_users.farm_id = sensor_requests.farm_id
            AND farm_users.user_id = auth.uid()
            AND farm_users.farm_role IN ('owner', 'manager')
        )
    );

-- Users can cancel their own requests (not delete, just update status)
CREATE POLICY "Users can cancel own sensor requests" ON public.sensor_requests
    FOR UPDATE USING (
        auth.uid() = requested_by
        AND status IN ('pending', 'approved')
        AND EXISTS (
            SELECT 1 FROM public.farm_users
            WHERE farm_users.farm_id = sensor_requests.farm_id
            AND farm_users.user_id = auth.uid()
        )
    );

-- Admin users can view all requests
CREATE POLICY "Admins can view all sensor requests" ON public.sensor_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admin users can update all requests
CREATE POLICY "Admins can update all sensor requests" ON public.sensor_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- RLS Policies for sensor_request_attachments
CREATE POLICY "Users can view attachments for accessible requests" ON public.sensor_request_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sensor_requests sr
            JOIN public.farm_users fu ON sr.farm_id = fu.farm_id
            WHERE sr.id = sensor_request_attachments.sensor_request_id
            AND fu.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can upload attachments for their requests" ON public.sensor_request_attachments
    FOR INSERT WITH CHECK (
        auth.uid() = uploaded_by
        AND EXISTS (
            SELECT 1 FROM public.sensor_requests sr
            JOIN public.farm_users fu ON sr.farm_id = fu.farm_id
            WHERE sr.id = sensor_request_attachments.sensor_request_id
            AND fu.user_id = auth.uid()
            AND sr.requested_by = auth.uid()
        )
    );

-- RLS Policies for sensor_request_status_history
CREATE POLICY "Users can view status history for accessible requests" ON public.sensor_request_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sensor_requests sr
            JOIN public.farm_users fu ON sr.farm_id = fu.farm_id
            WHERE sr.id = sensor_request_status_history.sensor_request_id
            AND fu.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "System can insert status history" ON public.sensor_request_status_history
    FOR INSERT WITH CHECK (auth.uid() = changed_by);

-- Create function to automatically update status history
CREATE OR REPLACE FUNCTION public.update_sensor_request_status_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.sensor_request_status_history (
            sensor_request_id,
            old_status,
            new_status,
            changed_by,
            notes
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            auth.uid(),
            CASE
                WHEN NEW.status = 'approved' THEN NEW.approval_notes
                WHEN NEW.status = 'rejected' THEN NEW.rejection_reason
                WHEN NEW.status = 'installed' THEN NEW.installation_notes
                ELSE NEW.admin_feedback
            END
        );
    END IF;

    -- Update the updated_at timestamp
    NEW.updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for status history
DROP TRIGGER IF EXISTS sensor_request_status_history_trigger ON public.sensor_requests;
CREATE TRIGGER sensor_request_status_history_trigger
    BEFORE UPDATE ON public.sensor_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_sensor_request_status_history();

-- Create function to get sensor request statistics
CREATE OR REPLACE FUNCTION public.get_sensor_request_stats(farm_id_param UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'pending', COUNT(*) FILTER (WHERE status = 'pending'),
        'approved', COUNT(*) FILTER (WHERE status = 'approved'),
        'rejected', COUNT(*) FILTER (WHERE status = 'rejected'),
        'installed', COUNT(*) FILTER (WHERE status = 'installed'),
        'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled'),
        'by_type', json_object_agg(sensor_type, type_count),
        'by_priority', json_object_agg(priority_level, priority_count)
    ) INTO result
    FROM (
        SELECT
            status,
            sensor_type,
            priority_level,
            COUNT(*) OVER (PARTITION BY sensor_type) as type_count,
            COUNT(*) OVER (PARTITION BY priority_level) as priority_count
        FROM public.sensor_requests
        WHERE (farm_id_param IS NULL OR farm_id = farm_id_param)
        AND (
            -- User can see their own farm requests
            EXISTS (
                SELECT 1 FROM public.farm_users
                WHERE farm_users.farm_id = sensor_requests.farm_id
                AND farm_users.user_id = auth.uid()
            )
            OR
            -- Admin can see all
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        )
    ) stats;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON public.sensor_requests TO authenticated;
GRANT ALL ON public.sensor_request_attachments TO authenticated;
GRANT ALL ON public.sensor_request_status_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sensor_request_stats TO authenticated;
