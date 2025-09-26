const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderModel'
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['VA', 'Business', 'User'] // Added User for unified model
  },
  body: {
    type: String,
    required: [true, 'Message body is required']
  },
  bodyHtml: {
    type: String,
    required: true
  },
  hiringFeeAcknowledged: {
    type: Boolean,
    default: false
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    contentType: String,
    thumbnailUrl: String // For image/video previews
  }],
  // Enhanced messenger features
  readAt: Date,
  deliveredAt: Date,
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Message status tracking
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
    default: 'sending'
  },
  // Message type for rich content
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'file', 'audio', 'link', 'emoji', 'sticker', 'system'],
    default: 'text'
  },
  // Reactions support
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Reply to specific message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  // Edited message tracking
  editedAt: Date,
  editHistory: [{
    body: String,
    editedAt: Date
  }],
  // Message deletion
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedForEveryone: {
    type: Boolean,
    default: false
  },
  // Admin moderation fields
  adminNote: String,
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'flagged', 'removed'],
    default: 'approved'
  }
}, {
  timestamps: true
});

// Index for conversation lookup and sorting
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

// Auto-generate HTML from plain text if not provided
messageSchema.pre('save', function(next) {
  if (!this.bodyHtml && this.body) {
    // Simple conversion - in production, use a proper markdown library
    this.bodyHtml = this.body
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }
  next();
});

// Update conversation's last message time after saving
messageSchema.post('save', async function(doc) {
  try {
    const Conversation = mongoose.model('Conversation');
    await Conversation.findByIdAndUpdate(doc.conversation, {
      lastMessageAt: doc.createdAt,
      $inc: { messagesCount: 1 }
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
  }
});

// Virtual to check if message is from VA
messageSchema.virtual('isFromVa').get(function() {
  return this.senderModel === 'VA';
});

// Virtual to check if message is from Business
messageSchema.virtual('isFromBusiness').get(function() {
  return this.senderModel === 'Business';
});

// Method to mark as read by a specific user
messageSchema.methods.markAsRead = function(userId) {
  // Check if already read by this user
  const alreadyRead = this.readBy.some(r => r.user.toString() === userId.toString());
  
  if (!alreadyRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
    this.status = 'read';
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to mark as delivered
messageSchema.methods.markAsDelivered = function() {
  if (this.status === 'sent' || this.status === 'sending') {
    this.status = 'delivered';
    this.deliveredAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  const existingReaction = this.reactions.find(r => r.user.toString() === userId.toString());
  
  if (existingReaction) {
    existingReaction.emoji = emoji;
  } else {
    this.reactions.push({ user: userId, emoji });
  }
  
  return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  return this.save();
};

// Method to edit message
messageSchema.methods.editMessage = function(newBody) {
  // Save edit history
  this.editHistory.push({
    body: this.body,
    editedAt: this.editedAt || this.createdAt
  });
  
  this.body = newBody;
  this.editedAt = new Date();
  
  // Auto-generate HTML
  this.bodyHtml = newBody
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  return this.save();
};

// Method to soft delete message
messageSchema.methods.softDelete = function(userId, forEveryone = false) {
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.deletedForEveryone = forEveryone;
  return this.save();
};

module.exports = mongoose.model('Message', messageSchema);