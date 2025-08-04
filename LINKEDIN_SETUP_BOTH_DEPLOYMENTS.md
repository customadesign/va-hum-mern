# LinkedIn OAuth Setup Guide for Both Deployments

This guide covers setting up LinkedIn OAuth for both deployments:
- **E Systems Management Hub**: https://esystems-management-hub.onrender.com (Business registration)
- **Linkage VA Hub**: https://linkage-va-hub.onrender.com (VA registration)

## Option 1: Single LinkedIn App for Both Deployments (Recommended)

### Step 1: LinkedIn Developer Console Setup

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click "Create app" or select your existing app
3. Fill in the required information:
   - **App name**: VA Hub Platform
   - **LinkedIn Page**: Select or create a company page
   - **App logo**: Upload your logo
   - **Legal agreement**: Check the box

### Step 2: Configure OAuth Settings

1. Go to the **Auth** tab in your LinkedIn app
2. Add ALL of these **Authorized Redirect URLs**:

```
https://esystems-management-hub.onrender.com/auth/linkedin/callback
https://esystems-management-hub.onrender.com/api/auth/linkedin/callback
https://linkage-va-hub.onrender.com/auth/linkedin/callback
https://linkage-va-hub.onrender.com/api/auth/linkedin/callback
```

3. Under **OAuth 2.0 Scopes**, ensure these are selected:
   - `openid` - For OpenID Connect authentication
   - `profile` - For basic profile information
   - `email` - For email address

### Step 3: Enable Products

1. Go to the **Products** tab
2. Request access to: **Sign In with LinkedIn using OpenID Connect**
3. Wait for approval (usually instant for this product)

### Step 4: Get Your Credentials

1. Go to the **Auth** tab
2. Copy your:
   - **Client ID**: (e.g., `86vhj2q7ukf83q`)
   - **Client Secret**: (e.g., `WPL_AP0.xxxxxxxxx`)

## Option 2: Separate LinkedIn Apps (If Required)

If you need separate LinkedIn apps for each deployment:

### For E Systems Management Hub:
Create an app with redirect URLs:
```
https://esystems-management-hub.onrender.com/auth/linkedin/callback
https://esystems-management-hub.onrender.com/api/auth/linkedin/callback
```

### For Linkage VA Hub:
Create another app with redirect URLs:
```
https://linkage-va-hub.onrender.com/auth/linkedin/callback
https://linkage-va-hub.onrender.com/api/auth/linkedin/callback
```

## Render Environment Variables Setup

### E Systems Management Hub Backend
```bash
# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
LINKEDIN_REDIRECT_URI=https://esystems-management-hub.onrender.com/auth/linkedin/callback

# Deployment Mode
ESYSTEMS_MODE=true

# Other required variables
MONGODB_URI=your_mongodb_connection
JWT_SECRET=your_32_char_secret
```

### E Systems Management Hub Frontend
```bash
# LinkedIn OAuth
REACT_APP_LINKEDIN_CLIENT_ID=your_client_id_here

# Brand Configuration
REACT_APP_BRAND=esystems

# API Configuration
REACT_APP_API_URL=https://esystems-management-hub.onrender.com/api
```

### Linkage VA Hub Backend
```bash
# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
LINKEDIN_REDIRECT_URI=https://linkage-va-hub.onrender.com/auth/linkedin/callback

# Deployment Mode (false or unset for Linkage)
ESYSTEMS_MODE=false

# Other required variables
MONGODB_URI=your_mongodb_connection
JWT_SECRET=your_32_char_secret
```

### Linkage VA Hub Frontend
```bash
# LinkedIn OAuth
REACT_APP_LINKEDIN_CLIENT_ID=your_client_id_here

# Brand Configuration
REACT_APP_BRAND=linkage

# API Configuration
REACT_APP_API_URL=https://linkage-va-hub.onrender.com/api
```

## Testing the Integration

### For E Systems (Business Registration):
1. Navigate to https://esystems-management-hub.onrender.com/register
2. Click "Continue with LinkedIn"
3. Authorize the app on LinkedIn
4. Profile should auto-fill with company data
5. User is created with role: `business`

### For Linkage (VA Registration):
1. Navigate to https://linkage-va-hub.onrender.com/register
2. Click "Continue with LinkedIn"
3. Authorize the app on LinkedIn
4. Profile should auto-fill with professional data
5. User is created with role: `va`

## Troubleshooting

### Common Issues:

1. **"Redirect URI mismatch" error**:
   - Ensure the exact URLs are added in LinkedIn app
   - Check for trailing slashes
   - Verify protocol (https vs http)

2. **"LinkedIn integration not configured" error**:
   - Verify environment variables are set in Render
   - Check that both CLIENT_ID and CLIENT_SECRET are present
   - Restart the service after adding variables

3. **Profile not auto-filling**:
   - Check browser console for errors
   - Verify the user has a complete LinkedIn profile
   - Ensure proper OAuth scopes are granted

4. **Wrong role assigned**:
   - Check `ESYSTEMS_MODE` environment variable
   - E Systems should have `ESYSTEMS_MODE=true`
   - Linkage should have `ESYSTEMS_MODE=false` or unset

### Deployment Checklist:

- [ ] LinkedIn app created and configured
- [ ] All 4 redirect URLs added (2 for each deployment)
- [ ] OAuth scopes configured (openid, profile, email)
- [ ] "Sign In with LinkedIn using OpenID Connect" product enabled
- [ ] Environment variables set in Render for backend
- [ ] Environment variables set in Render for frontend
- [ ] Code deployed to both services
- [ ] Tested registration flow on both deployments

## Security Notes

1. **Never commit credentials**: Keep CLIENT_ID and CLIENT_SECRET in environment variables
2. **Use HTTPS only**: All redirect URLs must use HTTPS in production
3. **Rotate secrets regularly**: Update CLIENT_SECRET periodically
4. **Monitor usage**: Check LinkedIn app analytics for unusual activity

## Support

For issues specific to:
- **LinkedIn API**: Check [LinkedIn API Documentation](https://docs.microsoft.com/en-us/linkedin/)
- **Render deployment**: Check [Render Documentation](https://render.com/docs)
- **Application bugs**: Check the application logs in Render dashboard