const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/hybridAuth');
const { sendEmail } = require('../utils/email');
const { authLimiter, passwordResetLimiter, twoFactorValidationLimiter } = require('../middleware/rateLimiter');
const { checkTwoFactorStatus, validateTwoFactorForLogin } = require('../middleware/twoFactorAuth');
const { trackLoginSession } = require('../middleware/sessionTracker');
const crypto = require('crypto');

// Add crypto for CSRF token generation
// CSRF helper: create token and set cookie
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Helper function to detect if request is from esystems platform
function detectPlatform(req) {
  const origin = req.headers.origin || req.headers.referer || '';
  const userAgent = req.headers['user-agent'] || '';
  
  // Check if request is from esystems platform
  if (origin.includes('esystems-management-hub.onrender.com') || 
      origin.includes('esystemsmanagement.com') ||
      req.headers['x-frontend-platform'] === 'esystems' ||
      userAgent.includes('esystems')) {
    return 'esystems';
  }
  
  // Default to linkage platform
  return 'linkage';
}

// Middleware to validate CSRF via double-submit cookie
function requireCsrf(req, res, next) {
  const cookieToken = req.cookies && (req.cookies['XSRF-TOKEN'] || req.cookies['xsrf-token']);
  const headerToken = req.headers['x-csrf-token'];
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
  }
  return next();
}
// Helper to sanitize logs (avoid logging raw credentials)
function sanitizeBody(body = {}) {
  const clone = { ...body };
  if (clone.password) clone.password = '***';
  if (clone.twoFactorCode) clone.twoFactorCode = '***';
  return clone;
}

