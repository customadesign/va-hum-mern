const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Business = require('../models/Business');

const router = express.Router();

// LinkedIn OAuth configuration
const LINKEDIN_CONFIG = {
  clientId: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  redirectUri: process.env.LINKEDIN_REDIRECT_URI || 'https://esystems-management-hub.onrender.com/auth/linkedin/callback',
};

// @desc    Handle LinkedIn OAuth callback
// @route   POST /api/auth/linkedin/callback
// @access  Public (E Systems only)
router.post('/callback', async (req, res) => {
  try {
    // Only allow on E Systems mode
    if (!process.env.ESYSTEMS_MODE) {
      return res.status(403).json({ error: 'LinkedIn integration only available on E Systems' });
    }

    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        client_id: LINKEDIN_CONFIG.clientId,
        client_secret: LINKEDIN_CONFIG.clientSecret,
        redirect_uri: LINKEDIN_CONFIG.redirectUri,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token } = tokenResponse.data;

    // Get user profile from LinkedIn
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

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
        role: 'business', // LinkedIn users are businesses
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
    console.error('LinkedIn OAuth error:', error);
    res.status(500).json({ 
      error: 'Failed to authenticate with LinkedIn',
      details: error.message 
    });
  }
});

// @desc    Get LinkedIn company profile data
// @route   GET /api/linkedin/company/:companyId
// @access  Private (E Systems only)
router.get('/company/:companyId', async (req, res) => {
  try {
    // Only allow on E Systems mode
    if (!process.env.ESYSTEMS_MODE) {
      return res.status(403).json({ error: 'LinkedIn integration only available on E Systems' });
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
    // Only allow on E Systems mode
    if (!process.env.ESYSTEMS_MODE) {
      return res.status(403).json({ error: 'LinkedIn integration only available on E Systems' });
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