const { ClerkExpressRequireAuth, ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
const User = require('../models/User');
const { isESystemsMode } = require('../utils/esystems');

// CLERK AUTHENTICATION MIDDLEWARE
// This replaces the old JWT-based auth middleware

/**
 * Protect routes - requires authentication
 * Replaces the old protect() middleware
 */
exports.protect = ClerkExpressRequireAuth((req, res, next) => {
  // Get Clerk user info from request
  const { userId: clerkUserId } = req.auth;
  
  if (!clerkUserId) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  // Find our internal user record by Clerk user ID
  User.findOne({ clerkUserId })
    .populate(['va', 'business'])
    .then(user => {
      if (!user) {
        // User exists in Clerk but not in our database
        // This might happen for new users during onboarding
        return res.status(404).json({
          success: false,
          error: 'User profile not found. Please complete your profile setup.',
          needsOnboarding: true
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
      
      next();
    })
    .catch(err => {
      console.error('Error in protect middleware:', err);
      return res.status(500).json({
        success: false,
        error: 'Authentication error'
      });
    });
});

/**
 * Optional authentication - doesn't fail if no token
 * Replaces the old optionalAuth() middleware
 */
exports.optionalAuth = ClerkExpressWithAuth((req, res, next) => {
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
});

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