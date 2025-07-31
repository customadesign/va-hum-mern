const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('referralCode').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
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

    // Create token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        referralCode: user.referralCode
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
router.post('/login', [
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

    // Create token
    const token = user.getSignedJwtToken();

    // Load related data
    await user.populate(['va', 'business']);

    res.json({
      success: true,
      token,
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

// @route   POST /api/auth/forgot-password
// @desc    Forgot password
// @access  Public
router.post('/forgot-password', [
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
router.put('/reset-password/:token', [
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