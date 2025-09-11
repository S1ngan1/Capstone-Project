-- Farm Request System Database Schema
-- This creates the tables needed for the farm request workflow

-- Create farm_requests table
CREATE TABLE IF NOT EXISTS public.farm_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_name TEXT NOT NULL,
    location TEXT NOT NULL,
    address TEXT, -- Added address column for farm requests
    notes TEXT,
    requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add address column if table already exists (migration)
ALTER TABLE public.farm_requests ADD COLUMN IF NOT EXISTS address TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_farm_requests_requested_by ON public.farm_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_farm_requests_status ON public.farm_requests(status);
CREATE INDEX IF NOT EXISTS idx_farm_requests_created_at ON public.farm_requests(created_at DESC);

-- Add RLS (Row Level Security)
ALTER TABLE public.farm_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for farm_requests
-- Users can view their own requests
CREATE POLICY "Users can view own requests" ON public.farm_requests
    FOR SELECT USING (auth.uid() = requested_by);

-- Users can insert their own requests
CREATE POLICY "Users can create requests" ON public.farm_requests
    FOR INSERT WITH CHECK (auth.uid() = requested_by);

-- Users can update their own pending requests
CREATE POLICY "Users can update own pending requests" ON public.farm_requests
    FOR UPDATE USING (auth.uid() = requested_by AND status = 'pending');

-- Users can delete their own pending or rejected requests
CREATE POLICY "Users can delete own requests" ON public.farm_requests
    FOR DELETE USING (auth.uid() = requested_by AND status IN ('pending', 'rejected'));

-- Admin users can view all requests
CREATE POLICY "Admins can view all requests" ON public.farm_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admin users can update any request (for processing)
CREATE POLICY "Admins can process requests" ON public.farm_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create trigger to update updated_at timestamp
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

-- Grant necessary permissions
GRANT ALL ON public.farm_requests TO authenticated;
GRANT ALL ON public.farm_requests TO service_role;

-- Additional indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_farm_requests_processed_by ON public.farm_requests(processed_by);
CREATE INDEX IF NOT EXISTS idx_farm_requests_processed_at ON public.farm_requests(processed_at DESC);

COMMENT ON TABLE public.farm_requests IS 'Farm creation requests that require admin approval';
COMMENT ON COLUMN public.farm_requests.status IS 'Request status: pending, approved, or rejected';
COMMENT ON COLUMN public.farm_requests.processed_by IS 'Admin user who processed the request';
COMMENT ON COLUMN public.farm_requests.processed_at IS 'Timestamp when request was processed';
