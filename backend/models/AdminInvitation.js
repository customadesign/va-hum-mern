const mongoose = require('mongoose');
const crypto = require('crypto');

const AdminInvitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  invitedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  invitationToken: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'cancelled'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  },
  acceptedAt: {
    type: Date
  },
  acceptedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  message: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Index for efficient queries
AdminInvitationSchema.index({ email: 1, status: 1 });
AdminInvitationSchema.index({ invitationToken: 1 });
AdminInvitationSchema.index({ expiresAt: 1 });

// Generate invitation token
AdminInvitationSchema.methods.generateInvitationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.invitationToken = crypto.createHash('sha256').update(token).digest('hex');
  return token;
};

// Check if invitation is expired
AdminInvitationSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

// Static method to find valid invitation by token
AdminInvitationSchema.statics.findByToken = function(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return this.findOne({
    invitationToken: hashedToken,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  });
};

// Auto-expire invitations
AdminInvitationSchema.pre('save', function(next) {
  if (this.isExpired() && this.status === 'pending') {
    this.status = 'expired';
  }
  next();
});

module.exports = mongoose.model('AdminInvitation', AdminInvitationSchema);
