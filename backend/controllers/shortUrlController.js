const ShortUrl = require('../models/ShortUrl');
const VA = require('../models/VA');
const { catchAsync } = require('../utils/errorHandler');

// Create a shortened URL for a VA profile
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

  // Create the short URL
  const originalUrl = `${req.protocol}://${req.get('host')}/vas/${vaId}`;
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

  // Redirect to original URL
  res.redirect(shortUrl.originalUrl);
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
  redirectShortUrl,
  getShortUrlInfo,
  getUserShortUrls,
  deactivateShortUrl,
  reactivateShortUrl
}; 