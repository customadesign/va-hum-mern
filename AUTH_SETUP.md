# Authentication Setup Guide

## Overview
The application now uses JWT-based authentication with SendGrid for email verification, replacing the previous Clerk authentication system.

## Features
- JWT token-based authentication
- Email verification using SendGrid
- Password reset functionality
- Refresh token support
- Session management

## Required Environment Variables

### Backend (.env)
```env
# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_key_here
JWT_EXPIRE=30d
JWT_REFRESH_SECRET=your_secure_refresh_secret_key_here
JWT_REFRESH_EXPIRE=7d

# SendGrid Configuration (Required for email verification)
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Linkage VA Hub

# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string

# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
```

### Frontend (.env)
```env
# API URL
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000

# App Settings
REACT_APP_NAME=Linkage VA Hub
REACT_APP_DESCRIPTION=Connect with talented Filipino virtual assistants
```

## SendGrid Setup

1. **Create a SendGrid Account**
   - Go to [SendGrid](https://sendgrid.com/)
   - Sign up for a free account (100 emails/day free tier)

2. **Get API Key**
   - Navigate to Settings → API Keys
   - Click "Create API Key"
   - Choose "Full Access" or "Restricted Access" with Mail Send permissions
   - Copy the API key to your `.env` file

3. **Verify Sender Domain**
   - Go to Settings → Sender Authentication
   - Add and verify your domain
   - Set up SPF, DKIM, and DMARC records in your DNS

4. **Configure From Email**
   - Use an email address from your verified domain
   - Update `SENDGRID_FROM_EMAIL` in your `.env`

## Authentication Flow

### Registration
1. User signs up with email and password
2. System sends verification email via SendGrid
3. User clicks verification link
4. Email is verified and user is auto-logged in
5. User is redirected to profile setup

### Login
1. User enters email and password
2. System validates credentials
3. JWT access token and refresh token are generated
4. Tokens are stored in localStorage
5. User is redirected to dashboard

### Password Reset
1. User requests password reset
2. System sends reset email via SendGrid
3. User clicks reset link (valid for 1 hour)
4. User enters new password
5. Password is updated and user can log in

### Email Verification
- Verification links are valid for 24 hours
- Users can resend verification email from their profile
- Unverified users have limited access

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password/:token` - Reset password
- `POST /api/auth/refresh` - Refresh access token

## Security Considerations

1. **JWT Secrets**
   - Use strong, random secrets for JWT_SECRET and JWT_REFRESH_SECRET
   - Never commit secrets to version control
   - Rotate secrets periodically

2. **Token Expiration**
   - Access tokens expire in 30 days (configurable)
   - Refresh tokens expire in 7 days (configurable)
   - Adjust based on security requirements

3. **Email Verification**
   - Verification tokens expire in 24 hours
   - Password reset tokens expire in 1 hour
   - Tokens are single-use

4. **Rate Limiting**
   - Authentication endpoints are rate-limited
   - Configure limits in `backend/middleware/rateLimiter.js`

## Testing

### Test Email Sending
```javascript
// In development, if SendGrid is not configured,
// email details will be logged to console
// Verification tokens will be displayed for testing
```

### Test Authentication Flow
1. Register a new account
2. Check console/logs for verification token (in dev mode)
3. Visit `/verify-email/:token` to verify
4. Test login/logout
5. Test password reset flow

## Troubleshooting

### SendGrid Issues
- Verify API key is correct
- Check sender domain verification
- Review SendGrid activity logs
- Ensure from email matches verified domain

### Token Issues
- Clear localStorage if tokens are corrupted
- Check token expiration settings
- Verify JWT secrets match between restarts

### Email Not Sending
- Check SendGrid API key configuration
- Verify network connectivity
- Review error logs for specific issues
- In development, check console for email details

## Migration from Clerk

The following Clerk-specific code has been removed:
- `@clerk/clerk-react` package
- ClerkProvider wrapper
- Clerk authentication hooks
- Clerk-specific routes and components

All authentication now flows through:
- `/contexts/AuthContext.js` - Authentication state management
- `/services/auth.js` - Authentication API calls
- `/middleware/auth.js` - Backend JWT validation