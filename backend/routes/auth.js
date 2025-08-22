const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('referralCode').optional().trim()
], async (req, res) => {
  console.log('Registration request received:', {
    body: req.body,
    headers: req.headers
  });
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password, referralCode } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create user
    user = await User.create({
      email,
      password
    });

    // Handle referral
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer) {
        user.referredBy = referrer._id;
        referrer.referrals.push(user._id);
        await referrer.save();
        await user.save();
      }
    }

    // Generate confirmation token
    const confirmToken = user.getConfirmationToken();
    await user.save();

    // Send confirmation email
    // TODO: Configure email settings in production
    try {
      const confirmUrl = `${process.env.CLIENT_URL}/confirm-email/${confirmToken}`;
      await sendEmail({
        email: user.email,
        subject: 'Welcome to Linkage VA Hub - Please confirm your email',
        template: 'welcome',
        data: { confirmUrl }
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue with registration even if email fails
    }

    // Create tokens
    const token = user.getSignedJwtToken();
    const refreshToken = user.getRefreshToken();
    await user.save();

    // Load related data
    await user.populate(['va', 'business']);

    res.status(201).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        referralCode: user.referralCode,
        role: user.role,
        admin: user.admin,
        va: user.va,
        business: user.business
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if suspended
    if (user.suspended) {
      return res.status(403).json({
        success: false,
        error: 'Account suspended'
      });
    }

    // Update sign in info
    user.lastSignInAt = user.currentSignInAt;
    user.currentSignInAt = new Date();
    user.signInCount += 1;
    await user.save();

    // Create tokens
    const token = user.getSignedJwtToken();
    const refreshToken = user.getRefreshToken();
    await user.save();

    // Load related data
    await user.populate(['va', 'business']);

    res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        admin: user.admin,
        referralCode: user.referralCode,
        va: user.va,
        business: user.business
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('va')
      .populate('business');

    res.json({
      success: true,
      user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/auth/confirm-email/:token
// @desc    Confirm email
// @access  Public
router.post('/confirm-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      confirmationToken: { $exists: true },
      confirmationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Verify token
    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(token, user.confirmationToken);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Confirm email
    user.confirmedAt = new Date();
    user.confirmationToken = undefined;
    user.confirmationTokenExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email confirmed successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/auth/complete-profile
// @desc    Complete user profile after registration
// @access  Private
router.post('/complete-profile', protect, async (req, res) => {
  try {
    const { role, referralCode } = req.body;
    const userId = req.user.id;

    // Validate role
    if (!role || !['va', 'business'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be either "va" or "business"'
      });
    }

    // Update user with role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user role
    user.role = role;
    
    // Handle referral code if provided
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer) {
        user.referredBy = referrer._id;
        referrer.referralCount = (referrer.referralCount || 0) + 1;
        await referrer.save();
      }
    }

    await user.save();

    // Create VA or Business profile based on role
    if (role === 'va') {
      const VA = require('../models/VA');
      const existingVA = await VA.findOne({ user: userId });
      if (!existingVA) {
        await VA.create({
          user: userId,
          name: user.name || user.email.split('@')[0],
          email: user.email,
          skills: [],
          hourlyRate: 5,
          bio: ''
        });
      }
    } else if (role === 'business') {
      const Business = require('../models/Business');
      const existingBusiness = await Business.findOne({ user: userId });
      if (!existingBusiness) {
        await Business.create({
          user: userId,
          contactName: user.name || user.email.split('@')[0],
          email: user.email,
          company: '',
          bio: ''
        });
      }
    }

    // Return updated user
    const updatedUser = await User.findById(userId)
      .select('-password')
      .populate('va')
      .populate('business');

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete profile'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Forgot password
// @access  Public
router.post('/forgot-password', passwordResetLimiter, [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save();

    // Send email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        template: 'reset-password',
        data: { resetUrl }
      });
      
      res.json({
        success: true,
        message: 'Email sent'
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      res.json({
        success: true,
        message: 'If the email exists, reset instructions will be sent',
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Email could not be sent'
    });
  }
});

// @route   PUT /api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
router.put('/reset-password/:token', passwordResetLimiter, [
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { token } = req.params;

    const user = await User.findOne({
      resetPasswordToken: { $exists: true },
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Verify token
    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(token, user.resetPasswordToken);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Create token
    const jwtToken = user.getSignedJwtToken();

    res.json({
      success: true,
      token: jwtToken
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Check if it's a refresh token
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token type'
      });
    }

    // Find user and validate refresh token
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Validate stored refresh token
    const isValid = await user.validateRefreshToken(refreshToken);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token'
      });
    }

    // Check if suspended
    if (user.suspended) {
      return res.status(403).json({
        success: false,
        error: 'Account suspended'
      });
    }

    // Generate new access token
    const newAccessToken = user.getSignedJwtToken();

    res.json({
      success: true,
      token: newAccessToken
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate refresh token)
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user) {
      user.refreshToken = undefined;
      user.refreshTokenExpire = undefined;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// TEMPORARY: Create first admin - REMOVE AFTER USE
// @route   POST /api/auth/create-first-admin
// @desc    Create the first admin user
// @access  Public (TEMPORARY - REMOVE AFTER USE)
router.post('/create-first-admin', async (req, res) => {
  try {
    const { email, password, secretKey } = req.body;

    // Simple secret key check - change this!
    if (secretKey !== 'linkage-admin-2024') {
      return res.status(401).json({
        success: false,
        error: 'Invalid secret key'
      });
    }

    // Check if admin already exists
    const adminExists = await User.findOne({ admin: true });
    if (adminExists) {
      return res.status(400).json({
        success: false,
        error: 'Admin user already exists'
      });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    
    if (user) {
      // Make existing user admin
      user.admin = true;
      await user.save();
    } else {
      // Create new admin user
      user = await User.create({
        email,
        password,
        admin: true
      });
    }

    res.json({
      success: true,
      message: `Admin user created successfully for ${email}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;