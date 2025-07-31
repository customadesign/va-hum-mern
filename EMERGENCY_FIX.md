# 🚨 Emergency Fix - Server 500 Error

The server is returning 500 errors because it's trying to use Supabase without credentials.

## Quick Fix Option 1: Add Supabase Credentials NOW

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on `linkage-va-hub-api` service
3. Go to **Environment** tab
4. Add these variables:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_BUCKET=linkage-va-hub
   ```
5. Click **Save Changes** - this will trigger a redeploy

## Quick Fix Option 2: Revert to Local Storage Temporarily

If you don't have Supabase credentials ready, push this quick fix:

```bash
# Revert the route changes
git checkout backend/routes/vas.js
git add backend/routes/vas.js
git commit -m "Revert: Temporarily disable Supabase until credentials are added"
git push
```

This will make uploads fail with a cleaner error instead of crashing the server.

## What's Happening?

The code is checking for Supabase credentials and trying to use them, but since they're not set in Render, it's causing the server to crash when handling uploads. The `/api/vas/me` endpoint is also failing because the server is in an error state.

## Permanent Solution

You need to:
1. Create a Supabase account (free): https://app.supabase.com
2. Create a new project
3. Go to Settings → API to get your credentials
4. Add them to Render as shown above

Without Supabase credentials, file uploads cannot work on Render's serverless platform.