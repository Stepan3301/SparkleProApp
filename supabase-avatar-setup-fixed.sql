-- =====================================================
-- SUPABASE AVATAR SETUP - COMPLETE CONFIGURATION
-- =====================================================

-- 1. Add avatar_url column to profiles table (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Create the avatars bucket (if not exists)
-- This should be done in Supabase UI: Storage > New Bucket > "avatars" > Public: true

-- 3. Delete existing policies (if any) and recreate them
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- 4. Create storage policies for avatars bucket
-- Policy 1: Allow users to INSERT (upload) their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Allow users to SELECT (read) their own avatar
CREATE POLICY "Users can read their own avatar"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Allow users to UPDATE their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Allow users to DELETE their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 5: Allow public read access to avatars (for displaying in UI)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 6. Ensure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 7. Optional: Update profiles table policy to allow avatar_url updates
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR ALL
USING (auth.uid() = id);

-- 8. Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;