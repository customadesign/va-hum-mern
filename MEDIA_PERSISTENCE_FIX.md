# Media Persistence Fix Guide

## Problem Summary
Profile images, cover images, and videos were not persisting after Render redeployments because they were being stored in Render's ephemeral `/uploads/` directory instead of Supabase Storage.

**CRITICAL DISCOVERY**: The frontend was also **actively hiding** media from Supabase URLs due to inverted logic!

## Root Causes Identified

### 1. **Local Storage URLs in Database**
MongoDB contained URLs like:
```
https://linkage-va-hub-api.onrender.com/uploads/image-1759987348317.jpg
```
These files are stored on Render's filesystem which gets **wiped on every redeploy**.

### 2. **Code Issues Fixed**
- **Cover image route** (line 1215 in `vas.js`) was using old local storage handler
- **Upload routes** had fallback logic that could result in local storage
- **Bucket mapping** was using single bucket instead of appropriate buckets per media type

### 3. **Frontend Display Bug (CRITICAL!)** 🚨
The frontend in `Detail.js` had **inverted logic** that was **blocking Supabase URLs**:
- **Lines 166-169**: Cover showed placeholder if URL contained 'supabase' ❌
- **Lines 184-187**: Avatar showed placeholder if URL contained 'supabase' ❌  
- **Lines 311-342**: Video only displayed if URL did NOT contain 'supabase' ❌

This meant ANY media uploaded to Supabase was INVISIBLE on public profile pages!

## Fixes Applied

### Backend Code Changes

1. **`backend/routes/vas.js`**:
   - ✅ Fixed cover-image route to use `handleUnifiedUpload` 
   - ✅ Simplified `/me/upload` route to always use unified storage
   - ✅ Simplified `/me/upload-video` route to always use unified storage

2. **`backend/utils/unifiedStorage.js`**:
   - ✅ Added intelligent bucket mapping:
     - `avatars`, `covers` → `profile-images` bucket
     - `introductions`, `videos` → `va-videos` bucket
     - `logos`, `marketing` → `business-assets` bucket
     - `system-assets`, `reports` → `admin-uploads` bucket

### Frontend Code Changes

3. **`frontend/src/pages/VAs/Detail.js`**:
   - ✅ Removed inverted `!includes('supabase')` check from cover image (line 166)
   - ✅ Removed inverted `!includes('supabase')` check from avatar (line 184)
   - ✅ Removed conditional logic blocking Supabase videos (lines 311-342)
   - ✅ Added proper error handlers with fallback for all media types
   - ✅ Now displays ALL media regardless of URL source

## Required Render Environment Variables

Add these to your **linkage-va-hub-api** service on Render:

```bash
# Supabase Configuration (CRITICAL)
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# Force Supabase in Production (CRITICAL)
NODE_ENV=production
FORCE_SUPABASE=true

# Bucket names (optional, uses defaults)
SUPABASE_BUCKET_PROFILE_IMAGES=profile-images
SUPABASE_BUCKET_VA_VIDEOS=va-videos
SUPABASE_BUCKET_BUSINESS_ASSETS=business-assets
SUPABASE_BUCKET_ADMIN_UPLOADS=admin-uploads
```

### How to Add Environment Variables in Render:

1. Go to https://dashboard.render.com/web/srv-d25arrripnbc73dpeqs0
2. Click **Environment** in the left sidebar
3. Add the variables above
4. Click **Save Changes**
5. Render will automatically redeploy

## Supabase Bucket Configuration

Ensure these buckets exist in your Supabase project with public access:

### 1. `profile-images` (Public)
- **Purpose**: User avatars and cover images
- **Max Size**: 10MB per file
- **Allowed Types**: JPEG, PNG, WebP, GIF
- **RLS Policy**: Public read, authenticated write

### 2. `va-videos` (Public) 
- **Purpose**: VA introduction videos
- **Max Size**: 1GB per file
- **Allowed Types**: MP4, WebM, MOV, AVI
- **RLS Policy**: Public read, authenticated write

### 3. `business-assets` (Public)
- **Purpose**: Business logos and documents
- **Max Size**: 10MB per file
- **Allowed Types**: Images, PDFs
- **RLS Policy**: Public read, authenticated write

### 4. `admin-uploads` (Private)
- **Purpose**: Admin system files
- **Max Size**: 20MB per file
- **RLS Policy**: Admin-only access

## Creating Buckets in Supabase

Run this script to auto-create all buckets with proper policies:

```bash
cd "Linkage VA Hub MERN Stack"
node configure-supabase-buckets.js
```

Or manually in Supabase Dashboard:
1. Go to Storage → Buckets
2. Create each bucket listed above
3. Set as **Public** (except admin-uploads)
4. Configure RLS policies as needed

## Migration Script for Existing Data

To migrate existing local URLs to Supabase, use the MongoDB update:

```javascript
// This will be handled automatically on next upload
// Old local URLs will be replaced when users re-upload images
```

## Testing the Fix

After deployment:

1. **Upload Test**:
   ```bash
   # The URL should be:
   https://YOUR_PROJECT.supabase.co/storage/v1/object/public/profile-images/avatars/...
   # NOT:
   https://linkage-va-hub-api.onrender.com/uploads/...
   ```

2. **Redeploy Test**:
   - Upload an image
   - Note the URL
   - Trigger a redeploy on Render
   - Verify the image still loads

3. **Check logs**:
   ```bash
   # Should see:
   📦 Uploading to Supabase bucket: profile-images/avatars
   ✅ File uploaded successfully to supabase
   ```

## Verification Checklist

- [ ] Supabase environment variables added to Render
- [ ] All 4 buckets created in Supabase
- [ ] Buckets set to public (except admin-uploads)
- [ ] Code changes deployed to Render
- [ ] Test upload shows Supabase URL
- [ ] Images persist after redeploy

## Troubleshooting

### Images still using local storage?
1. Check Render env vars are set correctly
2. Check Supabase buckets exist
3. View Render logs for upload errors
4. Verify `NODE_ENV=production` is set

### Upload fails with "bucket not found"?
1. Create missing buckets in Supabase
2. Run `configure-supabase-buckets.js`
3. Check bucket names match exactly

### RLS policy errors?
1. Ensure buckets are set to **Public**
2. Or configure RLS policies per the guide
3. Check Supabase logs for policy errors

## Next Steps

1. **Add environment variables to Render** (see above)
2. **Create Supabase buckets** (if not exists)
3. **Deploy changes** (Render will auto-deploy on push)
4. **Test uploads** to verify Supabase URLs
5. **Have existing users re-upload** their media

## Support

If issues persist:
- Check Render logs: https://dashboard.render.com/web/srv-d25arrripnbc73dpeqs0/logs
- Check Supabase Storage logs
- Verify bucket policies in Supabase Dashboard