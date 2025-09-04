-- Add window_panels_count column to bookings table for window cleaning services
-- This column will store the number of window panels for services 17 and 18
-- (Internal Window Cleaning and External Window Cleaning)

ALTER TABLE public.bookings 
ADD COLUMN window_panels_count integer NULL;

-- Add a check constraint to ensure valid panel counts (1-100 panels)
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_window_panels_count_check 
CHECK (window_panels_count IS NULL OR (window_panels_count >= 1 AND window_panels_count <= 100));

-- Add a comment to document the column purpose
COMMENT ON COLUMN public.bookings.window_panels_count IS 'Number of window panels for specialized window cleaning services (service IDs 17, 18). NULL for other services.';
