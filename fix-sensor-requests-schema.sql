-- Fix sensor_requests table and foreign key relationships
-- This script ensures the sensor_requests table exists with proper foreign key constraints

-- First, check if the table exists and drop it if it has issues
DROP TABLE IF EXISTS public.sensor_request_status_history CASCADE;
DROP TABLE IF EXISTS public.sensor_request_attachments CASCADE;
DROP TABLE IF EXISTS public.sensor_requests CASCADE;

-- Create sensor_requests table with proper foreign key relationships
CREATE TABLE public.sensor_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL,
    sensor_type TEXT NOT NULL CHECK (sensor_type IN ('ph', 'ec', 'moisture', 'temperature', 'light', 'humidity')),
    sensor_brand TEXT,
    sensor_model TEXT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 10),
    installation_location TEXT NOT NULL,
    justification TEXT NOT NULL,
    technical_requirements TEXT,
    budget_range TEXT CHECK (budget_range IN ('under_100', '100_500', '500_1000', '1000_plus')),
    priority_level TEXT NOT NULL DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'urgent')),
    requested_by UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'installed', 'cancelled')),
    processed_by UUID,
    admin_feedback TEXT,
    estimated_cost DECIMAL(10,2),
    installation_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approval_notes TEXT,
    rejection_reason TEXT,
    installation_notes TEXT
);

-- Add foreign key constraints after table creation - referencing profiles table instead of auth.users
ALTER TABLE public.sensor_requests
ADD CONSTRAINT sensor_requests_farm_id_fkey
FOREIGN KEY (farm_id) REFERENCES public.farms(id) ON DELETE CASCADE;

ALTER TABLE public.sensor_requests
ADD CONSTRAINT sensor_requests_requested_by_fkey
FOREIGN KEY (requested_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.sensor_requests
ADD CONSTRAINT sensor_requests_processed_by_fkey
FOREIGN KEY (processed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create supporting tables
CREATE TABLE public.sensor_request_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_request_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.sensor_request_attachments
ADD CONSTRAINT sensor_request_attachments_sensor_request_id_fkey
FOREIGN KEY (sensor_request_id) REFERENCES public.sensor_requests(id) ON DELETE CASCADE;

ALTER TABLE public.sensor_request_attachments
ADD CONSTRAINT sensor_request_attachments_uploaded_by_fkey
FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE TABLE public.sensor_request_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_request_id UUID NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.sensor_request_status_history
ADD CONSTRAINT sensor_request_status_history_sensor_request_id_fkey
FOREIGN KEY (sensor_request_id) REFERENCES public.sensor_requests(id) ON DELETE CASCADE;

ALTER TABLE public.sensor_request_status_history
ADD CONSTRAINT sensor_request_status_history_changed_by_fkey
FOREIGN KEY (changed_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_sensor_requests_farm_id ON public.sensor_requests(farm_id);
CREATE INDEX idx_sensor_requests_requested_by ON public.sensor_requests(requested_by);
CREATE INDEX idx_sensor_requests_status ON public.sensor_requests(status);
CREATE INDEX idx_sensor_requests_sensor_type ON public.sensor_requests(sensor_type);
CREATE INDEX idx_sensor_requests_priority ON public.sensor_requests(priority_level);
CREATE INDEX idx_sensor_requests_created_at ON public.sensor_requests(created_at DESC);
CREATE INDEX idx_sensor_request_attachments_request_id ON public.sensor_request_attachments(sensor_request_id);
CREATE INDEX idx_sensor_request_history_request_id ON public.sensor_request_status_history(sensor_request_id);

-- Enable RLS
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

-- Admins can update any request
CREATE POLICY "Admins can update any sensor request" ON public.sensor_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- RLS Policies for attachments
CREATE POLICY "Users can view attachments for accessible requests" ON public.sensor_request_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sensor_requests sr
            JOIN public.farm_users fu ON sr.farm_id = fu.farm_id
            WHERE sr.id = sensor_request_attachments.sensor_request_id
            AND fu.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can upload attachments to their requests" ON public.sensor_request_attachments
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

-- RLS Policies for status history
CREATE POLICY "Users can view status history for accessible requests" ON public.sensor_request_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sensor_requests sr
            JOIN public.farm_users fu ON sr.farm_id = fu.farm_id
            WHERE sr.id = sensor_request_status_history.sensor_request_id
            AND fu.user_id = auth.uid()
        )
    );

CREATE POLICY "Authorized users can create status history" ON public.sensor_request_status_history
    FOR INSERT WITH CHECK (
        auth.uid() = changed_by
        AND (
            -- Admins can change any status
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
            OR
            -- Users can change their own pending requests
            EXISTS (
                SELECT 1 FROM public.sensor_requests sr
                WHERE sr.id = sensor_request_status_history.sensor_request_id
                AND sr.requested_by = auth.uid()
                AND sr.status = 'pending'
            )
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sensor_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sensor_request_updated_at_trigger
    BEFORE UPDATE ON public.sensor_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_sensor_request_updated_at();

-- Add trigger to create status history entries
CREATE OR REPLACE FUNCTION create_sensor_request_status_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create history entry if status actually changed
    IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) OR TG_OP = 'INSERT' THEN
        INSERT INTO public.sensor_request_status_history (
            sensor_request_id,
            old_status,
            new_status,
            changed_by,
            notes
        ) VALUES (
            NEW.id,
            CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
            NEW.status,
            COALESCE(NEW.processed_by, NEW.requested_by),
            CASE
                WHEN NEW.status = 'approved' THEN NEW.approval_notes
                WHEN NEW.status = 'rejected' THEN NEW.rejection_reason
                ELSE NULL
            END
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sensor_request_status_history_trigger
    AFTER INSERT OR UPDATE ON public.sensor_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_sensor_request_status_history();
