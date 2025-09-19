const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Enhanced typing indicator schema
const typingIndicatorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  va: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [messageSchema],
  lastMessage: {
    type: String
  },
  lastMessageAt: {
    type: Date
  },
  unreadCount: {
    va: {
      type: Number,
      default: 0
    },
    business: {
      type: Number,
      default: 0
    },
    admin: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'blocked'],
    default: 'active'
  },
  // Enhanced messenger features
  theme: {
    type: String,
    default: 'default' // Can be customized per conversation
  },
  emoji: {
    type: String,
    default: '👍' // Default reaction emoji
  },
  nickname: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    nickname: String
  }],
  // Typing indicators
  typingIndicators: [typingIndicatorSchema],
  // Mute settings per user
  mutedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    mutedUntil: Date,
    mutedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Pin conversation for users
  pinnedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    pinnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Group conversation support (future enhancement)
  isGroup: {
    type: Boolean,
    default: false
  },
  groupName: String,
  groupAvatar: String,
  groupAdmins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Call history
  calls: [{
    type: {
      type: String,
      enum: ['voice', 'video'],
      required: true
    },
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    participants: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      joinedAt: Date,
      leftAt: Date
    }],
    startedAt: Date,
    endedAt: Date,
    duration: Number, // in seconds
    status: {
      type: String,
      enum: ['ringing', 'active', 'ended', 'missed', 'declined'],
      default: 'ringing'
    }
  }],
  // Intercept fields for admin proxy system
  isIntercepted: {
    type: Boolean,
    default: false  // True when business initiates conversation with VA
  },
  originalSender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'  // Tracks the original business that initiated contact
  },
  adminConversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'  // Links to the admin-VA conversation if admin has initiated contact
  },
  interceptedAt: {
    type: Date  // When the conversation was intercepted
  },
  adminNotes: {
    type: String  // Admin notes about the intercepted conversation
  },
  adminStatus: {
    type: String,
    enum: ['pending', 'forwarded', 'replied', 'resolved', 'spam'],
    default: 'pending'
  },
  forwardedAt: {
    type: Date  // When the conversation was forwarded to VA
  },
  repliedAt: {
    type: Date  // When admin replied to the business
  },
  adminActions: [{
    action: {
      type: String,
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

// Update last message info when a new message is added
conversationSchema.methods.updateLastMessage = function(message) {
  this.lastMessage = message.content || message.body;
  this.lastMessageAt = message.createdAt || new Date();
};

// Add typing indicator
conversationSchema.methods.addTypingIndicator = function(userId) {
  // Remove existing indicator for this user
  this.typingIndicators = this.typingIndicators.filter(
    indicator => indicator.user.toString() !== userId.toString()
  );
  
  // Add new indicator
  this.typingIndicators.push({ user: userId });
  
  // Auto-remove after 5 seconds (handled by frontend/socket)
  return this.save();
};

// Remove typing indicator
conversationSchema.methods.removeTypingIndicator = function(userId) {
  this.typingIndicators = this.typingIndicators.filter(
    indicator => indicator.user.toString() !== userId.toString()
  );
  return this.save();
};

// Mute conversation
conversationSchema.methods.muteConversation = function(userId, until) {
  const existingMute = this.mutedBy.find(m => m.user.toString() === userId.toString());
  
  if (existingMute) {
    existingMute.mutedUntil = until;
    existingMute.mutedAt = new Date();
  } else {
    this.mutedBy.push({ user: userId, mutedUntil: until });
  }
  
  return this.save();
};

// Unmute conversation
conversationSchema.methods.unmuteConversation = function(userId) {
  this.mutedBy = this.mutedBy.filter(m => m.user.toString() !== userId.toString());
  return this.save();
};

// Pin conversation
conversationSchema.methods.pinConversation = function(userId) {
  const alreadyPinned = this.pinnedBy.some(p => p.user.toString() === userId.toString());
  
  if (!alreadyPinned) {
    this.pinnedBy.push({ user: userId });
  }
  
  return this.save();
};

// Unpin conversation
conversationSchema.methods.unpinConversation = function(userId) {
  this.pinnedBy = this.pinnedBy.filter(p => p.user.toString() !== userId.toString());
  return this.save();
};

// Get conversation display info for a specific user
conversationSchema.methods.getDisplayInfo = function(userId) {
  const isPinned = this.pinnedBy.some(p => p.user.toString() === userId.toString());
  const isMuted = this.mutedBy.some(m => {
    if (m.user.toString() !== userId.toString()) return false;
    if (!m.mutedUntil) return true;
    return new Date(m.mutedUntil) > new Date();
  });
  
  return {
    isPinned,
    isMuted,
    theme: this.theme,
    emoji: this.emoji
  };
};

// Mark messages as read for a specific user
conversationSchema.methods.markAsRead = async function(userId, isAdmin = false) {
  let unreadCount = 0;
  
  this.messages.forEach(message => {
    if (message.sender.toString() !== userId.toString() && !message.read) {
      message.read = true;
      unreadCount++;
    }
  });

  // Update unread count based on user role
  if (isAdmin) {
    this.unreadCount.admin = 0;
  } else if (this.va.toString() === userId.toString()) {
    this.unreadCount.va = 0;
  } else if (this.business.toString() === userId.toString()) {
    this.unreadCount.business = 0;
  }

  return unreadCount;
};

// Add a new message to the conversation
conversationSchema.methods.addMessage = function(senderId, content, isAdmin = false) {
  const message = {
    sender: senderId,
    content: content,
    read: false
  };

  this.messages.push(message);
  this.updateLastMessage(message);

  // Update unread count for recipients
  if (this.isIntercepted && !isAdmin) {
    // For intercepted conversations, notify admin instead of VA
    this.unreadCount.admin++;
  } else if (isAdmin) {
    // Admin sending message - notify the intended recipient
    if (this.va.toString() === senderId.toString()) {
      this.unreadCount.business++;
    } else {
      this.unreadCount.va++;
    }
  } else {
    // Normal conversation flow
    if (this.va.toString() === senderId.toString()) {
      this.unreadCount.business++;
    } else {
      this.unreadCount.va++;
    }
  }

  return message;
};

module.exports = mongoose.model('Conversation', conversationSchema);