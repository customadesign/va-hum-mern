const mongoose = require('mongoose');
const crypto = require('crypto');

const profileViewSchema = new mongoose.Schema({
  // The VA whose profile was viewed (references User model)
  va: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Optional: authenticated user who viewed the profile
  viewerUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },

  // Optional: anonymous ID for unauthenticated viewers (from cookie)
  anonId: {
    type: String,
    default: null,
    index: true
  },

  // Optional: session ID for additional tracking
  sessionId: {
    type: String,
    default: null
  },

  // Optional: referrer URL
  referrer: {
    type: String,
    default: null,
    maxlength: 1000
  },

  // Optional: user agent string
  userAgent: {
    type: String,
    default: null,
    maxlength: 500
  },

  // Hashed IP address (never store raw IP)
  ipHash: {
    type: String,
    default: null,
    index: true
  },

  // Deduplication hash: prevents counting same viewer multiple times within time window
  // Format: sha256(vaId + viewerKey + timeBucketStart)
  dedupHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // When the view occurred
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false // We only need createdAt
});

// Compound indexes for efficient queries
profileViewSchema.index({ va: 1, createdAt: -1 });
profileViewSchema.index({ va: 1, viewerUser: 1, createdAt: -1 });
profileViewSchema.index({ va: 1, anonId: 1, createdAt: -1 });

// Static method to generate deduplication hash
profileViewSchema.statics.generateDedupHash = function(vaId, viewerKey, timestamp) {
  // Get time bucket start (30-minute windows by default)
  const dedupMinutes = parseInt(process.env.PROFILE_VIEWS_DEDUP_MINUTES || '30', 10);
  const timeBucketMs = dedupMinutes * 60 * 1000;
  const timeBucketStart = Math.floor(timestamp / timeBucketMs) * timeBucketMs;

  // Create hash: vaId + viewerKey + timeBucketStart
  const data = `${vaId}|${viewerKey}|${timeBucketStart}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Static method to hash IP address
profileViewSchema.statics.hashIp = function(ip) {
  if (!ip) return null;

  const salt = process.env.IP_HASH_SALT || 'dev-local-salt-change-in-prod';
  return crypto.createHash('sha256').update(ip + salt).digest('hex');
};

// Static method to detect bots from user agent
profileViewSchema.statics.isBot = function(userAgent) {
  if (!userAgent) return false;

  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
    /java\//i,
    /go-http-client/i,
    /axios/i,
    /fetch/i,
    /okhttp/i,
    /lighthouse/i,
    /pagespeed/i,
    /gtmetrix/i,
    /pingdom/i,
    /uptime/i
  ];

  return botPatterns.some(pattern => pattern.test(userAgent));
};

// Static method to extract viewer key (for deduplication)
profileViewSchema.statics.extractViewerKey = function(viewerData) {
  // Priority: authenticated user > anonId > ipHash
  if (viewerData.viewerUser) {
    return `user:${viewerData.viewerUser}`;
  }
  if (viewerData.anonId) {
    return `anon:${viewerData.anonId}`;
  }
  if (viewerData.ipHash) {
    return `ip:${viewerData.ipHash}`;
  }
  return 'unknown';
};

module.exports = mongoose.model('ProfileView', profileViewSchema);