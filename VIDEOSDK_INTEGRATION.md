# VideoSDK Integration Setup Guide

This guide explains how to set up VideoSDK integration for live training sessions.

## Prerequisites

1. **VideoSDK Account** - Sign up at [VideoSDK Dashboard](https://app.videosdk.live/)
2. **API Credentials** - Get your API Key and Secret Key from your dashboard

## Step 1: Get VideoSDK Credentials

1. Go to [VideoSDK Dashboard](https://app.videosdk.live/)
2. Sign in with your VideoSDK account
3. Navigate to "API Keys" section
4. Copy your credentials:
   - **API Key** - Your unique API identifier
   - **Secret Key** - Your secret key for JWT generation

## Step 2: Configure Environment Variables

Your VideoSDK credentials have been added to your backend `.env` file:

```env
# VideoSDK Configuration
VIDEOSDK_API_KEY=56566ba5-1557-4699-8fd2-ba7edfe6ad0d
VIDEOSDK_SECRET_KEY=ddfbfc0007d1b5bb4765adf200733ace3dd05318b99c1d5f1622945ddf3b5e10
```

## Step 3: No Additional Setup Required

Unlike Zoom, VideoSDK doesn't require:
- ❌ Complex app creation workflows
- ❌ Domain whitelisting
- ❌ Scope configuration
- ❌ OAuth flows

✅ **It just works!** Your credentials are ready to use.

## How It Works

### Backend API Endpoints

The backend provides these VideoSDK-related endpoints:

- `POST /api/videosdk/meeting` - Create a new meeting room
- `GET /api/videosdk/meeting/:roomId` - Get meeting details
- `GET /api/videosdk/meetings` - List meetings (database-based)
- `POST /api/videosdk/token` - Generate token for existing meeting
- `GET /api/videosdk/validate` - Validate API credentials

### Frontend Integration

1. **useVideoSDK Hook** - Manages API calls to backend
2. **VideoSDKMeeting Component** - Full React-based video conferencing
3. **Community Page Integration** - "Join Training" button functionality

### User Flow

1. User clicks "Join Training" on the community page
2. Backend creates a new VideoSDK meeting room via API
3. Backend generates JWT token for authentication
4. Frontend receives meeting room ID and token
5. VideoSDKMeeting component initializes with full video UI
6. User participates in the live video session with controls

## Development Testing

For local development:

1. ✅ **Already configured!** Your VideoSDK credentials are set up
2. Test the "Join Training" functionality on localhost:3000
3. Both frontend and backend servers are running

## Production Deployment

1. Update environment variables on your hosting platform (Render):
   ```env
   VIDEOSDK_API_KEY=56566ba5-1557-4699-8fd2-ba7edfe6ad0d
   VIDEOSDK_SECRET_KEY=ddfbfc0007d1b5bb4765adf200733ace3dd05318b99c1d5f1622945ddf3b5e10
   ```
2. ✅ **No domain whitelisting required**
3. Test the integration after deployment

## Security Notes

- **Never expose API credentials** in frontend code
- JWT tokens are generated server-side for security
- All VideoSDK API calls go through your backend
- Tokens expire after 24 hours for security

## Testing Your Integration

🎯 **Ready to test!** 

1. Open http://localhost:3000/community
2. Click "Join Training" button
3. The system will:
   - Create a VideoSDK meeting room
   - Generate authentication token
   - Open video conference interface
   - Allow multiple participants to join

## Troubleshooting

### Common Issues:

1. **"Invalid API Key"** - Check VIDEOSDK_API_KEY environment variable
2. **"Token Generation Failed"** - Verify VIDEOSDK_SECRET_KEY is correct
3. **"Meeting Creation Failed"** - Check backend server logs
4. **Video not showing** - Allow camera/microphone permissions in browser

### Debug Mode:

Enable detailed logging in development:

```javascript
// In VideoSDKMeeting component
console.log('VideoSDK Config:', meetingConfig);
```

## Features Included

✅ **Full Video Conferencing:**
- Multi-participant video calls
- Audio/video controls (mute, camera toggle)
- Responsive grid layout
- Participant management
- Screen sharing ready
- Chat ready (can be added)

✅ **Better than Zoom:**
- No meeting time limits
- No participant limits on free tier
- Built-in React components
- Customizable UI
- Real-time collaboration features

## Support

- [VideoSDK React Documentation](https://docs.videosdk.live/react/guide/video-and-audio-calling-api-sdk/quick-start)
- [VideoSDK API Reference](https://docs.videosdk.live/api-reference/realtime-communication/intro)
- [VideoSDK Discord Community](https://discord.gg/Gpmj6eCq5u)