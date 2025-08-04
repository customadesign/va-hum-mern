const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
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
    required: [true, 'Please specify user role']
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
    enum: ['local', 'linkedin'],
    default: 'local'
  },
  confirmationToken: String,
  confirmationTokenExpire: Date,
  confirmedAt: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
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
  // LinkedIn OAuth fields
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
  }
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
    expiresIn: process.env.JWT_EXPIRE
  });
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
  const confirmToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  this.confirmationToken = bcrypt.hashSync(confirmToken, 10);
  this.confirmationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return confirmToken;
};

module.exports = mongoose.model('User', userSchema);