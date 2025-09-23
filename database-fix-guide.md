# Database Setup and Fix Guide

## Issues Fixed in Code:
✅ Home component now properly displays username and farm-specific roles
✅ Farm component now correctly handles farm creation with owner role assignment
✅ Removed global role concepts - roles are now farm-specific
✅ Fixed database queries to use correct table relationships

## Remaining Database Issues to Fix:

### 1. Row-Level Security (RLS) Policies
The errors you're seeing are due to RLS policies blocking operations. You need to update your Supabase policies:

**For `farms` table:**
```sql
-- Policy for inserting farms (authenticated users can create farms)
CREATE POLICY "Users can insert farms" ON farms
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for selecting farms (users can see farms they have access to)
CREATE POLICY "Users can view their farms" ON farms
FOR SELECT USING (
  id IN (
    SELECT farm_id FROM farm_users WHERE user_id = auth.uid()
  )
);
```

**For `farm_users` table:**
```sql
-- Policy for inserting farm_users (authenticated users can be added to farms)
CREATE POLICY "Users can be added to farms" ON farm_users
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for selecting farm_users (users can see their own farm relationships)
CREATE POLICY "Users can view their farm relationships" ON farm_users
FOR SELECT USING (user_id = auth.uid());
```

### 2. Table Schema Verification
Make sure your tables have the correct structure:

**farms table should have:**
- id (uuid, primary key)
- name (text)
- location (text, nullable)
- created_at (timestamp, default now())

**farm_users table should have:**
- id (uuid, primary key) 
- farm_id (uuid, foreign key to farms.id)
- user_id (uuid, foreign key to auth.users.id)
- role (text) - values: 'owner', 'manager', 'viewer'
- created_at (timestamp, default now())

**profiles table should have:**
- id (uuid, primary key, foreign key to auth.users.id)
- username (text)
- email (text)
- created_at (timestamp, default now())

### 3. Foreign Key Relationships
Ensure proper foreign key constraints exist:

```sql
-- Add foreign key constraints if they don't exist
ALTER TABLE farm_users 
ADD CONSTRAINT fk_farm_users_farm_id 
FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE;

ALTER TABLE farm_users 
ADD CONSTRAINT fk_farm_users_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

### 4. Disable Anonymous Sign-ins
In your Supabase dashboard:
1. Go to Authentication > Settings
2. Disable "Enable anonymous sign-ins"
3. Make sure "Enable email confirmations" is enabled if you want email verification

## Testing the Fixes:

1. **Test User Registration:**
   - Should create user account and profile with username
   - No role should be assigned globally

2. **Test Farm Creation:**
   - User should be able to create farms
   - Creator automatically gets 'owner' role in farm_users table

3. **Test Home Page:**
   - Should display "Hello [username]," 
   - Should show current farm name and user's role for that farm
   - Should show alert if user has no farms with link to Farm page

4. **Test Farm Switching:**
   - If user has multiple farms, they can switch between them
   - Role should update based on the selected farm

## Implementation Notes:

- Roles are now contextual to each farm (stored in farm_users table)
- A user can be Owner of Farm A and Manager of Farm B
- Farm creation automatically assigns owner role to creator
- No global roles exist - all roles are farm-specific
- Username is properly stored and retrieved from profiles table
