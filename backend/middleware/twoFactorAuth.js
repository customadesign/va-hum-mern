const speakeasy = require('speakeasy');
const Business = require('../models/Business');
const BusinessSettings = require('../models/BusinessSettings');

// Check if 2FA is required for the user
exports.checkTwoFactorRequired = async (req, res, next) => {
  try {
    // Skip if no user is authenticated
    if (!req.user) {
      return next();
    }

    // Get business and settings
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return next();
    }

    const settings = await BusinessSettings.findOne({ business: business._id });
    if (!settings || !settings.securitySettings.twoFactorEnabled) {
      return next();
    }

    // Check if 2FA is already validated in this session
    if (req.session && req.session.twoFactorValidated) {
      // Check if validation hasn't expired (valid for session timeout period)
      const validatedAt = new Date(req.session.twoFactorValidatedAt);
      const timeoutMinutes = settings.securitySettings.sessionTimeout || 30;
      const expiresAt = new Date(validatedAt.getTime() + timeoutMinutes * 60 * 1000);
      
      if (new Date() < expiresAt) {
        return next();
      }
    }

    // 2FA is required but not validated
    return res.status(403).json({
      success: false,
      error: 'Two-factor authentication required',
      requiresTwoFactor: true
    });
  } catch (error) {
    console.error('Check 2FA required error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check 2FA requirement'
    });
  }
};

// Validate 2FA code middleware
exports.validateTwoFactor = async (req, res, next) => {
  try {
    const { twoFactorCode } = req.body;
    
    // Skip if no code provided
    if (!twoFactorCode) {
      return next();
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Get business and settings
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    const settings = await BusinessSettings.findOne({ business: business._id })
      .select('+securitySettings.twoFactorSecret');
    
    if (!settings || !settings.securitySettings.twoFactorEnabled) {
      // 2FA not enabled, continue without validation
      return next();
    }

    // Check if account is locked
    if (settings.securitySettings.twoFactorLockedUntil && 
        settings.securitySettings.twoFactorLockedUntil > new Date()) {
      const remainingTime = Math.ceil((settings.securitySettings.twoFactorLockedUntil - new Date()) / 60000);
      return res.status(429).json({
        success: false,
        error: `Account locked due to too many failed attempts. Try again in ${remainingTime} minutes.`,
        locked: true
      });
    }

    // Decrypt secret
    const decryptedSecret = settings.decryptData(settings.securitySettings.twoFactorSecret);
    
    // First try as TOTP code
    let isValidCode = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: twoFactorCode,
      window: 2
    });
    
    let isBackupCode = false;
    
    // If not valid TOTP, try as backup code
    if (!isValidCode) {
      isValidCode = settings.verifyBackupCode(twoFactorCode);
      isBackupCode = isValidCode;
    }
    
    if (!isValidCode) {
      // Track failed attempts
      settings.securitySettings.twoFactorFailedAttempts = (settings.securitySettings.twoFactorFailedAttempts || 0) + 1;
      settings.securitySettings.twoFactorLastFailedAttempt = new Date();
      
      // Lock after 5 failed attempts
      if (settings.securitySettings.twoFactorFailedAttempts >= 5) {
        settings.securitySettings.twoFactorLockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        await settings.save();
        
        console.log(`2FA locked due to failed attempts for user: ${req.user.email}`);
        
        return res.status(429).json({
          success: false,
          error: 'Too many failed attempts. Account locked for 30 minutes.',
          locked: true
        });
      }
      
      await settings.save();
      
      return res.status(401).json({
        success: false,
        error: 'Invalid 2FA code',
        attemptsRemaining: Math.max(0, 5 - settings.securitySettings.twoFactorFailedAttempts)
      });
    }

    // Reset failed attempts on successful validation
    settings.securitySettings.twoFactorFailedAttempts = 0;
    settings.securitySettings.twoFactorLastFailedAttempt = undefined;
    settings.securitySettings.twoFactorLockedUntil = undefined;
    
    await settings.save();

    // Mark 2FA as validated in session
    if (req.session) {
      req.session.twoFactorValidated = true;
      req.session.twoFactorValidatedAt = new Date();
    }

    // Add to request for logging
    req.twoFactorValidated = true;
    req.twoFactorBackupCodeUsed = isBackupCode;

    console.log(`2FA validated successfully for user: ${req.user.email}${isBackupCode ? ' (backup code used)' : ''}`);
    
    if (isBackupCode) {
      // Notify user that backup code was used
      req.twoFactorWarning = `Backup code used. ${settings.securitySettings.twoFactorBackupCodes.filter(bc => !bc.used).length} backup codes remaining.`;
    }

    next();
  } catch (error) {
    console.error('Validate 2FA error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to validate 2FA code'
    });
  }
};

