const User = require('../models/User');
const geoip = require('geoip-lite');
const crypto = require('crypto');

/**
 * Middleware to track user login sessions for security monitoring
 * This should be used after successful authentication
 */
const trackLoginSession = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return next();
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return next();
    }

    // Parse user agent to get device/browser info
    const userAgent = req.headers['user-agent'] || '';
    const deviceInfo = parseUserAgent(userAgent);
    
    // Get location from IP address
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                     (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                     req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
    
    const location = getLocationFromIP(ipAddress);
    
    // Generate unique session ID
    const sessionId = crypto.randomBytes(16).toString('hex');
    
    // Create new session object
    const newSession = {
      id: sessionId,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      location: location,
      ipAddress: ipAddress,
      timestamp: new Date(),
      current: true,
      userAgent: userAgent
    };

    // Initialize loginSessions if it doesn't exist
    if (!user.loginSessions) {
      user.loginSessions = [];
    }

    // Mark all existing sessions as not current
    user.loginSessions.forEach(session => {
      session.current = false;
    });

    // Add new session
    user.loginSessions.push(newSession);

    // Keep only the last 10 sessions to prevent bloat
    if (user.loginSessions.length > 10) {
      user.loginSessions = user.loginSessions.slice(-10);
    }

    // Update user stats
    user.stats = user.stats || {};
    user.stats.totalLogins = (user.stats.totalLogins || 0) + 1;
    user.stats.lastActive = new Date();

    await user.save();

    // Store session ID in request for potential use by other middleware
    req.sessionId = sessionId;

    next();
  } catch (error) {
    console.error('Error tracking login session:', error);
    // Don't fail the request if session tracking fails
    next();
  }
};

/**
 * Parse user agent string to extract device, browser, and OS information
 */
function parseUserAgent(userAgent) {
  const result = {
    device: 'Unknown Device',
    browser: 'Unknown Browser',
    os: 'Unknown OS'
  };

  if (!userAgent) return result;

  // Detect device type
  if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
    if (/iPhone/i.test(userAgent)) result.device = 'iPhone';
    else if (/iPad/i.test(userAgent)) result.device = 'iPad';
    else if (/Android/i.test(userAgent)) result.device = 'Android';
    else result.device = 'Mobile';
  } else {
    result.device = 'Desktop';
  }

  // Detect browser
  if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) {
    result.browser = 'Chrome';
  } else if (/Firefox/i.test(userAgent)) {
    result.browser = 'Firefox';
  } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
    result.browser = 'Safari';
  } else if (/Edg/i.test(userAgent)) {
    result.browser = 'Edge';
  } else if (/Opera/i.test(userAgent)) {
    result.browser = 'Opera';
  }

  // Detect OS
  if (/Windows/i.test(userAgent)) {
    result.os = 'Windows';
  } else if (/Mac OS X/i.test(userAgent)) {
    result.os = 'macOS';
  } else if (/Linux/i.test(userAgent)) {
    result.os = 'Linux';
  } else if (/Android/i.test(userAgent)) {
    result.os = 'Android';
  } else if (/iOS/i.test(userAgent)) {
    result.os = 'iOS';
  }

  return result;
}

/**
 * Get approximate location from IP address
 */
function getLocationFromIP(ipAddress) {
  try {
    // Skip private/local IP addresses
    if (!ipAddress || ipAddress === 'unknown' || 
        ipAddress.startsWith('192.168.') || 
        ipAddress.startsWith('10.') || 
        ipAddress.startsWith('172.') ||
        ipAddress === '127.0.0.1' ||
        ipAddress === '::1') {
      return 'Local/Private Network';
    }

    const geo = geoip.lookup(ipAddress);
    if (geo) {
      return `${geo.city || 'Unknown City'}, ${geo.region || ''} ${geo.country || 'Unknown'}`.trim();
    }
  } catch (error) {
    console.error('Error getting location from IP:', error);
  }
  
  return 'Unknown Location';
}

/**
 * Middleware to update current session activity
 * Use this on protected routes to track user activity
 */
const updateSessionActivity = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return next();
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.loginSessions) {
      return next();
    }

    // Find current session and update last activity
    const currentSession = user.loginSessions.find(session => session.current);
    if (currentSession) {
      currentSession.lastActivity = new Date();
      user.stats = user.stats || {};
      user.stats.lastActive = new Date();
      await user.save();
    }

    next();
  } catch (error) {
    console.error('Error updating session activity:', error);
    next();
  }
};

/**
 * Clean up old sessions (can be run periodically)
 */
const cleanupOldSessions = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    await User.updateMany(
      { 'loginSessions.timestamp': { $lt: thirtyDaysAgo } },
      { 
        $pull: { 
          loginSessions: { 
            timestamp: { $lt: thirtyDaysAgo } 
          } 
        } 
      }
    );
    
    console.log('Old login sessions cleaned up');
  } catch (error) {
    console.error('Error cleaning up old sessions:', error);
  }
};

module.exports = {
  trackLoginSession,
  updateSessionActivity,
  cleanupOldSessions
};