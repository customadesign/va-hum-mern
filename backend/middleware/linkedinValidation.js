const validateLinkedInConfig = (req, res, next) => {
  // Only validate on LinkedIn OAuth routes
  if (!req.path.includes('/linkedin')) {
    return next();
  }

  // Check if LinkedIn is properly configured
  if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
    return res.status(503).json({
      error: 'LinkedIn authentication is not configured',
      message: 'LinkedIn OAuth is currently disabled. Please contact support.',
      configured: false,
      timestamp: new Date().toISOString()
    });
  }

  // Validate redirect URI doesn't contain common mistakes
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://linkage-va-hub.onrender.com/auth/linkedin/callback'
      : 'http://localhost:3000/auth/linkedin/callback');

  const errors = [];
  
  // Check for API URL in redirect URI (common mistake)
  if (redirectUri.includes('/api/')) {
    errors.push('Redirect URI contains /api/ - this should be the frontend URL');
  }
  
  if (redirectUri.includes('-api.onrender.com')) {
    errors.push('Redirect URI points to API domain - should be frontend domain');
  }
  
  // Check for localhost in production
  if (process.env.NODE_ENV === 'production' && redirectUri.includes('localhost')) {
    errors.push('Using localhost redirect URI in production environment');
  }

  // Log configuration issues but don't block the request
  if (errors.length > 0) {
    console.warn('LinkedIn OAuth Configuration Warnings:', {
      errors,
      currentRedirectUri: redirectUri,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  }

  // Attach config to request for use in routes
  req.linkedinConfig = {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    redirectUri,
    hasConfigIssues: errors.length > 0,
    configErrors: errors
  };

  next();
};

// Middleware to log LinkedIn OAuth attempts for debugging
const logLinkedInRequest = (req, res, next) => {
  if (req.path.includes('/linkedin/callback')) {
    console.log('LinkedIn OAuth Callback Request:', {
      method: req.method,
      headers: {
        origin: req.headers.origin,
        referer: req.headers.referer,
        'content-type': req.headers['content-type']
      },
      body: req.body ? {
        hasCode: !!req.body.code,
        codePreview: req.body.code ? `${req.body.code.substring(0, 10)}...` : null
      } : 'no body',
      query: req.query,
      timestamp: new Date().toISOString()
    });
  }
  next();
};

module.exports = {
  validateLinkedInConfig,
  logLinkedInRequest
};