-- Add new structured add-on services for the booking page
-- Run this in your Supabase SQL Editor

-- First, add a category column to additional_services table if it doesn't exist
ALTER TABLE additional_services ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';
ALTER TABLE additional_services ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE additional_services ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Insert new Furniture Cleaning services
-- Sofa Cleaning
INSERT INTO additional_services (name, description, price, category, subcategory, image_url) VALUES
('Single Seat', 'Refresh your single seat with a professional shampoo treatment that removes stains and buildup.', 50, 'furniture', 'sofa', NULL),
('2 Seater', 'Bring your 2-seater sofa back to life with expert shampooing for a cleaner, fresher look.', 100, 'furniture', 'sofa', NULL),
('3 Seater', 'Make your 3-seater sofa look and feel like new with a thorough shampoo clean.', 150, 'furniture', 'sofa', NULL),
('4 Seater (L-Shape)', 'Restore the comfort and freshness of your L-shaped sofa with targeted shampoo cleaning.', 200, 'furniture', 'sofa', NULL),
('5 Seater', 'Get your 5-seater sofa spotless and fresh with a complete professional shampoo service.', 250, 'furniture', 'sofa', NULL);

-- Carpet Cleaning
INSERT INTO additional_services (name, description, price, category, subcategory, image_url) VALUES
('Small Carpet (Up to 5 sq. meters)', 'Refresh your small carpet with expert shampooing to remove dust, stains, and odors.', 75, 'furniture', 'carpet', NULL),
('Medium Carpet (6-10 sq. meters)', 'Professional deep cleaning for medium-sized carpets to restore freshness and appearance.', 120, 'furniture', 'carpet', NULL),
('Large Carpet (11-20 sq. meters)', 'Comprehensive cleaning service for large carpets with advanced stain removal techniques.', 180, 'furniture', 'carpet', NULL),
('Extra Large Carpet (20+ sq. meters)', 'Complete professional cleaning for extra large carpets with deep sanitization.', 250, 'furniture', 'carpet', NULL);

-- Mattress Cleaning
INSERT INTO additional_services (name, description, price, category, subcategory, image_url) VALUES
('Single Mattress', 'Deep clean your single mattress to remove dust mites, stains, and allergens for better sleep.', 80, 'furniture', 'mattress', NULL),
('Double Mattress', 'Professional cleaning for double mattresses with sanitization and stain removal.', 120, 'furniture', 'mattress', NULL),
('Queen Mattress', 'Thorough cleaning and sanitization of queen-size mattresses for a healthier sleeping environment.', 150, 'furniture', 'mattress', NULL),
('King Mattress', 'Complete deep cleaning service for king mattresses with advanced allergen removal.', 180, 'furniture', 'mattress', NULL);

-- Curtain Cleaning
INSERT INTO additional_services (name, description, price, category, subcategory, image_url) VALUES
('Small Curtain (300 x 300 cm)', 'We''ll give your small curtains a fresh, clean feel you''ll love to come home to.', 100, 'furniture', 'curtain', NULL),
('Medium Curtain (430 x 300 cm)', 'Your medium curtains will look as good as new with our gentle and effective cleaning.', 155, 'furniture', 'curtain', NULL),
('Large Curtain (830 x 300 cm)', 'Big curtains, no problem! We''ll take care of them, leaving them fresh and beautifully clean.', 315, 'furniture', 'curtain', NULL),
('X-Large Curtain (1000 x 300 cm)', 'Got big, beautiful curtains? We''ll handle them with care and leave them looking fresh and fabulous!', 365, 'furniture', 'curtain', NULL);

-- Update existing add-ons to be in "other" category
UPDATE additional_services 
SET category = 'other', subcategory = 'general'
WHERE category IS NULL OR category = 'other';

-- Verify the new structure
SELECT category, subcategory, name, price FROM additional_services ORDER BY category, subcategory, price;
