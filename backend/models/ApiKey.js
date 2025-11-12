const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  keyHash: {
    type: String,
    required: true,
    unique: true
  },
  keyPrefix: {
    type: String,
    required: true
  },
  scopes: [{
    type: String,
    enum: [
      'read:vas',
      'write:vas',
      'read:messages',
      'write:messages',
      'read:analytics',
      'read:team',
      'write:team',
      'read:settings',
      'write:settings',
      'read:billing',
      'write:billing'
    ]
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'revoked'],
    default: 'active'
  },
  lastUsed: Date,
  usageCount: {
    type: Number,
    default: 0
  },
  expiresAt: Date,
  ipWhitelist: [String],
  rateLimit: {
    requests: {
      type: Number,
      default: 1000
    },
    period: {
      type: String,
      enum: ['minute', 'hour', 'day'],
      default: 'hour'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  revokedAt: Date,
  revokeReason: String
}, {
  timestamps: true
});

// Indexes
apiKeySchema.index({ business: 1, status: 1 });
// Note: keyHash index is automatically created by unique: true
apiKeySchema.index({ keyPrefix: 1 });
apiKeySchema.index({ expiresAt: 1 });

// Static method to generate a new API key
apiKeySchema.statics.generateApiKey = function() {
  const prefix = 'lnkg';
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const apiKey = `${prefix}_${randomBytes}`;
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  const keyPrefix = apiKey.substring(0, 12); // Store first 12 chars for identification
  
  return {
    apiKey, // Return the full key only once (during creation)
    keyHash,
    keyPrefix
  };
};

// Instance method to verify an API key
apiKeySchema.methods.verifyKey = function(apiKey) {
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  return this.keyHash === keyHash;
};

// Check if key is valid
apiKeySchema.methods.isValid = function() {
  if (this.status !== 'active') return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  return true;
};

// Record usage
apiKeySchema.methods.recordUsage = async function() {
  this.lastUsed = new Date();
  this.usageCount += 1;
  await this.save();
};

// Check if scope is allowed
apiKeySchema.methods.hasScope = function(scope) {
  return this.scopes.includes(scope);
};

module.exports = mongoose.model('ApiKey', apiKeySchema);