const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const File = require('../models/File');
const { protect } = require('../middleware/auth');
const { handleSupabaseUpload, deleteFromSupabase } = require('../utils/supabaseStorage');
const { uploadLimiter } = require('../middleware/rateLimiter');

// @route   GET /api/profile
// @desc    Get current user's profile
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -refreshToken -resetPasswordToken -confirmationToken')
      .populate('va')
      .populate('business')
      .populate('avatarFileId')
      .populate('coverImageFileId');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Calculate profile completion
    const profileCompletion = user.calculateProfileCompletion();

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        displayName: user.getDisplayName(),
        profileCompletion
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile'
    });
  }
});

// @route   PUT /api/profile
// @desc    Update user profile
// @access  Private
router.put('/', 
  protect,
  [
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
    body('displayName').optional().trim().isLength({ min: 1, max: 100 }),
    body('bio').optional().trim().isLength({ max: 500 }),
    body('phone').optional().matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/),
    body('dateOfBirth').optional().isISO8601(),
    body('gender').optional().isIn(['male', 'female', 'other', 'prefer-not-to-say']),
    body('location.city').optional().trim(),
    body('location.state').optional().trim(),
    body('location.country').optional().trim(),
    body('location.timezone').optional().trim(),
    body('socialLinks.linkedin').optional().isURL(),
    body('socialLinks.twitter').optional().isURL(),
    body('socialLinks.facebook').optional().isURL(),
    body('socialLinks.instagram').optional().isURL(),
    body('socialLinks.website').optional().isURL(),
    body('socialLinks.github').optional().isURL()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Update fields
      const updateFields = [
        'firstName', 'lastName', 'displayName', 'bio', 
        'phone', 'dateOfBirth', 'gender'
      ];

      updateFields.forEach(field => {
        if (req.body[field] !== undefined) {
          user[field] = req.body[field];
        }
      });

      // Update location
      if (req.body.location) {
        user.location = {
          ...user.location,
          ...req.body.location
        };
      }

      // Update social links
      if (req.body.socialLinks) {
        user.socialLinks = {
          ...user.socialLinks,
          ...req.body.socialLinks
        };
      }

      // Update stats
      user.stats.lastActive = new Date();

      // Calculate profile completion
      user.calculateProfileCompletion();

      await user.save();

      res.json({
        success: true,
        user: {
          ...user.toObject(),
          displayName: user.getDisplayName()
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  }
);

// @route   POST /api/profile/avatar
// @desc    Upload profile picture
// @access  Private
router.post('/avatar',
  protect,
  uploadLimiter,
  handleSupabaseUpload('avatar', 'avatars'),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Delete old avatar if exists
      if (user.avatarFileId) {
        const oldFile = await File.findById(user.avatarFileId);
        if (oldFile) {
          await deleteFromSupabase(oldFile.url, oldFile.bucket);
          await oldFile.softDelete();
        }
      }

      // Create file record for new avatar
      const file = await File.create({
        filename: req.file.filename || req.file.originalname,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: req.file.path,
        bucket: process.env.SUPABASE_BUCKET || 'linkage-va-hub',
        path: req.file.path,
        uploadedBy: req.user._id,
        category: 'profile',
        fileType: 'image',
        isPublic: true
      });

      // Update user profile
      user.avatar = file.url;
      user.avatarFileId = file._id;
      user.calculateProfileCompletion();
      await user.save();

      res.json({
        success: true,
        avatar: file.url,
        profileCompletion: user.profileCompletion
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      
      // Try to delete uploaded file if database save failed
      if (req.file && req.file.path) {
        await deleteFromSupabase(req.file.path, process.env.SUPABASE_BUCKET || 'linkage-va-hub');
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to upload avatar'
      });
    }
  }
);

// @route   POST /api/profile/cover
// @desc    Upload cover image
// @access  Private
router.post('/cover',
  protect,
  uploadLimiter,
  handleSupabaseUpload('cover', 'covers'),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Delete old cover if exists
      if (user.coverImageFileId) {
        const oldFile = await File.findById(user.coverImageFileId);
        if (oldFile) {
          await deleteFromSupabase(oldFile.url, oldFile.bucket);
          await oldFile.softDelete();
        }
      }

      // Create file record for new cover
      const file = await File.create({
        filename: req.file.filename || req.file.originalname,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: req.file.path,
        bucket: process.env.SUPABASE_BUCKET || 'linkage-va-hub',
        path: req.file.path,
        uploadedBy: req.user._id,
        category: 'profile',
        fileType: 'image',
        isPublic: true
      });

      // Update user profile
      user.coverImage = file.url;
      user.coverImageFileId = file._id;
      await user.save();

      res.json({
        success: true,
        coverImage: file.url
      });
    } catch (error) {
      console.error('Cover upload error:', error);
      
      // Try to delete uploaded file if database save failed
      if (req.file && req.file.path) {
        await deleteFromSupabase(req.file.path, process.env.SUPABASE_BUCKET || 'linkage-va-hub');
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to upload cover image'
      });
    }
  }
);

