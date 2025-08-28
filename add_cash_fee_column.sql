-- Add missing cash_fee column to bookings table
-- This fixes the error: "Could not find the 'cash_fee' column of 'bookings' in the schema cache"

-- Add cash_fee column
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS cash_fee integer DEFAULT 0;

-- Add comment explaining the column
COMMENT ON COLUMN public.bookings.cash_fee IS 'Cash payment fee (5 AED if cash, 0 if other payment methods)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'cash_fee';
