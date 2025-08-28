-- Add missing columns to bookings table
-- This fixes both errors:
-- 1. "Could not find the 'vat_amount' column of 'bookings' in the schema cache"
-- 2. "Could not find the 'cash_fee' column of 'bookings' in the schema cache"

-- Add vat_amount column
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS vat_amount integer DEFAULT 0;

-- Add cash_fee column
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS cash_fee integer DEFAULT 0;

-- Add comments explaining the columns
COMMENT ON COLUMN public.bookings.vat_amount IS 'VAT amount (5% of base price) in AED';
COMMENT ON COLUMN public.bookings.cash_fee IS 'Cash payment fee (5 AED if cash, 0 if other payment methods)';

-- Verify both columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('vat_amount', 'cash_fee')
ORDER BY column_name;
