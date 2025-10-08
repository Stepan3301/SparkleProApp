# Required Images for Add-ons Page

## Banner Images (Section Headers)
These images should be added to the `/public` folder:

1. **sofa-cleaning-banner.jpg** - For the Sofa section header
   - Recommended size: 400x128px (aspect ratio 3:1)
   - Should show professional sofa cleaning in action

2. **carpet-cleaning-banner.jpg** - For the Carpet section header
   - Recommended size: 400x128px (aspect ratio 3:1)
   - Should show carpet cleaning equipment or process

3. **mattress-cleaning-banner.jpg** - For the Mattress section header
   - Recommended size: 400x128px (aspect ratio 3:1)
   - Should show mattress cleaning or sanitization

4. **curtain-cleaning-banner.jpg** - For the Curtain section header
   - Recommended size: 400x128px (aspect ratio 3:1)
   - Should show curtain cleaning process

## Individual Service Images (Optional)
These can be added to the database via the `image_url` column in `additional_services` table:

### Sofa Cleaning Images:
- Single seat chair image
- 2-seater sofa image
- 3-seater sofa image
- L-shaped sofa image
- 5-seater sectional sofa image

### Carpet Cleaning Images:
- Small carpet/rug image
- Medium carpet image
- Large carpet image
- Extra large carpet image

### Mattress Cleaning Images:
- Single mattress image
- Double mattress image
- Queen mattress image
- King mattress image

### Curtain Cleaning Images:
- Small curtains image
- Medium curtains image
- Large curtains image
- Extra large curtains image
- Pillows image (for pillow cleaning service)

## How to Add Images:

### For Banner Images:
1. Save the images in `/public/` folder
2. The code will automatically use them (they're already referenced in the code)

### For Individual Service Images:
1. Upload images to your preferred hosting (Supabase Storage, Cloudinary, etc.)
2. Update the database with the image URLs:

```sql
-- Example for updating sofa images
UPDATE additional_services 
SET image_url = 'https://your-image-host.com/single-seat.jpg' 
WHERE name = 'Single Seat';

UPDATE additional_services 
SET image_url = 'https://your-image-host.com/2-seater.jpg' 
WHERE name = '2 Seater';
-- ... continue for all services
```

## Current Status:
✅ Database structure updated with new categories and services
✅ Frontend redesigned with new layout and navigation
✅ Horizontal scrolling implemented for each subcategory
✅ Sticky sub-navigation added
✅ Proper filtering by category and subcategory

❌ Images need to be added manually (placeholder emojis are currently used)

The page will work perfectly without images - they'll show fallback placeholder designs with emojis and gradients until you add the actual images.
