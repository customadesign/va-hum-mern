const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/hybridAuth');
const { passwordResetLimiter } = require('../middleware/rateLimiter');
const {
  adminInitiateReset,
  forgotPassword,
  resetPassword,
  validateResetToken,
  getPasswordResetAudit,
  cleanupExpiredTokens
} = require('../controllers/passwordResetController');

// Validation middleware
const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

const validatePassword = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const validateAdminInitiate = [
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  body('reason')
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
  body('notifyUser')
    .optional()
    .isBoolean()
    .withMessage('notifyUser must be a boolean')
];

// Admin Routes (protected, admin only)

// @route   POST /api/password-reset/admin/initiate
// @desc    Admin-initiated password reset for any user
// @access  Private (Admin only)
router.post('/admin/initiate', 
  protect,
  passwordResetLimiter,
  validateAdminInitiate,
  adminInitiateReset
);

// @route   GET /api/password-reset/admin/audit
// @desc    Get password reset audit logs
// @access  Private (Admin only)
router.get('/admin/audit',
  protect,
  getPasswordResetAudit
);

// @route   POST /api/password-reset/admin/cleanup
// @desc    Cleanup expired password reset tokens
// @access  Private (Admin only)
router.post('/admin/cleanup',
  protect,
  cleanupExpiredTokens
);

// Public Routes (rate limited)

// @route   POST /api/password-reset/forgot
// @desc    User-initiated forgot password (public)
// @access  Public
router.post('/forgot',
  passwordResetLimiter,
  validateEmail,
  forgotPassword
);

// @route   GET /api/password-reset/validate/:token
// @desc    Validate password reset token without consuming it
// @access  Public
router.get('/validate/:token',
  passwordResetLimiter,
  validateResetToken
);

// @route   POST /api/password-reset/reset/:token
// @desc    Reset password using valid token
// @access  Public
router.post('/reset/:token',
  passwordResetLimiter,
  validatePassword,
  resetPassword
);

// Additional utility routes

// @route   GET /api/password-reset/admin/stats
// @desc    Get password reset statistics (admin only)
// @access  Private (Admin only)
router.get('/admin/stats', protect, async (req, res) => {
  try {
    const adminUser = req.user;
    
    // Verify admin permissions
    if (!adminUser || !adminUser.admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required'
      });
    }

    const PasswordResetAudit = require('../models/PasswordResetAudit');
    
    // Get statistics for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [
      totalResets,
      adminInitiated,
      userSelfService,
      successfulResets,
      failedResets,
      emailFailures,
      recentActivity
    ] = await Promise.all([
      PasswordResetAudit.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      PasswordResetAudit.countDocuments({ 
        resetType: 'admin_initiated',
        createdAt: { $gte: thirtyDaysAgo }
      }),
      PasswordResetAudit.countDocuments({ 
        resetType: 'user_self_service',
        createdAt: { $gte: thirtyDaysAgo }
      }),
      PasswordResetAudit.countDocuments({ 
        status: 'completed',
        createdAt: { $gte: thirtyDaysAgo }
      }),
      PasswordResetAudit.countDocuments({ 
        status: 'failed',
        createdAt: { $gte: thirtyDaysAgo }
      }),
      PasswordResetAudit.countDocuments({ 
        status: 'email_failed',
        createdAt: { $gte: thirtyDaysAgo }
      }),
      PasswordResetAudit.find({ createdAt: { $gte: thirtyDaysAgo } })
        .populate('user', 'email')
        .populate('initiatedBy', 'email')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    const stats = {
      period: '30 days',
      totalResets,
      breakdown: {
        adminInitiated,
        userSelfService
      },
      outcomes: {
        successful: successfulResets,
        failed: failedResets,
        emailFailures
      },
      successRate: totalResets > 0 ? Math.round((successfulResets / totalResets) * 100) : 0,
      recentActivity
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get password reset stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve password reset statistics'
    });
  }
});

// @route   GET /api/password-reset/admin/user/:userId/history
// @desc    Get password reset history for specific user (admin only)
// @access  Private (Admin only)
router.get('/admin/user/:userId/history', protect, async (req, res) => {
  try {
    const adminUser = req.user;
    
    // Verify admin permissions
    if (!adminUser || !adminUser.admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required'
      });
    }

    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const PasswordResetAudit = require('../models/PasswordResetAudit');
    const User = require('../models/User');

    // Verify user exists
    const user = await User.findById(userId).select('email name');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's password reset history
    const history = await PasswordResetAudit.find({ user: userId })
      .populate('initiatedBy', 'email name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name
        },
        history
      }
    });

  } catch (error) {
    console.error('Get user reset history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user password reset history'
    });
  }
});

module.exports = router;