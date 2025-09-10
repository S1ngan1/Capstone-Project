-- Fix RLS policies for sensor data access
-- Run this in your Supabase SQL editor

-- 1. Check current RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('sensor', 'sensor_data', 'farms', 'farm_users');

-- 2. Temporarily disable RLS on sensor table to test
ALTER TABLE sensor DISABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_data DISABLE ROW LEVEL SECURITY;

-- 3. Or create proper RLS policies if you want to keep RLS enabled
-- Policy for sensor table - allow users to read sensors from farms they have access to
CREATE POLICY "Users can read sensors from their farms" ON sensor
    FOR SELECT
    USING (
        farm_id IN (
            SELECT farm_id
            FROM farm_users
            WHERE user_id = auth.uid()
        )
    );

-- Policy for sensor_data table - allow users to read data from sensors in their farms
CREATE POLICY "Users can read sensor data from their farms" ON sensor_data
    FOR SELECT
    USING (
        sensor_id IN (
            SELECT sensor_id
            FROM sensor
            WHERE farm_id IN (
                SELECT farm_id
                FROM farm_users
                WHERE user_id = auth.uid()
            )
        )
    );

-- Policy for farms table - allow users to read farms they have access to
CREATE POLICY "Users can read their farms" ON farms
    FOR SELECT
    USING (
        id IN (
            SELECT farm_id
            FROM farm_users
            WHERE user_id = auth.uid()
        )
    );

-- Policy for farms table - allow users to insert farms if they have creation privileges
CREATE POLICY "Approved users can create farms" ON farms
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
            AND farm_creation_status = 'approved'
        )
    );

-- 4. Enable RLS back on tables (if you want to use the policies above)
-- ALTER TABLE sensor ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