// @route   DELETE /api/profile/avatar
// @desc    Delete profile picture
// @access  Private
router.delete('/avatar', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.avatarFileId) {
      const file = await File.findById(user.avatarFileId);
      if (file) {
        await deleteFromSupabase(file.url, file.bucket);
        await file.softDelete();
      }
    }

    user.avatar = null;
    user.avatarFileId = null;
    user.calculateProfileCompletion();
    await user.save();

    res.json({
      success: true,
      message: 'Avatar deleted successfully',
      profileCompletion: user.profileCompletion
    });
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete avatar'
    });
  }
});

// @route   PUT /api/profile/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences',
  protect,
  [
    body('notifications.email.enabled').optional().isBoolean(),
    body('notifications.email.messages').optional().isBoolean(),
    body('notifications.email.updates').optional().isBoolean(),
    body('notifications.email.marketing').optional().isBoolean(),
    body('notifications.push.enabled').optional().isBoolean(),
    body('notifications.push.messages').optional().isBoolean(),
    body('notifications.push.updates').optional().isBoolean(),
    body('notifications.sms.enabled').optional().isBoolean(),
    body('notifications.sms.messages').optional().isBoolean(),
    body('notifications.sms.updates').optional().isBoolean(),
    body('privacy.profileVisibility').optional().isIn(['public', 'private', 'connections-only']),
    body('privacy.showEmail').optional().isBoolean(),
    body('privacy.showPhone').optional().isBoolean(),
    body('privacy.allowMessagesFrom').optional().isIn(['everyone', 'connections-only', 'no-one']),
    body('display.theme').optional().isIn(['light', 'dark', 'auto']),
    body('display.language').optional().isString(),
    body('display.dateFormat').optional().isIn(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
    body('display.timeFormat').optional().isIn(['12h', '24h'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Deep merge preferences
      if (req.body.notifications) {
        user.preferences.notifications = {
          ...user.preferences.notifications,
          email: {
            ...user.preferences.notifications.email,
            ...req.body.notifications.email
          },
          push: {
            ...user.preferences.notifications.push,
            ...req.body.notifications.push
          },
          sms: {
            ...user.preferences.notifications.sms,
            ...req.body.notifications.sms
          }
        };
      }

      if (req.body.privacy) {
        user.preferences.privacy = {
          ...user.preferences.privacy,
          ...req.body.privacy
        };
      }

      if (req.body.display) {
        user.preferences.display = {
          ...user.preferences.display,
          ...req.body.display
        };
      }

      await user.save();

      res.json({
        success: true,
        preferences: user.preferences
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update preferences'
      });
    }
  }
);

// @route   GET /api/profile/preferences
// @desc    Get user preferences
// @access  Private
router.get('/preferences', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('preferences');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve preferences'
    });
  }
});

// @route   GET /api/profile/completion
// @desc    Get profile completion status
// @access  Private
router.get('/completion', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const profileCompletion = user.calculateProfileCompletion();

    res.json({
      success: true,
      profileCompletion
    });
  } catch (error) {
    console.error('Get profile completion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate profile completion'
    });
  }
});

// @route   PUT /api/profile/password
// @desc    Change password
// @access  Private
router.put('/password',
  protect,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
    body('confirmPassword').custom((value, { req }) => value === req.body.newPassword)
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('+password');

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Check current password
      const isMatch = await user.matchPassword(req.body.currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      // Update password
      user.password = req.body.newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to change password'
      });
    }
  }
);

// @route   DELETE /api/profile
// @desc    Delete user account
// @access  Private
router.delete('/',
  protect,
  [
    body('password').notEmpty(),
    body('confirmDelete').equals('DELETE')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('+password');

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Verify password
      const isMatch = await user.matchPassword(req.body.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Password is incorrect'
        });
      }

      // Soft delete user (mark as deleted but keep data)
      user.suspended = true;
      user.deletedAt = new Date();
      await user.save();

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete account'
      });
    }
  }
);

module.exports = router;