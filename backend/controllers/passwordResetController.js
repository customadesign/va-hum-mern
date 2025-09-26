const User = require('../models/User');
const VA = require('../models/VA');
const Business = require('../models/Business');
const PasswordResetAudit = require('../models/PasswordResetAudit');
const { sendEmail } = require('../utils/email');
const { detectRecipientType } = require('../config/emailDomains');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

// Rate limiting constants
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS_PER_HOUR = 3;
const ADMIN_MAX_ATTEMPTS_PER_HOUR = 10;

// Token expiry constants
const TOKEN_EXPIRY_MINUTES = 15; // 15 minutes for security
const ADMIN_TOKEN_EXPIRY_MINUTES = 30; // 30 minutes for admin-initiated resets

/**
 * Generate a secure password reset token
 */
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a token for secure storage
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Determine user type from User document
 */
const determineUserType = async (user) => {
  if (user.admin) return 'admin';
  
  // Check if user has VA profile
  const va = await VA.findOne({ user: user._id });
  if (va) return 'va';
  
  // Check if user has Business profile
  const business = await Business.findOne({ user: user._id });
  if (business) return 'business';
  
  // Fallback based on user.role or default to business
  return user.role || 'business';
};

/**
 * Check rate limiting for password reset attempts
 */
const checkRateLimit = async (userEmail, isAdmin = false) => {
  const maxAttempts = isAdmin ? ADMIN_MAX_ATTEMPTS_PER_HOUR : MAX_ATTEMPTS_PER_HOUR;
  const recentAttempts = await PasswordResetAudit.getRecentAttempts(userEmail, 1);
  
  if (recentAttempts.length >= maxAttempts) {
    const oldestAttempt = recentAttempts[recentAttempts.length - 1];
    const timeUntilReset = new Date(oldestAttempt.createdAt.getTime() + RATE_LIMIT_WINDOW);
    
    throw new Error(`Too many password reset attempts. Please try again after ${timeUntilReset.toLocaleTimeString()}`);
  }
  
  return true;
};

/**
 * Admin-initiated password reset
 * POST /api/password-reset/admin/initiate
 */
const adminInitiateReset = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId, reason, notifyUser = true } = req.body;
    const adminUser = req.user;

    // Verify admin permissions
    if (!adminUser || !adminUser.admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required'
      });
    }

    // Find the target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check rate limiting
    await checkRateLimit(targetUser.email, true);

    // Determine user type for proper email routing
    const userType = await determineUserType(targetUser);

    // Generate secure token
    const resetToken = generateSecureToken();
    const hashedToken = hashToken(resetToken);
    const expiryTime = new Date(Date.now() + ADMIN_TOKEN_EXPIRY_MINUTES * 60 * 1000);

    // Create audit record
    const auditRecord = new PasswordResetAudit({
      user: targetUser._id,
      userEmail: targetUser.email,
      resetType: 'admin_initiated',
      initiatedBy: adminUser._id,
      initiatedByEmail: adminUser.email,
      tokenHash: hashedToken,
      tokenExpiry: expiryTime,
      userType,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      reason: reason || 'Admin-initiated password reset',
      securityFlags: {
        adminOverride: true
      }
    });

    await auditRecord.save();

    // Update user's reset token fields
    targetUser.resetPasswordToken = hashedToken;
    targetUser.resetPasswordExpire = expiryTime;
    await targetUser.save();

    let emailResult = null;
    
    if (notifyUser) {
      try {
        // Prepare email data
        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        const emailData = {
          resetUrl,
          adminName: adminUser.name || adminUser.email,
          reason: reason || 'An administrator has initiated a password reset for your account',
          expiresIn: `${ADMIN_TOKEN_EXPIRY_MINUTES} minutes`
        };

        // Determine appropriate user data for email routing
        const userData = userType === 'admin' ? { admin: true } : 
                        userType === 'va' ? { role: 'va' } : 
                        { role: 'business' };

        // Send email using the enhanced email service
        emailResult = await sendEmail({
          email: targetUser.email,
          template: 'admin-password-reset',
          data: emailData,
          userData,
          recipientType: userType
        });

        // Update audit record with email delivery info
        await auditRecord.updateEmailDelivery({
          provider: emailResult.provider || 'smtp',
          senderEmail: emailResult.senderEmail,
          senderDomain: emailResult.senderDomain,
          messageId: emailResult.messageId
        });

        console.log(`Admin-initiated password reset email sent to ${targetUser.email} via ${userType} domain`);

      } catch (emailError) {
        console.error('Failed to send admin password reset email:', emailError);
        
        // Update audit record with email failure
        await auditRecord.markEmailFailed(emailError.message);

        // Don't fail the entire request if email fails
        emailResult = { error: emailError.message };
      }
    }

    res.json({
      success: true,
      message: notifyUser ? 
        'Password reset initiated and email sent to user' : 
        'Password reset initiated (user not notified)',
      auditId: auditRecord._id,
      emailDelivered: !emailResult?.error,
      emailError: emailResult?.error,
      expiresAt: expiryTime,
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined // Only in dev
    });

  } catch (error) {
    console.error('Admin password reset error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initiate password reset'
    });
  }
};

