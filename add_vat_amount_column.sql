-- Add missing vat_amount column to bookings table
-- This fixes the error: "Could not find the 'vat_amount' column of 'bookings' in the schema cache"

-- Add vat_amount column
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS vat_amount integer DEFAULT 0;

-- Add comment explaining the column
COMMENT ON COLUMN public.bookings.vat_amount IS 'VAT amount (5% of base price) in AED';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'vat_amount';
