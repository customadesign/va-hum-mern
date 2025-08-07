const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Business = require('../models/Business');
// HYBRID AUTH: Support both Clerk and legacy JWT during migration
const { protect, authorize } = require('../middleware/hybridAuth');
// For now, just use local upload until Supabase is configured
const upload = require('../utils/upload');

// @route   GET /api/businesses/me
// @desc    Get current business profile
// @access  Private/Business
router.get('/me', protect, authorize('business'), async (req, res) => {
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
// @desc    Update current business profile
// @access  Private/Business
router.put('/me', protect, authorize('business'), async (req, res) => {
  try {
    const business = await Business.findOne({ user: req.user._id });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    // Update fields
    const updateFields = [
      'contactName', 'company', 'bio', 'website', 'contactRole',
      'email', 'phone', 'streetAddress', 'city', 'state', 
      'postalCode', 'country', 'vaNotifications', 'invisible',
      'surveyRequestNotifications'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        business[field] = req.body[field];
      }
    });

    await business.save();

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
router.post('/me/upload', protect, authorize('business'), upload.single('image'), async (req, res) => {
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
router.post('/:id/avatar', protect, authorize('business'), upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a file'
      });
    }

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

    // Update avatar URL
    business.avatar = `/uploads/${req.file.filename}`;
    await business.save();

    res.json({
      success: true,
      data: {
        avatar: business.avatar
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

module.exports = router;