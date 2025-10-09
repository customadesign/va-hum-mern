# 🚀 Quick Supabase Setup - Action Required!

## ⚡ DO THIS NOW (2 minutes)

Your code is deployed, but you need to set up Supabase storage buckets and policies.

### 📦 Step 1: Create Buckets (1 minute)

Go to: https://supabase.com/dashboard/project/nexilfvrehlkphlrghxn/storage/buckets

Click **"New Bucket"** for each of these:

1. **profile-images**
   - Name: `profile-images`
   - Public: ✅ YES
   - Click "Create"

2. **va-videos**
   - Name: `va-videos`  
   - Public: ✅ YES
   - Click "Create"

3. **business-assets**
   - Name: `business-assets`
   - Public: ✅ YES
   - Click "Create"

4. **admin-uploads**
   - Name: `admin-uploads`
   - Public: ❌ NO (Private)
   - Click "Create"

5. **linkage-va-hub** (may already exist)
   - Name: `linkage-va-hub`
   - Public: ✅ YES
   - Click "Create"

---

### 🔒 Step 2: Apply Security Policies (30 seconds)

Go to: https://supabase.com/dashboard/project/nexilfvrehlkphlrghxn/editor

Click **"New Query"** and paste this entire SQL script:

```sql
-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Clean up old policies
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Service Role Full Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "User Update Own Files" ON storage.objects;
DROP POLICY IF EXISTS "User Delete Own Files" ON storage.objects;
DROP POLICY IF EXISTS "Admin Only Access" ON storage.objects;

-- Public can view files in public buckets
CREATE POLICY "Public Read Access" ON storage.objects
  FOR SELECT USING (bucket_id IN ('profile-images', 'va-videos', 'business-assets', 'linkage-va-hub'));

-- Backend (service role) can do everything
CREATE POLICY "Service Role Full Access" ON storage.objects
  FOR ALL USING (auth.role() = 'service_role');

-- Authenticated users can upload
CREATE POLICY "Authenticated Upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id IN ('profile-images', 'va-videos', 'business-assets', 'linkage-va-hub'));

-- Users can update their files
CREATE POLICY "User Update Own Files" ON storage.objects
  FOR UPDATE USING ((auth.uid()::text = owner) OR (auth.role() = 'service_role'));

-- Users can delete their files  
CREATE POLICY "User Delete Own Files" ON storage.objects
  FOR DELETE USING ((auth.uid()::text = owner) OR (auth.role() = 'service_role'));

-- Admin bucket (private)
CREATE POLICY "Admin Only Access" ON storage.objects
  FOR ALL USING (bucket_id = 'admin-uploads' AND auth.role() = 'service_role');
```

Click **"Run"** ▶️

---

## ✅ That's It!

After completing these 2 steps, your files will persist permanently!

**Wait for Render to finish deploying** (~2 more minutes), then test:

1. Go to https://linkage-va-hub.onrender.com/va/profile
2. Upload a profile picture
3. Refresh page - picture should stay! ✨

---

## 🎯 What Was Fixed

- ✅ Supabase enabled in backend code
- ✅ Environment variables added to Render
- ⏳ Backend redeploying now
- ⚠️ **Buckets need to be created** (Step 1 above)
- ⚠️ **Policies need to be applied** (Step 2 above)

---

**Questions?** Check the full guide: `SUPABASE_FIX_DEPLOYMENT.md`