/**
 * User-facing forgot password
 * POST /api/password-reset/forgot
 */
const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Always return success for security (don't reveal if email exists)
    const genericResponse = {
      success: true,
      message: 'If an account with this email exists, password reset instructions have been sent'
    };

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Still return success but don't actually send email
      return res.json(genericResponse);
    }

    // Check if account is suspended
    if (user.suspended) {
      return res.status(403).json({
        success: false,
        error: 'Account is suspended. Please contact support.'
      });
    }

    try {
      // Check rate limiting
      await checkRateLimit(user.email, false);
    } catch (rateLimitError) {
      return res.status(429).json({
        success: false,
        error: rateLimitError.message
      });
    }

    // Determine user type for proper email routing
    const userType = await determineUserType(user);

    // Generate secure token
    const resetToken = generateSecureToken();
    const hashedToken = hashToken(resetToken);
    const expiryTime = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    // Create audit record
    const auditRecord = new PasswordResetAudit({
      user: user._id,
      userEmail: user.email,
      resetType: 'user_self_service',
      tokenHash: hashedToken,
      tokenExpiry: expiryTime,
      userType,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    await auditRecord.save();

    // Update user's reset token fields
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = expiryTime;
    await user.save();

    try {
      // Prepare email data
      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
      const emailData = {
        resetUrl,
        userName: user.name || user.email.split('@')[0],
        expiresIn: `${TOKEN_EXPIRY_MINUTES} minutes`
      };

      // Determine appropriate user data for email routing
      const userData = userType === 'admin' ? { admin: true } : 
                      userType === 'va' ? { role: 'va' } : 
                      { role: 'business' };

      // Send email using the enhanced email service
      const emailResult = await sendEmail({
        email: user.email,
        template: 'reset-password',
        data: emailData,
        userData,
        recipientType: userType
      });

      // Update audit record with email delivery info
      await auditRecord.updateEmailDelivery({
        provider: emailResult.provider || 'smtp',
        senderEmail: emailResult.senderEmail,
        senderDomain: emailResult.senderDomain,
        messageId: emailResult.messageId
      });

      console.log(`Self-service password reset email sent to ${user.email} via ${userType} domain`);

    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      
      // Update audit record with email failure
      await auditRecord.markEmailFailed(emailError.message);

      // For self-service, we still return success to prevent email enumeration
      console.log(`Password reset email failed for ${user.email}: ${emailError.message}`);
    }

    res.json(genericResponse);

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your request'
    });
  }
};

/**
 * Reset password with token
 * POST /api/password-reset/reset/:token
 */
