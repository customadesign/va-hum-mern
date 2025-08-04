# LinkedIn OAuth Setup Guide for E-Systems Management Hub

## Overview
This guide provides step-by-step instructions for configuring LinkedIn OAuth authentication for the E-Systems Management Hub application deployed at https://esystems-management-hub.onrender.com/

## Prerequisites
- LinkedIn account with access to create apps
- Access to Render dashboard for environment variables
- MongoDB Atlas database configured

## Step 1: Create LinkedIn App

1. **Navigate to LinkedIn Developers**
   - Go to https://www.linkedin.com/developers/
   - Click "Create app"

2. **Fill in App Details**
   - **App name**: E-Systems Management Hub
   - **LinkedIn Page**: Select or create a company page
   - **Privacy policy URL**: https://esystems-management-hub.onrender.com/privacy
   - **App logo**: Upload your logo (300x300px recommended)

3. **Legal Agreement**
   - Check the legal agreement checkbox
   - Click "Create app"

## Step 2: Configure OAuth Settings

1. **Navigate to Auth Tab**
   - In your app dashboard, click on the "Auth" tab

2. **Add Redirect URLs**
   Add the following Authorized Redirect URLs:
   ```
   https://esystems-management-hub.onrender.com/auth/linkedin/callback
   https://esystems-management-hub.onrender.com/api/auth/linkedin/callback
   ```
   
   For local development (optional):
   ```
   http://localhost:3000/auth/linkedin/callback
   http://localhost:5000/api/auth/linkedin/callback
   ```

3. **OAuth 2.0 Scopes**
   The application uses OpenID Connect. Required scopes:
   - `openid` - OpenID Connect authentication
   - `profile` - Basic profile information
   - `email` - Email address

## Step 3: Get App Credentials

1. **Navigate to Auth Tab**
   - Find your **Client ID** and **Client Secret**
   - Keep these secure - you'll need them for environment variables

2. **Important**: Never commit these credentials to your repository

## Step 4: Configure Products

1. **Navigate to Products Tab**
   - Add "Sign In with LinkedIn using OpenID Connect"
   - Review and accept any required agreements

2. **Verification Status**
   - For basic authentication, no verification is needed
   - For advanced features (company data), you may need app verification

## Step 5: Set Environment Variables in Render

### Backend Service (Web Service)

Add these environment variables in your Render backend service:

```bash
# Core Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/esystems-hub?retryWrites=true&w=majority
JWT_SECRET=[generate-secure-32-char-string]
JWT_EXPIRE=30d

# Server Configuration
PORT=10000
NODE_ENV=production
SERVER_URL=https://esystems-management-hub.onrender.com
CLIENT_URL=https://esystems-management-hub.onrender.com
ESYSTEMS_CLIENT_URL=https://esystems-management-hub.onrender.com
ESYSTEMS_MODE=true

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=[your-linkedin-client-id]
LINKEDIN_CLIENT_SECRET=[your-linkedin-client-secret]
LINKEDIN_REDIRECT_URI=https://esystems-management-hub.onrender.com/auth/linkedin/callback

# Alternative LinkedIn Credentials (if using separate apps)
LINKEDIN_ESYSTEMS_CLIENT_ID=[your-linkedin-client-id]
LINKEDIN_ESYSTEMS_CLIENT_SECRET=[your-linkedin-client-secret]

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=[your-email]
EMAIL_PASS=[your-app-password]
EMAIL_FROM=noreply@esystems-hub.com

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# File Storage
SUPABASE_URL=[your-supabase-url]
SUPABASE_ANON_KEY=[your-supabase-anon-key]
SUPABASE_BUCKET=esystems-hub
```

### Frontend Service (Static Site)

Add these environment variables in your Render frontend service:

```bash
REACT_APP_API_URL=https://esystems-management-hub.onrender.com/api
REACT_APP_SOCKET_URL=https://esystems-management-hub.onrender.com
REACT_APP_NAME=E-Systems Management Hub
REACT_APP_DESCRIPTION=Connect with skilled professionals and grow your business
REACT_APP_BRAND=esystems
REACT_APP_LINKEDIN_CLIENT_ID=[your-linkedin-client-id]
REACT_APP_ENABLE_LINKEDIN=true
```

## Step 6: Generate Secure Secrets

