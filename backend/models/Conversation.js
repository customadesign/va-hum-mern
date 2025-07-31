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
    }
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'blocked'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Update last message info when a new message is added
conversationSchema.methods.updateLastMessage = function(message) {
  this.lastMessage = message.content;
  this.lastMessageAt = message.createdAt || new Date();
};

// Mark messages as read for a specific user
conversationSchema.methods.markAsRead = async function(userId) {
  let unreadCount = 0;
  
  this.messages.forEach(message => {
    if (message.sender.toString() !== userId.toString() && !message.read) {
      message.read = true;
      unreadCount++;
    }
  });

  // Update unread count
  if (this.va.toString() === userId.toString()) {
    this.unreadCount.va = 0;
  } else if (this.business.toString() === userId.toString()) {
    this.unreadCount.business = 0;
  }

  return unreadCount;
};

// Add a new message to the conversation
conversationSchema.methods.addMessage = function(senderId, content) {
  const message = {
    sender: senderId,
    content: content,
    read: false
  };

  this.messages.push(message);
  this.updateLastMessage(message);

  // Update unread count for recipient
  if (this.va.toString() === senderId.toString()) {
    this.unreadCount.business++;
  } else {
    this.unreadCount.va++;
  }

  return message;
};

module.exports = mongoose.model('Conversation', conversationSchema);