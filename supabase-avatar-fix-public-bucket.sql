-- =====================================================
-- AVATAR BUCKET FIX - PUBLIC BUCKET CONFIGURATION
-- =====================================================

-- CRITICAL: The avatars bucket MUST be set as PUBLIC in Supabase UI
-- Go to Storage > avatars bucket > Settings > Toggle "Public bucket" ON

-- 1. Remove all existing avatar policies that might be conflicting
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Avatar management for users" ON storage.objects;

-- 2. For PUBLIC BUCKET - Create simple policies
-- Policy 1: Allow authenticated users to upload to their folder
CREATE POLICY "Avatar upload for authenticated users"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow authenticated users to update their own avatars
CREATE POLICY "Avatar update for authenticated users" 
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow authenticated users to delete their own avatars
CREATE POLICY "Avatar delete for authenticated users"
ON storage.objects FOR DELETE  
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Since bucket is PUBLIC, we don't need SELECT policies
-- Public buckets allow anyone to read files by default

-- 4. Verify storage objects has RLS enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. Check profiles table policies
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR ALL
TO authenticated
USING (auth.uid() = id);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. Verify the avatar_url column exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 7. IMPORTANT MANUAL STEPS:
-- After running this SQL, you MUST:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click on 'avatars' bucket  
-- 3. Click Settings
-- 4. Toggle "Public bucket" to ON/TRUE
-- 5. Save settings

-- 8. Test query to verify setup
-- SELECT auth.uid() as current_user_id;
-- SELECT * FROM profiles WHERE id = auth.uid();