const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Business = require('../models/Business');
const { isESystemsMode } = require('../utils/esystems');

const router = express.Router();

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

// LinkedIn OAuth configuration
// IMPORTANT: The redirect URI must match EXACTLY what's configured in LinkedIn app
// This should be the FRONTEND URL where LinkedIn redirects users after authorization
const getRedirectUri = () => {
  // Allow override via environment variable for flexibility
  if (process.env.LINKEDIN_REDIRECT_URI) {
    console.log('Using LINKEDIN_REDIRECT_URI from environment:', process.env.LINKEDIN_REDIRECT_URI);
    return process.env.LINKEDIN_REDIRECT_URI;
  }
  
  // Production URLs - MUST match LinkedIn app configuration exactly
  if (process.env.NODE_ENV === 'production') {
    if (process.env.ESYSTEMS_MODE === 'true') {
      return 'https://esystems-management-hub.onrender.com/auth/linkedin/callback';
    }
    return 'https://linkage-va-hub.onrender.com/auth/linkedin/callback';
  }
  
  // Development URL
  return 'http://localhost:3000/auth/linkedin/callback';
};

// Validate redirect URI configuration on startup
const validateRedirectUri = () => {
  const redirectUri = getRedirectUri();
  const warnings = [];
  
  // Check for common misconfigurations
  if (redirectUri.includes('/api/')) {
    warnings.push('WARNING: Redirect URI contains /api/ - this should be the FRONTEND URL, not the API URL');
  }
  
  if (redirectUri.includes('-api.onrender.com')) {
    warnings.push('WARNING: Redirect URI points to API domain - this should be the FRONTEND domain');
  }
  
  if (warnings.length > 0) {
    console.error('\n=== LinkedIn OAuth Configuration Issues ===');
    warnings.forEach(w => console.error(w));
    console.error('Current redirect URI:', redirectUri);
    console.error('This MUST match exactly what is configured in your LinkedIn app');
    console.error('==========================================\n');
  }
  
  return redirectUri;
};

const LINKEDIN_CONFIG = {
  ...getLinkedInCredentials(),
  redirectUri: validateRedirectUri() // Validate on startup
};

// Log configuration on startup for debugging
if (LINKEDIN_CONFIG.clientId && LINKEDIN_CONFIG.clientSecret) {
  console.log('LinkedIn OAuth configured with redirect URI:', LINKEDIN_CONFIG.redirectUri);
  console.log('Ensure this EXACT URL is added to your LinkedIn app\'s OAuth 2.0 settings');
}

