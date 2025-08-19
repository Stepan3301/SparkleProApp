-- Add avatar_url column to profiles table
alter table profiles add column if not exists avatar_url text;

-- Allow users to read their own avatar
create policy if not exists "Users can read their own avatar"
on storage.objects for select
using (
  bucket_id = 'avatars'
  and auth.uid()::text = substring(name, 1, position('/' in name) - 1)
);

-- Allow users to upload their own avatar
create policy if not exists "Users can upload their own avatar"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = substring(name, 1, position('/' in name) - 1)
);

-- Allow users to update their own avatar
create policy if not exists "Users can update their own avatar"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.uid()::text = substring(name, 1, position('/' in name) - 1)
);

-- Allow users to delete their own avatar
create policy if not exists "Users can delete their own avatar"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and auth.uid()::text = substring(name, 1, position('/' in name) - 1)
);

-- Allow users to update their own profile (including avatar_url)
create policy if not exists "Users can update their own profile"
on profiles for update
using (auth.uid() = id);