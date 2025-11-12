# Supabase Storage Setup Guide

## Problem
Images and videos are not persisting in profiles on https://linkage-va-hub.onrender.com/dashboard

## Root Causes Identified

1. Missing storage buckets in Supabase
2. Missing or incorrect Row Level Security (RLS) policies
3. Production using ANON key instead of SERVICE_ROLE key for uploads

## Required Buckets

Your application needs these buckets:

| Bucket Name | Purpose | Public/Private | Max Size |
|------------|---------|----------------|----------|
| `linkage-va-hub` | Legacy support | Public | 10MB |
| `profile-images` | Avatars, covers | Public | 10MB |
| `va-videos` | Video introductions | Public | 1GB |
| `business-assets` | Business files | Public | 10MB |
| `admin-uploads` | Admin-only files | Private | 20MB |

## Setup Instructions

### Step 1: Create Storage Buckets

Go to https://supabase.com/dashboard/project/nexilfvrehlkphlrghxn/storage/buckets

For each bucket, click "New Bucket" and configure:

1. **linkage-va-hub**
   - Name: `linkage-va-hub`
   - Public: ✅ Yes
   - File size limit: 10 MB

2. **profile-images**
   - Name: `profile-images`
   - Public: ✅ Yes
   - File size limit: 10 MB
   - Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, image/gif

3. **va-videos**
   - Name: `va-videos`
   - Public: ✅ Yes
   - File size limit: 1024 MB (1 GB)
   - Allowed MIME types: video/mp4, video/webm, video/mov, video/avi, video/quicktime

4. **business-assets**
   - Name: `business-assets`
   - Public: ✅ Yes
   - File size limit: 10 MB

5. **admin-uploads**
   - Name: `admin-uploads`
   - Public: ❌ No (Private)
   - File size limit: 20 MB

### Step 2: Set Up Row Level Security (RLS) Policies

Go to https://supabase.com/dashboard/project/nexilfvrehlkphlrghxn/editor

Run this SQL:

```sql
-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Service Role Full Access" ON storage.objects;
DROP POLICY IF EXISTS "User Update Own Files" ON storage.objects;
DROP POLICY IF EXISTS "User Delete Own Files" ON storage.objects;
DROP POLICY IF EXISTS "Admin Only Access" ON storage.objects;

-- Allow anyone to read from public buckets
CREATE POLICY "Public Read Access" ON storage.objects
  FOR SELECT
  USING (
    bucket_id IN ('profile-images', 'va-videos', 'business-assets', 'linkage-va-hub')
  );

-- Allow service role to do everything (backend uploads)
CREATE POLICY "Service Role Full Access" ON storage.objects
  FOR ALL
  USING (
    auth.role() = 'service_role'
  );

-- Allow authenticated users to upload to public buckets
CREATE POLICY "Authenticated Upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id IN ('profile-images', 'va-videos', 'business-assets', 'linkage-va-hub')
    AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  );

-- Allow users to update files they own or service role
CREATE POLICY "User Update Own Files" ON storage.objects
  FOR UPDATE
  USING (
    (auth.uid()::text = owner) OR (auth.role() = 'service_role')
  );

-- Allow users to delete files they own or service role
CREATE POLICY "User Delete Own Files" ON storage.objects
  FOR DELETE
  USING (
    (auth.uid()::text = owner) OR (auth.role() = 'service_role')
  );

-- Admin bucket - service role only
CREATE POLICY "Admin Only Access" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'admin-uploads' AND auth.role() = 'service_role'
  );
```

### Step 3: Update Render Environment Variables

Go to https://dashboard.render.com/web/srv-d25arrripnbc73dpeqs0 (linkage-va-hub-api)

Add or update these environment variables:

1. **SUPABASE_URL**
   - Value: `https://nexilfvrehlkphlrghxn.supabase.co`

2. **SUPABASE_SERVICE_ROLE_KEY** (⚠️ CRITICAL - This is what's likely missing!)
   - Go to https://supabase.com/dashboard/project/nexilfvrehlkphlrghxn/settings/api
   - Copy the `service_role` key (NOT the anon key)
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leGlsZnZyZWhsa3BobHJnaHhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzczNjU2OSwiZXhwIjoyMDY5MzEyNTY5fQ.I6Vijnl-bHYj0hPbjRaiL_77LogNtGdSII0Prko1bGQ`

3. **SUPABASE_ANON_KEY** (Keep for frontend)
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leGlsZnZyZWhsa3BobHJnaHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MzY1NjksImV4cCI6MjA2OTMxMjU2OX0.pAoVwyVwOKodsU8hlpI1Zqt2THo6-UvXGDZR3rYhTRs`

4. **SUPABASE_BUCKET** (Legacy)
   - Value: `linkage-va-hub`

After adding these, click "Manual Deploy" > "Deploy latest commit" to restart with new environment variables.

### Step 4: Test the Upload

1. Go to https://linkage-va-hub.onrender.com/dashboard
2. Try uploading a profile image
3. Check the browser console for any errors
4. Verify the image persists after refresh

## Verification

After setup, you can verify by:

1. **Check buckets exist**: https://supabase.com/dashboard/project/nexilfvrehlkphlrghxn/storage/buckets
2. **Test health endpoint**: https://linkage-va-hub-api.onrender.com/api/health (should show Supabase: true)
3. **Check RLS policies**: https://supabase.com/dashboard/project/nexilfvrehlkphlrghxn/editor

## Why This Fixes The Problem

- **SERVICE_ROLE_KEY**: Bypasses RLS policies, allowing server-side uploads without authentication issues
- **Correct Buckets**: Application code expects specific bucket names
- **Public Buckets**: Allows users to view uploaded images/videos
- **RLS Policies**: Provides security while allowing necessary operations

## Code References

- Upload logic: `backend/utils/supabaseStorage.js`
- Bucket configuration: Lines 8-35 define required buckets
- Profile routes: `backend/routes/profile.js` (avatar/cover uploads)
- VA routes: `backend/routes/vas.js` (video uploads)