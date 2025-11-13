# MongoDB Live Database Setup Guide

## Current Status
✅ **Fixed**: `bufferMaxEntries` deprecated option issue  
🔄 **In Progress**: Setting up live MongoDB connection

## Updated Configuration

The `.env` file has been updated with a template MongoDB URI:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/linkagevahub?retryWrites=true&w=majority
```

## Required Actions

### 1. Get Your MongoDB Atlas Credentials

1. **Login to MongoDB Atlas**: https://cloud.mongodb.com/
2. **Navigate to your cluster**
3. **Click "Connect"** button
4. **Choose "Drivers"** connection method
5. **Copy the connection string** (it will look like the template above)

### 2. Update the MongoDB URI

Replace the template in `backend/.env` with your actual credentials:

```env
# Replace these values:
# username -> your actual MongoDB username
# password -> your actual MongoDB password  
# cluster -> your actual cluster name
# linkagevahub -> your desired database name

MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/YOUR_DATABASE_NAME?retryWrites=true&w=majority
```

### 3. Example Real Connection String

```env
MONGODB_URI=mongodb+srv://adminUser:SecurePassword123@linkage-va-cluster.xxxxx.mongodb.net/linkagevahub-prod?retryWrites=true&w=majority
```

## Security Best Practices

### ✅ **DO**:
- Use strong, unique passwords
- Enable IP whitelisting in MongoDB Atlas
- Use database-specific users with limited permissions
- Enable SSL/TLS (included in `mongodb+srv://`)
- Set up database monitoring and alerts

### ❌ **DON'T**:
- Commit credentials to version control
- Use default/admin passwords
- Share connection strings publicly
- Use `localhost` in production

## Environment-Specific Configuration

### Development (Local)
```env
NODE_ENV=development
MONGODB_URI=mongodb+srv://dev-user:dev-password@cluster.mongodb.net/linkagevahub-dev
```

### Production (Render)
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://prod-user:prod-password@cluster.mongodb.net/linkagevahub-prod
```

## MongoDB Atlas Network Access

### For Render Deployment:
1. **Go to MongoDB Atlas → Network Access**
2. **Add IP Address**: `0.0.0.0/0` (allows all IPs - for development)
3. **For Production**: Add Render's IP ranges:
   - Check Render docs for current IP ranges
   - Or use VPC peering if available

### Recommended IP Settings:
- **Development**: `0.0.0.0/0` (all access)
- **Staging**: Specific office/development IPs
- **Production**: Render IP ranges + office IPs

## Testing the Connection

### 1. Test Locally:
```bash
cd backend
node test-mongodb-fix.js
```

### 2. Expected Output:
```
🧪 Testing MongoDB Connection Fix...
✅ MONGODB_URI found
🔗 Attempting to connect with new configuration...
✅ SUCCESS: Connected to MongoDB at [cluster-name]
📊 Connection state: Connected
🧪 Testing basic database operation...
✅ SUCCESS: Database ping successful
📋 Testing collection access...
✅ SUCCESS: Found X collections
🔌 Disconnected successfully

🎉 ALL TESTS PASSED - MongoDB connection fix is working!
```

### 3. Test on Render:
- Deploy to Render
- Check Render logs for connection success
- Verify database operations work in production

## Troubleshooting

### Common Issues:

#### **Authentication Failed**
```
❌ MongoDB authentication failed!
```
**Solution**: Check username/password in URI

#### **Connection Timeout**
```
❌ MongoDB connection timed out!
```
**Solution**: 
- Check IP whitelist in MongoDB Atlas
- Verify network connectivity
- Ensure cluster is running

#### **Database Not Found**
```
❌ Database not found
```
**Solution**: 
- Create the database in MongoDB Atlas
- Check database name in URI
- Ensure user has access to the database

## Render Environment Variables

Set these in your Render service dashboard:

### Required:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
NODE_ENV=production
```

### Optional (but recommended):
```
JWT_SECRET=your-secure-jwt-secret
CLIENT_URL=https://your-app.onrender.com
```

## Next Steps

1. **Update MongoDB URI** with real credentials
2. **Test connection locally** using `node test-mongodb-fix.js`
3. **Deploy to Render** 
4. **Verify production connection** in Render logs
5. **Monitor database performance** and set up alerts

## Security Reminder

🔐 **Never commit real credentials to Git!**  
Always use environment variables for production secrets.

---

**Once you've updated the MongoDB URI with real credentials, test the connection and deploy to Render. The `bufferMaxEntries` issue is now resolved.**