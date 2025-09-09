-- Quick Database Setup for Farm Request System
-- Run this in your Supabase SQL Editor to fix the missing table error

-- First, ensure profiles table has role column with proper constraints
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'tester'));

-- Update existing users to have default 'user' role if NULL
UPDATE public.profiles SET role = 'user' WHERE role IS NULL;

-- Create or update farm_requests table with admin feedback
CREATE TABLE IF NOT EXISTS public.farm_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_name TEXT NOT NULL,
    location TEXT NOT NULL,
    notes TEXT,
    requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    admin_feedback TEXT, -- New column for admin feedback when denying requests
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add admin_feedback column if it doesn't exist (for existing tables)
ALTER TABLE public.farm_requests ADD COLUMN IF NOT EXISTS admin_feedback TEXT;

-- Enable RLS
ALTER TABLE public.farm_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own requests" ON public.farm_requests;
DROP POLICY IF EXISTS "Users can create requests" ON public.farm_requests;
DROP POLICY IF EXISTS "Users can update own pending requests" ON public.farm_requests;
DROP POLICY IF EXISTS "Users can delete own requests" ON public.farm_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.farm_requests;
DROP POLICY IF EXISTS "Admins can process requests" ON public.farm_requests;

-- Create comprehensive RLS policies
-- Users can view their own requests
CREATE POLICY "Users can view own requests" ON public.farm_requests
    FOR SELECT USING (auth.uid() = requested_by);

-- Users can create new requests
CREATE POLICY "Users can create requests" ON public.farm_requests
    FOR INSERT WITH CHECK (auth.uid() = requested_by);

-- Users can update their own pending requests (not processed ones)
CREATE POLICY "Users can update own pending requests" ON public.farm_requests
    FOR UPDATE USING (
        auth.uid() = requested_by
        AND status = 'pending'
        AND processed_by IS NULL
    );

-- Users can delete their own pending or rejected requests
CREATE POLICY "Users can delete own requests" ON public.farm_requests
    FOR DELETE USING (
        auth.uid() = requested_by
        AND status IN ('pending', 'rejected')
    );

-- Admins can view ALL requests (full access)
CREATE POLICY "Admins can view all requests" ON public.farm_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admins can process (approve/reject) any request
CREATE POLICY "Admins can process requests" ON public.farm_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Testers can view all requests but cannot modify them (read-only access)
CREATE POLICY "Testers can view all requests" ON public.farm_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'tester'
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_farm_requests_requested_by ON public.farm_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_farm_requests_status ON public.farm_requests(status);
CREATE INDEX IF NOT EXISTS idx_farm_requests_created_at ON public.farm_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_farm_requests_processed_by ON public.farm_requests(processed_by);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Grant permissions
GRANT ALL ON public.farm_requests TO authenticated;
GRANT ALL ON public.farm_requests TO service_role;

-- Add update trigger for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_farm_requests_updated_at ON public.farm_requests;
CREATE TRIGGER update_farm_requests_updated_at
    BEFORE UPDATE ON public.farm_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to set admin role (can only be called by service role)
CREATE OR REPLACE FUNCTION set_user_admin_role(user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role
        FROM public.profiles
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION set_user_admin_role TO service_role;

-- Insert initial admin user (replace with your actual user ID)
-- You can find your user ID in the Supabase auth.users table
-- INSERT INTO public.profiles (id, role) VALUES ('YOUR_USER_ID_HERE', 'admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

COMMENT ON TABLE public.farm_requests IS 'Farm creation requests that require admin approval with feedback system';
COMMENT ON COLUMN public.farm_requests.status IS 'Request status: pending, approved, or rejected';
COMMENT ON COLUMN public.farm_requests.processed_by IS 'Admin user who processed the request';
COMMENT ON COLUMN public.farm_requests.admin_feedback IS 'Feedback from admin when rejecting a request';
COMMENT ON COLUMN public.profiles.role IS 'User role: admin (full access), user (standard), tester (read-only)';
