-- =====================================================
-- SIMPLE ADMIN DIAGNOSTIC SCRIPT FOR SPARKLEPRO
-- =====================================================
-- This is a simplified version that should work with your database schema
-- Execute this script in Supabase SQL Editor while logged in as admin user

-- 1. BASIC USER CHECK
-- =====================================================
SELECT 'BASIC_USER_CHECK' as check_type, auth.uid() as current_user_id;

-- 2. CHECK IF CURRENT USER HAS ADMIN ROLE
-- =====================================================
SELECT 
    'ADMIN_ROLE_CHECK' as check_type,
    id,
    full_name,
    role,
    member_since
FROM public.profiles 
WHERE id = auth.uid();

-- 3. CHECK ALL ADMIN USERS IN SYSTEM
-- =====================================================
SELECT 
    'ALL_ADMIN_USERS' as check_type,
    id,
    full_name,
    role,
    member_since
FROM public.profiles 
WHERE role = 'admin';

-- 4. CHECK IF is_admin_user FUNCTION EXISTS
-- =====================================================
SELECT 
    'FUNCTION_EXISTS' as check_type,
    proname as function_name
FROM pg_proc 
WHERE proname = 'is_admin_user';

-- 5. TEST is_admin_user FUNCTION
-- =====================================================
SELECT 
    'FUNCTION_TEST' as check_type,
    is_admin_user() as function_result;

-- 6. CHECK RLS POLICIES
-- =====================================================
SELECT 
    'RLS_POLICIES' as check_type,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('profiles', 'bookings')
AND schemaname = 'public';

-- 7. CHECK IF RLS IS ENABLED
-- =====================================================
SELECT 
    'RLS_ENABLED' as check_type,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('profiles', 'bookings')
AND schemaname = 'public';

-- 8. TEST BASIC DATA ACCESS
-- =====================================================
-- Test if you can see your own profile
SELECT 
    'SELF_PROFILE_ACCESS' as check_type,
    COUNT(*) as profile_count
FROM public.profiles 
WHERE id = auth.uid();

-- Test if you can see your own bookings
SELECT 
    'SELF_BOOKINGS_ACCESS' as check_type,
    COUNT(*) as booking_count
FROM public.bookings 
WHERE customer_id = auth.uid();

-- 9. TEST ADMIN DATA ACCESS
-- =====================================================
-- Test if admin can see all profiles
SELECT 
    'ADMIN_PROFILES_ACCESS' as check_type,
    CASE 
        WHEN is_admin_user() THEN COUNT(*)::text
        ELSE 'NOT_ADMIN'
    END as total_profiles
FROM public.profiles;

-- Test if admin can see all bookings
SELECT 
    'ADMIN_BOOKINGS_ACCESS' as check_type,
    CASE 
        WHEN is_admin_user() THEN COUNT(*)::text
        ELSE 'NOT_ADMIN'
    END as total_bookings
FROM public.bookings;

-- 10. FINAL STATUS
-- =====================================================
SELECT 
    'FINAL_STATUS' as check_type,
    auth.uid() as user_id,
    (SELECT role FROM public.profiles WHERE id = auth.uid()) as user_role,
    is_admin_user() as admin_function_result,
    CASE 
        WHEN is_admin_user() THEN 'ADMIN_ACCESS_CONFIRMED'
        ELSE 'NOT_ADMIN_ACCESS'
    END as final_status;

-- =====================================================
-- EXECUTION INSTRUCTIONS:
-- =====================================================
-- 1. Copy this entire script
-- 2. Paste it into Supabase SQL Editor
-- 3. Make sure you're logged in as admin user
-- 4. Execute the script
-- 5. Copy ALL results and send them to me
-- =====================================================
