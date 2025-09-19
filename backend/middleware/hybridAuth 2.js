const { protect: legacyProtect, authorize: legacyAuthorize } = require('./auth');

/**
 * HYBRID AUTHENTICATION MIDDLEWARE
 * 
 * This middleware allows both legacy JWT and Clerk authentication to work simultaneously
 * during the migration period. It tries Clerk first, then falls back to legacy JWT.
 * 
 * This ensures zero downtime during deployment and gradual user migration.
 */

// Hybrid protect middleware (Clerk removed): always use legacy JWT auth
exports.protect = (req, res, next) => {
  return legacyProtect(req, res, next);
};

// Hybrid authorize middleware (Clerk removed)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    return legacyAuthorize(...roles)(req, res, next);
  };
};

// Optional auth - doesn't fail if no token (Clerk removed)
exports.optionalAuth = (req, res, next) => {
  const { optionalAuth: legacyOptionalAuth } = require('./auth');
  return legacyOptionalAuth(req, res, next);
};

// E-systems checks (unchanged)
exports.checkESystemsVAAccess = require('./auth').checkESystemsVAAccess;
exports.checkESystemsBusinessAccess = require('./auth').checkESystemsBusinessAccess;