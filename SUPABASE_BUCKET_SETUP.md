# ✅ Supabase Bucket Setup Checklist

Your Supabase project: **nexilfvreh1kph1rghxn**

## Quick Setup Steps:

1. **Go to your Supabase Dashboard**
   - Direct link: https://app.supabase.com/project/nexilfvreh1kph1rghxn/storage/buckets

2. **Create/Verify the `linkage-va-hub` bucket**
   - Click "New bucket" if it doesn't exist
   - Name: `linkage-va-hub`
   - **PUBLIC**: Must be toggled ON ✅
   - File size limit: 500MB
   - Click "Create bucket"

3. **Create folders inside the bucket** (optional but recommended):
   - Click on the bucket name
   - Create new folder: `avatars`
   - Create new folder: `covers`  
   - Create new folder: `videos`

4. **Verify RLS Policies**
   Go to Storage → Policies and ensure these exist:
   
   ```sql
   -- Allow public viewing
   CREATE POLICY "Public Access" ON storage.objects 
   FOR SELECT USING (bucket_id = 'linkage-va-hub');
   
   -- Allow authenticated uploads
   CREATE POLICY "Anyone can upload" ON storage.objects 
   FOR INSERT WITH CHECK (bucket_id = 'linkage-va-hub');
   
   -- Allow deletes
   CREATE POLICY "Anyone can delete" ON storage.objects 
   FOR DELETE USING (bucket_id = 'linkage-va-hub');
   ```

## Testing Your Setup

Once Render finishes deploying (3-5 minutes), test at:
https://linkage-va-hub.onrender.com/va/profile

1. Try uploading a profile image
2. If it works, you'll see the Supabase URL in the response
3. The image should be viewable immediately

## Common Issues:

- **"Bucket not found"** - Create the bucket with exact name `linkage-va-hub`
- **"Policy violation"** - Make sure bucket is PUBLIC
- **Images not loading** - Check if bucket is PUBLIC
- **Upload fails** - Check bucket size limits

## Your Deployment Status:
- Code: ✅ Pushed
- Environment Variables: ✅ Set in Render
- Deployment: ⏳ In progress (3-5 minutes)
- Bucket: ❓ Need to verify/create

Direct link to check deployment: https://dashboard.render.com