// @route   GET /api/auth/csrf
// @desc    Issue CSRF token cookie for subsequent state-changing requests
// @access  Public
router.get('/csrf', (req, res) => {
  const token = generateCsrfToken();
  // XSRF cookie: readable by JS (not httpOnly) to support SPA header submission
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 60 * 60 * 1000 // 1 hour
  });
  res.json({ success: true, csrfToken: token });
});

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

    // Detect platform from request
    const platform = detectPlatform(req);
    console.log(`🔍 Registration request from platform: ${platform}`);

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create user with appropriate role based on platform
    // E-Systems platform defaults to 'business' role
    // Linkage VA Hub defaults to 'va' role
    const defaultRole = platform === 'esystems' ? 'business' : 'va';
    
    user = await User.create({
      email,
      password,
      role: defaultRole
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

    // Send confirmation email with platform-specific template
    // TODO: Configure email settings in production
    try {
      const confirmUrl = platform === 'esystems' 
        ? `${process.env.ESYSTEMS_FRONTEND_URL || 'https://esystems-management-hub.onrender.com'}/verify-email/${confirmToken}`
        : `${process.env.CLIENT_URL}/verify-email/${confirmToken}`;
      
      const emailTemplate = platform === 'esystems' ? 'esystems-welcome' : 'welcome';
      const userData = platform === 'esystems' ? { role: 'business' } : { role: 'va' };
      
      await sendEmail({
        email: user.email,
        subject: platform === 'esystems' 
          ? 'Welcome to E-Systems Management - Please confirm your email'
          : 'Welcome to Linkage VA Hub - Please confirm your email',
        template: emailTemplate,
        data: { confirmUrl },
        userData: userData
      });
      
      console.log(`✅ ${platform} verification email sent to: ${user.email}`);
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
  body('password').exists(),
  body('twoFactorCode').optional().isLength({ min: 6, max: 8 })
], async (req, res) => {
  console.log('🔐 Login request received:', {
    body: sanitizeBody(req.body),
    headers: {
      'content-type': req.headers['content-type'],
      'origin': req.headers.origin,
      'user-agent': req.headers['user-agent']
    }
  });
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors:', errors.array());
    return res.status(400).json({ 
      success: false,
      error: 'Validation failed',
      errors: errors.array() 
    });
  }

  try {
    const { email, password, twoFactorCode } = req.body;
    console.log('🔍 Looking for user with email:', email);

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    console.log('👤 User found:', {
      exists: !!user,
      email: user?.email,
      hasPassword: !!user?.password,
      admin: user?.admin
    });
    
    if (!user) {
      console.log('❌ User not found, sending 401');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    console.log('🔐 Checking password for user:', user.email);
    const isMatch = await user.matchPassword(password);
    console.log('🔑 Password match result:', isMatch);
    
    if (!isMatch) {
      console.log('❌ Password mismatch, sending 401');
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

    // Check 2FA status
    const twoFactorStatus = await checkTwoFactorStatus(user._id);
    console.log('🔒 2FA Status:', twoFactorStatus);

    if (twoFactorStatus.enabled) {
      if (twoFactorStatus.locked) {
        return res.status(429).json({
          success: false,
          error: 'Account temporarily locked due to too many failed 2FA attempts'
        });
      }

      if (!twoFactorCode) {
        console.log('🔐 2FA required but not provided');
        return res.status(200).json({
          success: false,
          requiresTwoFactor: true,
          message: 'Please provide your two-factor authentication code'
        });
      }

      // Validate 2FA code
      console.log('🔐 Validating 2FA code');
      const twoFactorResult = await validateTwoFactorForLogin(user._id, twoFactorCode);
      
      if (!twoFactorResult.valid) {
        console.log('❌ Invalid 2FA code');
        return res.status(401).json({
          success: false,
          error: twoFactorResult.error || 'Invalid two-factor authentication code',
          attemptsRemaining: twoFactorResult.attemptsRemaining
        });
      }

      console.log('✅ 2FA validation successful');
      
      // Add warning if backup code was used
      if (twoFactorResult.backupCodeUsed) {
        console.log(`⚠️  Backup code used. ${twoFactorResult.remainingBackupCodes} codes remaining`);
      }
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

    // Track login session for security monitoring
    req.user = user;
    await new Promise((resolve, reject) => {
      trackLoginSession(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Set secure cookie options for cross-site cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Relax sameSite in development
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/'
    };

    // Set tokens in cookies for better security
    res.cookie('authToken', token, cookieOptions);
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, httpOnly: true });

    const response = {
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
    };

    // Add 2FA warnings if applicable
    if (twoFactorStatus.enabled && twoFactorCode) {
      const twoFactorResult = await validateTwoFactorForLogin(user._id, twoFactorCode);
      if (twoFactorResult.backupCodeUsed) {
        response.warning = `Backup code used. ${twoFactorResult.remainingBackupCodes} backup codes remaining. Please generate new ones if running low.`;
      }
    }

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/auth/clear-session
// @desc    Clear authentication session (for login page)
// @access  Public
router.post('/clear-session', (req, res) => {
  // SECURITY FIX: Clear authentication cookies when accessing login page
  // This prevents auto-authentication on refresh
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/'
  };

  // Clear both auth and refresh tokens
  res.clearCookie('authToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);

  res.json({
    success: true,
    message: 'Session cleared successfully'
  });
});

// @route   POST /api/auth/admin/login
// @desc    Admin login with email/password
// @access  Public
router.post('/admin/login', authLimiter, [
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

    // Check if user is admin
    if (!user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
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

    // Set secure cookie options for cross-site cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Relax sameSite in development
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/'
    };

    // Set tokens in cookies for better security
    res.cookie('authToken', token, cookieOptions);
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, httpOnly: true });

    res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        admin: user.admin,
        name: user.name || user.email
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

// @route   GET /api/auth/admin/me
// @desc    Get current logged in admin user
// @access  Private
router.get('/admin/me', protect, async (req, res) => {
  try {
    console.log('Auth /admin/me called for user:', req.user?.id);
    console.log('User admin status:', req.user?.admin);
    
    const user = await User.findById(req.user.id)
      .select('-password');

    if (!user) {
      console.log('User not found in database:', req.user.id);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is admin
    if (!user.admin) {
      console.log('User is not admin:', user.email);
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }

    console.log('Returning admin user data:', { 
      email: user.email, 
      admin: user.admin
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        admin: user.admin,
        name: user.name || user.email,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Error in /auth/admin/me:', err);
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
    console.log('Auth /me called for user:', req.user?.id);
    console.log('User admin status:', req.user?.admin);
    
    const user = await User.findById(req.user.id)
      .populate('va')
      .populate('business')
      .populate('avatarFileId');

    if (!user) {
      console.log('User not found in database:', req.user.id);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('Returning user data:', { 
      email: user.email, 
      admin: user.admin,
      hasVA: !!user.va,
      hasBusiness: !!user.business 
    });

    res.json({
      success: true,
      user
    });
  } catch (err) {
    console.error('Error in /auth/me:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/auth/verify-email/:token
// @desc    Verify email
// @access  Public
router.post('/verify-email/:token', async (req, res) => {
  try {
    const { token: verifyToken } = req.params;

    // Primary path: sha256 hashed token lookup
    const hashed = require('crypto').createHash('sha256').update(verifyToken).digest('hex');
    let user = await User.findOne({
      confirmationToken: hashed,
      confirmationTokenExpire: { $gt: Date.now() }
    });

    // Legacy fallback: iterate recent unverified users and bcrypt.compare
    if (!user) {
      const bcrypt = require('bcryptjs');
      const candidates = await User.find({
        confirmationToken: { $exists: true },
        confirmationTokenExpire: { $gt: Date.now() },
        confirmedAt: { $exists: false }
      }).limit(50);

      for (const candidate of candidates) {
        if (await bcrypt.compare(verifyToken, candidate.confirmationToken)) {
          user = candidate;
          break;
        }
      }
    }

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }

    user.confirmedAt = new Date();
    user.confirmationToken = undefined;
    user.confirmationTokenExpire = undefined;
    await user.save();

    // Issue tokens on successful verification for immediate login
    const token = user.getSignedJwtToken();
    const refreshToken = user.getRefreshToken();
    await user.save();
    await user.populate(['va', 'business']);

    res.json({ 
      success: true, 
      message: 'Email confirmed successfully',
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

// @route   POST /api/auth/confirm-email/:token
// @desc    Backward compatibility route for old email links
// @access  Public
router.post('/confirm-email/:token', async (req, res) => {
  // Forward to verify-email endpoint
  const { token } = req.params;
  req.url = `/verify-email/${token}`;
  return router.handle(req, res);
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email for the logged-in user
// @access  Private
router.post('/resend-verification', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // If already verified, return success (no email needed)
    if (user.confirmedAt) {
      return res.json({ success: true, message: 'Email already verified' });
    }

    // Detect platform from request
    const platform = detectPlatform(req);
    console.log(`🔄 Resend verification request from platform: ${platform}`);

    // Generate a fresh confirmation token
    const confirmToken = user.getConfirmationToken();
    await user.save();

    const confirmUrl = platform === 'esystems' 
      ? `${process.env.ESYSTEMS_FRONTEND_URL || 'https://esystems-management-hub.onrender.com'}/verify-email/${confirmToken}`
      : `${process.env.CLIENT_URL}/verify-email/${confirmToken}`;
    
    const emailTemplate = platform === 'esystems' ? 'esystems-welcome' : 'welcome';
    const userData = platform === 'esystems' ? { role: 'business' } : { role: 'va' };
    
    await sendEmail({
      email: user.email,
      subject: platform === 'esystems' 
        ? 'Welcome to E-Systems Management - Please confirm your email'
        : 'Welcome to Linkage VA Hub - Please confirm your email',
      template: emailTemplate,
      data: { confirmUrl },
      userData: userData
    });

    return res.json({ success: true, message: 'Verification email resent' });
  } catch (err) {
    console.error('Resend verification error:', err);
    return res.status(500).json({ success: false, error: 'Failed to resend verification email' });
  }
});

// @route   POST /api/auth/resend-verification-public
// @desc    Resend verification email by email address (unauthenticated)
// @access  Public
router.post('/resend-verification-public', async (req, res) => {
  try {
    console.log('🔄 Public resend verification request received:', { body: req.body, ip: req.ip });
    
    const { email } = req.body || {};
    if (!email) {
      console.log('❌ No email provided in request body');
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    console.log('🔍 Looking for user with email:', email);
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('⚠️  User not found for email:', email);
      // Do not reveal whether email exists
      return res.json({ success: true, message: 'If an account exists, a verification email has been sent' });
    }

    console.log('👤 User found:', { id: user._id, email: user.email, confirmedAt: user.confirmedAt });
    
    if (user.confirmedAt) {
      console.log('✅ User already verified');
      return res.json({ success: true, message: 'Email already verified' });
    }

    // Detect platform from request
    const platform = detectPlatform(req);
    console.log(`🔄 Public resend verification request from platform: ${platform}`);

    console.log('🔑 Generating new confirmation token...');
    const confirmToken = user.getConfirmationToken();
    await user.save();
    console.log('💾 Token saved to user document');

    const confirmUrl = platform === 'esystems' 
      ? `${process.env.ESYSTEMS_FRONTEND_URL || 'https://esystems-management-hub.onrender.com'}/verify-email/${confirmToken}`
      : `${process.env.CLIENT_URL}/verify-email/${confirmToken}`;
    console.log('📧 Sending verification email to:', user.email, 'with URL:', confirmUrl);
    
    const emailTemplate = platform === 'esystems' ? 'esystems-welcome' : 'welcome';
    const userData = platform === 'esystems' ? { role: 'business' } : { role: 'va' };
    
    await sendEmail({
      email: user.email,
      subject: platform === 'esystems' 
        ? 'Welcome to E-Systems Management - Please confirm your email'
        : 'Welcome to Linkage VA Hub - Please confirm your email',
      template: emailTemplate,
      data: { confirmUrl },
      userData: userData,
      forceSendGrid: true
    });

    console.log(`✅ ${platform} verification email sent successfully to:`, user.email);
    return res.json({ success: true, message: 'Verification email resent' });
  } catch (err) {
    console.error('❌ Public resend verification error:', err);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ success: false, error: 'Failed to resend verification email' });
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
        const newVA = await VA.create({
          user: userId,
          name: user.name || user.email.split('@')[0],
          email: user.email,
          skills: [],
          hourlyRate: 5,
          bio: ''
        });
        
        // Emit Socket.io event for real-time dashboard updates
        const io = req.app.get('io');
        if (io) {
          io.to('admin-notifications').emit('new_va_registered', {
            vaId: newVA._id,
            name: newVA.name,
            email: newVA.email,
            createdAt: newVA.createdAt
          });
          
          io.to('admin-notifications').emit('dashboard_update', {
            type: 'new_va',
            data: {
              vaId: newVA._id,
              name: newVA.name
            }
          });
        }
      }
    } else if (role === 'business') {
      const Business = require('../models/Business');
      const existingBusiness = await Business.findOne({ user: userId });
      if (!existingBusiness) {
        const newBusiness = await Business.create({
          user: userId,
          contactName: user.name || user.email.split('@')[0],
          email: user.email,
          company: '',
          bio: ''
        });
        
        // Emit Socket.io event for real-time dashboard updates  
        const io = req.app.get('io');
        if (io) {
          io.to('admin-notifications').emit('new_business_registered', {
            businessId: newBusiness._id,
            company: newBusiness.company || 'New Business',
            contactName: newBusiness.contactName,
            email: newBusiness.email,
            createdAt: newBusiness.createdAt
          });
          
          io.to('admin-notifications').emit('dashboard_update', {
            type: 'new_business',
            data: {
              businessId: newBusiness._id,
              company: newBusiness.company || 'New Business'
            }
          });
        }
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

// @route   POST /api/auth/admin/logout
// @desc    Logout admin user (clear cookies)
// @access  Private
router.post('/admin/logout', protect, requireCsrf, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.refreshToken = undefined;
      user.refreshTokenExpire = undefined;
      await user.save();
    }

    // SECURITY FIX: Clear cookies with proper options to prevent auth bypass
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    };

    // Clear both auth and refresh tokens
    res.clearCookie('authToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

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

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
], requireCsrf, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate refresh token)
// @access  Private
router.post('/logout', protect, requireCsrf, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.refreshToken = undefined;
      user.refreshTokenExpire = undefined;
      await user.save();
    }

    // SECURITY FIX: Clear HttpOnly cookies to prevent auth bypass
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    };

    // Clear both auth and refresh tokens
    res.clearCookie('authToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

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

// @route   GET /api/auth/test-cors
// @desc    Test CORS and authentication
// @access  Public
router.get('/test-cors', (req, res) => {
  console.log('Test CORS endpoint hit');
  console.log('Origin:', req.headers.origin);
  console.log('Cookies:', req.cookies);
  console.log('Auth header:', req.headers.authorization);
  
  res.json({
    success: true,
    message: 'CORS test successful',
    origin: req.headers.origin,
    hasCookies: !!req.cookies,
    hasAuthHeader: !!req.headers.authorization,
    timestamp: new Date().toISOString()
  });
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

// @route   GET /api/auth/test-cors
// @desc    Test CORS and cookie configuration
// @access  Public
router.get('/test-cors', (req, res) => {
  console.log('CORS test endpoint hit');
  console.log('Origin:', req.headers.origin);
  console.log('Cookies:', req.cookies);
  console.log('Auth header:', req.headers.authorization);
  
  res.json({
    success: true,
    message: 'CORS is working',
    origin: req.headers.origin,
    cookies: req.cookies ? Object.keys(req.cookies) : [],
    hasAuthHeader: !!req.headers.authorization,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;