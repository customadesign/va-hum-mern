const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Business = require('../models/Business');

const router = express.Router();

// LinkedIn OAuth configuration
// Dynamically determine redirect URI based on deployment
const getRedirectUri = () => {
  if (process.env.LINKEDIN_REDIRECT_URI) {
    return process.env.LINKEDIN_REDIRECT_URI;
  }
  // Default based on mode - frontend callback URL
  if (process.env.ESYSTEMS_MODE === 'true') {
    return 'https://esystems-management-hub.onrender.com/auth/linkedin/callback';
  }
  return 'https://linkage-va-hub.onrender.com/auth/linkedin/callback';
};

const LINKEDIN_CONFIG = {
  clientId: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  redirectUri: getRedirectUri(),
};

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
  console.log('LinkedIn callback initiated');
  console.log('Request body:', { code: req.body.code ? 'present' : 'missing' });
  console.log('LinkedIn config:', {
    clientId: LINKEDIN_CONFIG.clientId ? 'configured' : 'missing',
    clientSecret: LINKEDIN_CONFIG.clientSecret ? 'configured' : 'missing',
    redirectUri: LINKEDIN_CONFIG.redirectUri
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
    const formBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: LINKEDIN_CONFIG.clientId,
      client_secret: LINKEDIN_CONFIG.clientSecret,
      redirect_uri: LINKEDIN_CONFIG.redirectUri,
    }).toString();

    console.log('Exchanging code for token with redirect URI:', LINKEDIN_CONFIG.redirectUri);
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      formBody,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        // Never throw on non-2xx so we can return a clean JSON error instead of a 502
        validateStatus: () => true,
        timeout: 15000,
      }
    );
    console.log('Token exchange response status:', tokenResponse.status);

    if (tokenResponse.status !== 200 || !tokenResponse.data?.access_token) {
      console.error('Token exchange failed:', tokenResponse.data);
      return res.status(400).json({
        error: 'LinkedIn token exchange failed',
        status: tokenResponse.status,
        details: tokenResponse.data,
        redirectUriUsed: LINKEDIN_CONFIG.redirectUri,
        hint: 'Check if redirect URI matches LinkedIn app configuration'
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
    console.error('LinkedIn OAuth error:', error?.response?.data || error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Failed to authenticate with LinkedIn',
      details: error?.response?.data || error.message,
      redirectUri: LINKEDIN_CONFIG.redirectUri
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