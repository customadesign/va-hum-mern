# LinkedIn OAuth Setup Guide - TWO SEPARATE APPS REQUIRED

## IMPORTANT: You Need TWO SEPARATE LinkedIn Apps

This guide covers setting up TWO COMPLETELY SEPARATE LinkedIn OAuth applications:
- **App 1 - E Systems Management Hub**: For business registrations at https://esystems-management-hub.onrender.com
- **App 2 - Linkage VA Hub**: For VA registrations at https://linkage-va-hub.onrender.com

**Each deployment uses its own LinkedIn app with DIFFERENT credentials. Do NOT share credentials between deployments.**

---

## App 1: E Systems Management Hub LinkedIn App Setup

### Step 1: Create E Systems LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click "Create app"
3. Fill in the required information:
   - **App name**: E Systems Management Hub
   - **LinkedIn Page**: Select your E Systems business page
   - **App logo**: Upload E Systems logo
   - **Legal agreement**: Check the box

### Step 2: Configure E Systems OAuth Settings

1. Go to the **Auth** tab in your E Systems LinkedIn app
2. Add ONLY these **Authorized Redirect URLs** (2 URLs total):

```
https://esystems-management-hub.onrender.com/auth/linkedin/callback
https://esystems-management-hub.onrender.com/api/auth/linkedin/callback
```

**DO NOT add Linkage VA Hub URLs to this app!**

3. Under **OAuth 2.0 Scopes**, ensure these are selected:
   - `openid` - For OpenID Connect authentication
   - `profile` - For basic profile information
   - `email` - For email address

### Step 3: Enable Products for E Systems App

1. Go to the **Products** tab
2. Request access to: **Sign In with LinkedIn using OpenID Connect**
3. Wait for approval (usually instant for this product)

### Step 4: Get E Systems Credentials

1. Go to the **Auth** tab
2. Copy your E Systems credentials:
   - **E Systems Client ID**: (e.g., `86vhj2q7ukf83q`)
   - **E Systems Client Secret**: (e.g., `WPL_AP0.xxxxxxxxx`)
3. **SAVE THESE SEPARATELY** - Label them clearly as "E Systems LinkedIn Credentials"

---

## App 2: Linkage VA Hub LinkedIn App Setup

### Step 1: Create Linkage LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click "Create app" (this is a NEW app, different from E Systems)
3. Fill in the required information:
   - **App name**: Linkage VA Hub
   - **LinkedIn Page**: Select your Linkage VA business page
   - **App logo**: Upload Linkage logo
   - **Legal agreement**: Check the box

### Step 2: Configure Linkage OAuth Settings

1. Go to the **Auth** tab in your Linkage LinkedIn app
2. Add ONLY these **Authorized Redirect URLs** (2 URLs total):

```
https://linkage-va-hub.onrender.com/auth/linkedin/callback
https://linkage-va-hub.onrender.com/api/auth/linkedin/callback
```

**DO NOT add E Systems URLs to this app!**

3. Under **OAuth 2.0 Scopes**, ensure these are selected:
   - `openid` - For OpenID Connect authentication
   - `profile` - For basic profile information
   - `email` - For email address

### Step 3: Enable Products for Linkage App

1. Go to the **Products** tab
2. Request access to: **Sign In with LinkedIn using OpenID Connect**
3. Wait for approval (usually instant for this product)

### Step 4: Get Linkage Credentials

1. Go to the **Auth** tab
2. Copy your Linkage credentials:
   - **Linkage Client ID**: (e.g., `92klm3r8vwg74p`)
   - **Linkage Client Secret**: (e.g., `WPL_AP0.yyyyyyyyy`)
3. **SAVE THESE SEPARATELY** - Label them clearly as "Linkage VA LinkedIn Credentials"

---

## CRITICAL: Keep Credentials Separate!

You now have TWO sets of credentials:

### E Systems LinkedIn App:
- Client ID: `[E Systems specific ID]`
- Client Secret: `[E Systems specific secret]`
- Used ONLY for: https://esystems-management-hub.onrender.com

