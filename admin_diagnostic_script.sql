-- =====================================================
-- ADMIN DIAGNOSTIC SCRIPT FOR SPARKLEPRO
-- =====================================================
-- Execute this script in Supabase SQL Editor to diagnose admin access issues
-- Copy and paste the results back to me for analysis

-- 1. CHECK CURRENT USER AND AUTHENTICATION STATUS
-- =====================================================
SELECT 
    'CURRENT_USER_STATUS' as check_type,
    auth.uid() as current_user_id,
    auth.role() as current_auth_role,
    current_setting('request.jwt.claims', true) as jwt_claims;

-- 2. CHECK PROFILES TABLE STRUCTURE AND ADMIN USER
-- =====================================================
-- 2.1 Table structure
SELECT 
    'PROFILES_TABLE_STRUCTURE' as check_type,
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2.2 Check if current user has admin role
SELECT 
    'CURRENT_USER_ADMIN_CHECK' as check_type,
    id,
    full_name,
    role,
    member_since,
    created_at,
    updated_at
FROM public.profiles 
WHERE id = auth.uid();

-- 2.3 Check all admin users in the system
SELECT 
    'ALL_ADMIN_USERS' as check_type,
    id,
    full_name,
    role,
    member_since,
    created_at
FROM public.profiles 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- 3. CHECK RLS POLICIES STATUS
-- =====================================================
-- 3.1 Check if RLS is enabled on key tables
SELECT 
    'RLS_ENABLED_STATUS' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('profiles', 'bookings')
AND schemaname = 'public';

-- 3.2 Check all RLS policies for profiles table
SELECT 
    'PROFILES_RLS_POLICIES' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
AND schemaname = 'public'
ORDER BY policyname;

-- 3.3 Check all RLS policies for bookings table
SELECT 
    'BOOKINGS_RLS_POLICIES' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'bookings'
AND schemaname = 'public'
ORDER BY policyname;

-- 4. CHECK ADMIN FUNCTION STATUS
-- =====================================================
-- 4.1 Check if is_admin_user function exists
SELECT 
    'ADMIN_FUNCTION_EXISTS' as check_type,
    proname as function_name,
    prosrc as function_source,
    proacl as function_permissions
FROM pg_proc 
WHERE proname = 'is_admin_user';

-- 4.2 Test the is_admin_user function
SELECT 
    'ADMIN_FUNCTION_TEST' as check_type,
    is_admin_user() as function_result,
    auth.uid() as current_user_id;

-- 4.3 Check function permissions
SELECT 
    'FUNCTION_PERMISSIONS' as check_type,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges 
WHERE routine_name = 'is_admin_user'
AND routine_schema = 'public';

-- 5. CHECK DATA ACCESS PERMISSIONS
-- =====================================================
-- 5.1 Test if current user can see their own profile
SELECT 
    'SELF_PROFILE_ACCESS' as check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN 'SUCCESS - Can access own profile'
        ELSE 'FAILED - Cannot access own profile'
    END as result,
    COUNT(*) as records_found
FROM public.profiles 
WHERE id = auth.uid();

-- 5.2 Test if current user can see their own bookings
SELECT 
    'SELF_BOOKINGS_ACCESS' as check_type,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'SUCCESS - Can access own bookings'
        ELSE 'FAILED - Cannot access own bookings'
    END as result,
    COUNT(*) as records_found
FROM public.bookings 
WHERE customer_id = auth.uid();

-- 5.3 Test if admin can see all profiles (should work for admin users)
SELECT 
    'ADMIN_ALL_PROFILES_ACCESS' as check_type,
    CASE 
        WHEN is_admin_user() THEN 
            CASE 
                WHEN COUNT(*) > 0 THEN 'SUCCESS - Admin can see all profiles'
                ELSE 'FAILED - Admin cannot see all profiles'
            END
        ELSE 'SKIPPED - Not an admin user'
    END as result,
    COUNT(*) as total_profiles
FROM public.profiles;

-- 5.4 Test if admin can see all bookings (should work for admin users)
SELECT 
    'ADMIN_ALL_BOOKINGS_ACCESS' as check_type,
    CASE 
        WHEN is_admin_user() THEN 
            CASE 
                WHEN COUNT(*) >= 0 THEN 'SUCCESS - Admin can see all bookings'
                ELSE 'FAILED - Admin cannot see all bookings'
            END
        ELSE 'SKIPPED - Not an admin user'
    END as result,
    COUNT(*) as total_bookings
FROM public.bookings;

-- 6. CHECK ENUM TYPES AND CONSTRAINTS
-- =====================================================
-- 6.1 Check user_role enum
SELECT 
    'USER_ROLE_ENUM' as check_type,
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- 6.2 Check table constraints
SELECT 
    'TABLE_CONSTRAINTS' as check_type,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    kcu.data_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('profiles', 'bookings')
AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;

-- 7. CHECK TRIGGERS AND FUNCTIONS
-- =====================================================
-- 7.1 Check triggers on profiles table
SELECT 
    'PROFILES_TRIGGERS' as check_type,
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
AND trigger_schema = 'public';

-- 7.2 Check triggers on bookings table
SELECT 
    'BOOKINGS_TRIGGERS' as check_type,
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'bookings'
AND trigger_schema = 'public';

-- 8. CHECK SAMPLE DATA ACCESS
-- =====================================================
-- 8.1 Sample profiles data (first 5)
SELECT 
    'SAMPLE_PROFILES_DATA' as check_type,
    id,
    full_name,
    role,
    member_since,
    created_at
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 8.2 Sample bookings data (first 5)
SELECT 
    'SAMPLE_BOOKINGS_DATA' as check_type,
    id,
    customer_id,
    service_id,
    status,
    total_cost,
    created_at
FROM public.bookings 
ORDER BY created_at DESC 
LIMIT 5;

-- 9. CHECK AUTHENTICATION TABLES
-- =====================================================
-- 9.1 Check if current user exists in auth.users
SELECT 
    'AUTH_USERS_CHECK' as check_type,
    id,
    email,
    created_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users 
WHERE id = auth.uid();

-- 10. FINAL ADMIN ACCESS TEST
-- =====================================================
-- 10.1 Comprehensive admin test
SELECT 
    'FINAL_ADMIN_TEST' as check_type,
    auth.uid() as user_id,
    (SELECT role FROM public.profiles WHERE id = auth.uid()) as user_role,
    is_admin_user() as admin_function_result,
    CASE 
        WHEN is_admin_user() THEN 'ADMIN ACCESS CONFIRMED'
        ELSE 'NOT ADMIN ACCESS'
    END as final_status;

-- =====================================================
-- EXECUTION INSTRUCTIONS:
-- =====================================================
-- 1. Copy this entire script
-- 2. Paste it into Supabase SQL Editor
-- 3. Execute the script
-- 4. Copy ALL results (including any error messages)
-- 5. Send the complete output back to me
-- =====================================================
-- This will help identify exactly where the admin access issue is occurring
-- =====================================================
