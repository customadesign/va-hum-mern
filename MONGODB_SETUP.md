# MongoDB Setup Guide

## Option 1: MongoDB Atlas (Cloud) - Recommended

You already have a MongoDB Atlas account. To get the correct connection string:

1. **Go to MongoDB Atlas Dashboard**
   - Visit: https://cloud.mongodb.com
   - Login with your credentials

2. **Find Your Cluster**
   - Look for cluster named "LinkageVAhub"

3. **Get Connection String**
   - Click the "Connect" button on your cluster
   - Choose "Connect your application"
   - Select "Node.js" and version "5.5 or later"
   - Copy the connection string

4. **Update Your Connection String**
   - The string should look like:
     ```
     mongodb+srv://marketing:<password>@<cluster-name>.<subdomain>.mongodb.net/<database>?retryWrites=true&w=majority
     ```
   - Replace `<password>` with: TaNN6bttM920rEjL
   - Replace `<database>` with: linkage-va-hub

5. **Whitelist Your IP**
   - In MongoDB Atlas, go to Network Access
   - Add your current IP address or use 0.0.0.0/0 for all IPs (less secure)

## Option 2: Local MongoDB Installation

If you prefer to run MongoDB locally:

### On macOS:
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify it's running
mongosh
```

### Update .env for local MongoDB:
```
MONGODB_URI=mongodb://localhost:27017/linkage-va-hub
```

## Testing Your Connection

Run this test script:
```bash
cd backend
node test-db.js
```

You should see: "✅ MongoDB connected successfully!"

## Common Issues

1. **Connection String Error**: Make sure you copied the entire string from Atlas
2. **Authentication Failed**: Check username/password are correct
3. **Network Error**: Whitelist your IP address in Atlas
4. **DNS Error**: The cluster subdomain might be different than expected

## Need Help?

The exact format of your MongoDB Atlas connection string should be visible in your Atlas dashboard under "Connect" → "Connect your application".