// @desc    Health check for LinkedIn OAuth configuration
// @route   GET /api/auth/linkedin/config-check
// @access  Public
router.get('/config-check', (req, res) => {
  const redirectUri = LINKEDIN_CONFIG.redirectUri;
  
  // Detect potential misconfigurations
  const issues = [];
  if (redirectUri.includes('/api/')) {
    issues.push('Redirect URI contains /api/ - should be frontend URL');
  }
  if (redirectUri.includes('-api.onrender.com')) {
    issues.push('Redirect URI points to API domain - should be frontend domain');
  }
  
  const config = {
    configured: !!(getLinkedInCredentials().clientId && getLinkedInCredentials().clientSecret),
    clientIdPresent: !!getLinkedInCredentials().clientId,
    clientSecretPresent: !!getLinkedInCredentials().clientSecret,
    redirectUri: redirectUri,
    redirectUriEnv: process.env.LINKEDIN_REDIRECT_URI || 'not set (using defaults)',
    esystemsMode: process.env.ESYSTEMS_MODE || 'false',
    environment: process.env.NODE_ENV || 'development',
    expectedFrontendCallback: redirectUri,
    apiEndpoint: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/linkedin/callback`,
    configurationIssues: issues,
    isConfigurationValid: issues.length === 0,
    instructions: issues.length > 0 ? 
      'Remove the API URL from LinkedIn app and keep only the frontend URL' : 
      'Configuration appears correct',
    timestamp: new Date().toISOString()
  };
  
  console.log('LinkedIn config check requested:', config);
  res.json(config);
});

// @desc    Handle preflight OPTIONS request for LinkedIn OAuth callback
// @route   OPTIONS /api/auth/linkedin/callback
// @access  Public
router.options('/callback', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// @desc    Handle LinkedIn OAuth callback
// @route   POST /api/auth/linkedin/callback
// @access  Public
router.post('/callback', async (req, res) => {
  console.log('=== LinkedIn OAuth Callback Started ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request Headers:', {
    origin: req.headers.origin,
    referer: req.headers.referer,
    contentType: req.headers['content-type']
  });
  console.log('Request body:', { 
    code: req.body.code ? `present (${req.body.code.substring(0, 10)}...)` : 'missing',
    fullBody: req.body 
  });
  console.log('LinkedIn config:', {
    clientId: LINKEDIN_CONFIG.clientId ? `configured (${LINKEDIN_CONFIG.clientId.substring(0, 10)}...)` : 'missing',
    clientSecret: LINKEDIN_CONFIG.clientSecret ? 'configured' : 'missing',
    redirectUri: LINKEDIN_CONFIG.redirectUri,
    esystemsMode: process.env.ESYSTEMS_MODE
  });
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    ESYSTEMS_MODE: process.env.ESYSTEMS_MODE,
    LINKEDIN_REDIRECT_URI: process.env.LINKEDIN_REDIRECT_URI
  });

  try {
    // Check if LinkedIn credentials are configured
    if (!LINKEDIN_CONFIG.clientId || !LINKEDIN_CONFIG.clientSecret) {
      console.error('LinkedIn credentials not configured');
      return res.status(403).json({ 
        error: 'LinkedIn integration not configured',
        details: 'Missing client credentials' 
      });
    }

    const { code } = req.body;

    if (!code) {
      console.error('No authorization code provided');
      return res.status(400).json({ 
        error: 'Authorization code is required',
        details: 'No code in request body' 
      });
    }

    // Exchange code for access token (send as x-www-form-urlencoded body)
    const tokenParams = {
      grant_type: 'authorization_code',
      code,
      client_id: LINKEDIN_CONFIG.clientId,
      client_secret: LINKEDIN_CONFIG.clientSecret,
      redirect_uri: LINKEDIN_CONFIG.redirectUri,
    };
    
    console.log('Token exchange parameters:', {
      grant_type: tokenParams.grant_type,
      code: `${tokenParams.code.substring(0, 10)}...`,
      client_id: `${tokenParams.client_id.substring(0, 10)}...`,
      client_secret: 'hidden',
      redirect_uri: tokenParams.redirect_uri
    });
    
    const formBody = new URLSearchParams(tokenParams).toString();

    console.log('Exchanging code for token...');
    console.log('LinkedIn token endpoint: https://www.linkedin.com/oauth/v2/accessToken');
    console.log('Redirect URI being used:', LINKEDIN_CONFIG.redirectUri);
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      formBody,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        // Never throw on non-2xx so we can return a clean JSON error instead of a 502
        validateStatus: () => true,
        timeout: 15000,
      }
    );
    
    console.log('Token exchange response:', {
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      headers: tokenResponse.headers,
      data: tokenResponse.data
    });

    if (tokenResponse.status !== 200 || !tokenResponse.data?.access_token) {
      console.error('=== Token Exchange Failed ===');
      console.error('Response status:', tokenResponse.status);
      console.error('Response data:', JSON.stringify(tokenResponse.data, null, 2));
      
      // Parse LinkedIn error response
      let errorMessage = 'LinkedIn token exchange failed';
      let errorDetails = tokenResponse.data;
      
      if (tokenResponse.data?.error) {
        errorMessage = tokenResponse.data.error;
        if (tokenResponse.data.error_description) {
          errorDetails = tokenResponse.data.error_description;
        }
      }
      
      // Common error explanations with detailed instructions
      let hint = 'Check LinkedIn app configuration';
      let resolution = null;
      
      if (errorMessage === 'invalid_redirect_uri' || errorDetails?.includes('redirect_uri')) {
        hint = `Redirect URI mismatch. The backend is using: ${LINKEDIN_CONFIG.redirectUri}`;
        resolution = [
          '1. Go to https://www.linkedin.com/developers/apps',
          '2. Select your app',
          '3. Go to Auth tab',
          '4. Under OAuth 2.0 settings, ensure you have ONLY this redirect URL:',
          `   ${LINKEDIN_CONFIG.redirectUri}`,
          '5. Remove any API URLs (containing /api/ or -api.onrender.com)',
          '6. Save changes and wait 5 minutes for LinkedIn to update'
        ];
      } else if (errorMessage === 'invalid_client') {
        hint = 'Invalid client ID or secret';
        resolution = [
          '1. Verify LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in .env',
          '2. Ensure no extra spaces or quotes in the values',
          '3. Check that the app is not in development mode if using production'
        ];
      } else if (errorMessage === 'invalid_grant') {
        hint = 'Authorization code is invalid, expired, or already used';
        resolution = [
          '1. Try logging in again from the beginning',
          '2. Clear browser cookies for linkedin.com',
          '3. Ensure you\'re not double-clicking the login button'
        ];
      }
      
      return res.status(400).json({
        error: errorMessage,
        status: tokenResponse.status,
        details: errorDetails,
        redirectUriUsed: LINKEDIN_CONFIG.redirectUri,
        hint: hint,
        resolution: resolution,
        linkedinAppUrl: 'https://www.linkedin.com/developers/apps',
        timestamp: new Date().toISOString()
      });
    }

    const { access_token } = tokenResponse.data;

    // Get user profile from LinkedIn
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
      validateStatus: () => true,
      timeout: 15000,
    });

    if (profileResponse.status !== 200) {
      return res.status(400).json({
        error: 'Failed to fetch LinkedIn profile',
        status: profileResponse.status,
        details: profileResponse.data,
      });
    }

    const linkedinProfile = profileResponse.data;

    // Try to get company profile (if user has admin access to companies)
    let companyData = null;
    try {
      const companiesResponse = await axios.get('https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      if (companiesResponse.data.elements && companiesResponse.data.elements.length > 0) {
        const companyId = companiesResponse.data.elements[0].organizationalTarget;
        
        // Get company details
        const companyResponse = await axios.get(`https://api.linkedin.com/v2/organizations/${companyId}`, {
          headers: {
            'Authorization': `Bearer ${access_token}`,
          },
        });

        companyData = companyResponse.data;
      }
    } catch (companyError) {
      console.log('Could not fetch company data:', companyError.message);
      // Not critical, continue without company data
    }

    // Check if user already exists
    let user = await User.findOne({ email: linkedinProfile.email });

    if (!user) {
      // Create new user
      user = new User({
        name: linkedinProfile.name,
        email: linkedinProfile.email,
        role: process.env.ESYSTEMS_MODE === 'true' ? 'business' : 'va', // Role based on deployment
        isVerified: true, // LinkedIn emails are verified
        linkedinId: linkedinProfile.sub,
        provider: 'linkedin',
      });

      await user.save();
    } else {
      // Update existing user with LinkedIn info
      user.linkedinId = linkedinProfile.sub;
      user.provider = 'linkedin';
      await user.save();
    }

    // Create or update business profile
    let business = await Business.findOne({ user: user._id });

    if (!business) {
      business = new Business({
        user: user._id,
        contactName: linkedinProfile.name,
        email: linkedinProfile.email,
        company: companyData?.name || '',
        bio: companyData?.description || '',
      });

      await business.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      linkedinData: companyData, // Send company data for auto-fill
    });

  } catch (error) {
    console.error('=== LinkedIn OAuth Error ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    console.error('Stack trace:', error.stack);
    console.error('Current config:', {
      redirectUri: LINKEDIN_CONFIG.redirectUri,
      clientIdPresent: !!LINKEDIN_CONFIG.clientId,
      clientSecretPresent: !!LINKEDIN_CONFIG.clientSecret
    });
    
    res.status(500).json({ 
      error: 'Failed to authenticate with LinkedIn',
      details: error?.response?.data || error.message,
      redirectUri: LINKEDIN_CONFIG.redirectUri,
      timestamp: new Date().toISOString()
    });
  }
});

