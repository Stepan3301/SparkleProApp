-- Add member_since column to profiles table
ALTER TABLE profiles ADD COLUMN member_since TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing profiles to use their created_at date as member_since
-- If created_at doesn't exist, use current timestamp
UPDATE profiles 
SET member_since = COALESCE(created_at, NOW()) 
WHERE member_since IS NULL;

-- Make sure all new profiles get member_since set automatically
-- Note: You can also update this in your application logic when creating profiles