const mongoose = require('mongoose');

const vaSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  hero: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    required: [true, 'Please provide a bio']
  },
  coverImage: {
    type: String,
    trim: true,
    default: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=300&fit=crop'
  },
  website: {
    type: String,
    trim: true
  },
  github: {
    type: String,
    trim: true
  },
  gitlab: {
    type: String,
    trim: true
  },
  linkedin: {
    type: String,
    trim: true
  },
  twitter: {
    type: String,
    trim: true
  },
  mastodon: {
    type: String,
    trim: true
  },
  stackoverflow: {
    type: String,
    trim: true
  },
  schedulingLink: {
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
  whatsapp: {
    type: String,
    trim: true
  },
  viber: {
    type: String,
    trim: true
  },
  searchStatus: {
    type: String,
    enum: ['actively_looking', 'open', 'not_interested', 'invisible'],
    default: 'open'
  },
  preferredMinHourlyRate: {
    type: Number,
    min: 0
  },
  preferredMaxHourlyRate: {
    type: Number,
    min: 0
  },
  preferredMinSalary: {
    type: Number,
    min: 0
  },
  preferredMaxSalary: {
    type: Number,
    min: 0
  },
  publicProfileKey: {
    type: String,
    unique: true,
    sparse: true
  },
  sourceContributor: {
    type: Boolean,
    default: false
  },
  featuredAt: Date,
  profileUpdatedAt: {
    type: Date,
    default: Date.now
  },
  responseRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  searchScore: {
    type: Number,
    default: 0
  },
  conversationsCount: {
    type: Number,
    default: 0
  },
  productAnnouncementNotifications: {
    type: Boolean,
    default: true
  },
  profileReminderNotifications: {
    type: Boolean,
    default: true
  },
  specialties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialty'
  }],
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location'
  },
  roleLevel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoleLevel'
  },
  roleType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoleType'
  },
  avatar: {
    type: String // URL to avatar image
  },
  coverImage: {
    type: String // URL to cover image
  },
  videoIntroduction: {
    type: String // URL to video
  },
  videoTranscription: {
    type: String // Transcribed text from video
  },
  videoTranscriptionId: {
    type: String // External transcription service ID
  },
  videoTranscriptionStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  // Additional fields for better categorization
  industry: {
    type: String,
    enum: [
      'ecommerce',
      'real_estate',
      'digital_marketing',
      'social_media_management',
      'customer_service',
      'bookkeeping',
      'content_creation',
      'graphic_design',
      'virtual_assistance',
      'data_entry',
      'lead_generation',
      'email_marketing',
      'amazon_fba',
      'shopify',
      'wordpress',
      'video_editing',
      'podcast_management',
      'project_management',
      'human_resources',
      'online_tutoring',
      'travel_planning',
      'healthcare',
      'finance',
      'saas',
      'other'
    ],
    default: 'other'
  },
  yearsOfExperience: {
    type: Number,
    min: 0,
    max: 50
  },
  skills: [{
    type: String,
    trim: true
  }],
  certifications: [{
    type: String,
    trim: true
  }],
  languages: [{
    language: {
      type: String,
      required: true
    },
    proficiency: {
      type: String,
      enum: ['native', 'fluent', 'conversational', 'basic'],
      required: true
    }
  }],
  availability: {
    type: String,
    enum: ['immediately', 'within_week', 'within_month', 'not_available'],
    default: 'immediately'
  },
  workingHours: {
    timezone: String,
    preferredHours: String // e.g., "9AM-5PM EST"
  },
  portfolio: [{
    title: String,
    description: String,
    url: String,
    image: String
  }]
}, {
  timestamps: true
});

// Index for search functionality
vaSchema.index({ 
  name: 'text', 
  bio: 'text', 
  hero: 'text',
  videoTranscription: 'text' 
});

// Index for filtering
vaSchema.index({ searchStatus: 1 });
vaSchema.index({ searchScore: -1 });
vaSchema.index({ featuredAt: -1 });
vaSchema.index({ profileUpdatedAt: -1 });
vaSchema.index({ location: 1 });
vaSchema.index({ specialties: 1 });
vaSchema.index({ industry: 1 });
vaSchema.index({ yearsOfExperience: 1 });

// Generate public profile key before saving
vaSchema.pre('save', async function(next) {
  if (!this.isNew) return next();
  
  const generateKey = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };
  
  let key;
  let exists = true;
  
  while (exists) {
    key = generateKey();
    exists = await mongoose.model('VA').findOne({ publicProfileKey: key });
  }
  
  this.publicProfileKey = key;
  next();
});

// Update profile updated at
vaSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.profileUpdatedAt = new Date();
  }
  next();
});

// Virtual for completion percentage
vaSchema.virtual('completionPercentage').get(function() {
  let score = 0;
  const fields = [
    'name', 'bio', 'hero', 'location', 'avatar', 'roleLevel', 'roleType',
    'website', 'github', 'linkedin', 'email', 'phone', 'specialties',
    'preferredMinHourlyRate', 'preferredMaxHourlyRate', 'videoIntroduction'
  ];
  
  fields.forEach(field => {
    if (this[field] && (Array.isArray(this[field]) ? this[field].length > 0 : true)) {
      score += 100 / fields.length;
    }
  });
  
  return Math.round(score);
});

module.exports = mongoose.model('VA', vaSchema);