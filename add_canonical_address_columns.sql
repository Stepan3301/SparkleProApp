-- Add canonical address fields to addresses table
-- This migration adds Google Places API data to store canonical address information

-- Add new columns for canonical address data
ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS place_id TEXT,
  ADD COLUMN IF NOT EXISTS formatted_address TEXT,
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS emirate TEXT,
  ADD COLUMN IF NOT EXISTS route TEXT,
  ADD COLUMN IF NOT EXISTS street_number TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_addresses_place_id ON public.addresses(place_id);
CREATE INDEX IF NOT EXISTS idx_addresses_country ON public.addresses(country);
CREATE INDEX IF NOT EXISTS idx_addresses_emirate ON public.addresses(emirate);
CREATE INDEX IF NOT EXISTS idx_addresses_lat_lng ON public.addresses(lat, lng);

-- Optional: Add PostGIS extension for geospatial queries (uncomment if needed)
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS geo GEOGRAPHY(Point, 4326);
-- UPDATE public.addresses SET geo = CASE 
--   WHEN lat IS NOT NULL AND lng IS NOT NULL 
--   THEN ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography 
--   ELSE NULL 
-- END;

-- Create atomic default address setter function (recommended)
CREATE OR REPLACE FUNCTION public.set_default_address(p_user UUID, p_address_id BIGINT)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  -- Remove default from all user addresses
  UPDATE public.addresses 
  SET is_default = false 
  WHERE user_id = p_user;
  
  -- Set the specified address as default
  UPDATE public.addresses 
  SET is_default = true 
  WHERE id = p_address_id AND user_id = p_user;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.set_default_address(UUID, BIGINT) TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN public.addresses.place_id IS 'Google Places API place ID for canonical address reference';
COMMENT ON COLUMN public.addresses.formatted_address IS 'Canonical formatted address from Google Places API';
COMMENT ON COLUMN public.addresses.lat IS 'Latitude coordinate from Google Places API';
COMMENT ON COLUMN public.addresses.lng IS 'Longitude coordinate from Google Places API';
COMMENT ON COLUMN public.addresses.country IS 'Country code (e.g., AE for UAE)';
COMMENT ON COLUMN public.addresses.emirate IS 'Emirate/State (e.g., Dubai, Abu Dhabi)';
COMMENT ON COLUMN public.addresses.route IS 'Street/Route name';
COMMENT ON COLUMN public.addresses.street_number IS 'Street number';
