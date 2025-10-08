-- Update services table with new PNG image URLs
-- Run this SQL in your Supabase SQL Editor

-- Update main services with new PNG images
UPDATE services 
SET image_url = CASE 
    -- Window Cleaning Services
    WHEN id = 17 THEN '/internal-window-cleaning.png'
    WHEN id = 18 THEN '/external-window-cleaning.png'
    WHEN id = 19 THEN '/villa-window-package.png'
    
    -- Complete Package Services - Apartments
    WHEN name ILIKE '%studio%' THEN '/studio-deep-cleaning.png'
    WHEN name ILIKE '%1 bedroom%' AND name ILIKE '%apartment%' THEN '/1-bedroom-deep-cleaning.png'
    WHEN name ILIKE '%2 bedroom%' AND name ILIKE '%apartment%' THEN '/2-bedroom-deep-cleaning.png'
    WHEN name ILIKE '%3 bedroom%' AND name ILIKE '%apartment%' THEN '/3-bedroom-deep-cleaning.png'
    WHEN name ILIKE '%4 bedroom%' AND name ILIKE '%apartment%' THEN '/4-bedroom-deep-cleaning.png'
    
    -- Complete Package Services - Villas
    WHEN name ILIKE '%2 bedroom%' AND name ILIKE '%villa%' THEN '/2-bedroom-villa-deep-cleaning.png'
    WHEN name ILIKE '%3 bedroom%' AND name ILIKE '%villa%' THEN '/3-bedroom-villa-deep-cleaning.png'
    WHEN name ILIKE '%4 bedroom%' AND name ILIKE '%villa%' THEN '/4-bedroom-villa-deep-cleaning.png'
    WHEN name ILIKE '%5 bedroom%' AND name ILIKE '%villa%' THEN '/5-bedroom-villa-deep-cleaning.png'
    
    -- Keep existing mappings for other services
    ELSE image_url
END
WHERE id IN (17, 18, 19) OR name ILIKE '%bedroom%' OR name ILIKE '%studio%';

-- Update additional services with new PNG images
UPDATE additional_services 
SET image_url = CASE 
    -- Sofa Cleaning - Category banners and specific sizes
    WHEN category = 'sofa' AND subcategory = 'banner' THEN '/sofa-cleaning-banner.png'
    WHEN name = 'Single Seat' OR name ILIKE '%single%seat%' THEN '/single-seat-sofa.png'
    WHEN name = '2 Seater' OR name ILIKE '%2%seater%' THEN '/2-seater-sofa.png'
    WHEN name = '3 Seater' OR name ILIKE '%3%seater%' THEN '/3-seater-sofa.png'
    WHEN name = '4 Seater (L-Shape)' OR name ILIKE '%4%seater%' OR name ILIKE '%l-shape%' THEN '/4-seater-sofa.png'
    WHEN name = '5 Seater' OR name ILIKE '%5%seater%' THEN '/5-seater-sofa.png'
    
    -- Carpet Cleaning - Category banners and specific sizes
    WHEN category = 'carpet' AND subcategory = 'banner' THEN '/carpet-cleaning-banner.png'
    WHEN name ILIKE '%small%carpet%' OR name ILIKE '%up to 5%' THEN '/small-carpet.png'
    WHEN name ILIKE '%medium%carpet%' OR name ILIKE '%6-10%' THEN '/medium-carpet.png'
    WHEN name ILIKE '%large%carpet%' AND NOT name ILIKE '%extra%' OR name ILIKE '%11-20%' THEN '/large-carpet.png'
    WHEN name ILIKE '%extra large%carpet%' OR name ILIKE '%20+%' THEN '/extra-large-carpet.png'
    
    -- Mattress Cleaning - Category banners and specific sizes
    WHEN category = 'mattress' AND subcategory = 'banner' THEN '/mattress-cleaning-banner.png'
    WHEN name ILIKE '%single%mattress%' THEN '/single-mattress.png'
    WHEN name ILIKE '%double%mattress%' THEN '/double-mattress.png'
    WHEN name ILIKE '%queen%mattress%' THEN '/queen-mattress.png'
    WHEN name ILIKE '%king%mattress%' THEN '/king-mattress.png'
    
    -- Curtain Cleaning - Category banners and specific sizes
    WHEN category = 'curtains' AND subcategory = 'banner' THEN '/curtain-cleaning-banner.png'
    WHEN name ILIKE '%small%curtain%' THEN '/small-curtains.png'
    WHEN name ILIKE '%medium%curtain%' THEN '/medium-curtains.png'
    WHEN name ILIKE '%large%curtain%' AND NOT name ILIKE '%extra%' THEN '/large-curtains.png'
    WHEN name ILIKE '%extra large%curtain%' THEN '/extra-large-curtains.png'
    
    -- Keep existing mappings for other services
    ELSE image_url
END
WHERE category IN ('sofa', 'carpet', 'mattress', 'curtains') 
   OR name ILIKE '%sofa%' OR name ILIKE '%carpet%' OR name ILIKE '%mattress%' OR name ILIKE '%curtain%';

-- Verify the updates
SELECT id, name, image_url FROM services WHERE image_url IS NOT NULL ORDER BY id;
SELECT id, name, image_url FROM additional_services WHERE image_url IS NOT NULL ORDER BY category, subcategory, name;
