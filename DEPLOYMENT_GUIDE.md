# Linkage VA Hub - Deployment Guide

## Environment Variables Configuration

### Critical Fix Required for Production

**ISSUE**: The Clerk publishable key has a trailing '$' character causing authentication failures.

**ERROR MESSAGE**: 
```
Error: @clerk/clerk-react: The publishableKey passed to Clerk is invalid
```

**CURRENT INCORRECT KEY**: 
```
pk_test_c21hc2hpbmctc3VuYmVhbS03MC5jbGVyay5hY2NvdW50cy5kZXYk
```

**CORRECTED KEY** (remove the '$' at the end):
```
pk_test_c21hc2hpbmctc3VuYmVhbS03MC5jbGVyay5hY2NvdW50cy5kZXY
```

## How to Fix on Render.com

1. Go to your Render dashboard
2. Select your web service (linkage-va-hub)
3. Click on "Environment" in the left sidebar
4. Find `REACT_APP_CLERK_PUBLISHABLE_KEY`
5. Click "Edit" 
6. Remove the trailing '$' character from the value
7. Click "Save Changes"
8. The service will automatically redeploy

## Required Environment Variables

### Backend (.env)
```bash
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Server
NODE_ENV=production
PORT=5000
CLIENT_URL=https://linkage-va-hub.onrender.com

# Authentication - Clerk (Primary)
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx  # Without trailing $
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Authentication - JWT (Fallback)
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRE=30d

# Storage - AWS S3 (Primary)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=your_bucket_name
AWS_REGION=us-east-1

# Storage - Supabase (Fallback)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_BUCKET=your_bucket_name

# Monitoring (Optional but Recommended)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
NEW_RELIC_LICENSE_KEY=your_new_relic_key

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@linkage-va-hub.com

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Frontend (.env)
```bash
# API
REACT_APP_API_URL=https://linkage-va-hub-api.onrender.com

# Clerk Authentication
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx  # WITHOUT the $ at the end!

# Optional Features
REACT_APP_VIDEOSDK_API_KEY=your_videosdk_key
```

## Verification Steps

1. **Run the verification script locally**:
```bash
cd backend
node scripts/verify-clerk-config.js
```

2. **Check the deployment logs on Render**:
   - Look for "Clerk authentication initialized" message
   - Ensure no "Invalid publishable key" errors

3. **Test authentication**:
   - Visit https://linkage-va-hub.onrender.com
   - Try to sign up or log in
   - Check browser console for any errors

## Common Issues and Solutions

### Issue 1: Invalid Clerk Publishable Key
- **Symptom**: Error in browser console about invalid publishable key
- **Solution**: Remove trailing '$' from REACT_APP_CLERK_PUBLISHABLE_KEY

### Issue 2: CORS Errors
- **Symptom**: Cross-origin request blocked
- **Solution**: Ensure CLIENT_URL in backend matches frontend URL

### Issue 3: Database Connection Failed
- **Symptom**: Server crashes on startup
- **Solution**: Verify MONGODB_URI is correct and IP whitelist includes Render IPs

### Issue 4: File Upload Failures
- **Symptom**: Images/files not uploading
- **Solution**: Configure either AWS S3 or Supabase credentials

## Deployment Checklist

- [ ] Remove '$' from REACT_APP_CLERK_PUBLISHABLE_KEY
- [ ] Set all required environment variables
- [ ] Verify MongoDB connection string
- [ ] Configure storage (AWS S3 or Supabase)
- [ ] Set NODE_ENV=production
- [ ] Update CLIENT_URL to production URL
- [ ] Test authentication flow
- [ ] Verify file uploads work
- [ ] Check monitoring dashboards (if configured)

## Support

For issues, check:
1. Render deployment logs
2. Browser console for frontend errors
3. Network tab for API errors
4. MongoDB Atlas for connection issues
5. Clerk dashboard for authentication issues