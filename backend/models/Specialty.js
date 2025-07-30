const mongoose = require('mongoose');

const specialtySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['technical', 'administrative', 'creative', 'marketing', 'sales', 'customer_service', 'other'],
    default: 'other'
  },
  description: {
    type: String,
    trim: true
  },
  vasCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for searching and sorting
// Note: name and slug already have unique indexes from schema definition
specialtySchema.index({ category: 1 });
specialtySchema.index({ vasCount: -1 });

// Generate slug from name before saving
specialtySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  }
  next();
});

module.exports = mongoose.model('Specialty', specialtySchema);