// Require 2FA for sensitive operations
exports.requireTwoFactor = async (req, res, next) => {
  try {
    const { twoFactorCode } = req.body;
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Get business and settings
    const business = await Business.findOne({ user: req.user._id });
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    const settings = await BusinessSettings.findOne({ business: business._id })
      .select('+securitySettings.twoFactorSecret');
    
    if (!settings || !settings.securitySettings.twoFactorEnabled) {
      // 2FA not enabled, continue
      return next();
    }

    if (!twoFactorCode) {
      return res.status(403).json({
        success: false,
        error: '2FA code is required for this operation',
        requiresTwoFactor: true
      });
    }

    // Use the validateTwoFactor middleware logic
    req.body.twoFactorCode = twoFactorCode;
    return exports.validateTwoFactor(req, res, next);
  } catch (error) {
    console.error('Require 2FA error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to validate 2FA requirement'
    });
  }
};

// Check if user has 2FA enabled (for login flow)
exports.checkTwoFactorStatus = async (userId) => {
  try {
    const business = await Business.findOne({ user: userId });
    if (!business) {
      return { enabled: false };
    }

    const settings = await BusinessSettings.findOne({ business: business._id });
    if (!settings) {
      return { enabled: false };
    }

    return {
      enabled: settings.securitySettings.twoFactorEnabled,
      method: settings.securitySettings.twoFactorMethod,
      locked: settings.securitySettings.twoFactorLockedUntil && 
              settings.securitySettings.twoFactorLockedUntil > new Date()
    };
  } catch (error) {
    console.error('Check 2FA status error:', error);
    return { enabled: false, error: true };
  }
};

// Validate 2FA for login (returns boolean)
exports.validateTwoFactorForLogin = async (userId, code) => {
  try {
    const business = await Business.findOne({ user: userId });
    if (!business) {
      return { valid: false, error: 'Business profile not found' };
    }

    const settings = await BusinessSettings.findOne({ business: business._id })
      .select('+securitySettings.twoFactorSecret');
    
    if (!settings || !settings.securitySettings.twoFactorEnabled) {
      return { valid: true }; // No 2FA enabled, allow login
    }

    // Check if account is locked
    if (settings.securitySettings.twoFactorLockedUntil && 
        settings.securitySettings.twoFactorLockedUntil > new Date()) {
      const remainingTime = Math.ceil((settings.securitySettings.twoFactorLockedUntil - new Date()) / 60000);
      return { 
        valid: false, 
        error: `Account locked. Try again in ${remainingTime} minutes.`,
        locked: true 
      };
    }

    // Decrypt secret
    const decryptedSecret = settings.decryptData(settings.securitySettings.twoFactorSecret);
    
    // First try as TOTP code
    let isValidCode = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: code,
      window: 2
    });
    
    let isBackupCode = false;
    
    // If not valid TOTP, try as backup code
    if (!isValidCode) {
      isValidCode = settings.verifyBackupCode(code);
      isBackupCode = isValidCode;
    }
    
    if (!isValidCode) {
      // Track failed attempts
      settings.securitySettings.twoFactorFailedAttempts = (settings.securitySettings.twoFactorFailedAttempts || 0) + 1;
      settings.securitySettings.twoFactorLastFailedAttempt = new Date();
      
      // Lock after 5 failed attempts
      if (settings.securitySettings.twoFactorFailedAttempts >= 5) {
        settings.securitySettings.twoFactorLockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      }
      
      await settings.save();
      
      return { 
        valid: false, 
        error: 'Invalid 2FA code',
        attemptsRemaining: Math.max(0, 5 - settings.securitySettings.twoFactorFailedAttempts)
      };
    }

    // Reset failed attempts on successful validation
    settings.securitySettings.twoFactorFailedAttempts = 0;
    settings.securitySettings.twoFactorLastFailedAttempt = undefined;
    settings.securitySettings.twoFactorLockedUntil = undefined;
    
    await settings.save();

    return { 
      valid: true, 
      backupCodeUsed: isBackupCode,
      remainingBackupCodes: isBackupCode ? 
        settings.securitySettings.twoFactorBackupCodes.filter(bc => !bc.used).length : undefined
    };
  } catch (error) {
    console.error('Validate 2FA for login error:', error);
    return { valid: false, error: 'Failed to validate 2FA code' };
  }
};