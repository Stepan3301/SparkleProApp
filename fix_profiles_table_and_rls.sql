-- Fix Profiles Table Structure and RLS Policies for SparklePro
-- This script resolves the infinite recursion and missing columns issues

-- 1. First, add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS member_since TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Update existing profiles to have proper timestamps
UPDATE public.profiles 
SET 
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW()),
    member_since = COALESCE(member_since, NOW())
WHERE created_at IS NULL OR updated_at IS NULL OR member_since IS NULL;

-- 3. Create a trigger function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at_trigger ON public.profiles;
CREATE TRIGGER update_profiles_updated_at_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();

-- 5. Drop all existing RLS policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can insert own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can delete all bookings" ON public.bookings;

-- 6. Drop the problematic function if it exists
DROP FUNCTION IF EXISTS is_admin_user();

-- 7. Create a simple, secure admin check function
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get user role from profiles table
    SELECT role INTO user_role 
    FROM public.profiles 
    WHERE id = auth.uid();
    
    -- Return true if user is admin, false otherwise
    RETURN COALESCE(user_role = 'admin', FALSE);
EXCEPTION
    -- If any error occurs, return false (fail-safe)
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;

-- 8. Create RLS policies for profiles table
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 4: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (is_admin_user());

-- Policy 5: Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (is_admin_user());

-- 9. Create RLS policies for bookings table
-- Policy 1: Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = customer_id);

-- Policy 2: Users can insert their own bookings
CREATE POLICY "Users can insert own bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Policy 3: Users can update their own bookings
CREATE POLICY "Users can update own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = customer_id);

-- Policy 4: Users can delete their own bookings
CREATE POLICY "Users can delete own bookings" ON public.bookings
    FOR DELETE USING (auth.uid() = customer_id);

-- Policy 5: Admins can view all bookings
CREATE POLICY "Admins can view all bookings" ON public.bookings
    FOR SELECT USING (is_admin_user());

-- Policy 6: Admins can update all bookings
CREATE POLICY "Admins can update all bookings" ON public.bookings
    FOR UPDATE USING (is_admin_user());

-- Policy 7: Admins can delete all bookings
CREATE POLICY "Admins can delete all bookings" ON public.bookings
    FOR DELETE USING (is_admin_user());

-- 10. Ensure RLS is enabled on both tables
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 11. Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 12. Verify the policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('bookings', 'profiles')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- 13. Test queries (run these to verify everything works)
-- Test 1: Check if current user can see their own profile
-- SELECT * FROM public.profiles WHERE id = auth.uid();

-- Test 2: Check if current user can see their own bookings
-- SELECT COUNT(*) FROM public.bookings WHERE customer_id = auth.uid();

-- Test 3: Check if admin function works
-- SELECT is_admin_user();
