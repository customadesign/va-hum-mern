const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isESystemsMode } = require('../utils/esystems');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
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
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return async (req, res, next) => {
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

// Optional auth - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
  } catch (err) {
    // Continue without user
  }

  next();
};

// Check E-systems access for VA routes
exports.checkESystemsVAAccess = (req, res, next) => {
  if (isESystemsMode()) {
    return res.status(403).json({
      success: false,
      error: 'VA registration not available in E-systems mode'
    });
  }
  next();
};

// Check E-systems access for business routes
exports.checkESystemsBusinessAccess = (req, res, next) => {
  if (isESystemsMode() && !req.user.business) {
    return res.status(403).json({
      success: false,
      error: 'Business profile required in E-systems mode'
    });
  }
  next();
};