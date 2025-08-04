# Zoom Integration Setup Guide

This guide explains how to set up Zoom SDK integration for live training webinars.

## Prerequisites

1. **Zoom Developer Account** - Sign up at [Zoom App Marketplace](https://marketplace.zoom.us/)
2. **Zoom App** - Create a new app in your Zoom account

## Step 1: Create Zoom App

1. Go to [Zoom App Marketplace](https://marketplace.zoom.us/)
2. Sign in with your Zoom account
3. Click "Develop" → "Build App"
4. Choose "Meeting SDK" app type
5. Fill in your app details:
   - App Name: "Linkage VA Hub Training"
   - Short Description: "Live training sessions for virtual assistants"
   - Company Name: Your company name
6. Complete the app creation process

## Step 2: Get API Credentials

After creating your app, you'll need these credentials:

### For API Calls (Creating Webinars)
- **API Key** (from your Zoom app)
- **API Secret** (from your Zoom app)

### For Meeting SDK (Joining Webinars)
- **SDK Key** (from your Zoom app)
- **SDK Secret** (from your Zoom app)

## Step 3: Configure Environment Variables

Add these variables to your backend `.env` file:

```env
# Zoom API Configuration
ZOOM_API_KEY=your-zoom-api-key
ZOOM_API_SECRET=your-zoom-api-secret
ZOOM_SDK_KEY=your-zoom-sdk-key
ZOOM_SDK_SECRET=your-zoom-sdk-secret
```

## Step 4: Enable Required Scopes

In your Zoom app settings, enable these scopes:

### API Scopes:
- `webinar:write:admin` - Create webinars
- `webinar:read:admin` - Read webinar details
- `user:read:admin` - Read user information

### SDK Features:
- **Join meetings** - Allow users to join webinars
- **Host meetings** - Allow creating and hosting webinars

## Step 5: Configure Domains (Production)

For production deployment, add your domain to the app whitelist:

1. Go to your Zoom app settings
2. Navigate to "Feature" → "Embedded browser SDK"
3. Add your production domain(s):
   - `https://linkage-va-hub.onrender.com`
   - Any other domains you'll use

## How It Works

### Backend API Endpoints

The backend provides these Zoom-related endpoints:

- `POST /api/zoom/webinar` - Create a new webinar
- `GET /api/zoom/webinar/:id` - Get webinar details
- `GET /api/zoom/webinars` - List user's webinars
- `POST /api/zoom/signature` - Generate SDK signature
- `PATCH /api/zoom/webinar/:id` - Update webinar
- `DELETE /api/zoom/webinar/:id` - Delete webinar

### Frontend Integration

1. **useZoom Hook** - Manages API calls to backend
2. **ZoomWebinar Component** - Embeds Zoom Meeting SDK
3. **Community Page Integration** - "Join Training" button functionality

### User Flow

1. User clicks "Join Training" on the community page
2. Backend creates a new Zoom webinar via API
3. Backend generates SDK signature for joining
4. Frontend receives webinar details and SDK configuration
5. ZoomWebinar component initializes and joins the session
6. User participates in the live webinar

## Development Testing

For local development:

1. Set up a test Zoom account
2. Use the development credentials in your `.env`
3. Test the "Join Training" functionality on localhost:3000

## Production Deployment

1. Update environment variables on your hosting platform (Render)
2. Ensure your production domain is whitelisted in Zoom app settings
3. Test the integration after deployment

## Security Notes

- **Never expose API credentials** in frontend code
- JWT tokens are generated server-side for security
- All Zoom API calls go through your backend
- SDK signatures expire after 2 hours for security

## Troubleshooting

### Common Issues:

1. **"Invalid SDK Key"** - Check SDK_KEY environment variable
2. **"Signature Expired"** - Signatures expire after 2 hours, regenerate as needed
3. **"Meeting Not Found"** - Ensure webinar was created successfully
4. **CORS Errors** - Verify domain whitelist in Zoom app settings

### Debug Mode:

Enable detailed logging in development:

```javascript
// In ZoomWebinar component
console.log('Zoom Config:', webinarConfig);
```

## Support

- [Zoom Meeting SDK Documentation](https://developers.zoom.us/docs/meeting-sdk/)
- [Zoom API Documentation](https://developers.zoom.us/docs/api/)
- [Zoom Developer Forum](https://devforum.zoom.us/)