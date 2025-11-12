const mongoose = require('mongoose');
const crypto = require('crypto');

const businessSettingsSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    unique: true
  },
  
  // Account Settings
  accountSettings: {
    emailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    phoneVerified: {
      type: Boolean,
      default: false
    },
    phoneVerificationCode: String,
    phoneVerificationExpires: Date,
    timezone: {
      type: String,
      default: 'UTC'
    },
    language: {
      type: String,
      default: 'en'
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Notification Preferences
  notificationPreferences: {
    email: {
      newVAApplications: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      weeklyReports: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false },
      systemUpdates: { type: Boolean, default: true }
    },
    push: {
      newVAApplications: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      taskUpdates: { type: Boolean, default: true }
    },
    sms: {
      urgentNotifications: { type: Boolean, default: false },
      securityAlerts: { type: Boolean, default: true }
    },
    notificationTime: {
      type: String,
      default: '09:00'
    },
    notificationFrequency: {
      type: String,
      enum: ['instant', 'hourly', 'daily', 'weekly'],
      default: 'instant'
    }
  },
  
  // Security Settings
  securitySettings: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: {
      type: String,
      select: false // Don't include by default for security
    },
    twoFactorBackupCodes: [{
      code: String,
      used: {
        type: Boolean,
        default: false
      },
      usedAt: Date
    }],
    twoFactorMethod: {
      type: String,
      enum: ['authenticator', 'sms', 'email'],
      default: 'authenticator'
    },
    twoFactorVerifiedAt: Date,
    twoFactorFailedAttempts: {
      type: Number,
      default: 0
    },
    twoFactorLastFailedAttempt: Date,
    twoFactorLockedUntil: Date,
    lastPasswordChange: {
      type: Date,
      default: Date.now
    },
    passwordChangeRequired: {
      type: Boolean,
      default: false
    },
    sessionTimeout: {
      type: Number,
      default: 30 // minutes
    },
    ipWhitelist: [String],
    allowedLoginMethods: {
      email: { type: Boolean, default: true },
      google: { type: Boolean, default: false },
      linkedin: { type: Boolean, default: false }
    }
  },
  
  // Preferences
  preferences: {
    dashboardLayout: {
      type: String,
      enum: ['grid', 'list', 'compact'],
      default: 'grid'
    },
    defaultView: {
      type: String,
      enum: ['dashboard', 'vas', 'messages', 'analytics'],
      default: 'dashboard'
    },
    showWelcomeMessage: {
      type: Boolean,
      default: true
    },
    autoAcceptVAs: {
      type: Boolean,
      default: false
    },
    vaApprovalCriteria: {
      minRating: { type: Number, default: 0 },
      requiredSkills: [String],
      requiredExperience: { type: Number, default: 0 }
    },
    communicationPreferences: {
      preferredChannel: {
        type: String,
        enum: ['email', 'platform', 'whatsapp', 'slack'],
        default: 'platform'
      },
      responseTime: {
        type: String,
        enum: ['immediate', 'within_hour', 'within_day', 'within_week'],
        default: 'within_day'
      }
    }
  },
  
  // Privacy Settings
  privacySettings: {
    profileVisibility: {
      type: String,
      enum: ['public', 'registered', 'private'],
      default: 'registered'
    },
    showContactInfo: {
      type: Boolean,
      default: false
    },
    showCompanyDetails: {
      type: Boolean,
      default: true
    },
    allowDataCollection: {
      type: Boolean,
      default: true
    },
    allowAnalytics: {
      type: Boolean,
      default: true
    },
    dataRetentionDays: {
      type: Number,
      default: 365
    }
  },
  
  // Billing Settings
  billingSettings: {
    billingEmail: String,
    billingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    taxId: String,
    preferredPaymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'bank_transfer', 'paypal'],
      default: 'credit_card'
    },
    autoRenewal: {
      type: Boolean,
      default: true
    },
    invoiceFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      default: 'monthly'
    }
  }
}, {
  timestamps: true
});

// Encryption key from environment variable
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
  return crypto.createHash('sha256').update(key).digest();
};

// Encrypt data
businessSettingsSchema.methods.encryptData = function(data) {
  if (!data) return null;
  const algorithm = 'aes-256-cbc';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
};

// Decrypt data
businessSettingsSchema.methods.decryptData = function(encryptedData) {
  if (!encryptedData) return null;
  try {
    const algorithm = 'aes-256-cbc';
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

// Hash backup codes
businessSettingsSchema.methods.hashBackupCode = function(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
};

// Verify backup code
businessSettingsSchema.methods.verifyBackupCode = function(code) {
  const hashedCode = this.hashBackupCode(code);
  const backupCode = this.securitySettings.twoFactorBackupCodes.find(
    bc => bc.code === hashedCode && !bc.used
  );
  
  if (backupCode) {
    backupCode.used = true;
    backupCode.usedAt = new Date();
    return true;
  }
  
  return false;
};

// Indexes
// Note: business index is automatically created by unique: true
businessSettingsSchema.index({ 'accountSettings.emailVerificationToken': 1 });
businessSettingsSchema.index({ 'accountSettings.phoneVerificationCode': 1 });

module.exports = mongoose.model('BusinessSettings', businessSettingsSchema);