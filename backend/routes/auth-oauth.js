const express = require('express');
const passport = require('passport');
const router = express.Router();

// @route   GET /api/auth/linkedin
// @desc    Initiate LinkedIn OAuth
// @access  Public
router.get('/linkedin', passport.authenticate('linkedin', {
  scope: ['r_liteprofile', 'r_emailaddress']
}));

// @route   GET /api/auth/linkedin/callback
// @desc    LinkedIn OAuth callback
// @access  Public
router.get('/linkedin/callback',
  passport.authenticate('linkedin', { 
    failureRedirect: '/login?error=oauth_failed' 
  }),
  async (req, res) => {
    try {
      // Generate JWT token
      const token = req.user.getSignedJwtToken();
      
      // Set secure HTTP-only cookie with the token
      const cookieOptions = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      };

      res.cookie('token', token, cookieOptions);

      // Determine redirect URL based on user type and profile completion
      let redirectUrl = '/dashboard';
      
      if (req.user.va) {
        // Check if VA profile needs completion
        const va = req.user.va;
        const isProfileComplete = va.bio && va.bio !== 'Professional virtual assistant' && 
                                 va.hero && va.location;
        
        if (!isProfileComplete) {
          redirectUrl = '/va/profile?welcome=true';
        } else {
          redirectUrl = '/dashboard';
        }
      } else if (req.user.business) {
        redirectUrl = '/vas';
      } else {
        redirectUrl = '/profile-setup';
      }

      // Redirect to frontend with success
      res.redirect(`${process.env.CLIENT_URL}${redirectUrl}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }
  }
);

module.exports = router;