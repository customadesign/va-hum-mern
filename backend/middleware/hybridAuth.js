const { protect: legacyProtect, authorize: legacyAuthorize } = require('./auth');
const { protect: clerkProtect, authorize: clerkAuthorize, legacyProtect: clerkLegacyProtect } = require('./clerkAuth');

/**
 * HYBRID AUTHENTICATION MIDDLEWARE
 * 
 * This middleware allows both legacy JWT and Clerk authentication to work simultaneously
 * during the migration period. It tries Clerk first, then falls back to legacy JWT.
 * 
 * This ensures zero downtime during deployment and gradual user migration.
 */

// Hybrid protect middleware - tries Clerk first, then legacy JWT
exports.protect = (req, res, next) => {
  console.log('Hybrid auth - checking authentication method...');
  console.log('Hybrid auth - CLERK_SECRET_KEY present:', !!process.env.CLERK_SECRET_KEY);
  
  // Check if Clerk is configured
  if (process.env.CLERK_SECRET_KEY) {
    console.log('Hybrid auth - Using Clerk authentication');
    // Use the main Clerk protect middleware directly
    return clerkProtect(req, res, next);
  } else {
    console.log('Hybrid auth - Using legacy JWT authentication');
    // Fall back to legacy JWT authentication
    return legacyProtect(req, res, next);
  }
};

// Hybrid authorize middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user was authenticated via Clerk
    if (req.clerkUserId) {
      return clerkAuthorize(...roles)(req, res, next);
    } else {
      // Fall back to legacy authorization
      return legacyAuthorize(...roles)(req, res, next);
    }
  };
};

// Optional auth - doesn't fail if no token
exports.optionalAuth = (req, res, next) => {
  // Check if Clerk is configured
  if (process.env.CLERK_SECRET_KEY) {
    const { optionalAuth: clerkOptionalAuth } = require('./clerkAuth');
    return clerkOptionalAuth(req, res, next);
  } else {
    const { optionalAuth: legacyOptionalAuth } = require('./auth');
    return legacyOptionalAuth(req, res, next);
  }
};

// E-systems checks (unchanged)
exports.checkESystemsVAAccess = require('./auth').checkESystemsVAAccess;
exports.checkESystemsBusinessAccess = require('./auth').checkESystemsBusinessAccess;