-- Create cleaners table for staff management
CREATE TABLE IF NOT EXISTS cleaners (
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

-- Add RLS policies for cleaners table
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage cleaners
CREATE POLICY "Admins can manage cleaners" ON cleaners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy for cleaners to view their own data
CREATE POLICY "Cleaners can view own data" ON cleaners
    FOR SELECT USING (
        id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Add staff assignment column to bookings table (only if bookings table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assigned_cleaners UUID[] DEFAULT '{}';
        CREATE INDEX IF NOT EXISTS idx_bookings_assigned_cleaners ON bookings USING GIN(assigned_cleaners);
    ELSE
        RAISE NOTICE 'Bookings table does not exist. Skipping assigned_cleaners column addition.';
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_cleaners_active ON cleaners(is_active);
CREATE INDEX IF NOT EXISTS idx_cleaners_name ON cleaners(name);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cleaners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_cleaners_updated_at
    BEFORE UPDATE ON cleaners
    FOR EACH ROW
    EXECUTE FUNCTION update_cleaners_updated_at();

-- Insert some sample cleaners for testing
INSERT INTO cleaners (name, phone, sex, is_active) VALUES
('Ahmed Hassan', '+971501234567', 'male', true),
('Fatima Al-Zahra', '+971507654321', 'female', true),
('Mohammed Ali', '+971509876543', 'male', true),
('Aisha Mohammed', '+971501111111', 'female', true),
('Omar Khalil', '+971502222222', 'male', true);

-- Grant necessary permissions
GRANT ALL ON cleaners TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
