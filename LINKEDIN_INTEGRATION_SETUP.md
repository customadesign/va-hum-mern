# LinkedIn Integration Setup Guide (E Systems Only)

This guide explains how to set up LinkedIn OAuth integration for the E Systems management platform to enable automatic profile filling for employers.

## Features

- **LinkedIn Sign-in**: Employers can sign in using their LinkedIn account
- **Auto-fill Profile**: Company profile automatically populated from LinkedIn company page data
- **E Systems Only**: Integration only available on E Systems, not on Linkage VA Hub
- **Seamless UX**: One-click profile setup for employers

## LinkedIn Developer Setup

### 1. Create LinkedIn App

1. Go to [LinkedIn Developer Console](https://developer.linkedin.com/)
2. Click "Create App"
3. Fill in app details:
   - **App name**: E Systems Management Hub
   - **LinkedIn Page**: Your company's LinkedIn page
   - **Privacy policy URL**: `https://esystems-management-hub.onrender.com/privacy`
   - **App logo**: Upload your E Systems logo

### 2. Configure OAuth Settings

1. In your LinkedIn app, go to "Auth" tab
2. Add **Authorized redirect URLs**:
   ```
   https://esystems-management-hub.onrender.com/auth/linkedin/callback
   http://localhost:3001/auth/linkedin/callback  (for development)
   ```

### 3. Request Required Products

Request access to these LinkedIn products:

- ✅ **Sign In with LinkedIn using OpenID Connect**
- ✅ **Share on LinkedIn** (for company profile access)

### 4. Required OAuth Scopes

The integration uses these scopes:
- `openid` - Basic profile access
- `profile` - Name, picture, etc.
- `email` - Email address  
- `w_organization_social` - Company profile access (if user is admin)

## Environment Variables

### Backend (.env for esystems-backend)
```bash
# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_linkedin_client_id_here
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret_here
LINKEDIN_REDIRECT_URI=https://esystems-management-hub.onrender.com/auth/linkedin/callback

# E Systems Configuration
ESYSTEMS_MODE=true
CLIENT_URL=https://esystems-management-hub.onrender.com
ESYSTEMS_CLIENT_URL=https://esystems-management-hub.onrender.com
```

### Frontend (.env for esystems-frontend)
```bash
# LinkedIn OAuth
REACT_APP_LINKEDIN_CLIENT_ID=your_linkedin_client_id_here
REACT_APP_BRAND=esystems

# API Configuration
REACT_APP_API_URL=https://esystems-backend-api.onrender.com/api
```

## How It Works

### 1. User Flow
1. Employer visits E Systems login page
2. Clicks "Sign in with LinkedIn & Auto-fill Profile"
3. Redirected to LinkedIn OAuth
4. Grants permissions to access profile + company data
5. Redirected back to E Systems with auth code
6. Backend exchanges code for access token
7. Fetches user + company profile from LinkedIn API
8. Creates/updates user account and business profile
9. User redirected to profile page with auto-filled data

### 2. Data Mapping

LinkedIn company data is automatically mapped to business profile fields:

| LinkedIn Field | E Systems Field |
|----------------|-----------------|
| `name` | `company` |
| `description` | `bio` |
| `website.url` | `website` |
| `industry` | `industry` |
| `staffCount` | `companySize` |
| `foundedOn.year` | `foundedYear` |
| `headquarters` | `headquartersLocation` |
| `tagline` | `missionStatement` |
| `specialties` | `specialties` |
| `logoV2.original` | `avatar` |

### 3. Profile Completion

The auto-fill typically completes 60-80% of the business profile:
- ✅ Company name, description, industry
- ✅ Company size, founded year, location
- ✅ Company logo and LinkedIn profile
- ✅ Mission statement and specialties
- ❌ Benefits, values, VA requirements (manual)

## Technical Implementation

### Frontend Components
- `LinkedInLoginButton.js` - OAuth login button (E Systems only)
- `LinkedInCallback.js` - OAuth callback handler
- `linkedinAuth.js` - LinkedIn service with data mapping

### Backend Routes
- `POST /api/auth/linkedin/callback` - OAuth callback processing
- `GET /api/linkedin/company/:id` - Company profile fetch
- `GET /api/linkedin/organizations` - User's companies

### Security Features
- ✅ State parameter validation
- ✅ CSRF protection
- ✅ E Systems mode verification
- ✅ Secure token handling
- ✅ Data validation and sanitization

## Development Setup

1. **Clone repository**
2. **Set up LinkedIn app** (follow steps above)
3. **Add environment variables** to `.env` files
4. **Install dependencies**: `npm install`
5. **Start development servers**:
   ```bash
   # E Systems frontend (port 3001)
   cd esystems-frontend && REACT_APP_BRAND=esystems npm start
   
   # E Systems backend (port 8000)
   cd esystems-backend && ESYSTEMS_MODE=true npm start
   ```
6. **Test LinkedIn flow**: Visit `http://localhost:3001/login`

## Production Deployment

### Render Configuration

#### E Systems Frontend
```yaml
# render-esystems.yaml
envVars:
  - key: REACT_APP_LINKEDIN_CLIENT_ID
    value: your_production_linkedin_client_id
  - key: REACT_APP_BRAND
    value: esystems
  - key: REACT_APP_API_URL
    value: https://esystems-backend-api.onrender.com/api
```

#### E Systems Backend
```yaml
# render-esystems.yaml
envVars:
  - key: LINKEDIN_CLIENT_ID
    sync: false # Set in Render dashboard
  - key: LINKEDIN_CLIENT_SECRET
    sync: false # Set in Render dashboard
  - key: ESYSTEMS_MODE
    value: true
  - key: CLIENT_URL
    value: https://esystems-management-hub.onrender.com
```

## Troubleshooting

### Common Issues

1. **"LinkedIn integration not available"**
   - Check `ESYSTEMS_MODE=true` in backend
   - Check `REACT_APP_BRAND=esystems` in frontend

2. **OAuth redirect errors**
   - Verify redirect URI in LinkedIn app matches exactly
   - Check HTTPS vs HTTP in production

3. **Company data not fetching**
   - User must be admin of LinkedIn company page
   - Check LinkedIn app has "Share on LinkedIn" product approved

4. **Auto-fill not working**
   - Check browser console for errors
   - Verify session storage contains LinkedIn data
   - Check data mapping in `linkedinAuth.js`

### Debug Mode

Enable debug logging:
```bash
# Backend
DEBUG=linkedin:* npm start

# Frontend
REACT_APP_DEBUG=true npm start
```

## Security Considerations

- LinkedIn tokens are never stored persistently
- Company data only accessible to admin users
- CSRF protection via state parameter
- E Systems mode verification on all endpoints
- Input sanitization and validation
- Rate limiting on OAuth endpoints

## Support

For issues with LinkedIn integration:
1. Check this documentation
2. Review LinkedIn Developer Console for app status
3. Check browser dev tools for errors
4. Verify environment variables are set correctly