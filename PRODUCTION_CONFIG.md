# 🚀 Production Configuration Guide

## Overview
This guide provides complete environment configuration for the **Linkage VA Hub MERN Stack** with hybrid authentication system in production.

## 🔐 Required Environment Variables

### Backend (.env)

```bash
# =====================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# =====================================

# Application Configuration
NODE_ENV=production
PORT=8000
CLIENT_URL=https://yourdomain.com
ESYSTEMS_CLIENT_URL=https://esystems.yourdomain.com

# Database Configuration  
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/production-db?retryWrites=true&w=majority

# =====================================
# HYBRID AUTHENTICATION SYSTEM
# =====================================

# Clerk Configuration (Primary Authentication)
CLERK_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY
CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY  
CLERK_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET
CLERK_FRONTEND_API=https://yourdomain.clerk.accounts.dev
CLERK_API_URL=https://api.clerk.com
CLERK_JWKS_URL=https://yourdomain.clerk.accounts.dev/.well-known/jwks.json

# JWT Configuration (Legacy Fallback)
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters
JWT_EXPIRE=30d

# =====================================
# OAUTH & SOCIAL AUTHENTICATION
# =====================================

# LinkedIn OAuth Configuration
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=https://yourdomain.com/api/linkedin/callback

# =====================================
# FILE STORAGE CONFIGURATION
# =====================================

# Supabase Storage (Primary)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AWS S3 Configuration (Fallback)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=linkage-va-hub-production-storage

# =====================================
# COMMUNICATION SERVICES
# =====================================

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_app_specific_password

# Video SDK Configuration
VIDEOSDK_API_KEY=your_videosdk_api_key
VIDEOSDK_SECRET_KEY=your_videosdk_secret_key

# =====================================
# SECURITY CONFIGURATION
# =====================================

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com,https://esystems.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# =====================================
# MONITORING & ANALYTICS
# =====================================

# Sentry Error Tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# New Relic APM
NEW_RELIC_LICENSE_KEY=your_new_relic_license_key
NEW_RELIC_APP_NAME=Linkage VA Hub Production

# =====================================
# TASK MANAGEMENT (OPTIONAL)
# =====================================

# TaskMaster AI Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
OPENAI_API_KEY=your_openai_api_key
```

### Frontend (.env)

```bash
# =====================================
# FRONTEND PRODUCTION CONFIGURATION
# =====================================

# Environment
NODE_ENV=production
REACT_APP_ENV=production

# API Configuration
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_ESYSTEMS_API_URL=https://esystems-api.yourdomain.com/api

# Clerk Configuration
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY
VITE_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY

# VideoSDK Configuration
REACT_APP_VIDEOSDK_API_KEY=your_videosdk_api_key

# LinkedIn Integration
REACT_APP_LINKEDIN_CLIENT_ID=your_linkedin_client_id

# Analytics (Optional)
REACT_APP_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
REACT_APP_SENTRY_DSN=https://your-frontend-sentry-dsn@sentry.io/project-id
```

## 🏥 Health Check Endpoints

### Available Health Checks

1. **General Health**: `GET /api/health`
   - Database connectivity
   - Environment configuration
   - Authentication system status
   - Feature availability

2. **Authentication Health**: `GET /api/health/auth`
   - Clerk configuration status
   - JWT configuration status
   - OAuth provider status

### Example Health Response

```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T20:30:00.000Z",
  "version": "1.0.0",
  "database": {
    "status": "connected",
    "connected": true
  },
  "environment": {
    "nodeEnv": "production",
    "mongoUri": true,
    "jwtSecret": true,
    "clerkSecret": true,
    "clerkPublishable": true,
    "corsOrigin": true
  },
  "authentication": {
    "hybridAuth": true,
    "clerkConfigured": true,
    "jwtConfigured": true,
    "linkedinConfigured": true
  },
  "features": {
    "hybridAuthentication": true,
    "dualBrandSupport": true,
    "linkedinOAuth": true,
    "videoSDK": true,
    "supabaseStorage": true,
    "awsS3Fallback": true
  }
}
```

## 🛡️ Security Configuration

### Implemented Security Features

1. **Helmet**: Security headers protection
2. **CORS**: Cross-origin request security
3. **Rate Limiting**: API abuse prevention
4. **Hybrid Authentication**: Secure session management
5. **Input Validation**: Request sanitization
6. **Error Handling**: Secure error responses

### Security Checklist

- [ ] Use HTTPS in production
- [ ] Set strong JWT secrets (minimum 32 characters)
- [ ] Configure proper CORS origins
- [ ] Enable rate limiting
- [ ] Set up error monitoring (Sentry)
- [ ] Use environment-specific database URIs
- [ ] Secure API keys and secrets
- [ ] Enable security headers via Helmet

## 🚀 Deployment Configuration

### Environment-Specific Settings

#### Development
- `NODE_ENV=development`
- Local database connections
- Relaxed CORS settings
- Verbose logging

#### Staging
- `NODE_ENV=staging`
- Staging database
- Production-like security
- Debug logging enabled

#### Production
- `NODE_ENV=production`
- Production database
- Strict security settings
- Error logging only

## 📊 Monitoring Setup

### Required Monitoring

1. **Health Checks**: `/api/health` endpoint monitoring
2. **Authentication**: `/api/health/auth` monitoring
3. **Database**: MongoDB connection monitoring
4. **API Performance**: Response time tracking
5. **Error Tracking**: Sentry error monitoring

### Recommended Alerts

- API response time > 2 seconds
- Database connection failures
- Authentication system errors
- High error rates (>5%)
- Memory usage > 80%

## 🔧 Configuration Validation

To validate your configuration, start the servers and check:

1. **Backend Health**: `curl https://api.yourdomain.com/api/health`
2. **Auth Health**: `curl https://api.yourdomain.com/api/health/auth`
3. **Frontend**: Visit `https://yourdomain.com`
4. **Authentication**: Test both Clerk and JWT login flows

## 🚨 Troubleshooting

### Common Issues

1. **"unhealthy" status**: Check environment variables
2. **Database connection failed**: Verify MONGODB_URI
3. **Authentication errors**: Check Clerk/JWT configuration
4. **CORS errors**: Verify CLIENT_URL and CORS_ORIGIN
5. **Rate limiting**: Check RATE_LIMIT settings

### Debug Commands

```bash
# Check environment configuration
curl https://api.yourdomain.com/api/health

# Test authentication
curl https://api.yourdomain.com/api/health/auth

# View server logs
pm2 logs linkage-va-hub

# Monitor performance
curl https://api.yourdomain.com/api/monitoring
```

## 🎯 Next Steps

After configuration:

1. **Test Authentication Flows**: Both Clerk and JWT
2. **Verify File Uploads**: Supabase and AWS S3 fallback
3. **Test OAuth**: LinkedIn integration
4. **Monitor Performance**: Response times and error rates
5. **Set Up Alerts**: Health check monitoring

Your hybrid authentication system is now production-ready! 🎉
