// @desc    Get LinkedIn company profile data
// @route   GET /api/linkedin/company/:companyId
// @access  Private (E Systems only)
router.get('/company/:companyId', async (req, res) => {
  try {
    // LinkedIn integration available for both deployments
    // Check if LinkedIn credentials are configured
    if (!LINKEDIN_CONFIG.clientId || !LINKEDIN_CONFIG.clientSecret) {
      return res.status(403).json({ error: 'LinkedIn integration not configured' });
    }

    const { companyId } = req.params;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Get company profile from LinkedIn
    const companyResponse = await axios.get(`https://api.linkedin.com/v2/organizations/${companyId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    res.json(companyResponse.data);

  } catch (error) {
    console.error('LinkedIn company fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch company profile',
      details: error.message 
    });
  }
});

// @desc    Get user's LinkedIn organizations
// @route   GET /api/linkedin/organizations
// @access  Private (E Systems only)
router.get('/organizations', async (req, res) => {
  try {
    // LinkedIn integration available for both deployments
    // Check if LinkedIn credentials are configured
    if (!LINKEDIN_CONFIG.clientId || !LINKEDIN_CONFIG.clientSecret) {
      return res.status(403).json({ error: 'LinkedIn integration not configured' });
    }

    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Get user's organizations from LinkedIn
    const organizationsResponse = await axios.get('https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    res.json(organizationsResponse.data);

  } catch (error) {
    console.error('LinkedIn organizations fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch organizations',
      details: error.message 
    });
  }
});

module.exports = router;