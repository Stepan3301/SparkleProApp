-- Fix Admin User Role Script
-- This script ensures the current user has admin role

-- 1. First, check if the current user exists in profiles
DO $$
DECLARE
    user_exists BOOLEAN;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    -- Check if user exists in profiles table
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = current_user_id) INTO user_exists;
    
    IF user_exists THEN
        -- Update existing user to admin role
        UPDATE public.profiles 
        SET role = 'admin'
        WHERE id = current_user_id;
        
        RAISE NOTICE 'Updated existing user % to admin role', current_user_id;
    ELSE
        -- Create new profile with admin role
        INSERT INTO public.profiles (id, role, member_since)
        VALUES (current_user_id, 'admin', NOW());
        
        RAISE NOTICE 'Created new admin profile for user %', current_user_id;
    END IF;
END $$;

-- 2. Verify the admin role was set correctly
SELECT 
    'Admin Role Verification' as status,
    id,
    full_name,
    role,
    member_since
FROM public.profiles 
WHERE id = auth.uid();

-- 3. Test the is_admin_user() function
SELECT 
    'Function Test' as status,
    is_admin_user() as is_admin_result;
