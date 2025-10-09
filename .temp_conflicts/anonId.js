const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to set persistent anonymous ID for unauthenticated users
 * This helps track profile views and user behavior across sessions
 */
exports.setAnonId = (req, res, next) => {
  const cookieName = 'linkage_anon_id';

  // If user is authenticated, they don't need an anon ID
  if (req.user) {
    return next();
  }

  // Check if anon ID cookie already exists
  let anonId = req.cookies[cookieName];

  // If no anon ID exists, generate a new one
  if (!anonId) {
    anonId = uuidv4();

    // Set cookie with long expiration (1 year)
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    res.cookie(cookieName, anonId, {
      maxAge: oneYearInMs,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    });
  }

  // Attach anonId to request object for use in controllers
  req.anonId = anonId;

  next();
};

/**
 * Middleware to extract session ID from request
 * Can use various sources: custom header, query param, or generate new
 */
exports.setSessionId = (req, res, next) => {
  // Check for session ID in various places
  let sessionId = req.headers['x-session-id'] || req.query.sessionId || req.cookies.session_id;

  // If no session ID exists, generate a new one
  if (!sessionId) {
    sessionId = uuidv4();

    // Set session cookie with shorter expiration (session-based, or 24 hours)
    res.cookie('session_id', sessionId, {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    });
  }

  // Attach sessionId to request object
  req.sessionId = sessionId;

  next();
};

/**
 * Get client IP address, respecting proxy headers
 */
exports.getClientIp = (req) => {
  // Check various headers for IP address (in order of reliability)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp;
  }

  // Fallback to socket address
  return req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
};

module.exports = exports;