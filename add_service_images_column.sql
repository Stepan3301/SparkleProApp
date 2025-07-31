-- Add image_url column to services table
ALTER TABLE services 
ADD COLUMN image_url TEXT;

-- Update services with corresponding image URLs
UPDATE services 
SET image_url = CASE 
    WHEN id = 6 THEN '/regular-cleaning.jpg'
    WHEN id = 7 THEN '/regular-cleaning.jpg'
    WHEN id = 8 THEN '/deep-cleaning.JPG'
    WHEN id = 9 THEN '/deep-cleaning.JPG'
    WHEN id = 10 THEN '/villa-deep-cleaning.png'
    WHEN id = 11 THEN '/appartment-deep-cleaning.png'
    WHEN id = 12 THEN '/villa-facade-cleaning.png'
    WHEN id = 13 THEN '/move-in-move-out.JPG'
    WHEN id = 14 THEN '/post-construction-cleaning.png'
    WHEN id = 15 THEN '/kitchen-deep-cleaning.png'
    WHEN id = 16 THEN '/bathroom-deep-cleaning.png'
    WHEN id = 17 THEN '/window-cleaning.JPG'
    WHEN id = 18 THEN '/window-cleaning.JPG'
    WHEN id = 19 THEN '/window-cleaning.JPG'
    ELSE '/regular-cleaning.jpg' -- Default fallback image
END;

-- Alternative approach using service names (more maintainable)
-- Uncomment this section if you prefer to match by service name instead of ID

/*
UPDATE services 
SET image_url = CASE 
    WHEN name ILIKE '%regular cleaning%' THEN '/regular-cleaning.jpg'
    WHEN name ILIKE '%deep cleaning%' AND name ILIKE '%villa%' THEN '/villa-deep-cleaning.png'
    WHEN name ILIKE '%deep cleaning%' AND name ILIKE '%apartment%' THEN '/appartment-deep-cleaning.png'
    WHEN name ILIKE '%deep cleaning%' AND name ILIKE '%kitchen%' THEN '/kitchen-deep-cleaning.png'
    WHEN name ILIKE '%deep cleaning%' AND name ILIKE '%bathroom%' THEN '/bathroom-deep-cleaning.png'
    WHEN name ILIKE '%deep cleaning%' THEN '/deep-cleaning.JPG'
    WHEN name ILIKE '%façade%' OR name ILIKE '%facade%' THEN '/villa-facade-cleaning.png'
    WHEN name ILIKE '%move%' AND name ILIKE '%out%' THEN '/move-in-move-out.JPG'
    WHEN name ILIKE '%post-construction%' THEN '/post-construction-cleaning.png'
    WHEN name ILIKE '%window%' THEN '/window-cleaning.JPG'
    ELSE '/regular-cleaning.jpg' -- Default fallback
END;
*/

-- Verify the updates
SELECT id, name, image_url 
FROM services 
ORDER BY id;