const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token } = req.params;
    const { password } = req.body;

    // Hash the provided token to compare with stored hash
    const hashedToken = hashToken(token);

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Find the corresponding audit record
    const auditRecord = await PasswordResetAudit.findOne({
      user: user._id,
      tokenHash: hashedToken,
      status: { $in: ['email_sent', 'initiated'] },
      tokenExpiry: { $gt: Date.now() }
    });

    if (!auditRecord) {
      return res.status(400).json({
        success: false,
        error: 'Reset token not found or already used'
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    // Clear any existing refresh tokens for security
    user.refreshToken = undefined;
    user.refreshTokenExpire = undefined;
    
    await user.save();

    // Update audit record as completed
    await auditRecord.markCompleted(
      req.ip || req.connection.remoteAddress,
      req.get('User-Agent')
    );

    // Create new access token
    const newToken = user.getSignedJwtToken();

    console.log(`Password reset completed for user ${user.email}`);

    res.json({
      success: true,
      message: 'Password reset successful',
      token: newToken,
      user: {
        id: user._id,
        email: user.email,
        admin: user.admin
      }
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    });
  }
};

/**
 * Validate reset token (check if token is valid without using it)
 * GET /api/password-reset/validate/:token
 */
const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    const hashedToken = hashToken(token);

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('email');

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Find audit record for additional context
    const auditRecord = await PasswordResetAudit.findOne({
      user: user._id,
      tokenHash: hashedToken,
      status: { $in: ['email_sent', 'initiated'] }
    });

    res.json({
      success: true,
      valid: true,
      email: user.email,
      resetType: auditRecord?.resetType || 'unknown',
      expiresAt: auditRecord?.tokenExpiry
    });

  } catch (error) {
    console.error('Validate token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate token'
    });
  }
};

/**
 * Get password reset audit logs (admin only)
 * GET /api/password-reset/admin/audit
 */
const getPasswordResetAudit = async (req, res) => {
  try {
    const adminUser = req.user;
    
    // Verify admin permissions
    if (!adminUser || !adminUser.admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required'
      });
    }

    const {
      page = 1,
      limit = 20,
      status,
      resetType,
      userEmail,
      startDate,
      endDate
    } = req.query;

    // Build query
    const query = {};
    
    if (status) query.status = status;
    if (resetType) query.resetType = resetType;
    if (userEmail) query.userEmail = { $regex: userEmail, $options: 'i' };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [auditLogs, total] = await Promise.all([
      PasswordResetAudit.find(query)
        .populate('user', 'email name admin')
        .populate('initiatedBy', 'email name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      PasswordResetAudit.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: auditLogs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit logs'
    });
  }
};

/**
 * Cleanup expired password reset tokens
 * POST /api/password-reset/admin/cleanup (admin only)
 */
const cleanupExpiredTokens = async (req, res) => {
  try {
    const adminUser = req.user;
    
    // Verify admin permissions
    if (!adminUser || !adminUser.admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required'
      });
    }

    // Cleanup expired audit records
    const auditCleanupResult = await PasswordResetAudit.cleanupExpiredTokens();
    
    // Cleanup expired user tokens
    const userCleanupResult = await User.updateMany(
      {
        resetPasswordExpire: { $lt: new Date() }
      },
      {
        $unset: {
          resetPasswordToken: 1,
          resetPasswordExpire: 1
        }
      }
    );

    res.json({
      success: true,
      message: 'Expired tokens cleaned up successfully',
      auditRecordsUpdated: auditCleanupResult.modifiedCount,
      userRecordsUpdated: userCleanupResult.modifiedCount
    });

  } catch (error) {
    console.error('Cleanup expired tokens error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup expired tokens'
    });
  }
};

module.exports = {
  adminInitiateReset,
  forgotPassword,
  resetPassword,
  validateResetToken,
  getPasswordResetAudit,
  cleanupExpiredTokens
};