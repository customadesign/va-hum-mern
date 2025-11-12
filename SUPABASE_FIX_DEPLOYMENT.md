# Supabase Storage Fix - Deployment Guide

## 🔴 Problem Summary

Profile pictures, cover images, and videos were **disappearing after redeployment** on Render because:

1. **Supabase was disabled** in `backend/routes/vas.js`
2. Files were being uploaded to **local ephemeral storage** on Render
3. Render's filesystem is **wiped on every deployment/restart**
4. Missing Supabase environment variables in Render

## ✅ What Was Fixed

### 1. **Re-enabled Supabase Storage** ✅
- **File:** `backend/routes/vas.js` (line 16)
- **Change:** `const useSupabase = isProduction || process.env.FORCE_SUPABASE === 'true';`
- **Result:** Production deployments now use Supabase (persistent) instead of local storage (ephemeral)

### 2. **Added Supabase Environment Variables to Render** ✅
- **Service:** linkage-va-hub-api (Backend API)
- **Variables Added:**
  - ✅ `SUPABASE_URL` = `https://nexilfvrehlkphlrghxn.supabase.co`
  - ✅ `SUPABASE_SERVICE_ROLE_KEY` = (Service role key from Supabase)
  - ✅ `SUPABASE_ANON_KEY` = (Anon key from Supabase)
  - ✅ `SUPABASE_BUCKET` = `linkage-va-hub`

### 3. **Created Setup Scripts & Documentation** ✅
- **File:** `setup-supabase-buckets.js` - Automated bucket creation script
- **File:** `supabase-rls-policies-complete.sql` - Complete RLS policies for all buckets

---

## 🚀 Deployment Steps (Already Done!)

### ✅ Step 1: Code Changes Committed
```
Commit: 2329b46
Message: "fix: Enable Supabase storage for production persistence"
Status: Pushed to GitHub
```

### ✅ Step 2: Render Environment Variables
```
Service: linkage-va-hub-api
Variables: Added SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, SUPABASE_BUCKET
Deployment: Triggered automatically (dep-d3jk2l6r433s739cessg)
```

---

## 📋 Required Supabase Buckets

Your application needs these buckets created in Supabase:

| Bucket Name | Purpose | Public | Max Size | Status |
|------------|---------|--------|----------|--------|
| `profile-images` | VA/Business avatars & covers | ✅ Yes | 10 MB | ⚠️ **Verify exists** |
| `va-videos` | VA video introductions | ✅ Yes | 1 GB | ⚠️ **Verify exists** |
| `business-assets` | Business logos & files | ✅ Yes | 10 MB | ⚠️ **Verify exists** |
| `admin-uploads` | Admin-only files | ❌ Private | 20 MB | ⚠️ **Verify exists** |
| `linkage-va-hub` | Legacy bucket | ✅ Yes | 10 MB | ⚠️ **Verify exists** |

---

## ⚙️ Manual Steps Required

### Step 1: Verify/Create Buckets in Supabase

1. **Go to:** https://supabase.com/dashboard/project/nexilfvrehlkphlrghxn/storage/buckets

2. **Check if buckets exist.** If any are missing, create them:
   - Click "New Bucket"
   - Enter bucket name (e.g., `profile-images`)
   - Set "Public bucket" to **ON** (except for `admin-uploads`)
   - Click "Create bucket"

3. **Or run the automated setup script locally:**
   ```bash
   cd backend
   node ../setup-supabase-buckets.js
   ```

### Step 2: Apply RLS Policies

1. **Go to:** https://supabase.com/dashboard/project/nexilfvrehlkphlrghxn/editor

2. **Copy and run the SQL** from `supabase-rls-policies-complete.sql`

3. **Why this is critical:**
   - Without RLS policies, uploads will fail with "row-level security" errors
   - The SERVICE_ROLE key needs these policies to upload files
   - Public buckets need read access for users to view uploaded files

---

## 🧪 Testing After Deployment

