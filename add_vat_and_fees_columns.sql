-- Add VAT and Cash Fee columns to bookings table for better price transparency
-- This ensures the final price calculation is stored and can be verified

-- Add VAT amount column
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS vat_amount integer DEFAULT 0;

-- Add cash fee column  
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS cash_fee integer DEFAULT 0;

-- Add comment explaining the pricing structure
COMMENT ON COLUMN public.bookings.vat_amount IS 'VAT amount (5% of base price) in AED';
COMMENT ON COLUMN public.bookings.cash_fee IS 'Cash payment fee (5 AED if cash, 0 if other payment methods)';
COMMENT ON COLUMN public.bookings.total_cost IS 'Final total including base price, addons, VAT, and cash fee';

-- Update existing records to calculate VAT and fees (optional)
-- This will set VAT to 5% of base price for existing records
UPDATE public.bookings 
SET vat_amount = CASE 
  WHEN total_cost > 0 THEN ROUND((total_cost - COALESCE(addons_total, 0)) * 0.05)
  ELSE 0 
END
WHERE vat_amount = 0;

-- Set cash fee to 5 for existing records (assuming they were cash payments)
UPDATE public.bookings 
SET cash_fee = 5 
WHERE cash_fee = 0;

-- Verify the changes
SELECT 
  id,
  base_price,
  addons_total,
  total_price,
  vat_amount,
  cash_fee,
  total_cost,
  (base_price + COALESCE(addons_total, 0) + vat_amount + cash_fee) as calculated_total
FROM public.bookings 
LIMIT 5; 