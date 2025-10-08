-- Ensure avatars bucket exists and has proper policies for cleaner avatars
-- Run this in your Supabase SQL Editor

-- 1. Create or update the avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Drop existing conflicting policies
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete for authenticated users" ON storage.objects;

-- 3. Create new policies that work for both user avatars and cleaner avatars
-- Policy 1: Allow authenticated users to upload to their own folder
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow authenticated users to update their own files
CREATE POLICY "Authenticated users can update avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow authenticated users to delete their own files
CREATE POLICY "Authenticated users can delete avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Since bucket is public, SELECT is automatically allowed
-- No need for SELECT policies on public buckets

-- 5. Ensure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 6. Verify the setup
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'avatars';
