# Quick Fix for "Bucket does not exist" Error

## The Error
"Failed to upload to Supabase: Bucket 'linkage-va-hub' does not exist. Please create it in Supabase dashboard."

## Quick Solution

### Option 1: Create the Expected Bucket (Easiest)

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Click on **Storage** in the left sidebar
3. Click **"New bucket"**
4. Enter exactly: `linkage-va-hub` as the bucket name
5. **IMPORTANT**: Toggle "Public bucket" to ON ✅
6. Click **"Create bucket"**
7. Try uploading again - it should work now!

### Option 2: Use Your Existing Bucket

If you already have a bucket with a different name:

1. Go to your Render dashboard
2. Add this environment variable:
   ```
   SUPABASE_BUCKET=your-actual-bucket-name
   ```
3. Save and redeploy

## Verify Your Setup

Your environment variables should look like:
```
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_BUCKET=linkage-va-hub  (or your bucket name)
```

## Still Having Issues?

The app now has automatic fallback to local storage. If Supabase fails, your uploads will still work using local storage on the server.