### JWT Secret
Generate a secure JWT secret using one of these methods:

**Option 1: Command Line (Mac/Linux)**
```bash
openssl rand -base64 32
```

**Option 2: Node.js**
```javascript
require('crypto').randomBytes(32).toString('base64')
```

**Option 3: Online Generator**
- Visit https://generate-secret.vercel.app/32

## Step 7: Test the Integration

1. **Deploy Changes**
   - Push your code changes to trigger Render deployment
   - Wait for both frontend and backend to deploy successfully

2. **Test LinkedIn Login**
   - Navigate to https://esystems-management-hub.onrender.com/login
   - Click "Continue with LinkedIn"
   - Authorize the application
   - Verify successful login and redirect

3. **Troubleshooting Common Issues**

   **Issue: "Invalid redirect_uri"**
   - Solution: Ensure redirect URLs in LinkedIn app match exactly
   - Check for trailing slashes, http vs https

   **Issue: "Invalid client_id"**
   - Solution: Verify LINKEDIN_CLIENT_ID is set correctly in both frontend and backend
   - Ensure no extra spaces or quotes

   **Issue: "Authentication failed"**
   - Solution: Check backend logs in Render dashboard
   - Verify LINKEDIN_CLIENT_SECRET is correct
   - Ensure ESYSTEMS_MODE=true is set

## Step 8: Security Best Practices

1. **Never expose credentials**
   - Keep CLIENT_SECRET only on backend
   - Use environment variables, never hardcode

2. **HTTPS Only**
   - Always use HTTPS URLs in production
   - LinkedIn requires HTTPS for redirect URLs

3. **State Parameter**
   - The app uses state parameter to prevent CSRF attacks
   - This is handled automatically by the implementation

4. **Token Storage**
   - JWT tokens are stored in localStorage
   - Consider httpOnly cookies for enhanced security

## Step 9: Monitoring and Maintenance

1. **Monitor Usage**
   - Check LinkedIn app dashboard for usage statistics
   - Monitor for any rate limiting issues

2. **Keep Credentials Secure**
   - Rotate secrets periodically
   - Use Render's secret management features

3. **Update Scopes if Needed**
   - If you need additional user data, update scopes
   - Remember to update both LinkedIn app and code

## Additional LinkedIn API Features (Optional)

If you want to access additional LinkedIn features:

1. **Company Data Access**
   - Requires LinkedIn Marketing Developer Platform access
   - Additional verification may be needed

2. **Share on LinkedIn**
   - Add "Share on LinkedIn" product
   - Requires w_member_social permission

3. **LinkedIn Messaging**
   - Requires special partnership agreement
   - Not available for most applications

## Support and Resources

- **LinkedIn OAuth Documentation**: https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication
- **LinkedIn Developer Support**: https://www.linkedin.com/help/linkedin/ask/lms
- **Render Documentation**: https://render.com/docs/environment-variables
- **MongoDB Atlas**: https://docs.atlas.mongodb.com/

## Quick Checklist

- [ ] Created LinkedIn App
- [ ] Added redirect URLs to LinkedIn app
- [ ] Configured OAuth 2.0 scopes (openid, profile, email)
- [ ] Added "Sign In with LinkedIn using OpenID Connect" product
- [ ] Set all required environment variables in Render backend
- [ ] Set all required environment variables in Render frontend
- [ ] Generated secure JWT_SECRET
- [ ] Deployed both frontend and backend
- [ ] Tested LinkedIn login flow
- [ ] Verified user creation in MongoDB

## Troubleshooting Commands

**Check Backend Logs (Render)**
```bash
# View live logs in Render dashboard
# Or use Render CLI:
render logs --service esystems-management-hub-backend --tail
```

**Test LinkedIn OAuth Locally**
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm start
```

**Verify Environment Variables**
```javascript
// Add this temporarily to server.js to check vars (remove after testing)
console.log('LinkedIn Config:', {
  clientId: !!process.env.LINKEDIN_CLIENT_ID,
  clientSecret: !!process.env.LINKEDIN_CLIENT_SECRET,
  redirectUri: process.env.LINKEDIN_REDIRECT_URI,
  esystemsMode: process.env.ESYSTEMS_MODE
});
```

---

Last Updated: 2025-08-04
Version: 1.0