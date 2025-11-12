-- Complete RLS Policies for Linkage VA Hub Storage
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/nexilfvrehlkphlrghxn/editor

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Service Role Full Access" ON storage.objects;
DROP POLICY IF EXISTS "User Update Own Files" ON storage.objects;
DROP POLICY IF EXISTS "User Delete Own Files" ON storage.objects;
DROP POLICY IF EXISTS "Admin Only Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- 1. Allow anyone to READ from public buckets (CRITICAL for viewing uploaded files)
CREATE POLICY "Public Read Access" ON storage.objects
  FOR SELECT
  USING (
    bucket_id IN ('profile-images', 'va-videos', 'business-assets', 'linkage-va-hub')
  );

-- 2. Allow SERVICE ROLE to do EVERYTHING (backend uploads bypass auth)
CREATE POLICY "Service Role Full Access" ON storage.objects
  FOR ALL
  USING (
    auth.role() = 'service_role'
  );

-- 3. Allow authenticated users to UPLOAD to public buckets
CREATE POLICY "Authenticated Upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id IN ('profile-images', 'va-videos', 'business-assets', 'linkage-va-hub')
    AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  );

-- 4. Allow users to UPDATE files they own (or service role)
CREATE POLICY "User Update Own Files" ON storage.objects
  FOR UPDATE
  USING (
    (auth.uid()::text = owner) OR (auth.role() = 'service_role')
  );

-- 5. Allow users to DELETE files they own (or service role)
CREATE POLICY "User Delete Own Files" ON storage.objects
  FOR DELETE
  USING (
    (auth.uid()::text = owner) OR (auth.role() = 'service_role')
  );

-- 6. Admin bucket - SERVICE ROLE only (private/secure)
CREATE POLICY "Admin Only Access" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'admin-uploads' AND auth.role() = 'service_role'
  );

-- Verify policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
ORDER BY policyname;

