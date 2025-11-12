const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// @route   GET /api/auth/linkedin/admin
// @desc    Initiate LinkedIn OAuth for admin users
// @access  Public
router.get('/linkedin/admin', passport.authenticate('linkedin-admin', {
  scope: ['r_liteprofile', 'r_emailaddress']
}));

// @route   GET /api/auth/linkedin/admin/callback
// @desc    LinkedIn OAuth callback for admin users
// @access  Public
router.get('/linkedin/admin/callback',
  passport.authenticate('linkedin-admin', { 
    failureRedirect: '/admin/login?error=oauth_failed' 
  }),
  async (req, res) => {
    try {
      // Check if user has admin privileges
      if (!req.user.admin) {
        return res.redirect('/admin/login?error=access_denied');
      }

      // Create JWT token for the admin user
      const token = req.user.getSignedJwtToken();
      const refreshToken = req.user.getRefreshToken();
      await req.user.save();

      // Redirect to admin dashboard with token
      res.redirect(`/admin/dashboard?token=${token}&refreshToken=${refreshToken}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('/admin/login?error=auth_failed');
    }
  }
);

// @route   POST /api/auth/admin/oauth/linkedin
// @desc    Alternative OAuth endpoint that returns JSON instead of redirect
// @access  Public
router.post('/admin/oauth/linkedin', async (req, res) => {
  try {
    // This would be called after successful OAuth flow
    // For now, we'll use the existing OAuth callback approach
    res.json({
      success: true,
      message: 'Use GET /api/auth/linkedin/admin to initiate OAuth flow'
    });
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).json({
      success: false,
      error: 'OAuth authentication failed'
    });
  }
});

// @route   GET /api/auth/admin/methods
// @desc    Get available authentication methods for admin
// @access  Public
router.get('/admin/methods', (req, res) => {
  res.json({
    success: true,
    methods: [
      {
        name: 'email_password',
        endpoint: '/api/auth/admin/login',
        type: 'POST',
        description: 'Login with email and password'
      },
      {
        name: 'linkedin_oauth',
        endpoint: '/api/auth/linkedin/admin',
        type: 'GET',
        description: 'Login with LinkedIn OAuth'
      }
    ]
  });
});

module.exports = router;
