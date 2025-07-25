# Missing Service Images Analysis

## Current Services in Database

### ✅ Main Services (Have Images)
1. **Regular Cleaning** (IDs: 6, 7) → `regular-cleaning.jpg` ✅
2. **Deep Cleaning** (IDs: 8, 9) → `deep-cleaning.JPG` ✅  
3. **Move in/Move out Cleaning** (ID: 13) → `move-in-move-out.JPG` ✅
4. **Window Cleaning Services** (IDs: 17, 18, 19) → `window-cleaning.JPG` ✅
5. **Office Cleaning** → `office-cleaning.JPG` ✅

### ❌ Main Services (Missing Images)
1. **Full Villa Deep Cleaning** (ID: 10) → **MISSING:** `villa-cleaning.JPG`
2. **Full Apartment Deep Cleaning** (ID: 11) → **MISSING:** `apartment-cleaning.JPG`
3. **Villa Façade Cleaning** (ID: 12) → **MISSING:** `facade-cleaning.JPG`
4. **Post-construction Cleaning** (ID: 14) → **MISSING:** `construction-cleaning.JPG`
5. **Kitchen Deep Cleaning** (ID: 15) → **MISSING:** `kitchen-cleaning.JPG`
6. **Bathroom Deep Cleaning** (ID: 16) → **MISSING:** `bathroom-cleaning.JPG`

---

## Current Additional Services

### ✅ Additional Services (Have Images)
1. **Fridge Cleaning** → `fridge-cleaning.JPG` ✅
2. **Oven Cleaning** → `oven-cleaning.JPG` ✅
3. **Balcony Cleaning** → `balcony-cleaning.JPG` ✅
4. **Carpet Cleaning** → `carpet-cleaning.JPG` ✅
5. **Ironing Service** → `laundry-service.JPG` ✅ (reused)

### ❌ Additional Services (Missing Images)
1. **Wardrobe/Cabinet Cleaning** → **MISSING:** `cabinet-cleaning.JPG`
2. **Sofa Cleaning** → **MISSING:** `sofa-cleaning.JPG`
3. **Mattress Cleaning Single** → **MISSING:** `mattress-cleaning.JPG`
4. **Mattress Cleaning Double** → **MISSING:** `mattress-cleaning.JPG` (can reuse single)
5. **Curtains Cleaning** → **MISSING:** `curtains-cleaning.JPG`

---

## 📋 **PRIORITY LIST - Images You Need to Find/Add:**

### 🔥 **High Priority (Main Services)**
1. **`villa-cleaning.JPG`** - Large villa exterior/interior cleaning
2. **`apartment-cleaning.JPG`** - Modern apartment cleaning
3. **`kitchen-cleaning.JPG`** - Professional kitchen deep cleaning
4. **`bathroom-cleaning.JPG`** - Sparkling clean bathroom
5. **`facade-cleaning.JPG`** - Villa exterior/facade cleaning
6. **`construction-cleaning.JPG`** - Post-construction debris cleaning

### 🔸 **Medium Priority (Additional Services)**
7. **`cabinet-cleaning.JPG`** - Wardrobe/cabinet interior cleaning
8. **`sofa-cleaning.JPG`** - Professional sofa/upholstery cleaning
9. **`mattress-cleaning.JPG`** - Mattress deep cleaning service
10. **`curtains-cleaning.JPG`** - Curtain cleaning/hanging

---

## 🎯 **Recommended Image Specifications:**

- **Dimensions:** 1200x800px minimum (3:2 aspect ratio)
- **Format:** JPG or PNG (JPG preferred for smaller file size)
- **Style:** Bright, professional, clean aesthetic
- **Content:** Show actual cleaning in progress or sparkling results
- **Lighting:** Well-lit, natural lighting preferred
- **Colors:** Match your brand palette (emerald/teal accent colors)

---

## 📁 **File Naming Convention:**

Follow the existing pattern in your `/public` folder:
- Use lowercase with dashes: `service-name.JPG`
- Keep consistent file extensions (.JPG for photos)
- Examples: `villa-cleaning.JPG`, `kitchen-cleaning.JPG`

---

## 🔄 **Current Fallback Logic:**

The app currently uses these fallbacks when images are missing:
- **Main services:** Falls back to `regular-cleaning.jpg`
- **Additional services:** Falls back to `regular-cleaning.jpg`
- **Homepage:** Uses placeholder emoji or first letter of service name

---

## 💡 **Image Search Keywords:**

For finding/purchasing stock images:
- Villa cleaning, luxury home cleaning
- Apartment cleaning, modern home cleaning  
- Kitchen deep cleaning, professional kitchen
- Bathroom cleaning, sparkling bathroom
- Facade cleaning, building exterior cleaning
- Post construction cleaning, renovation cleanup
- Cabinet organizing, wardrobe cleaning
- Sofa cleaning, upholstery cleaning
- Mattress cleaning, bed cleaning
- Curtain cleaning, window treatments

---

## ⚡ **Impact of Missing Images:**

Currently missing images affect:
1. **Service selection pages** - Users see generic fallback images
2. **Booking flow** - Less visual appeal in service selection
3. **Homepage service cards** - Generic appearance
4. **Additional services carousel** - Inconsistent visual experience

Adding these images will significantly improve the visual appeal and professionalism of your app. 