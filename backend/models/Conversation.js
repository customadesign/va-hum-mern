const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  va: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VA',
    required: true
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  vaBlockedAt: Date,
  businessBlockedAt: Date,
  inboundEmailToken: {
    type: String,
    unique: true,
    sparse: true
  },
  userWithUnreadMessages: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  messagesCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Unique constraint for VA and Business combination
conversationSchema.index({ va: 1, business: 1 }, { unique: true });

// Index for sorting and filtering
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ vaBlockedAt: 1 });
conversationSchema.index({ businessBlockedAt: 1 });
conversationSchema.index({ userWithUnreadMessages: 1 });

// Generate inbound email token before saving
conversationSchema.pre('save', async function(next) {
  if (!this.isNew || this.inboundEmailToken) return next();
  
  const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };
  
  let token;
  let exists = true;
  
  while (exists) {
    token = generateToken();
    exists = await mongoose.model('Conversation').findOne({ inboundEmailToken: token });
  }
  
  this.inboundEmailToken = token;
  next();
});

// Virtual to check if conversation is blocked
conversationSchema.virtual('isBlocked').get(function() {
  return !!(this.vaBlockedAt || this.businessBlockedAt);
});

// Virtual to check if blocked by VA
conversationSchema.virtual('blockedByVa').get(function() {
  return !!this.vaBlockedAt;
});

// Virtual to check if blocked by Business
conversationSchema.virtual('blockedByBusiness').get(function() {
  return !!this.businessBlockedAt;
});

// Method to block conversation
conversationSchema.methods.block = function(blockerType) {
  if (blockerType === 'va') {
    this.vaBlockedAt = new Date();
  } else if (blockerType === 'business') {
    this.businessBlockedAt = new Date();
  }
  return this.save();
};

// Method to unblock conversation
conversationSchema.methods.unblock = function(unblockerType) {
  if (unblockerType === 'va') {
    this.vaBlockedAt = undefined;
  } else if (unblockerType === 'business') {
    this.businessBlockedAt = undefined;
  }
  return this.save();
};

// Method to mark as read
conversationSchema.methods.markAsRead = function(userId) {
  if (this.userWithUnreadMessages && this.userWithUnreadMessages.toString() === userId.toString()) {
    this.userWithUnreadMessages = undefined;
    return this.save();
  }
  return Promise.resolve(this);
};

module.exports = mongoose.model('Conversation', conversationSchema);