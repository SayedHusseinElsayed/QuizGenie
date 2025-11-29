-- Add OWNER role and suspension fields to profiles table

-- Step 1: Add suspension fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Step 2: Create owner account in auth.users (if using Supabase Auth)
-- NOTE: This requires admin access. You may need to create the user via Supabase Dashboard first,
-- then run Step 3 to create the profile.

-- Step 3: Insert owner profile
-- IMPORTANT: Replace 'YOUR_USER_ID_FROM_SUPABASE_AUTH' with the actual UUID from auth.users
-- after creating the account via Supabase Dashboard (Authentication > Users > Add User)
INSERT INTO profiles (id, email, full_name, role, created_at)
VALUES (
  'YOUR_USER_ID_FROM_SUPABASE_AUTH',  -- Replace with actual user ID from Supabase Auth
  'sayedelsayed20390@gmail.com',
  'Sayed Elsayed',
  'OWNER',
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET role = 'OWNER';

-- Alternative: If the auth user already exists, update the profile
-- UPDATE profiles
-- SET role = 'OWNER'
-- WHERE email = 'sayedelsayed20390@gmail.com';

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(is_suspended);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Step 5: Add comments for documentation
COMMENT ON COLUMN profiles.is_suspended IS 'Whether the user account is suspended';
COMMENT ON COLUMN profiles.suspended_at IS 'Timestamp when account was suspended';
COMMENT ON COLUMN profiles.suspended_by IS 'ID of owner who suspended the account';
COMMENT ON COLUMN profiles.suspension_reason IS 'Reason for account suspension';

-- Step 5: Create RLS policy for owner access (optional - run if RLS is enabled)
-- CREATE POLICY "owner_view_all_users" ON profiles
--   FOR SELECT
--   USING (
--     auth.uid() IN (
--       SELECT id FROM profiles WHERE role = 'OWNER'
--     )
--   );

-- CREATE POLICY "owner_manage_users" ON profiles
--   FOR UPDATE
--   USING (
--     auth.uid() IN (
--       SELECT id FROM profiles WHERE role = 'OWNER'
--     )
--   );
