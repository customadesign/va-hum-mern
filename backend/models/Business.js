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
  },
  // LinkedIn-like company fields
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10000+'],
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  foundedYear: {
    type: Number,
    min: 1800,
    max: new Date().getFullYear()
  },
  employeeCount: {
    type: Number,
    min: 0
  },
  specialties: [{
    type: String,
    trim: true
  }],
  companyCulture: {
    type: String,
    trim: true
  },
  benefits: [{
    type: String,
    trim: true
  }],
  workEnvironment: {
    type: String,
    enum: ['remote', 'hybrid', 'onsite', 'flexible'],
    trim: true
  },
  headquartersLocation: {
    type: String,
    trim: true
  },
  // Social media links
  linkedin: {
    type: String,
    trim: true
  },
  facebook: {
    type: String,
    trim: true
  },
  twitter: {
    type: String,
    trim: true
  },
  instagram: {
    type: String,
    trim: true
  },
  youtube: {
    type: String,
    trim: true
  },
  // Additional professional information
  certifications: [{
    type: String,
    trim: true
  }],
  awards: [{
    type: String,
    trim: true
  }],
  companyValues: [{
    type: String,
    trim: true
  }],
  workingHours: {
    type: String,
    trim: true
  },
  languages: [{
    type: String,
    trim: true
  }],
  missionStatement: {
    type: String,
    trim: true
  },
  vaRequirements: {
    type: String,
    trim: true
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
  const requiredFields = [
    'contactName', 'company', 'bio', 'website', 'contactRole',
    'email', 'phone', 'avatar'
  ];
  
  const professionalFields = [
    'companySize', 'industry', 'foundedYear', 'specialties',
    'companyCulture', 'workEnvironment', 'headquartersLocation',
    'missionStatement', 'vaRequirements'
  ];
  
  const locationFields = [
    'streetAddress', 'city', 'state', 'postalCode', 'country'
  ];
  
  const socialFields = [
    'linkedin', 'facebook', 'twitter', 'instagram'
  ];
  
  // Required fields are worth more (60% of total)
  const requiredWeight = 60;
  const professionalWeight = 25;
  const locationWeight = 10;
  const socialWeight = 5;
  
  // Calculate required fields score
  let requiredScore = 0;
  requiredFields.forEach(field => {
    if (this[field] && (Array.isArray(this[field]) ? this[field].length > 0 : true)) {
      requiredScore += requiredWeight / requiredFields.length;
    }
  });
  
  // Calculate professional fields score
  let professionalScore = 0;
  professionalFields.forEach(field => {
    if (this[field] && (Array.isArray(this[field]) ? this[field].length > 0 : true)) {
      professionalScore += professionalWeight / professionalFields.length;
    }
  });
  
  // Calculate location fields score (at least 3 fields needed)
  let locationScore = 0;
  let locationFieldsCompleted = 0;
  locationFields.forEach(field => {
    if (this[field]) {
      locationFieldsCompleted++;
    }
  });
  if (locationFieldsCompleted >= 3) {
    locationScore = locationWeight;
  } else {
    locationScore = (locationFieldsCompleted / 3) * locationWeight;
  }
  
  // Calculate social fields score (at least 1 social link)
  let socialScore = 0;
  let socialFieldsCompleted = 0;
  socialFields.forEach(field => {
    if (this[field]) {
      socialFieldsCompleted++;
    }
  });
  if (socialFieldsCompleted >= 1) {
    socialScore = socialWeight;
  }
  
  const totalScore = requiredScore + professionalScore + locationScore + socialScore;
  return Math.round(totalScore);
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