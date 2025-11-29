-- Add student details columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS mobile_number TEXT,
ADD COLUMN IF NOT EXISTS parent_name TEXT,
ADD COLUMN IF NOT EXISTS parent_phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN profiles.mobile_number IS 'Student mobile/phone number';
COMMENT ON COLUMN profiles.parent_name IS 'Parent or guardian full name';
COMMENT ON COLUMN profiles.parent_phone IS 'Parent or guardian phone number';
COMMENT ON COLUMN profiles.address IS 'Student residential address';
COMMENT ON COLUMN profiles.notes IS 'Additional notes about the student';
