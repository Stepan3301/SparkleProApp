# Avatar Upload Troubleshooting Guide

## Current Issue
Users are unable to upload avatars successfully in the profile page.

## Root Cause Analysis

### 1. **Supabase Storage Bucket Configuration**
The `avatars` bucket needs to be properly configured:

#### Step 1: Verify Bucket Settings
1. Go to Supabase Dashboard > Storage
2. Check if `avatars` bucket exists
3. **IMPORTANT**: The bucket must be **PUBLIC** for images to be displayed
4. If bucket is not public:
   - Click on `avatars` bucket
   - Go to Settings
   - Set "Public bucket" to `true`

#### Step 2: Apply Fixed SQL Policies
Run the SQL from `supabase-avatar-setup-fixed.sql`:

```sql
-- Apply these policies in Supabase SQL Editor
-- (See supabase-avatar-setup-fixed.sql for complete script)
```

### 2. **Frontend Code Issues Fixed**
- Added detailed console logging for debugging
- Changed `upsert: false` to `upsert: true` for overwriting files
- Added old file deletion before upload
- Improved error handling with specific error messages
- Reset file input after upload

### 3. **Testing Steps**

#### Browser Console Testing:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try uploading an avatar
4. Check for any error messages:
   - Upload errors
   - Permission errors
   - Network errors

#### Expected Console Output:
```
Starting avatar upload for user: [user-id]
File details: {name: "image.jpg", type: "image/jpeg", size: 123456}
Uploading to path: [user-id]/[timestamp].jpg
Upload successful: {path: "...", id: "...", fullPath: "..."}
Public URL generated: https://[project].supabase.co/storage/v1/object/public/avatars/[user-id]/[timestamp].jpg
Profile updated successfully
```

### 4. **Common Error Messages & Solutions**

#### Error: "new row violates row-level security policy"
- **Solution**: Run the fixed SQL policies
- **Cause**: Missing or incorrect RLS policies

#### Error: "bucket not found" or "access denied"
- **Solution**: Ensure bucket is public and policies are applied
- **Cause**: Bucket misconfiguration

#### Error: "File already exists"
- **Solution**: Code now uses `upsert: true` to overwrite
- **Cause**: Previous upload with same filename

#### Error: Network or CORS issues
- **Solution**: Check Supabase project settings and API keys
- **Cause**: Environment variable misconfiguration

### 5. **Manual Verification Steps**

1. **Check Environment Variables**:
   ```bash
   # In your .env.local file:
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_anon_key
   ```

2. **Test Storage Access**:
   - Go to Supabase Dashboard > Storage > avatars
   - Try manually uploading a file
   - Check if you can view/download it

3. **Check User Authentication**:
   - Ensure user is properly logged in
   - Check if `user.id` is available in console logs

4. **Database Check**:
   ```sql
   -- Check if profiles table has avatar_url column
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'profiles' AND column_name = 'avatar_url';
   
   -- Check current user profile
   SELECT id, full_name, avatar_url 
   FROM profiles 
   WHERE id = auth.uid();
   ```

## Implementation Status

✅ **Fixed Code Issues**:
- Enhanced error handling and logging
- Fixed upsert configuration
- Added file cleanup

✅ **Updated SQL Policies**:
- Comprehensive storage policies
- Public read access for avatars
- User-specific upload/update/delete permissions

🔄 **Next Steps**:
1. Apply the fixed SQL policies
2. Ensure bucket is public
3. Test upload with browser console open
4. Check specific error messages if any

## Files Updated
- `src/pages/profile/PersonalInfoPage.tsx` - Enhanced upload logic
- `supabase-avatar-setup-fixed.sql` - Complete storage setup
- `AVATAR_UPLOAD_TROUBLESHOOTING.md` - This troubleshooting guide