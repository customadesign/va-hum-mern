# LinkedIn OAuth Setup Guide

## Critical Configuration Requirements

### ⚠️ IMPORTANT: Common Mistakes to Avoid

1. **DO NOT** add the API URL (containing `/api/` or `-api.onrender.com`) to LinkedIn's redirect URLs
2. **DO NOT** mix frontend and backend URLs in the LinkedIn app configuration
3. **ONLY** use the frontend callback URL in LinkedIn's OAuth settings

## Correct LinkedIn App Configuration

### For Production (Linkage VA Hub)

In your LinkedIn app settings, add **ONLY** this redirect URL:
```
https://linkage-va-hub.onrender.com/auth/linkedin/callback
```

### For Production (E-Systems)

In your LinkedIn app settings, add **ONLY** this redirect URL:
```
https://esystems-management-hub.onrender.com/auth/linkedin/callback
```

### For Development

In your LinkedIn app settings, add **ONLY** this redirect URL:
```
http://localhost:3000/auth/linkedin/callback
```

## How to Configure LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Select your application
3. Navigate to the **Auth** tab
4. Under **OAuth 2.0 settings**, find **Authorized redirect URLs**
5. Remove any URLs containing:
   - `/api/` (e.g., `/api/auth/linkedin/callback`)
   - `-api.onrender.com` (e.g., `linkage-va-hub-api.onrender.com`)
6. Add **ONLY** the appropriate frontend URL from above
7. Click **Update** to save changes
8. Wait 5 minutes for LinkedIn to propagate the changes

## OAuth Flow Explanation

The correct OAuth flow is:

1. **User clicks "Login with LinkedIn"** on frontend
   - Frontend generates OAuth URL with redirect_uri pointing to FRONTEND

2. **LinkedIn authorizes and redirects** to:
   - `https://linkage-va-hub.onrender.com/auth/linkedin/callback?code=XXX`
   - This is the FRONTEND callback URL

3. **Frontend callback component** receives the code and sends it to backend:
   - POST to `https://linkage-va-hub-api.onrender.com/api/auth/linkedin/callback`
   - Body: `{ code: "authorization_code" }`

4. **Backend exchanges code** with LinkedIn:
   - Uses the SAME redirect_uri that was used in step 1 (frontend URL)
   - This is why it MUST match exactly

5. **Backend returns JWT** to frontend

## Environment Variables

### Backend (.env)

```bash
# LinkedIn OAuth (Optional)
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here

# Optional: Override default redirect URI
# Only set this if you need a custom URL
# LINKEDIN_REDIRECT_URI=https://linkage-va-hub.onrender.com/auth/linkedin/callback
```

### Frontend (.env)

```bash
# LinkedIn OAuth
REACT_APP_LINKEDIN_CLIENT_ID=your_client_id_here

# API URL
REACT_APP_API_URL=https://linkage-va-hub-api.onrender.com/api
```

## Debugging LinkedIn OAuth Issues

### 1. Check Configuration

Visit: `https://your-api-domain.com/api/auth/linkedin/diagnostics`

This will show:
- Current redirect URI configuration
- Any configuration issues
- Step-by-step resolution instructions

### 2. Test OAuth Flow

Visit: `https://your-api-domain.com/api/auth/linkedin/test-flow`

This shows the expected OAuth flow without actual authentication.

### 3. Common Error Messages

#### `invalid_redirect_uri` or `redirect_uri_mismatch`

**Cause**: The redirect URI in your LinkedIn app doesn't match what the code is using.

**Solution**:
1. Check the diagnostics endpoint to see what redirect URI is being used
2. Ensure this EXACT URL is in your LinkedIn app settings
3. Remove any API URLs from LinkedIn app settings

#### `invalid_client`

**Cause**: Invalid client ID or secret.

**Solution**:
1. Verify LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in backend .env
2. Ensure no extra spaces or quotes in the values
3. Check that the LinkedIn app is approved for production use

#### `invalid_grant`

**Cause**: Authorization code is invalid, expired, or already used.

**Solution**:
1. The code is only valid for a short time and can only be used once
2. Try the login flow again from the beginning
3. Clear browser cookies for linkedin.com

## Monitoring and Logs

The backend includes comprehensive logging for LinkedIn OAuth:

1. **Startup logs** - Shows configured redirect URI
2. **Request logs** - Logs each OAuth callback attempt
3. **Error logs** - Detailed error information with resolution steps

Check backend logs for lines starting with:
- `LinkedIn OAuth configured with redirect URI:`
- `LinkedIn OAuth Callback Started`
- `LinkedIn OAuth Error`

## Security Considerations

1. **Never expose** LINKEDIN_CLIENT_SECRET in frontend code
2. **Always validate** the state parameter in production
3. **Use HTTPS** for all production redirect URIs
4. **Limit redirect URIs** to only what's necessary
5. **Monitor failed attempts** for potential security issues

## Support

If you continue to have issues after following this guide:

1. Run the diagnostics endpoint and share the output
2. Check backend logs for detailed error messages
3. Verify the LinkedIn app is properly configured and approved
4. Ensure no firewall or proxy is blocking LinkedIn API calls