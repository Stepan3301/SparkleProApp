-- Create user_role enum for SparklePro profiles table
-- This script ensures the user_role enum exists and is properly configured

-- 1. Create the user_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('customer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Verify the enum exists
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- 3. Check if profiles table has the correct role column type
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name = 'role'
AND table_schema = 'public';

-- 4. If the role column doesn't exist or has wrong type, fix it
DO $$ BEGIN
    -- Add role column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role public.user_role NOT NULL DEFAULT 'customer';
    END IF;
    
    -- Change column type if it's not user_role
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role'
        AND table_schema = 'public'
        AND data_type != 'USER-DEFINED'
    ) THEN
        ALTER TABLE public.profiles ALTER COLUMN role TYPE public.user_role USING role::text::public.user_role;
    END IF;
    
    -- Set default value if not set
    ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'customer';
    
    -- Make sure it's not null
    ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating role column: %', SQLERRM;
END $$;

-- 5. Update any existing profiles that don't have a role
UPDATE public.profiles 
SET role = 'customer' 
WHERE role IS NULL;

-- 6. Verify final table structure
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND table_schema = 'public'
ORDER BY ordinal_position;
