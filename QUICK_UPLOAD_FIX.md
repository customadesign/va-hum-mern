# 🚀 Quick Upload Fix for Production

Your uploads are failing because the app is trying to save files locally on Render (which doesn't persist files). Here's the quick fix:

## Step 1: Set Supabase Environment Variables in Render

Go to your [Render Dashboard](https://dashboard.render.com) and add these environment variables to your `linkage-va-hub-api` service:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_BUCKET=linkage-va-hub
```

Get these values from your Supabase project:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy the **Project URL** and **anon/public** key

## Step 2: Create/Verify Supabase Storage Bucket

1. In Supabase Dashboard, go to **Storage**
2. Create a bucket named `linkage-va-hub` (if not exists)
3. Make sure it's set to **PUBLIC**
4. Create these folders inside:
   - `avatars`
   - `covers`
   - `videos`

## Step 3: Apply This Quick Code Fix

Replace the content of `/backend/routes/vas.js` lines 11-21 with:

```javascript
// Dynamic upload handler based on environment
const upload = (() => {
  const isProduction = process.env.NODE_ENV === 'production';
  const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;
  
  if (isProduction && hasSupabase) {
    console.log('✅ Using Supabase storage for uploads');
    return require('../utils/supabaseStorage');
  } else {
    console.log('📁 Using local storage for uploads');
    return require('../utils/upload');
  }
})();

// Use the appropriate upload handler
const { handleSupabaseUpload } = require('../utils/supabaseStorage');
```

## Step 4: Test It

1. Commit and push your changes
2. Wait for Render to deploy
3. Try uploading a profile image at https://linkage-va-hub.onrender.com/va/profile

## Alternative: Quick Local Test

To test if Supabase is configured correctly, run this in your project:

```bash
cd backend
node -e "
require('dotenv').config();
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_BUCKET:', process.env.SUPABASE_BUCKET || 'linkage-va-hub');
"
```

## Still Having Issues?

The most common problems:
1. **Bucket not public** - Check Supabase bucket settings
2. **Wrong environment variables** - Double-check in Render dashboard
3. **CORS issues** - Supabase bucket should allow your domain

Need help? The error logs in Render dashboard will show what's failing.