const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  // Profile Information
  name: {
    type: String,
    required: false, // Make optional for backward compatibility
    trim: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  displayName: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 500
  },
  avatar: {
    type: String, // URL to profile picture
    default: null
  },
  avatarFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  },
  coverImage: {
    type: String, // URL to cover image
    default: null
  },
  coverImageFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  },
  phone: {
    type: String,
    match: [/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Please provide a valid phone number']
  },
  location: {
    city: String,
    state: String,
    country: String,
    timezone: {
      type: String,
      default: 'America/New_York'
    }
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say']
  },
  // Authentication Information
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  role: {
    type: String,
    enum: ['va', 'business'],
    required: false // Make optional for backward compatibility
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: function() {
      // Password not required for OAuth users
      return !this.provider || this.provider === 'local';
    },
    minlength: 6,
    select: false
  },
  provider: {
    type: String,
    enum: ['local', 'linkedin', 'clerk'],
    default: 'local'
  },
  // CLERK AUTHENTICATION - New field for Clerk integration
  clerkUserId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values during migration
  },
  confirmationToken: String,
  confirmationTokenExpire: Date,
  confirmedAt: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  refreshToken: String,
  refreshTokenExpire: Date,
  signInCount: {
    type: Number,
    default: 0
  },
  currentSignInAt: Date,
  lastSignInAt: Date,
  currentSignInIp: String,
  lastSignInIp: String,
  admin: {
    type: Boolean,
    default: false
  },
  // LinkedIn OAuth fields (DEPRECATED - TO BE REMOVED AFTER CLERK MIGRATION)
  linkedinId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  linkedinProfile: {
    firstName: String,
    lastName: String,
    profileUrl: String,
    pictureUrl: String
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  authenticationToken: {
    type: String,
    unique: true,
    sparse: true
  },
  inboxEnabled: {
    type: Boolean,
    default: true
  },
  suspended: {
    type: Boolean,
    default: false
  },
  referrals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  va: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VA'
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business'
  },
  // User Preferences
  preferences: {
    notifications: {
      email: {
        enabled: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
        updates: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false }
      },
      push: {
        enabled: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
        updates: { type: Boolean, default: true }
      },
      sms: {
        enabled: { type: Boolean, default: false },
        messages: { type: Boolean, default: false },
        updates: { type: Boolean, default: false }
      }
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private', 'connections-only'],
        default: 'public'
      },
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
      allowMessagesFrom: {
        type: String,
        enum: ['everyone', 'connections-only', 'no-one'],
        default: 'everyone'
      }
    },
    display: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'light'
      },
      language: {
        type: String,
        default: 'en'
      },
      dateFormat: {
        type: String,
        enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
        default: 'MM/DD/YYYY'
      },
      timeFormat: {
        type: String,
        enum: ['12h', '24h'],
        default: '12h'
      }
    }
  },
  // Social Links
  socialLinks: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String,
    website: String,
    github: String
  },
  // Profile Completion
  profileCompletion: {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completedSteps: [String],
    lastUpdated: Date
  },
  // Statistics
  stats: {
    totalLogins: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    totalConnections: { type: Number, default: 0 },
    profileViews: { type: Number, default: 0 },
    lastActive: Date
  },
  // Two-Factor Authentication
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false // Don't include in queries by default
  },
  backupCodes: [{
    code: String,
    used: { type: Boolean, default: false },
    usedAt: Date
  }],
  // Login Sessions for tracking recent activity
  loginSessions: [{
    id: String,
    device: String,
    browser: String,
    os: String,
    location: String,
    ipAddress: String,
    timestamp: { type: Date, default: Date.now },
    current: { type: Boolean, default: false },
    userAgent: String
  }]
}, {
  timestamps: true
});

// Generate referral code before saving
userSchema.pre('save', async function(next) {
  if (!this.isNew) return next();
  
  // Generate unique referral code
  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };
  
  let code;
  let exists = true;
  
  while (exists) {
    code = generateCode();
    exists = await mongoose.model('User').findOne({ referralCode: code });
  }
  
  this.referralCode = code;
  next();
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '60m' // 60 minutes access token
  });
};

