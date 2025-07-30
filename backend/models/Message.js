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
    enum: ['VA', 'Business']
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
    contentType: String
  }],
  readAt: Date,
  deliveredAt: Date
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

// Method to mark as read
messageSchema.methods.markAsRead = function() {
  if (!this.readAt) {
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

module.exports = mongoose.model('Message', messageSchema);