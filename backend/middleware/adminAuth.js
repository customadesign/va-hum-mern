const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    // Check if user exists (should be set by auth middleware)
    if (!req.user) {
      console.log('Admin auth: No user object in request');
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check if user is admin
    if (!req.user.admin) {
      console.log('Admin auth failed for user:', req.user.email, 'Admin status:', req.user.admin);
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    // If impersonating, check that the impersonator is an admin
    if (req.user.isImpersonated && req.user.impersonatedBy) {
      const impersonator = await User.findById(req.user.impersonatedBy).select('admin email');
      if (!impersonator || !impersonator.admin) {
        console.log('Impersonation not allowed - impersonator is not admin');
        return res.status(403).json({
          success: false,
          error: 'Invalid impersonation'
        });
      }
      console.log('Admin auth passed for impersonated user:', req.user.email, 'by admin:', impersonator.email);
    } else {
      console.log('Admin auth passed for user:', req.user.email);
    }

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during authentication'
    });
  }
};

module.exports = adminAuth;