# MongoDB Setup for Render Deployment

## Problem
Your local MongoDB (`mongodb://localhost:27017/linkagevahub`) only works on your local machine. When deployed to Render, the app needs to connect to a cloud MongoDB database.

## Solution: Set up MongoDB Atlas (Free Tier)

### Step 1: Create MongoDB Atlas Account
1. Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new organization (or use existing)

### Step 2: Create a New Cluster
1. Click "Build a Database"
2. Choose **M0 Sandbox** (FREE)
3. Select a cloud provider and region (closest to your users)
4. Cluster name: `linkage-va-hub` (or your preference)
5. Click "Create Cluster"

### Step 3: Create Database User
1. Go to "Database Access" in the left menu
2. Click "Add New Database User"
3. Username: `linkage-va-admin` (or your preference)
4. Password: Generate a strong password (save it!)
5. Click "Add User"

### Step 4: Configure Network Access
1. Go to "Network Access" in the left menu
2. Click "Add IP Address"
3. Choose **"Allow access from anywhere"** (0.0.0.0/0)
   - This is required for Render's dynamic IP addresses
4. Click "Confirm"

### Step 5: Get Your Connection String
1. Go to "Database" in the left menu
2. Click "Connect" for your cluster
3. Choose "Drivers"
4. Copy the connection string (it looks like this):
   ```
   mongodb+srv://linkage-va-admin:<PASSWORD>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<PASSWORD>` with your actual password

### Step 6: Set Environment Variables on Render

In your Render dashboard, go to your backend service and add these environment variables:

#### Required Variables:
```
MONGODB_URI=mongodb+srv://linkage-va-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/linkagevahub?retryWrites=true&w=majority
NODE_ENV=production
```

#### Important Notes:
- Replace `YOUR_PASSWORD` with your actual database password
- Replace `cluster0.xxxxx` with your actual cluster name
- Keep `/linkagevahub` at the end (this creates/uses the database name)

### Step 7: Update Your Local .env (Optional)
For local development, you can keep using your local MongoDB, but if you want to use the cloud database locally too:

```env
# For local development (optional)
MONGODB_URI=mongodb+srv://linkage-va-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/linkagevahub?retryWrites=true&w=majority

# For production (Render will use this)
NODE_ENV=production
```

### Step 8: Deploy and Test
1. Commit and push your changes to GitHub
2. Render will automatically redeploy
3. Check the Render logs for successful database connection
4. Test your API endpoints

## Troubleshooting

### Error: "Authentication failed"
- Check username and password in MONGODB_URI
- Ensure the database user has the correct permissions

### Error: "Connection timeout"
- Verify IP whitelist includes 0.0.0.0/0
- Check if your cluster is running (not paused)

### Error: "Database not found"
- The database will be created automatically on first connection
- Ensure the connection string ends with your database name

### Error: "ENOTFOUND" or "ECONNREFUSED"
- Double-check your connection string format
- Ensure there are no typos in the cluster name

## Security Best Practices

1. **Use strong passwords** for database users
2. **Limit IP access** in production if possible (though Render requires 0.0.0.0/0)
3. **Enable SSL/TLS** (already included in the connection string)
4. **Monitor database usage** in Atlas dashboard
5. **Set up alerts** for unusual activity

## Free Tier Limitations

- **512MB storage** (should be sufficient for development/small apps)
- **Shared RAM** (may have occasional slow responses)
- **No automatic backups** on free tier (manual exports available)

## Next Steps After Setup

1. Test database connection with our test script:
   ```bash
   cd backend && node test-mongodb-fix.js
   ```

2. Verify API endpoints work:
   - `GET /api/vas/featured`
   - `GET /api/vas`
   - `GET /health`

3. Monitor Render logs for any database-related errors

## Alternative: Use Render's Managed MongoDB

If you prefer not to use MongoDB Atlas, Render also offers managed MongoDB:

1. In Render dashboard, click "New+" → "Mongo"
2. Choose a plan (free tier available)
3. Set up database user and password
4. Get the connection string from Render
5. Use that connection string in your MONGODB_URI

The connection string will look like:
```
mongodb://user:password@host:port/database
```

## Quick Checklist Before Deployment

- [ ] MongoDB Atlas cluster created and running
- [ ] Database user created with strong password
- [ ] Network access configured (0.0.0.0/0)
- [ ] MONGODB_URI environment variable set on Render
- [ ] NODE_ENV=production set on Render
- [ ] Local code committed and pushed to GitHub
- [ ] Render deployment successful
- [ ] Database connection working in production

Once you complete these steps, your app should successfully connect to MongoDB on Render and all API endpoints should work properly.