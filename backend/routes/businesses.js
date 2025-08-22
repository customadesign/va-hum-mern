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
    'avatar'
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
    } else {
      // Update existing
      updateFields.forEach(field => {
        if (req.body[field] === undefined) return;
        let value = req.body[field];
        
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