Once Render finishes deploying (should take ~2-3 minutes):

### Test 1: Upload Profile Picture
1. Go to https://linkage-va-hub.onrender.com/va/profile
2. Click on the profile picture area
3. Upload an image
4. ✅ Should see the image immediately
5. ✅ Refresh the page - image should still be there

### Test 2: Upload Cover Image
1. On the same page, upload a cover image
2. ✅ Should see it displayed
3. ✅ Should persist after refresh

### Test 3: Upload Video Introduction
1. Upload a video (MP4 format recommended)
2. ✅ Video should play in the preview
3. ✅ Should persist after refresh and redeployment

### Test 4: Check Backend Logs
1. Go to https://dashboard.render.com/web/srv-d25arrripnbc73dpeqs0/logs
2. Look for these log messages:
   - ✅ "Supabase client initialized successfully"
   - ✅ "Using key type: SERVICE_ROLE"
   - ✅ "File uploaded successfully to profile-images/avatars"
   - ❌ "Supabase credentials not found" (bad - means env vars missing)

---

## 🔍 Troubleshooting

### If images still don't appear:

**Check 1: Verify Supabase Connection**
```bash
# Check health endpoint
curl https://linkage-va-hub-api.onrender.com/api/health
# Should show: "supabase": true
```

**Check 2: Verify Buckets Exist**
- Go to https://supabase.com/dashboard/project/nexilfvrehlkphlrghxn/storage/buckets
- Ensure all 5 buckets are listed

**Check 3: Verify RLS Policies**
- Go to https://supabase.com/dashboard/project/nexilfvrehlkphlrghxn/editor
- Run: `SELECT * FROM pg_policies WHERE tablename = 'objects';`
- Should see 6 policies listed

**Check 4: Test Upload Directly**
```bash
# Check backend logs during upload
# Should see: "Uploading to Supabase bucket: profile-images"
# NOT: "Uploading to local storage"
```

### Common Issues:

**Issue:** "Supabase client not initialized"
- **Fix:** Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Render environment variables

**Issue:** "Bucket does not exist"
- **Fix:** Create missing buckets in Supabase dashboard or run `setup-supabase-buckets.js`

**Issue:** "row-level security policy violation"
- **Fix:** Run the SQL from `supabase-rls-policies-complete.sql` in Supabase SQL editor

**Issue:** Images upload but show as broken links
- **Fix:** Check bucket is set to "Public" in Supabase settings

---

## 📊 Deployment Status

| Task | Status | Notes |
|------|--------|-------|
| Code: Enable Supabase | ✅ Complete | Committed (2329b46) |
| Render: Add env vars | ✅ Complete | Deployment triggered |
| Render: Backend deploying | 🔄 In Progress | Check dashboard |
| Supabase: Create buckets | ⚠️ **Action Required** | Manual step needed |
| Supabase: Apply RLS policies | ⚠️ **Action Required** | Manual step needed |

---

## 🎯 Expected Results

After completing all steps:

✅ **Upload profile picture** → Saved to Supabase `profile-images/avatars/`  
✅ **Upload cover image** → Saved to Supabase `profile-images/covers/`  
✅ **Upload video** → Saved to Supabase `va-videos/introductions/`  
✅ **Redeploy application** → All files still visible  
✅ **Restart services** → All files still visible  
✅ **Files persist permanently** → Stored in Supabase cloud storage  

---

## 📞 Support

If you continue to have issues after following all steps:

1. Check Render logs: https://dashboard.render.com/web/srv-d25arrripnbc73dpeqs0/logs
2. Check Supabase logs: https://supabase.com/dashboard/project/nexilfvrehlkphlrghxn/logs
3. Verify buckets: https://supabase.com/dashboard/project/nexilfvrehlkphlrghxn/storage/buckets

---

**Last Updated:** October 9, 2025  
**Deployment ID:** dep-d3jk2l6r433s739cessg  
**Commit:** 2329b46

