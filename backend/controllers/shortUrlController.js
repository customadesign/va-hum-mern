const ShortUrl = require('../models/ShortUrl');
const VA = require('../models/VA');
const { catchAsync } = require('../utils/errorHandler');

// Create a shortened URL for a VA profile (authenticated users only)
const createShortUrl = catchAsync(async (req, res) => {
  const { vaId } = req.params;
  const userId = req.user.id;

  // Verify the VA exists and user has permission
  const va = await VA.findById(vaId);
  if (!va) {
    return res.status(404).json({ error: 'VA profile not found' });
  }

  // Check if user owns this VA profile or is admin
  if (va.user.toString() !== userId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to create short URL for this profile' });
  }

  // Check if a short URL already exists for this VA
  const existingShortUrl = await ShortUrl.findOne({ vaId, isActive: true });
  if (existingShortUrl) {
    return res.status(400).json({ 
      error: 'A short URL already exists for this profile',
      shortUrl: existingShortUrl
    });
  }

  // Generate unique short code
  let shortCode;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    shortCode = ShortUrl.generateShortCode();
    attempts++;
    if (attempts > maxAttempts) {
      return res.status(500).json({ error: 'Unable to generate unique short code' });
    }
  } while (!(await ShortUrl.isCodeUnique(shortCode)));

  // Store only the relative path - redirect URL will be constructed dynamically
  const originalUrl = `/vas/${vaId}`;
  const shortUrl = new ShortUrl({
    originalUrl,
    shortCode,
    vaId,
    createdBy: userId
  });

  await shortUrl.save();

  res.status(201).json({
    success: true,
    data: {
      shortUrl: shortUrl,
      fullShortUrl: `${req.protocol}://${req.get('host')}/s/${shortCode}`
    }
  });
});

// Create a shortened URL for a VA profile (PUBLIC - no authentication required)
const createPublicVAShortUrl = catchAsync(async (req, res) => {
  const { vaId } = req.params;

  // Verify the VA exists
  const va = await VA.findById(vaId);
  if (!va) {
    return res.status(404).json({ error: 'VA profile not found' });
  }

  // Check if a short URL already exists for this VA
  const existingShortUrl = await ShortUrl.findOne({ vaId, isActive: true });
  if (existingShortUrl) {
    // Return the existing short URL instead of error - public sharing should work
    const fullShortUrl = existingShortUrl.fullShortUrl || `${req.protocol}://${req.get('host')}/s/${existingShortUrl.shortCode}`;
    return res.status(200).json({ 
      success: true,
      data: {
        shortUrl: existingShortUrl,
        fullShortUrl: fullShortUrl
      }
    });
  }

  // Generate unique short code
  let shortCode;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    shortCode = ShortUrl.generateShortCode();
    attempts++;
    if (attempts > maxAttempts) {
      return res.status(500).json({ error: 'Unable to generate unique short code' });
    }
  } while (!(await ShortUrl.isCodeUnique(shortCode)));

  // Store only the relative path - redirect URL will be constructed dynamically
  const originalUrl = `/vas/${vaId}`;
  const shortUrl = new ShortUrl({
    originalUrl,
    shortCode,
    vaId,
    createdBy: null, // No user required for public sharing
    isPublicShare: true // Mark as public share
  });

  await shortUrl.save();

  const fullShortUrl = `${req.protocol}://${req.get('host')}/s/${shortCode}`;
  
  res.status(201).json({
    success: true,
    data: {
      shortUrl: shortUrl,
      fullShortUrl: fullShortUrl
    }
  });
});

// Redirect short URL to original URL
const redirectShortUrl = catchAsync(async (req, res) => {
  const { shortCode } = req.params;

  const shortUrl = await ShortUrl.findOne({ 
    shortCode, 
    isActive: true 
  }).populate('vaId');

  if (!shortUrl) {
    return res.status(404).json({ error: 'Short URL not found or inactive' });
  }

  // Check if URL has expired
  if (shortUrl.expiresAt && new Date() > shortUrl.expiresAt) {
    return res.status(410).json({ error: 'Short URL has expired' });
  }

  // Increment click count
  shortUrl.clicks += 1;
  await shortUrl.save();

  // Dynamically construct the frontend URL based on the current request
  // This ensures the redirect always uses the correct domain (production or local)
  const protocol = req.protocol;
  const host = req.get('host');
  
  // Determine the frontend host based on the API host
  let frontendHost;
  if (host.includes('linkage-va-hub-api.onrender.com')) {
    // Production API -> Production Frontend
    frontendHost = 'linkage-va-hub.onrender.com';
  } else if (host.includes('localhost') || host.includes('127.0.0.1')) {
    // Local API -> Local Frontend
    frontendHost = 'localhost:3000';
  } else {
    // Fallback: use environment variable or default
    frontendHost = process.env.FRONTEND_URL?.replace(/^https?:\/\//, '') || 'linkage-va-hub.onrender.com';
  }
  
  // Construct redirect URL with share parameter and shortlink tracking
  const separator = shortUrl.originalUrl.includes('?') ? '&' : '?';
  const redirectUrl = `${protocol}://${frontendHost}${shortUrl.originalUrl}${separator}share=true&via=shortlink`;
  
  res.redirect(redirectUrl);
});

// Get short URL info (for analytics)
const getShortUrlInfo = catchAsync(async (req, res) => {
  const { shortCode } = req.params;
  const userId = req.user.id;

  const shortUrl = await ShortUrl.findOne({ shortCode })
    .populate('vaId', 'name hero')
    .populate('createdBy', 'name email');

  if (!shortUrl) {
    return res.status(404).json({ error: 'Short URL not found' });
  }

  // Check if user has permission to view this info
  if (shortUrl.createdBy._id.toString() !== userId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to view this short URL info' });
  }

  res.json({
    success: true,
    data: shortUrl
  });
});

// Get all short URLs for a user
const getUserShortUrls = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const shortUrls = await ShortUrl.find({ createdBy: userId })
    .populate('vaId', 'name hero')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: shortUrls
  });
});

// Deactivate a short URL
const deactivateShortUrl = catchAsync(async (req, res) => {
  const { shortCode } = req.params;
  const userId = req.user.id;

  const shortUrl = await ShortUrl.findOne({ shortCode });

  if (!shortUrl) {
    return res.status(404).json({ error: 'Short URL not found' });
  }

  // Check if user has permission
  if (shortUrl.createdBy.toString() !== userId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to deactivate this short URL' });
  }

  shortUrl.isActive = false;
  await shortUrl.save();

  res.json({
    success: true,
    message: 'Short URL deactivated successfully'
  });
});

// Reactivate a short URL
const reactivateShortUrl = catchAsync(async (req, res) => {
  const { shortCode } = req.params;
  const userId = req.user.id;

  const shortUrl = await ShortUrl.findOne({ shortCode });

  if (!shortUrl) {
    return res.status(404).json({ error: 'Short URL not found' });
  }

  // Check if user has permission
  if (shortUrl.createdBy.toString() !== userId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to reactivate this short URL' });
  }

  shortUrl.isActive = true;
  await shortUrl.save();

  res.json({
    success: true,
    message: 'Short URL reactivated successfully'
  });
});

module.exports = {
  createShortUrl,
  createPublicVAShortUrl,
  redirectShortUrl,
  getShortUrlInfo,
  getUserShortUrls,
  deactivateShortUrl,
  reactivateShortUrl
};