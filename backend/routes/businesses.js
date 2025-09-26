const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Business = require('../models/Business');
const User = require('../models/User');
// HYBRID AUTH: Support both Clerk and legacy JWT during migration
const { protect, authorize, optionalAuth } = require('../middleware/hybridAuth');
// Use unified storage handler
const { handleUnifiedUpload, deleteWithFallback } = require('../utils/unifiedStorage');
// For now, just use local upload until Supabase is configured
const upload = require('../utils/upload');

// @route   GET /api/businesses
// @desc    Get all businesses (with search and filters)
// @access  Public (admin gets all, others get only visible)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      search,
      status,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    const query = {};
    
    // Only show visible businesses to non-admins
    if (!req.user?.admin) {
      query.invisible = { $ne: true };
    }
    
    if (search) {
      query.$or = [
        { company: { $regex: search, $options: 'i' } },
        { contactName: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status === 'active') {
      query.invisible = { $ne: true };
    } else if (status === 'suspended' && req.user?.admin) {
      query.invisible = true;
    }

    const skip = (page - 1) * limit;

    const [businesses, total] = await Promise.all([
      Business.find(query)
        .populate('user', 'email suspended')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Business.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: businesses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/businesses/me
// @desc    Get current business profile
// @access  Private (allow users without a business profile to get 404 instead of 403)
router.get('/me', protect, async (req, res) => {
  try {
    const business = await Business.findOne({ user: req.user._id })
      .populate('user', 'email');

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    res.json({
      success: true,
      data: business
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/businesses/me
// @desc    Upsert current business profile (create if missing)
// @access  Private
router.put('/me', protect, async (req, res) => {
  try {
    console.log('Received business update request:', req.body);
    console.log('Specialties received:', req.body.specialties);
    console.log('Benefits received:', req.body.benefits);
    console.log('Company Values received:', req.body.companyValues);
    
    let business = await Business.findOne({ user: req.user._id });

  // Update fields (include companySize, industry and other profile fields)
  const updateFields = [
    // Basics
    'contactName', 'company', 'bio', 'website', 'contactRole',
    'email', 'phone',
    // Address
    'streetAddress', 'city', 'state', 'postalCode', 'country',
    // Settings
    'vaNotifications', 'invisible', 'surveyRequestNotifications',
    // LinkedIn-like fields
    'companySize', 'industry', 'foundedYear', 'employeeCount', 'companyCulture',
    'workEnvironment', 'headquartersLocation', 'missionStatement', 'vaRequirements', 'workingHours',
    // Arrays
    'specialties', 'benefits', 'companyValues', 'languages',
    // Socials
    'linkedin', 'facebook', 'twitter', 'instagram', 'youtube',
    // Media
    'avatar',
    // New preference objects (handled separately below)
    'emailNotifications', 'communicationPreferences', 'privacySettings'
  ];

  // Validators for enumerated/numeric fields
  const allowedCompanySizes = ['1-10','11-50','51-200','201-500','501-1000','1001-5000','5001-10000','10000+'];
  const allowedWorkEnvironments = ['remote','hybrid','onsite','flexible'];

    if (!business) {
      // Create if missing (upsert behavior)
      const doc = { user: req.user._id };
      updateFields.forEach(field => {
        if (req.body[field] === undefined) return;
        let value = req.body[field];
        
        // Handle nested objects for preferences
        if (['emailNotifications', 'communicationPreferences', 'privacySettings'].includes(field)) {
          if (typeof value === 'object' && value !== null) {
            doc[field] = value;
          }
          return;
        }
        
        // Handle empty strings (but not arrays)
        if (typeof value === 'string' && value.trim() === '') return;
        
        // For arrays, allow empty arrays to clear the field
        if (Array.isArray(value)) {
          doc[field] = value;
          return;
        }

        // Enum sanitization
        if (field === 'companySize') {
          if (!allowedCompanySizes.includes(value)) return;
        }
        if (field === 'workEnvironment') {
          if (!allowedWorkEnvironments.includes(value)) return;
        }

        // Number conversion
        if (field === 'foundedYear' || field === 'employeeCount') {
          const num = Number(value);
          if (!Number.isFinite(num)) return;
          value = num;
        }

        doc[field] = value;
      });
      business = await Business.create(doc);
      // Link on user for future role checks
      if (!req.user.business) {
        req.user.business = business._id;
        await req.user.save();
      }
      
      // Emit Socket.io event for real-time dashboard updates
      const io = req.app.get('io');
      if (io) {
        io.to('admin-notifications').emit('new_business_registered', {
          businessId: business._id,
          company: business.company,
          contactName: business.contactName,
          email: business.email,
          createdAt: business.createdAt
        });
        
        // Emit general dashboard update event
        io.to('admin-notifications').emit('dashboard_update', {
          type: 'new_business',
          data: {
            businessId: business._id,
            company: business.company
          }
        });
      }
    } else {
      // Update existing
      updateFields.forEach(field => {
        if (req.body[field] === undefined) return;
        let value = req.body[field];
        
        // Handle nested objects for preferences
        if (['emailNotifications', 'communicationPreferences', 'privacySettings'].includes(field)) {
          if (typeof value === 'object' && value !== null) {
            // Merge with existing values to allow partial updates
            business[field] = { ...business[field]?.toObject?.() || {}, ...value };
          }
          return;
        }
        
        // Handle empty strings (but not arrays)
        if (typeof value === 'string' && value.trim() === '') return;
        
        // For arrays, allow empty arrays to clear the field
        if (Array.isArray(value)) {
          business[field] = value;
          return;
        }

        if (field === 'companySize') {
          if (!allowedCompanySizes.includes(value)) return;
        }
        if (field === 'workEnvironment') {
          if (!allowedWorkEnvironments.includes(value)) return;
        }
        if (field === 'foundedYear' || field === 'employeeCount') {
          const num = Number(value);
          if (!Number.isFinite(num)) return;
          value = num;
        }

        business[field] = value;
      });
      await business.save();
    }

    console.log('Business after save - Specialties:', business.specialties);
    console.log('Business after save - Benefits:', business.benefits);
    console.log('Business after save - Company Values:', business.companyValues);

    res.json({
      success: true,
      data: business
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/businesses/me/upload
// @desc    Upload business avatar
// @access  Private/Business
router.post('/me/upload', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a file'
      });
    }

    const baseUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      url: imageUrl
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/businesses/:id
// @desc    Get business by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id)
      .populate('user', 'email');

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    // Check if business is invisible
    if (business.invisible) {
      // Only show to owner or admin
      if (req.user._id.toString() !== business.user._id.toString() && !req.user.admin) {
        return res.status(404).json({
          success: false,
          error: 'Business not found'
        });
      }
    }

    res.json({
      success: true,
      data: business
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/businesses
// @desc    Create business profile
// @access  Private
router.post('/', protect, [
  body('contactName').notEmpty().trim(),
  body('company').notEmpty().trim(),
  body('bio').notEmpty().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if user already has a business profile
    if (req.user.business) {
      return res.status(400).json({
        success: false,
        error: 'User already has a business profile'
      });
    }

    // Check if user has a VA profile
    if (req.user.va) {
      return res.status(400).json({
        success: false,
        error: 'User already has a VA profile'
      });
    }

    // Create business profile
    const business = await Business.create({
      ...req.body,
      user: req.user._id
    });

    // Update user
    req.user.business = business._id;
    await req.user.save();
    
    // Emit Socket.io event for real-time dashboard updates
    const io = req.app.get('io');
    if (io) {
      io.to('admin-notifications').emit('new_business_registered', {
        businessId: business._id,
        company: business.company,
        contactName: business.contactName,
        email: business.email,
        createdAt: business.createdAt
      });
      
      // Emit general dashboard update event
      io.to('admin-notifications').emit('dashboard_update', {
        type: 'new_business',
        data: {
          businessId: business._id,
          company: business.company
        }
      });
    }

    res.status(201).json({
      success: true,
      data: business
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/businesses/:id
// @desc    Update business profile
// @access  Private (Business owner only)
router.put('/:id', protect, authorize('business'), async (req, res) => {
  try {
    let business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    // Check ownership
    if (business.user.toString() !== req.user._id.toString() && !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Update business
    business = await Business.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: business
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/businesses/:id/avatar
// @desc    Upload business avatar
// @access  Private (Business owner only)
router.post('/:id/avatar', protect, authorize('business'), handleUnifiedUpload('avatar', 'avatars'), async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    const File = require('../models/File');
    
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    // Check ownership
    if (business.user.toString() !== req.user._id.toString() && !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Delete old avatar if exists
    if (business.avatar && (business.avatar.includes('/uploads/') || business.avatar.includes('supabase'))) {
      await deleteWithFallback({
        provider: req.file.storageProvider,
        url: business.avatar,
        bucket: req.file.bucket
      });
    }

    // Update business avatar
    business.avatar = req.file.path;
    await business.save();

    // Also update the User model avatar
    const user = await User.findById(business.user);
    if (user) {
      // Create file record
      const file = await File.create({
        filename: req.file.filename || req.file.originalname,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: req.file.path,
        bucket: req.file.bucket,
        path: req.file.path,
        storageProvider: req.file.storageProvider,
        s3Key: req.file.s3Key,
        uploadedBy: user._id,
        category: 'profile',
        fileType: 'image',
        isPublic: true
      });

      // Delete old avatar file if exists
      if (user.avatarFileId) {
        const oldFile = await File.findById(user.avatarFileId);
        if (oldFile) {
          await deleteWithFallback({
            provider: oldFile.storageProvider || 'supabase',
            url: oldFile.url,
            bucket: oldFile.bucket,
            key: oldFile.s3Key
          });
          await oldFile.softDelete();
        }
      }

      user.avatar = req.file.path;
      user.avatarFileId = file._id;
      await user.save();
    }

    res.json({
      success: true,
      data: {
        avatar: business.avatar
      }
    });
  } catch (err) {
    console.error('Business avatar upload error:', err);
    
    // Try to delete uploaded file if database save failed
    if (req.file && req.file.path) {
      await deleteWithFallback({
        provider: req.file.storageProvider,
        url: req.file.path,
        bucket: req.file.bucket,
        key: req.file.s3Key
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/businesses/me/preferences
// @desc    Update business preferences separately
// @access  Private
router.put('/me/preferences', protect, async (req, res) => {
  try {
    const business = await Business.findOne({ user: req.user._id });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    // Update preferences
    const { emailNotifications, communicationPreferences, privacySettings, vaNotifications, invisible, surveyRequestNotifications } = req.body;

    // Update email notifications (merge with existing)
    if (emailNotifications && typeof emailNotifications === 'object') {
      business.emailNotifications = {
        ...business.emailNotifications?.toObject?.() || {},
        ...emailNotifications
      };
    }

    // Update communication preferences (merge with existing)
    if (communicationPreferences && typeof communicationPreferences === 'object') {
      business.communicationPreferences = {
        ...business.communicationPreferences?.toObject?.() || {},
        ...communicationPreferences
      };
    }

    // Update privacy settings (merge with existing)
    if (privacySettings && typeof privacySettings === 'object') {
      business.privacySettings = {
        ...business.privacySettings?.toObject?.() || {},
        ...privacySettings
      };
    }

    // Update legacy preferences
    if (vaNotifications !== undefined) business.vaNotifications = vaNotifications;
    if (invisible !== undefined) business.invisible = invisible;
    if (surveyRequestNotifications !== undefined) business.surveyRequestNotifications = surveyRequestNotifications;

    await business.save();

    res.json({
      success: true,
      data: {
        emailNotifications: business.emailNotifications,
        communicationPreferences: business.communicationPreferences,
        privacySettings: business.privacySettings,
        vaNotifications: business.vaNotifications,
        invisible: business.invisible,
        surveyRequestNotifications: business.surveyRequestNotifications
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/businesses/me/preferences
// @desc    Get business preferences only
// @access  Private
router.get('/me/preferences', protect, async (req, res) => {
  try {
    const business = await Business.findOne({ user: req.user._id })
      .select('emailNotifications communicationPreferences privacySettings vaNotifications invisible surveyRequestNotifications');

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    res.json({
      success: true,
      data: {
        emailNotifications: business.emailNotifications || {},
        communicationPreferences: business.communicationPreferences || {},
        privacySettings: business.privacySettings || {},
        vaNotifications: business.vaNotifications,
        invisible: business.invisible,
        surveyRequestNotifications: business.surveyRequestNotifications
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/businesses/:id
// @desc    Delete business profile
// @access  Private (Business owner or admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    // Check ownership
    if (business.user.toString() !== req.user._id.toString() && !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    await business.remove();

    // Update user
    const user = await User.findById(business.user);
    if (user) {
      user.business = undefined;
      await user.save();
    }

    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// ===============================================
// SECURITY ENDPOINTS
// ===============================================

// @route   GET /api/businesses/profile
// @desc    Get business profile with basic info (alias for /me for frontend compatibility)
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const business = await Business.findOne({ user: req.user._id })
      .populate('user', 'email');

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    res.json({
      success: true,
      data: {
        businessName: business.company,
        email: business.email || business.user?.email,
        phone: business.phone,
        address: business.streetAddress,
        city: business.city,
        state: business.state,
        country: business.country,
        zipCode: business.postalCode,
        timezone: business.timezone || 'America/New_York',
        language: business.language || 'en',
        emailVerified: business.emailVerified || false,
        phoneVerified: business.phoneVerified || false
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/businesses/profile
// @desc    Update business profile (alias for settings compatibility)
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const business = await Business.findOne({ user: req.user._id });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    // Map frontend field names to database field names
    const fieldMapping = {
      businessName: 'company',
      address: 'streetAddress',
      zipCode: 'postalCode'
    };

    // Update fields
    Object.keys(req.body).forEach(key => {
      const dbField = fieldMapping[key] || key;
      if (business.schema.paths[dbField]) {
        business[dbField] = req.body[key];
      }
    });

    await business.save();

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/businesses/notification-settings
// @desc    Get notification settings
// @access  Private
router.get('/notification-settings', protect, async (req, res) => {
  try {
    const business = await Business.findOne({ user: req.user._id });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    res.json({
      success: true,
      data: {
        email: business.emailNotifications || {
          newApplications: true,
          trialExpiration: true,
          paymentConfirmations: true,
          weeklyReports: false,
          systemUpdates: true,
        },
        sms: {
          enabled: false,
          newApplications: false,
          trialExpiration: false,
          paymentConfirmations: false,
        },
        inApp: {
          enabled: true,
          newApplications: true,
          trialExpiration: true,
          paymentConfirmations: true,
          systemUpdates: true,
        },
        frequency: 'instant'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/businesses/notification-settings
// @desc    Update notification settings
// @access  Private
router.put('/notification-settings', protect, async (req, res) => {
  try {
    const business = await Business.findOne({ user: req.user._id });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    // Update email notifications
    if (req.body.email) {
      business.emailNotifications = {
        ...business.emailNotifications?.toObject?.() || {},
        ...req.body.email
      };
    }

    await business.save();

    res.json({
      success: true,
      message: 'Notification settings updated successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/businesses/security-settings
// @desc    Get security settings including 2FA status, API keys, and sessions
// @access  Private
router.get('/security-settings', protect, async (req, res) => {
  try {
    const business = await Business.findOne({ user: req.user._id });
    const user = await User.findById(req.user._id);

    if (!business || !user) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    // Get security settings from both user and business models
    const securitySettings = {
      twoFactorEnabled: user.twoFactorEnabled || false,
      sessions: user.loginSessions || [],
      apiKeys: business.apiKeys || []
    };

    res.json({
      success: true,
      data: securitySettings
    });
  } catch (err) {
    console.error('Error fetching security settings:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/businesses/security/2fa
// @desc    Toggle two-factor authentication
// @access  Private
router.post('/security/2fa', protect, async (req, res) => {
  try {
    const { enabled } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (enabled) {
      // Enable 2FA - in a real implementation, you'd generate a secret and show QR code
      // For now, we'll just set the flag
      user.twoFactorEnabled = true;
      user.twoFactorSecret = 'temp-secret-' + Date.now(); // Replace with proper TOTP secret generation
    } else {
      // Disable 2FA
      user.twoFactorEnabled = false;
      user.twoFactorSecret = undefined;
      user.backupCodes = undefined;
    }

    await user.save();

    res.json({
      success: true,
      message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: {
        twoFactorEnabled: user.twoFactorEnabled
      }
    });
  } catch (err) {
    console.error('Error toggling 2FA:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update two-factor authentication settings'
    });
  }
});

// @route   POST /api/businesses/api-keys
// @desc    Generate a new API key
// @access  Private
router.post('/api-keys', protect, async (req, res) => {
  try {
    const { name } = req.body;
    const business = await Business.findOne({ user: req.user._id });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    // Generate API key
    const crypto = require('crypto');
    const apiKey = {
      id: new Date().getTime().toString(),
      name: name || `API Key ${(business.apiKeys?.length || 0) + 1}`,
      key: 'lk_' + crypto.randomBytes(32).toString('hex'),
      createdAt: new Date(),
      lastUsed: null,
      active: true
    };

    // Initialize apiKeys array if it doesn't exist
    if (!business.apiKeys) {
      business.apiKeys = [];
    }

    business.apiKeys.push(apiKey);
    await business.save();

    res.json({
      success: true,
      message: 'API key generated successfully',
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key,
        createdAt: apiKey.createdAt
      }
    });
  } catch (err) {
    console.error('Error generating API key:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to generate API key'
    });
  }
});

// @route   DELETE /api/businesses/api-keys/:keyId
// @desc    Delete an API key
// @access  Private
router.delete('/api-keys/:keyId', protect, async (req, res) => {
  try {
    const { keyId } = req.params;
    const business = await Business.findOne({ user: req.user._id });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    // Remove API key
    business.apiKeys = business.apiKeys?.filter(key => key.id !== keyId) || [];
    await business.save();

    res.json({
      success: true,
      message: 'API key deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting API key:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete API key'
    });
  }
});

// @route   GET /api/businesses/team-members
// @desc    Get team members (placeholder for future implementation)
// @access  Private
router.get('/team-members', protect, async (req, res) => {
  try {
    // Placeholder - return empty array for now
    res.json({
      success: true,
      data: []
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/businesses/integrations
// @desc    Get integration settings
// @access  Private
router.get('/integrations', protect, async (req, res) => {
  try {
    // Placeholder integrations
    res.json({
      success: true,
      data: {
        google: { connected: false },
        outlook: { connected: false },
        slack: { connected: false },
        zapier: { connected: false, webhook: '' }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/businesses/preferences
// @desc    Get business preferences
// @access  Private
router.get('/preferences', protect, async (req, res) => {
  try {
    const business = await Business.findOne({ user: req.user._id });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    res.json({
      success: true,
      data: {
        defaultWorkingHours: { start: '09:00', end: '18:00' },
        preferredSpecialties: business.specialties || [],
        autoApproveApplications: false,
        defaultTrialDuration: 10
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/businesses/preferences
// @desc    Update business preferences
// @access  Private
router.put('/preferences', protect, async (req, res) => {
  try {
    const business = await Business.findOne({ user: req.user._id });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    // Update specialties if provided
    if (req.body.preferredSpecialties) {
      business.specialties = req.body.preferredSpecialties;
      await business.save();
    }

    res.json({
      success: true,
      message: 'Preferences updated successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/businesses/export-data
// @desc    Export business data
// @access  Private
router.get('/export-data', protect, async (req, res) => {
  try {
    const business = await Business.findOne({ user: req.user._id }).populate('user');

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    const exportData = {
      profile: {
        company: business.company,
        contactName: business.contactName,
        email: business.email,
        phone: business.phone,
        address: {
          street: business.streetAddress,
          city: business.city,
          state: business.state,
          country: business.country,
          postalCode: business.postalCode
        }
      },
      preferences: {
        notifications: business.emailNotifications,
        communication: business.communicationPreferences,
        privacy: business.privacySettings
      },
      exportedAt: new Date(),
      version: '1.0'
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="business-data-${Date.now()}.json"`);
    res.json(exportData);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Failed to export data'
    });
  }
});

// @route   DELETE /api/businesses/account
// @desc    Delete business account
// @access  Private
router.delete('/account', protect, async (req, res) => {
  try {
    const business = await Business.findOne({ user: req.user._id });
    const user = await User.findById(req.user._id);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    // Delete business profile
    await business.remove();

    // Delete user account
    if (user) {
      await user.remove();
    }

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
});

module.exports = router;