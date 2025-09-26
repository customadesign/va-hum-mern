const express = require('express');
const router = express.Router();
const axios = require('axios');
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

// @desc    Comprehensive LinkedIn OAuth diagnostics
// @route   GET /api/auth/linkedin/diagnostics
// @access  Public (for debugging - should be protected in production)
router.get('/diagnostics', async (req, res) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    
    // Configuration status
    configuration: {
      hasClientId: !!getLinkedInCredentials().clientId,
      hasClientSecret: !!getLinkedInCredentials().clientSecret,
      clientIdPreview: getLinkedInCredentials().clientId ? 
        `${getLinkedInCredentials().clientId.substring(0, 10)}...` : 'not set',
      redirectUriEnvVar: process.env.LINKEDIN_REDIRECT_URI || 'not set (using defaults)',
    },
    
    // Redirect URI analysis
    redirectUri: {
      current: null,
      isValid: false,
      issues: [],
      recommendations: []
    },
    
    // Expected URLs for different environments
    expectedUrls: {
      production: {
        linkage: 'https://linkage-va-hub.onrender.com/auth/linkedin/callback',
        esystems: 'https://esystems-management-hub.onrender.com/auth/linkedin/callback'
      },
      development: 'http://localhost:3000/auth/linkedin/callback'
    },
    
    // Common misconfigurations
    commonIssues: [],
    
    // LinkedIn app configuration instructions
    instructions: {
      linkedinAppUrl: 'https://www.linkedin.com/developers/apps',
      steps: [
        '1. Go to LinkedIn Developers and select your app',
        '2. Navigate to the Auth tab',
        '3. Under OAuth 2.0 settings, ensure Authorized redirect URLs contains ONLY:',
        '   - For Linkage: https://linkage-va-hub.onrender.com/auth/linkedin/callback',
        '   - For E-Systems: https://esystems-management-hub.onrender.com/auth/linkedin/callback',
        '   - For Development: http://localhost:3000/auth/linkedin/callback',
        '4. Remove any URLs containing /api/ or -api.onrender.com',
        '5. Save changes and wait 5 minutes for LinkedIn to update'
      ]
    }
  };
  
  // Determine current redirect URI
  let redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  if (!redirectUri) {
    if (process.env.NODE_ENV === 'production') {
      redirectUri = process.env.ESYSTEMS_MODE === 'true' 
        ? diagnostics.expectedUrls.production.esystems
        : diagnostics.expectedUrls.production.linkage;
    } else {
      redirectUri = diagnostics.expectedUrls.development;
    }
  }
  
  diagnostics.redirectUri.current = redirectUri;
  
  // Validate redirect URI
  const issues = [];
  const recommendations = [];
  
  // Check for API URL (most common mistake)
  if (redirectUri.includes('/api/')) {
    issues.push('Contains /api/ path - this should be a frontend URL');
    recommendations.push('Remove /api/ from the redirect URL');
  }
  
  if (redirectUri.includes('-api.onrender.com')) {
    issues.push('Points to API domain instead of frontend domain');
    recommendations.push('Use the frontend domain (without -api)');
  }
  
  // Check for localhost in production
  if (process.env.NODE_ENV === 'production' && redirectUri.includes('localhost')) {
    issues.push('Using localhost URL in production environment');
    recommendations.push('Use the production URL for your deployment');
  }
  
  // Check for HTTPS in production
  if (process.env.NODE_ENV === 'production' && !redirectUri.startsWith('https://')) {
    issues.push('Not using HTTPS in production');
    recommendations.push('LinkedIn requires HTTPS for production redirect URLs');
  }
  
  diagnostics.redirectUri.isValid = issues.length === 0;
  diagnostics.redirectUri.issues = issues;
  diagnostics.redirectUri.recommendations = recommendations;
  
  // Add common issues summary
  if (issues.length > 0) {
    diagnostics.commonIssues.push({
      severity: 'critical',
      message: 'Redirect URI configuration issues detected',
      impact: 'LinkedIn authentication will fail with redirect_uri_mismatch error',
      resolution: 'Fix the issues listed above and update LinkedIn app settings'
    });
  }
  
  if (!getLinkedInCredentials().clientId || !getLinkedInCredentials().clientSecret) {
    diagnostics.commonIssues.push({
      severity: 'critical',
      message: 'LinkedIn credentials not configured',
      impact: 'LinkedIn authentication is completely disabled',
      resolution: 'Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET to .env file'
    });
  }
  
  // Test LinkedIn API connectivity (optional)
  if (getLinkedInCredentials().clientId) {
    try {
      // This is a simple connectivity test - won't work without valid token
      const testUrl = 'https://www.linkedin.com/oauth/v2/authorization';
      const testResponse = await axios.head(testUrl, { timeout: 5000 });
      diagnostics.linkedinApiStatus = {
        reachable: true,
        statusCode: testResponse.status
      };
    } catch (error) {
      diagnostics.linkedinApiStatus = {
        reachable: false,
        error: error.message
      };
    }
  }
  
  // Add summary
  diagnostics.summary = {
    isConfigured: !!getLinkedInCredentials().clientId && !!getLinkedInCredentials().clientSecret,
    isValidConfiguration: diagnostics.redirectUri.isValid && diagnostics.commonIssues.length === 0,
    readyForProduction: diagnostics.redirectUri.isValid && 
                        diagnostics.commonIssues.length === 0 && 
                        process.env.NODE_ENV === 'production',
    requiresAction: diagnostics.commonIssues.length > 0 || !diagnostics.redirectUri.isValid
  };
  
  // Set appropriate HTTP status code
  const statusCode = diagnostics.summary.isValidConfiguration ? 200 : 503;
  
  res.status(statusCode).json(diagnostics);
});

