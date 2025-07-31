# Supabase Storage Setup

This guide will help you set up Supabase Storage for file uploads in production.

## Prerequisites

1. A Supabase account (free tier is sufficient)
2. A Supabase project

## Setup Steps

### 1. Create a Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to Storage section
3. Click "Create a new bucket"
4. Name it: `linkage-va-hub`
5. Set it as **Public** (important for serving files)
6. Click "Create bucket"

### 2. Configure Bucket Policies

Add the following policies to your bucket:

#### Allow Public Access (for viewing)
```sql
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'linkage-va-hub');
```

#### Allow Authenticated Upload
```sql
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'linkage-va-hub');
```

#### Allow Authenticated Delete
```sql
CREATE POLICY "Users can delete their own uploads" ON storage.objects FOR DELETE USING (bucket_id = 'linkage-va-hub');
```

### 3. Get Your Credentials

1. Go to Settings > API
2. Copy your:
   - **Project URL** (this is your SUPABASE_URL)
   - **Anon/Public Key** (this is your SUPABASE_ANON_KEY)

### 4. Set Environment Variables

Add these to your production environment (e.g., Render):

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: 
- Do NOT include any credentials in the URL
- The URL should be just the base URL (e.g., `https://abcdef.supabase.co`)
- The anon key is safe to use in client-side code

### 5. Create Folder Structure

In your Supabase Storage bucket, create these folders:
- `avatars` - for profile pictures
- `covers` - for cover images  
- `videos` - for video introductions

## Testing

1. Upload a test file through your application
2. Check Supabase Dashboard > Storage to see if the file appears
3. The URL returned should be in format: `https://your-project.supabase.co/storage/v1/object/public/linkage-va-hub/avatars/filename.jpg`

## Troubleshooting

### "Request cannot be constructed from a URL that includes credentials"
- This means your SUPABASE_URL has credentials in it
- Make sure it's just the base URL without any auth parameters

### "Failed to upload to Supabase"
- Check that your bucket is set to PUBLIC
- Verify your environment variables are correct
- Check Supabase Dashboard for any error logs

### File not accessible after upload
- Ensure the bucket is PUBLIC
- Check that the RLS policies are correctly applied

## Local Development

In local development, files will continue to use the local `uploads` directory unless you set the Supabase environment variables.