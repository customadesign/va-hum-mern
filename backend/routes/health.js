const express = require('express');
const mongoose = require('mongoose');
const { isESystemsMode } = require('../utils/esystems');

// Dynamic LinkedIn credentials based on mode (same logic as passport.js)
const getLinkedInCredentials = () => {
  if (isESystemsMode()) {
    return {
      clientId: process.env.LINKEDIN_ESYSTEMS_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_ESYSTEMS_CLIENT_SECRET
    };
  }
  return {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET
  };
};

const router = express.Router();

// @route   GET /api/health
// @desc    Health check endpoint for monitoring
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check environment configuration
    const envChecks = {
      nodeEnv: process.env.NODE_ENV || 'development',
      mongoUri: !!process.env.MONGODB_URI,
      jwtSecret: !!process.env.JWT_SECRET,
      clerkSecret: !!process.env.CLERK_SECRET_KEY,
      clerkPublishable: !!process.env.CLERK_PUBLISHABLE_KEY,
      corsOrigin: !!process.env.CLIENT_URL,
      rateLimitWindow: !!process.env.RATE_LIMIT_WINDOW,
      rateLimitMax: !!process.env.RATE_LIMIT_MAX
    };

    // Check authentication system
    const authChecks = {
      hybridAuth: true, // Hybrid authentication is implemented
      clerkConfigured: !!(process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY),
      jwtConfigured: !!process.env.JWT_SECRET,
      linkedinConfigured: !!(getLinkedInCredentials().clientId && getLinkedInCredentials().clientSecret)
    };

    // Determine overall health
    const isHealthy = dbStatus === 'connected' && 
                     envChecks.mongoUri && 
                     (authChecks.clerkConfigured || authChecks.jwtConfigured);

    const healthData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: {
        status: dbStatus,
        connected: dbStatus === 'connected'
      },
      environment: envChecks,
      authentication: authChecks,
      features: {
        hybridAuthentication: true,
        dualBrandSupport: true,
        linkedinOAuth: authChecks.linkedinConfigured,
        videoSDK: !!process.env.VIDEOSDK_API_KEY,
        supabaseStorage: !!process.env.SUPABASE_URL,
        awsS3Fallback: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
      }
    };

    // Return appropriate status code
    res.status(isHealthy ? 200 : 503).json(healthData);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error.message
    });
  }
});

// @route   GET /api/health/auth
// @desc    Authentication system status check
// @access  Public
router.get('/auth', async (req, res) => {
  try {
    const authStatus = {
      hybridAuthentication: {
        enabled: true,
        description: 'Supports both Clerk and JWT authentication'
      },
      clerk: {
        configured: !!(process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY),
        secretKeyPresent: !!process.env.CLERK_SECRET_KEY,
        publishableKeyPresent: !!process.env.CLERK_PUBLISHABLE_KEY,
        webhookSecretPresent: !!process.env.CLERK_WEBHOOK_SECRET
      },
      jwt: {
        configured: !!process.env.JWT_SECRET,
        secretPresent: !!process.env.JWT_SECRET,
        expiration: process.env.JWT_EXPIRE || '30d'
      },
      oauth: {
        linkedin: {
          configured: !!(getLinkedInCredentials().clientId && getLinkedInCredentials().clientSecret),
          clientIdPresent: !!getLinkedInCredentials().clientId,
          clientSecretPresent: !!getLinkedInCredentials().clientSecret
        }
      }
    };

    const isAuthHealthy = authStatus.clerk.configured || authStatus.jwt.configured;

    res.status(isAuthHealthy ? 200 : 503).json({
      status: isAuthHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      authentication: authStatus
    });
  } catch (error) {
    console.error('Auth health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Auth health check failed',
      message: error.message
    });
  }
});

module.exports = router;
