### Linkage VA LinkedIn App:
- Client ID: `[Linkage specific ID - DIFFERENT from E Systems]`
- Client Secret: `[Linkage specific secret - DIFFERENT from E Systems]`
- Used ONLY for: https://linkage-va-hub.onrender.com

**NEVER mix these credentials between deployments!**

## Render Environment Variables Setup

### E Systems Management Hub Backend
```bash
# LinkedIn OAuth - E SYSTEMS SPECIFIC CREDENTIALS
# Use credentials from your E Systems LinkedIn App ONLY
LINKEDIN_CLIENT_ID=your_esystems_linkedin_client_id_here
LINKEDIN_CLIENT_SECRET=your_esystems_linkedin_client_secret_here
LINKEDIN_REDIRECT_URI=https://esystems-management-hub.onrender.com/auth/linkedin/callback

# Deployment Mode
ESYSTEMS_MODE=true

# Other required variables
MONGODB_URI=your_mongodb_connection
JWT_SECRET=your_32_char_secret
```

### E Systems Management Hub Frontend
```bash
# LinkedIn OAuth - E SYSTEMS SPECIFIC CLIENT ID
# Use the Client ID from your E Systems LinkedIn App ONLY
REACT_APP_LINKEDIN_CLIENT_ID=your_esystems_linkedin_client_id_here

# Brand Configuration
REACT_APP_BRAND=esystems

# API Configuration
REACT_APP_API_URL=https://esystems-management-hub.onrender.com/api
```

### Linkage VA Hub Backend
```bash
# LinkedIn OAuth - LINKAGE SPECIFIC CREDENTIALS
# Use credentials from your Linkage VA LinkedIn App ONLY
# These MUST be DIFFERENT from E Systems credentials
LINKEDIN_CLIENT_ID=your_linkage_linkedin_client_id_here
LINKEDIN_CLIENT_SECRET=your_linkage_linkedin_client_secret_here
LINKEDIN_REDIRECT_URI=https://linkage-va-hub.onrender.com/auth/linkedin/callback

# Deployment Mode (false or unset for Linkage)
ESYSTEMS_MODE=false

# Other required variables
MONGODB_URI=your_mongodb_connection
JWT_SECRET=your_32_char_secret
```

### Linkage VA Hub Frontend
```bash
# LinkedIn OAuth - LINKAGE SPECIFIC CLIENT ID
# Use the Client ID from your Linkage VA LinkedIn App ONLY
# This MUST be DIFFERENT from E Systems Client ID
REACT_APP_LINKEDIN_CLIENT_ID=your_linkage_linkedin_client_id_here

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

#### E Systems LinkedIn App:
- [ ] E Systems LinkedIn app created (separate from Linkage)
- [ ] Only 2 E Systems redirect URLs added (NOT Linkage URLs)
- [ ] OAuth scopes configured (openid, profile, email)
- [ ] "Sign In with LinkedIn using OpenID Connect" product enabled
- [ ] E Systems credentials saved and labeled clearly

#### Linkage VA LinkedIn App:
- [ ] Linkage LinkedIn app created (separate from E Systems)
- [ ] Only 2 Linkage redirect URLs added (NOT E Systems URLs)
- [ ] OAuth scopes configured (openid, profile, email)
- [ ] "Sign In with LinkedIn using OpenID Connect" product enabled
- [ ] Linkage credentials saved and labeled clearly

#### E Systems Deployment:
- [ ] E Systems LinkedIn credentials set in Render backend
- [ ] E Systems LinkedIn Client ID set in Render frontend
- [ ] ESYSTEMS_MODE=true set in backend
- [ ] REACT_APP_BRAND=esystems set in frontend
- [ ] Tested registration flow with E Systems LinkedIn app

#### Linkage VA Deployment:
- [ ] Linkage LinkedIn credentials set in Render backend (DIFFERENT from E Systems)
- [ ] Linkage LinkedIn Client ID set in Render frontend (DIFFERENT from E Systems)
- [ ] ESYSTEMS_MODE=false set in backend
- [ ] REACT_APP_BRAND=linkage set in frontend
- [ ] Tested registration flow with Linkage LinkedIn app

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