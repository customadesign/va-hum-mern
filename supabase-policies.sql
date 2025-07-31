-- Policy 1: Allow public to view all files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'linkage-va-hub');

-- Policy 2: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'linkage-va-hub' 
  AND auth.role() = 'authenticated'
);

-- Policy 3: Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'linkage-va-hub' 
  AND auth.uid() = owner
);

-- Policy 4: Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'linkage-va-hub' 
  AND auth.uid() = owner
);

-- Alternative: If you want to allow anonymous uploads (less secure but simpler)
-- CREATE POLICY "Anyone can upload"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'linkage-va-hub');