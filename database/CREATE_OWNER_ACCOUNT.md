# Creating Owner Account - Step-by-Step Guide

## Method 1: Via Supabase Dashboard (Recommended)

### Step 1: Create Auth User
1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add User** → **Create new user**
4. Fill in:
   - **Email:** sayedelsayed20390@gmail.com
   - **Password:** Dev@2400572
   - **Auto Confirm User:** ✅ Check this box
5. Click **Create user**
6. **Copy the User ID (UUID)** that appears

### Step 2: Run Suspension Fields Migration
1. Go to **SQL Editor**
2. Paste and run:
```sql
-- Add suspension fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(is_suspended);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
```

### Step 3: Create Owner Profile
1. Still in **SQL Editor**
2. Replace `YOUR_USER_ID_HERE` with the UUID you copied in Step 1
3. Run:
```sql
INSERT INTO profiles (id, email, full_name, role, created_at)
VALUES (
  'YOUR_USER_ID_HERE',  -- Replace with actual UUID
  'sayedelsayed20390@gmail.com',
  'Sayed Elsayed',
  'OWNER',
  NOW()
);
```

### Step 4: Login
1. Go to your app
2. Login with:
   - Email: sayedelsayed20390@gmail.com
   - Password: Dev@2400572
3. You should see the **Shield icon** in the sidebar
4. Click it to access the Admin Dashboard!

---

## Method 2: Via Signup Page (Alternative)

### Step 1: Run Migration First
1. Go to Supabase Dashboard → **SQL Editor**
2. Run the suspension fields migration (from Method 1, Step 2)

### Step 2: Signup as Teacher
1. Go to your app's signup page
2. Create account with:
   - Email: sayedelsayed20390@gmail.com
   - Password: Dev@2400572
   - Role: **Teacher**
3. Complete signup

### Step 3: Upgrade to Owner
1. Go to Supabase Dashboard → **SQL Editor**
2. Run:
```sql
UPDATE profiles
SET role = 'OWNER'
WHERE email = 'sayedelsayed20390@gmail.com';
```

### Step 4: Re-login
1. Logout from your app
2. Login again
3. You should now see the **Shield icon**

---

## Verification

After completing either method, verify:
- ✅ Can login with sayedelsayed20390@gmail.com
- ✅ See Shield icon in sidebar
- ✅ Can access Admin Dashboard
- ✅ Can view all users
- ✅ Can see statistics

---

## Troubleshooting

**Can't see Shield icon?**
- Logout and login again
- Check role in Supabase: `SELECT role FROM profiles WHERE email = 'sayedelsayed20390@gmail.com'`
- Should return `OWNER`

**Can't access /admin route?**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check browser console for errors

**Suspension fields missing?**
- Re-run the ALTER TABLE commands from Step 2
