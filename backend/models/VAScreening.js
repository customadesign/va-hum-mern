const mongoose = require('mongoose');

const vaScreeningSchema = new mongoose.Schema({
  va: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VA',
    required: true,
    unique: true
  },
  // Basic Information
  vaType: {
    type: String,
    enum: ['general', 'executive', 'technical', 'creative', 'sales', 'customer_service', 'other'],
    required: true
  },
  experienceYears: {
    type: Number,
    min: 0,
    required: true
  },
  industries: [{
    type: String,
    trim: true
  }],
  primarySkills: [{
    type: String,
    trim: true
  }],
  secondarySkills: [{
    type: String,
    trim: true
  }],
  
  // Work Preferences
  workEnvironment: {
    type: String,
    enum: ['remote', 'hybrid', 'onsite'],
    default: 'remote'
  },
  availability: {
    type: String,
    enum: ['immediate', 'two_weeks', 'one_month', 'flexible'],
    required: true
  },
  hoursPerWeek: {
    min: {
      type: Number,
      min: 0,
      max: 168
    },
    max: {
      type: Number,
      min: 0,
      max: 168
    }
  },
  timezone: {
    type: String,
    required: true
  },
  
  // Communication & Language
  englishProficiency: {
    type: String,
    enum: ['native', 'fluent', 'advanced', 'intermediate', 'basic'],
    required: true
  },
  otherLanguages: [{
    language: String,
    proficiency: {
      type: String,
      enum: ['native', 'fluent', 'advanced', 'intermediate', 'basic']
    }
  }],
  communicationStyle: {
    type: String,
    enum: ['formal', 'casual', 'adaptive'],
    default: 'adaptive'
  },
  
  // Experience Details
  projectManagementExperience: {
    type: Boolean,
    default: false
  },
  teamManagementExperience: {
    type: Boolean,
    default: false
  },
  clientFacingExperience: {
    type: Boolean,
    default: false
  },
  
  // Tools & Software
  toolsUsed: [{
    category: String,
    tools: [String]
  }],
  
  // Additional Information
  strengths: {
    type: String,
    maxlength: 500
  },
  idealClient: {
    type: String,
    maxlength: 500
  },
  careerGoals: {
    type: String,
    maxlength: 500
  },
  
  // Salary Expectations
  salaryExpectations: {
    currency: {
      type: String,
      default: 'USD'
    },
    hourlyMin: Number,
    hourlyMax: Number,
    monthlyMin: Number,
    monthlyMax: Number
  },
  
  // Screening Status
  completedAt: Date,
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // References
  hasReferences: {
    type: Boolean,
    default: false
  },
  references: [{
    name: String,
    company: String,
    position: String,
    email: String,
    phone: String,
    relationship: String
  }]
}, {
  timestamps: true
});

// Index for lookup and filtering
// Note: va already has unique index from schema definition
vaScreeningSchema.index({ completedAt: 1 });
vaScreeningSchema.index({ vaType: 1 });
vaScreeningSchema.index({ experienceYears: 1 });

// Calculate completion percentage before saving
vaScreeningSchema.pre('save', function(next) {
  const requiredFields = [
    'vaType', 'experienceYears', 'industries', 'primarySkills',
    'availability', 'englishProficiency', 'timezone'
  ];
  
  const optionalFields = [
    'secondarySkills', 'workEnvironment', 'hoursPerWeek',
    'otherLanguages', 'communicationStyle', 'projectManagementExperience',
    'teamManagementExperience', 'clientFacingExperience', 'toolsUsed',
    'strengths', 'idealClient', 'careerGoals', 'salaryExpectations'
  ];
  
  let completedRequired = 0;
  let completedOptional = 0;
  
  // Check required fields (70% weight)
  requiredFields.forEach(field => {
    if (this[field] && (Array.isArray(this[field]) ? this[field].length > 0 : true)) {
      completedRequired++;
    }
  });
  
  // Check optional fields (30% weight)
  optionalFields.forEach(field => {
    if (this[field] && (Array.isArray(this[field]) ? this[field].length > 0 : true)) {
      completedOptional++;
    }
  });
  
  const requiredPercentage = (completedRequired / requiredFields.length) * 70;
  const optionalPercentage = (completedOptional / optionalFields.length) * 30;
  
  this.completionPercentage = Math.round(requiredPercentage + optionalPercentage);
  
  // Mark as completed if 100%
  if (this.completionPercentage === 100 && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

module.exports = mongoose.model('VAScreening', vaScreeningSchema);