// Generate refresh token
userSchema.methods.getRefreshToken = function() {
  const refreshToken = jwt.sign({ id: this._id, type: 'refresh' }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' // Long-lived refresh token
  });
  
  // Store hashed refresh token
  this.refreshToken = bcrypt.hashSync(refreshToken, 10);
  this.refreshTokenExpire = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  
  return refreshToken;
};

// Validate refresh token
userSchema.methods.validateRefreshToken = async function(token) {
  if (!this.refreshToken || !this.refreshTokenExpire) {
    return false;
  }
  
  if (Date.now() > this.refreshTokenExpire) {
    return false;
  }
  
  return await bcrypt.compare(token, this.refreshToken);
};

// CLERK AUTHENTICATION HELPERS
// Check if user is authenticated via Clerk
userSchema.methods.isClerkUser = function() {
  return this.provider === 'clerk' && this.clerkUserId;
};

// Get user display name (works with both legacy and Clerk users)
userSchema.methods.getDisplayName = function() {
  if (this.displayName) {
    return this.displayName;
  }
  if (this.firstName || this.lastName) {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }
  if (this.name) {
    return this.name;
  }
  if (this.linkedinProfile && this.linkedinProfile.firstName) {
    return `${this.linkedinProfile.firstName} ${this.linkedinProfile.lastName || ''}`.trim();
  }
  return this.email.split('@')[0]; // Fallback to email username
};

// Calculate profile completion percentage
userSchema.methods.calculateProfileCompletion = function() {
  const steps = [];
  let completed = 0;
  const totalSteps = 10;

  // Basic info
  if (this.firstName && this.lastName) {
    completed++;
    steps.push('name');
  }
  
  // Avatar
  if (this.avatar) {
    completed++;
    steps.push('avatar');
  }
  
  // Bio
  if (this.bio && this.bio.length > 20) {
    completed++;
    steps.push('bio');
  }
  
  // Phone
  if (this.phone) {
    completed++;
    steps.push('phone');
  }
  
  // Location
  if (this.location && this.location.city) {
    completed++;
    steps.push('location');
  }
  
  // Date of birth
  if (this.dateOfBirth) {
    completed++;
    steps.push('dateOfBirth');
  }
  
  // Email confirmed
  if (this.confirmedAt) {
    completed++;
    steps.push('emailConfirmed');
  }
  
  // Profile type (VA or Business)
  if (this.va || this.business) {
    completed++;
    steps.push('profileType');
  }
  
  // Social links (at least one)
  if (this.socialLinks && Object.values(this.socialLinks).some(link => link)) {
    completed++;
    steps.push('socialLinks');
  }
  
  // Preferences configured
  if (this.preferences && this.preferences.privacy) {
    completed++;
    steps.push('preferences');
  }

  const percentage = Math.round((completed / totalSteps) * 100);
  
  this.profileCompletion = {
    percentage,
    completedSteps: steps,
    lastUpdated: new Date()
  };
  
  return {
    percentage,
    completedSteps: steps,
    missingSteps: this.getMissingProfileSteps()
  };
};

// Get missing profile steps
userSchema.methods.getMissingProfileSteps = function() {
  const missing = [];
  
  if (!this.firstName || !this.lastName) missing.push('Add your full name');
  if (!this.avatar) missing.push('Upload a profile picture');
  if (!this.bio || this.bio.length <= 20) missing.push('Write a bio');
  if (!this.phone) missing.push('Add your phone number');
  if (!this.location || !this.location.city) missing.push('Add your location');
  if (!this.dateOfBirth) missing.push('Add your date of birth');
  if (!this.confirmedAt) missing.push('Confirm your email address');
  if (!this.va && !this.business) missing.push('Complete your VA or Business profile');
  if (!this.socialLinks || !Object.values(this.socialLinks).some(link => link)) {
    missing.push('Add at least one social link');
  }
  
  return missing;
};

// Match password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
userSchema.methods.getResetPasswordToken = function() {
  const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  this.resetPasswordToken = bcrypt.hashSync(resetToken, 10);
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Generate confirmation token
userSchema.methods.getConfirmationToken = function() {
  const confirmToken = crypto.randomBytes(32).toString('hex');
  // Deterministic hash for lookup
  this.confirmationToken = crypto.createHash('sha256').update(confirmToken).digest('hex');
  this.confirmationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return confirmToken;
};

// Index for faster lookups by confirmation token
userSchema.index({ confirmationToken: 1 });

module.exports = mongoose.model('User', userSchema);