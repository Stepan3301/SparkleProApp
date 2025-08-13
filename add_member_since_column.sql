-- Add member_since column to profiles table
ALTER TABLE profiles ADD COLUMN member_since TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing profiles to use the user's signup date from auth.users table
-- This gets the real signup date for existing users
UPDATE profiles 
SET member_since = (
  SELECT au.created_at 
  FROM auth.users au 
  WHERE au.id = profiles.id
)
WHERE member_since IS NULL;

-- For any profiles that still don't have member_since (edge case), set to NOW()
UPDATE profiles 
SET member_since = NOW() 
WHERE member_since IS NULL;