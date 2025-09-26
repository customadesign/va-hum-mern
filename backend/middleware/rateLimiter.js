const rateLimit = require('express-rate-limit');

// Rate limiter for authentication endpoints
exports.authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000, // 15 minutes by default
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5'), // 5 requests per window
  message: 'Too many authentication attempts from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false,
  // Fix for X-Forwarded-For header issue
  trustProxy: process.env.NODE_ENV === 'production',
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts. Please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Rate limiter for general API endpoints
exports.apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000, // 15 minutes by default
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 100 requests per window
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Rate limiter for password reset endpoints (stricter)
exports.passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 3, // 3 requests per hour
  message: 'Too many password reset attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed requests
  // Fix for X-Forwarded-For header issue
  trustProxy: process.env.NODE_ENV === 'production',
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many password reset attempts. Please try again in an hour.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Rate limiter for file upload endpoints
exports.uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 20, // 20 uploads per hour
  message: 'Upload limit exceeded, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Upload limit exceeded. Please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Rate limiter for 2FA setup and verification (stricter)
exports.twoFactorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10, // 10 attempts per 15 minutes
  message: 'Too many 2FA attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many 2FA attempts. Please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Rate limiter for 2FA code validation (very strict)
exports.twoFactorValidationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes window
  max: 5, // 5 attempts per 5 minutes
  message: 'Too many 2FA validation attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed requests
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many 2FA validation attempts. Please try again in 5 minutes.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Rate limiter for sensitive operations requiring 2FA
exports.sensitiveOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // 5 sensitive operations per hour
  message: 'Too many sensitive operations, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many sensitive operations. Please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});