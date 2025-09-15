-- Admin User Diagnostic Script
-- This script helps diagnose admin user issues

-- 1. Check if the current user exists in profiles table
SELECT 
    'Current User Profile Check' as check_type,
    id,
    full_name,
    role,
    member_since
FROM public.profiles 
WHERE id = auth.uid();

-- 2. Check all profiles to see admin users
SELECT 
    'All Admin Users' as check_type,
    id,
    full_name,
    role,
    member_since
FROM public.profiles 
WHERE role = 'admin'
ORDER BY member_since DESC;

-- 3. Test the is_admin_user() function
SELECT 
    'Admin Function Test' as check_type,
    auth.uid() as current_user_id,
    is_admin_user() as is_admin_result;

-- 4. Check RLS policies on profiles table
SELECT 
    'RLS Policies on Profiles' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles'
AND schemaname = 'public'
ORDER BY policyname;

-- 5. Check if RLS is enabled on profiles table
SELECT 
    'RLS Status' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles'
AND schemaname = 'public';

-- 6. Check current user's auth info
SELECT 
    'Auth Info' as check_type,
    auth.uid() as user_id,
    auth.role() as user_role;
