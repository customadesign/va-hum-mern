const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  countryCode: {
    type: String,
    required: true,
    uppercase: true,
    length: 2
  },
  latitude: {
    type: Number,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    min: -180,
    max: 180
  },
  timeZone: {
    type: String,
    required: true
  },
  utcOffset: {
    type: Number,
    required: true
  },
  streetAddress: {
    type: String,
    trim: true
  },
  postalCode: {
    type: String,
    trim: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed // For storing additional geocoding data
  }
}, {
  timestamps: true
});

// Indexes for searching
locationSchema.index({ city: 1, country: 1 });
locationSchema.index({ countryCode: 1 });
locationSchema.index({ latitude: 1, longitude: 1 });

// Virtual for full location string
locationSchema.virtual('fullLocation').get(function() {
  const parts = [];
  if (this.city) parts.push(this.city);
  if (this.state) parts.push(this.state);
  if (this.country) parts.push(this.country);
  
  return parts.join(', ');
});

// Virtual for short location (city, country code)
locationSchema.virtual('shortLocation').get(function() {
  return `${this.city}, ${this.countryCode}`;
});

module.exports = mongoose.model('Location', locationSchema);