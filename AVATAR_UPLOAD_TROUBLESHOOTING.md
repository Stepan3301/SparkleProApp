# Avatar Upload Troubleshooting Guide

## 🚨 Current Issue
**Error**: "new row violates row-level security policy" when trying to upload avatars
**Status Code**: 403 (Unauthorized)
**Root Cause**: Supabase Storage RLS policies are not properly configured

## 🔧 Step-by-Step Fix

### Step 1: Run the SQL Script
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `avatar_upload_fix.sql`
4. Click **Run** to execute the script

### Step 2: Verify the Fix
After running the SQL script, you should see:
- ✅ `avatars` bucket created/updated
- ✅ 5 RLS policies created
- ✅ Bucket is set to public
- ✅ File size limit: 5MB
- ✅ Supported formats: JPEG, PNG, GIF, WebP

### Step 3: Test Avatar Upload
1. Go back to your app
2. Try uploading an avatar image
3. Check the console for success messages
4. Verify the avatar appears correctly

## 📋 What the SQL Script Does

### 1. **Bucket Configuration**
- Creates `avatars` bucket if it doesn't exist
- Sets bucket to public (accessible by all users)
- Configures 5MB file size limit
- Allows common image formats

### 2. **RLS Policies**
- **INSERT**: Users can upload to their own folder (`user_id/filename`)
- **SELECT**: Users can view their own avatars + public access
- **UPDATE**: Users can update their own avatars
- **DELETE**: Users can delete their own avatars
- **Public Access**: Anyone can view avatars (for app display)

### 3. **Security Features**
- Users can only access files in their own folder
- Folder structure: `avatars/user_id/filename.jpg`
- Authenticated users only for upload/update/delete
- Public read access for displaying avatars

## 🐛 If Issues Persist

### Check 1: Bucket Exists
```sql
SELECT * FROM storage.buckets WHERE id = 'avatars';
```

### Check 2: RLS Policies
```sql
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
```

### Check 3: RLS Enabled
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';
```

### Check 4: User Authentication
```sql
SELECT auth.uid(), auth.role();
```

## 🔍 Debug Information

### Console Logs to Check
- "Starting avatar upload for user: [user_id]"
- "File details: {name, type, size}"
- "Uploading to path: [user_id]/[timestamp].[ext]"
- "Upload successful: [data]"
- "Public URL generated: [url]"

### Common Error Messages
- **403 Unauthorized**: RLS policy issue (fixed by SQL script)
- **400 Bad Request**: File format/size issue
- **404 Not Found**: Bucket doesn't exist
- **500 Internal Error**: Server configuration issue

## ✅ Expected Result
After running the SQL script:
1. Avatar upload should work without errors
2. No more "row-level security policy" errors
3. Avatars should display correctly in the app
4. Users can upload, update, and delete their avatars

## 🚀 Next Steps
1. Run the SQL script in Supabase
2. Test avatar upload functionality
3. Verify avatars display correctly
4. Check that profile updates work
5. Test avatar removal functionality

## 📞 Need Help?
If the issue persists after running the SQL script:
1. Check Supabase logs for detailed error messages
2. Verify the bucket and policies were created correctly
3. Ensure your Supabase project has Storage enabled
4. Check that your API keys have the correct permissions