// @desc    Test LinkedIn OAuth flow without actual authentication
// @route   GET /api/auth/linkedin/test-flow
// @access  Public
router.get('/test-flow', (req, res) => {
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 
    (process.env.NODE_ENV === 'production' 
      ? (process.env.ESYSTEMS_MODE === 'true' 
        ? 'https://esystems-management-hub.onrender.com/auth/linkedin/callback'
        : 'https://linkage-va-hub.onrender.com/auth/linkedin/callback')
      : 'http://localhost:3000/auth/linkedin/callback');
  
  const testFlow = {
    step1_frontend: {
      description: 'Frontend generates OAuth URL',
      url: 'https://www.linkedin.com/oauth/v2/authorization',
      parameters: {
        response_type: 'code',
        client_id: getLinkedInCredentials().clientId ? 'configured' : 'missing',
        redirect_uri: redirectUri,
        state: 'random_state_string',
        scope: 'openid profile email'
      }
    },
    step2_linkedin: {
      description: 'LinkedIn redirects to frontend callback',
      redirectsTo: redirectUri,
      withParameters: {
        code: 'authorization_code_from_linkedin',
        state: 'random_state_string'
      }
    },
    step3_frontend: {
      description: 'Frontend sends code to backend',
      endpoint: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/linkedin/callback`,
      method: 'POST',
      body: {
        code: 'authorization_code_from_linkedin'
      }
    },
    step4_backend: {
      description: 'Backend exchanges code for token',
      linkedinEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
      parameters: {
        grant_type: 'authorization_code',
        code: 'authorization_code_from_linkedin',
        client_id: getLinkedInCredentials().clientId ? 'configured' : 'missing',
        client_secret: getLinkedInCredentials().clientSecret ? 'configured' : 'missing',
        redirect_uri: redirectUri // MUST match exactly what was used in step 1
      },
      criticalNote: 'The redirect_uri here MUST match EXACTLY what was used in step 1'
    },
    step5_backend: {
      description: 'Backend fetches user profile and returns JWT',
      linkedinEndpoint: 'https://api.linkedin.com/v2/userinfo',
      returnsTo: 'Frontend with JWT token and user data'
    }
  };
  
  res.json({
    description: 'LinkedIn OAuth flow test - shows expected flow without actual authentication',
    currentRedirectUri: redirectUri,
    isConfigured: !!getLinkedInCredentials().clientId && !!getLinkedInCredentials().clientSecret,
    flow: testFlow,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;