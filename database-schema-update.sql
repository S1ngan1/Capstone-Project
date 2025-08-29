-- Updated Database Schema Migration Script
-- Run these commands in your Supabase SQL Editor to implement the new schema

-- ========================================
-- 1. UPDATE PROFILES TABLE - ADD APPLICATION ROLE
-- ========================================

-- Add role column to profiles table for application-level roles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'normal_user'
CHECK (role IN ('admin', 'normal_user', 'data_manager'));

-- Update existing users to have default role
UPDATE profiles SET role = 'normal_user' WHERE role IS NULL;

-- ========================================
-- 2. UPDATE FARM_USERS TABLE - RENAME ROLE TO FARM_ROLE
-- ========================================

-- Rename the role column to farm_role to differentiate from application roles
ALTER TABLE farm_users
RENAME COLUMN role TO farm_role;

-- Update the check constraint for farm_role values
ALTER TABLE farm_users
DROP CONSTRAINT IF EXISTS farm_users_role_check;

ALTER TABLE farm_users
ADD CONSTRAINT farm_users_farm_role_check
CHECK (farm_role IN ('owner', 'manager', 'viewer'));

-- ========================================
-- 3. UPDATE RLS POLICIES FOR NEW SCHEMA
-- ========================================

-- Drop old policies that might reference the old column names
DROP POLICY IF EXISTS "Farm owners can manage users" ON farm_users;
DROP POLICY IF EXISTS "Users can view their farm relationships" ON farm_users;

-- Create updated policies with new column names
CREATE POLICY "Users can view their farm relationships" ON farm_users
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Farm owners can manage users" ON farm_users
FOR ALL USING (
  farm_id IN (
    SELECT farm_id FROM farm_users
    WHERE user_id = auth.uid() AND farm_role = 'owner'
  )
);

-- Policy for inserting farm users (updated for farm_role)
DROP POLICY IF EXISTS "Users can be added to farms" ON farm_users;
CREATE POLICY "Users can be added to farms" ON farm_users
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ========================================
-- 4. UPDATE PROFILES POLICIES
-- ========================================

-- Ensure profiles table has proper RLS policies
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can create profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- ========================================
-- 5. VERIFY SCHEMA CHANGES
-- ========================================

-- Check that the columns exist with correct names
-- Run this to verify your changes:
/*
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('profiles', 'farm_users', 'farms')
ORDER BY table_name, ordinal_position;
*/

-- ========================================
-- 6. SAMPLE DATA VERIFICATION
-- ========================================

-- Example queries to test the new schema:
/*
-- Check profiles with roles
SELECT id, username, email, role FROM profiles LIMIT 5;

-- Check farm_users with farm_roles
SELECT
    fu.user_id,
    fu.farm_role,
    f.name as farm_name,
    p.username,
    p.role as app_role
FROM farm_users fu
JOIN farms f ON fu.farm_id = f.id
JOIN profiles p ON fu.user_id = p.id
LIMIT 5;
*/
