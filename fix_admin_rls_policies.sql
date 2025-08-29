-- Fix Admin RLS Policies for SparklePro Admin Dashboard
-- This script ensures admins can access all data needed for statistics
-- FIXED: Removed infinite recursion in profiles table policies

-- 1. Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can insert own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete own bookings" ON public.bookings;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can delete all bookings" ON public.bookings;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- 2. Create a function to check if user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current user has admin role in profiles table
  -- Use a direct query without RLS to avoid recursion
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
EXCEPTION
  -- If any error occurs, return false (fail-safe)
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;

-- 3. Create comprehensive RLS policies for bookings table

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

-- 4. Create comprehensive RLS policies for profiles table

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

-- 5. Ensure RLS is enabled on both tables
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Verify the policies are created
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

-- 7. Test admin access (run this as admin user)
-- SELECT COUNT(*) FROM public.bookings;
-- SELECT COUNT(*) FROM public.profiles;
