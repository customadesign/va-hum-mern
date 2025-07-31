# Supabase Storage Policies (NOT Table RLS)

## Important: These go in Storage > Your Bucket > Policies

### 1. Allow Public Downloads
- **Name:** Allow public downloads
- **Operation:** SELECT
- **Policy:** `true`

### 2. Allow Anonymous Uploads  
- **Name:** Allow anonymous uploads
- **Operation:** INSERT
- **Policy:** `true`

### 3. Allow Anonymous Updates (optional)
- **Name:** Allow anonymous updates
- **Operation:** UPDATE
- **Policy:** `true`

### 4. Allow Anonymous Deletes (optional)
- **Name:** Allow anonymous deletes
- **Operation:** DELETE
- **Policy:** `true`

## Where to Add These:

1. Go to your Supabase Dashboard
2. Click on **Storage** (not Table Editor)
3. Click on your bucket `linkage-va-hub`
4. Click on the **Policies** tab
5. Click **New Policy** for each one above

## What NOT to Do:

- Don't confuse Storage policies with Table RLS policies
- Those `active_storage_*` tables are unrelated to Supabase Storage
- Storage policies are separate from database table policies