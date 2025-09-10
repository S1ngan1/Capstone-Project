-- Supabase RLS Policy Fix Script
-- Run these commands in your Supabase SQL Editor

-- 1. DISABLE RLS temporarily (if you want quick fix) - NOT RECOMMENDED for production
-- ALTER TABLE farms DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE farm_users DISABLE ROW LEVEL SECURITY;

-- 2. OR CREATE PROPER RLS POLICIES (RECOMMENDED) ✅

-- ========================================
-- FARMS TABLE POLICIES
-- ========================================

-- Policy 1: Allow authenticated users to INSERT farms
CREATE POLICY "Authenticated users can create farms" ON farms
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 2: Allow users to view farms they have access to
CREATE POLICY "Users can view their farms" ON farms
FOR SELECT USING (
  id IN (
    SELECT farm_id FROM farm_users WHERE user_id = auth.uid()
  )
);

-- Policy 3: Allow farm owners to update their farms
CREATE POLICY "Farm owners can update farms" ON farms
FOR UPDATE USING (
  id IN (
    SELECT farm_id FROM farm_users
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Policy 4: Allow farm owners to delete their farms
CREATE POLICY "Farm owners can delete farms" ON farms
FOR DELETE USING (
  id IN (
    SELECT farm_id FROM farm_users
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- ========================================
-- FARM_USERS TABLE POLICIES
-- ========================================

-- Policy 1: Allow authenticated users to be added to farms
CREATE POLICY "Users can be added to farms" ON farm_users
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 2: Allow users to view their own farm relationships
CREATE POLICY "Users can view their farm relationships" ON farm_users
FOR SELECT USING (user_id = auth.uid());

-- Policy 3: Allow farm owners to manage farm users
CREATE POLICY "Farm owners can manage users" ON farm_users
FOR ALL USING (
  farm_id IN (
    SELECT farm_id FROM farm_users
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- ========================================
-- PROFILES TABLE POLICIES (if needed)
-- ========================================

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Allow profile creation during signup
CREATE POLICY "Users can create profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- ========================================
-- VERIFY POLICIES ARE APPLIED
-- ========================================

-- Check if policies exist (run this to verify)
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('farms', 'farm_users', 'profiles');

-- ========================================
-- ALTERNATIVE: QUICK FIX (DISABLE RLS)
-- ========================================
-- Only use this for testing - NOT for production!
-- ALTER TABLE farms DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE farm_users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
