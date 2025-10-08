-- SQL for Admin Cleaners Management and Booking Assignment
-- Copy and paste this SQL to set up the cleaners table and integrate with bookings

-- 1. Create cleaners table for staff management
CREATE TABLE IF NOT EXISTS public.cleaners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    sex VARCHAR(10) CHECK (sex IN ('male', 'female', 'other')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 2. Enable RLS for cleaners table
ALTER TABLE public.cleaners ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for cleaners table
-- Policy for admins to manage cleaners
CREATE POLICY "Admins can manage cleaners" ON public.cleaners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy for cleaners to view their own data
CREATE POLICY "Cleaners can view own data" ON public.cleaners
    FOR SELECT USING (
        id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 4. Add assigned_cleaners column to bookings table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'assigned_cleaners'
    ) THEN
        ALTER TABLE public.bookings 
        ADD COLUMN assigned_cleaners UUID[] DEFAULT '{}';
    END IF;
END $$;

-- 5. Create index for better performance on assigned_cleaners
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_cleaners 
ON public.bookings USING GIN(assigned_cleaners);

-- 6. Create index for better performance on cleaners
CREATE INDEX IF NOT EXISTS idx_cleaners_active ON public.cleaners(is_active);
CREATE INDEX IF NOT EXISTS idx_cleaners_name ON public.cleaners(name);

-- 7. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_cleaners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_cleaners_updated_at ON public.cleaners;
CREATE TRIGGER update_cleaners_updated_at
    BEFORE UPDATE ON public.cleaners
    FOR EACH ROW
    EXECUTE FUNCTION public.update_cleaners_updated_at();

-- 9. Insert sample cleaners for testing
INSERT INTO public.cleaners (name, phone, sex, is_active) VALUES
('Ahmed Hassan', '+971501234567', 'male', true),
('Fatima Al-Zahra', '+971507654321', 'female', true),
('Mohammed Ali', '+971509876543', 'male', true),
('Aisha Mohammed', '+971501111111', 'female', true),
('Omar Khalil', '+971502222222', 'male', true)
ON CONFLICT DO NOTHING;

-- 10. Grant necessary permissions
GRANT ALL ON public.cleaners TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 11. Create view for booking details with assigned cleaners info
CREATE OR REPLACE VIEW public.booking_with_cleaners AS
SELECT 
    b.*,
    COALESCE(
        array_agg(
            json_build_object(
                'id', c.id,
                'name', c.name,
                'phone', c.phone,
                'sex', c.sex,
                'avatar_url', c.avatar_url,
                'is_active', c.is_active
            ) ORDER BY c.name
        ) FILTER (WHERE c.id IS NOT NULL),
        '{}'::json[]
    ) as assigned_cleaners_details
FROM public.bookings b
LEFT JOIN unnest(b.assigned_cleaners) AS cleaner_id ON true
LEFT JOIN public.cleaners c ON c.id = cleaner_id
GROUP BY b.id;

-- 12. Grant permissions on the view
GRANT SELECT ON public.booking_with_cleaners TO authenticated;

-- Verification queries (optional - run these to check if everything worked)
-- SELECT * FROM public.cleaners LIMIT 5;
-- SELECT id, assigned_cleaners FROM public.bookings WHERE assigned_cleaners IS NOT NULL LIMIT 5;
-- SELECT * FROM public.booking_with_cleaners LIMIT 1;
