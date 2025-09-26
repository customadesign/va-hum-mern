const mongoose = require('mongoose');

const shortUrlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
    trim: true
  },
  shortCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  vaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VA',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Not required for public shares
  },
  isPublicShare: {
    type: Boolean,
    default: false
  },
  clicks: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: null // null means never expires
  }
}, {
  timestamps: true
});

// Index for faster lookups (shortCode already indexed due to unique: true)
shortUrlSchema.index({ vaId: 1 });
shortUrlSchema.index({ isActive: 1 });

// Generate a random short code
shortUrlSchema.statics.generateShortCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Check if short code exists
shortUrlSchema.statics.isCodeUnique = async function(code) {
  const existing = await this.findOne({ shortCode: code });
  return !existing;
};

module.exports = mongoose.model('ShortUrl', shortUrlSchema); 