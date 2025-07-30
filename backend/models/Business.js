const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  contactName: {
    type: String,
    required: [true, 'Please provide contact name'],
    trim: true
  },
  company: {
    type: String,
    required: [true, 'Please provide company name'],
    trim: true
  },
  bio: {
    type: String,
    required: [true, 'Please provide company bio']
  },
  website: {
    type: String,
    trim: true
  },
  contactRole: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  streetAddress: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  postalCode: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  vaNotifications: {
    type: String,
    enum: ['no', 'daily', 'weekly'],
    default: 'no'
  },
  invisible: {
    type: Boolean,
    default: false
  },
  surveyRequestNotifications: {
    type: Boolean,
    default: true
  },
  avatar: {
    type: String // URL to avatar image
  },
  conversationsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for searching
businessSchema.index({ company: 'text', bio: 'text' });
businessSchema.index({ invisible: 1 });

// Virtual for completion percentage
businessSchema.virtual('completionPercentage').get(function() {
  let score = 0;
  const fields = [
    'contactName', 'company', 'bio', 'website', 'contactRole',
    'email', 'phone', 'streetAddress', 'city', 'state', 
    'postalCode', 'country', 'avatar'
  ];
  
  fields.forEach(field => {
    if (this[field]) {
      score += 100 / fields.length;
    }
  });
  
  return Math.round(score);
});

// Virtual for full address
businessSchema.virtual('fullAddress').get(function() {
  const parts = [];
  if (this.streetAddress) parts.push(this.streetAddress);
  if (this.city) parts.push(this.city);
  if (this.state) parts.push(this.state);
  if (this.postalCode) parts.push(this.postalCode);
  if (this.country) parts.push(this.country);
  
  return parts.join(', ');
});

module.exports = mongoose.model('Business', businessSchema);