const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
const User = require('../models/User');
const { isESystemsMode } = require('../utils/esystems');

// CLERK AUTHENTICATION MIDDLEWARE
// This replaces the old JWT-based auth middleware

// Check if Clerk is properly configured
if (!process.env.CLERK_SECRET_KEY) {
  console.error('ERROR: CLERK_SECRET_KEY is not set in environment variables');
  console.error('Clerk authentication middleware will not work properly');
}

/**
 * Fallback middleware to catch Clerk errors
 */
const clerkErrorHandler = (err, req, res, next) => {
  console.error('=== Clerk middleware error ===');
  console.error('Error:', err);
  console.error('Request headers:', req.headers);
  console.error('Request URL:', req.url);
  console.error('Request method:', req.method);
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Clerk authentication failed',
      details: err.message
    });
  }
  
  return res.status(500).json({
    success: false,
    error: 'Clerk authentication error',
    details: err.message
  });
};

/**
 * Simple test middleware to verify Clerk is working
 */
exports.testClerk = (req, res, next) => {
  console.log('=== Testing Clerk middleware ===');
  console.log('CLERK_SECRET_KEY present:', !!process.env.CLERK_SECRET_KEY);
  console.log('CLERK_SECRET_KEY length:', process.env.CLERK_SECRET_KEY ? process.env.CLERK_SECRET_KEY.length : 0);
  console.log('CLERK_SECRET_KEY starts with:', process.env.CLERK_SECRET_KEY ? process.env.CLERK_SECRET_KEY.substring(0, 10) : 'none');
  
  // Test if Clerk can be imported
  try {
    const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
    console.log('Clerk SDK imported successfully');
    
    // Test if we can create a middleware
    const testMiddleware = ClerkExpressRequireAuth((req, res, next) => {
      console.log('Clerk middleware function created successfully');
      next();
    });
    console.log('Clerk middleware function created successfully');
    
  } catch (error) {
    console.error('Error importing Clerk SDK:', error);
  }
  
  next();
};

/**
 * Protect routes - requires authentication
 * Reads auth from req.auth (populated by global Clerk middleware)
 */
exports.protect = async (req, res, next) => {
  // Debug: Check what's in the request
  console.log('=== Clerk protect middleware called ===');
  console.log('Clerk protect middleware - req.auth:', req.auth);
  console.log('Clerk protect middleware - req.headers:', {
    authorization: req.headers.authorization ? 'Present' : 'Missing',
    'user-agent': req.headers['user-agent']
  });
  console.log('Clerk protect middleware - Authorization header value:', req.headers.authorization ? req.headers.authorization.substring(0, 20) + '...' : 'None');

  try {
    const clerkUserId = req.auth && req.auth.userId;

    if (!clerkUserId) {
      console.log('Clerk protect middleware - No clerkUserId found in req.auth');
      console.log('Clerk protect middleware - req.auth keys:', req.auth ? Object.keys(req.auth) : 'none');
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route',
        debug: {
          hasAuth: !!req.auth,
          authKeys: req.auth ? Object.keys(req.auth) : 'none',
          authValue: req.auth
        }
      });
    }

    // Find our internal user record by Clerk user ID
    const user = await User.findOne({ clerkUserId }).populate(['va', 'business']);

    if (!user) {
      console.log(`Clerk user ${clerkUserId} not found in database - needs onboarding`);
      return res.status(404).json({
        success: false,
        error: 'User profile not found. Please complete your profile setup.',
        needsOnboarding: true,
        clerkUserId: clerkUserId,
        message: 'User authenticated with Clerk but profile not yet created in database'
      });
    }

    if (user.suspended) {
      return res.status(403).json({
        success: false,
        error: 'Account suspended'
      });
    }

    // Add user to request object
    req.user = user;
    req.clerkUserId = clerkUserId;
    return next();
  } catch (err) {
    console.error('Error in protect middleware:', err);
    return res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Replaces the old optionalAuth() middleware
 */
exports.optionalAuth = (req, res, next) => {
  const { userId: clerkUserId } = req.auth || {};

  if (!clerkUserId) {
    return next();
  }

  // Try to find user, but don't fail if not found
  User.findOne({ clerkUserId })
    .populate(['va', 'business'])
    .then(user => {
      if (user && !user.suspended) {
        req.user = user;
        req.clerkUserId = clerkUserId;
      }
      next();
    })
    .catch(err => {
      console.error('Error in optionalAuth middleware:', err);
      // Continue without user on error
      next();
    });
};

/**
 * Grant access to specific roles
 * Enhanced version of the old authorize() middleware
 */
exports.authorize = (...roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check if user is admin
    if (roles.includes('admin') && req.user.admin) {
      return next();
    }

    // Check if user has VA profile
    if (roles.includes('va') && req.user.va) {
      const VA = require('../models/VA');
      req.va = await VA.findById(req.user.va);
      if (req.va) return next();
    }

    // Check if user has Business profile
    if (roles.includes('business') && req.user.business) {
      const Business = require('../models/Business');
      req.business = await Business.findById(req.user.business);
      if (req.business) return next();
    }

    return res.status(403).json({
      success: false,
      error: `User role is not authorized to access this route`
    });
  };
};

/**
 * Find or create user from Clerk data
 * Used during user onboarding process
 */
exports.findOrCreateUser = async (clerkUser) => {
  try {
    // Try to find existing user by Clerk ID
    let user = await User.findOne({ clerkUserId: clerkUser.id });
    
    if (user) {
      return user;
    }

    // Try to find existing user by email (for migration from old system)
    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
      
      if (user) {
        // Link existing user to Clerk
        user.clerkUserId = clerkUser.id;
        user.provider = 'clerk';
        user.isVerified = true; // Clerk handles email verification
        await user.save();
        return user;
      }
    }

    // Create new user
    user = new User({
      clerkUserId: clerkUser.id,
      email: email?.toLowerCase(),
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
      provider: 'clerk',
      isVerified: true // Clerk handles email verification
    });

    await user.save();
    return user;
  } catch (error) {
    console.error('Error in findOrCreateUser:', error);
    throw error;
  }
};

// Legacy middleware compatibility layer
// These wrap the new Clerk middleware to maintain compatibility
// with existing route handlers that expect req.user

/**
 * Legacy JWT middleware wrapper
 * Allows gradual migration from JWT to Clerk
 */
exports.legacyProtect = async (req, res, next) => {
  const jwt = require('jsonwebtoken');
  
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token, use Clerk
  if (!token) {
    return exports.protect(req, res, next);
  }

  try {
    // Try legacy JWT first
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (req.user.suspended) {
      return res.status(403).json({
        success: false,
        error: 'Account suspended'
      });
    }

    next();
  } catch (err) {
    // JWT failed, try Clerk
    return exports.protect(req, res, next);
  }
};

// E-systems mode checks (keep existing functionality)
exports.checkESystemsVAAccess = (req, res, next) => {
  if (isESystemsMode()) {
    return res.status(403).json({
      success: false,
      error: 'VA registration not available in E-systems mode'
    });
  }
  next();
};

exports.checkESystemsBusinessAccess = (req, res, next) => {
  if (isESystemsMode() && !req.user.business) {
    return res.status(403).json({
      success: false,
      error: 'Business profile required in E-systems mode'
    });
  }
  next();
};