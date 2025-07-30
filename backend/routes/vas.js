const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const VA = require('../models/VA');
const Location = require('../models/Location');
const Specialty = require('../models/Specialty');
const RoleLevel = require('../models/RoleLevel');
const RoleType = require('../models/RoleType');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const upload = require('../utils/upload');

// @route   GET /api/vas
// @desc    Get all VAs (with search and filters)
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      search,
      specialties,
      roleTypes,
      roleLevels,
      locations,
      minRate,
      maxRate,
      sort = '-searchScore',
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {
      searchStatus: { $in: ['actively_looking', 'open'] }
    };

    // Search
    if (search) {
      query.$text = { $search: search };
    }

    // Filters
    if (specialties) {
      const specialtyIds = Array.isArray(specialties) ? specialties : [specialties];
      query.specialties = { $in: specialtyIds };
    }

    if (minRate || maxRate) {
      query.$or = [
        {
          preferredMinHourlyRate: {
            $gte: minRate || 0,
            $lte: maxRate || 999999
          }
        },
        {
          preferredMinSalary: {
            $gte: (minRate || 0) * 160, // Convert hourly to monthly
            $lte: (maxRate || 999999) * 160
          }
        }
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const [vas, total] = await Promise.all([
      VA.find(query)
        .populate('location')
        .populate('specialties')
        .populate('roleLevel')
        .populate('roleType')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      VA.countDocuments(query)
    ]);

    // Additional filtering for role types and levels
    let filteredVAs = vas;
    
    if (roleTypes) {
      const types = Array.isArray(roleTypes) ? roleTypes : [roleTypes];
      filteredVAs = filteredVAs.filter(va => {
        if (!va.roleType) return false;
        return types.some(type => va.roleType[type.replace('_', '')]);
      });
    }

    if (roleLevels) {
      const levels = Array.isArray(roleLevels) ? roleLevels : [roleLevels];
      filteredVAs = filteredVAs.filter(va => {
        if (!va.roleLevel) return false;
        return levels.some(level => va.roleLevel[level.replace('_', '')]);
      });
    }

    if (locations) {
      const locationIds = Array.isArray(locations) ? locations : [locations];
      filteredVAs = filteredVAs.filter(va => 
        va.location && locationIds.includes(va.location._id.toString())
      );
    }

    res.json({
      success: true,
      data: filteredVAs,
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

// @route   GET /api/vas/featured
// @desc    Get featured VAs
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const vas = await VA.find({
      featuredAt: { $ne: null },
      searchStatus: { $in: ['actively_looking', 'open'] }
    })
      .populate('location')
      .populate('specialties')
      .sort('-featuredAt')
      .limit(6);

    res.json({
      success: true,
      data: vas
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/vas/:id
// @desc    Get single VA by ID or public key
// @access  Public
router.get('/:identifier', optionalAuth, async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Try to find by ID first, then by public key
    let va = await VA.findById(identifier)
      .populate('user', 'email')
      .populate('location')
      .populate('specialties')
      .populate('roleLevel')
      .populate('roleType');
    
    if (!va) {
      va = await VA.findOne({ publicProfileKey: identifier })
        .populate('user', 'email')
        .populate('location')
        .populate('specialties')
        .populate('roleLevel')
        .populate('roleType');
    }

    if (!va) {
      return res.status(404).json({
        success: false,
        error: 'VA not found'
      });
    }

    // Check visibility
    if (va.searchStatus === 'invisible' || va.searchStatus === 'not_interested') {
      // Only show to owner or admin
      if (!req.user || (req.user._id.toString() !== va.user._id.toString() && !req.user.admin)) {
        return res.status(404).json({
          success: false,
          error: 'VA not found'
        });
      }
    }

    res.json({
      success: true,
      data: va
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/vas
// @desc    Create VA profile
// @access  Private (authenticated users only)
router.post('/', protect, [
  body('name').notEmpty().trim(),
  body('bio').notEmpty().trim(),
  body('searchStatus').optional().isIn(['actively_looking', 'open', 'not_interested', 'invisible'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if user already has a VA profile
    if (req.user.va) {
      return res.status(400).json({
        success: false,
        error: 'User already has a VA profile'
      });
    }

    // Check if user has a business profile
    if (req.user.business) {
      return res.status(400).json({
        success: false,
        error: 'User already has a business profile'
      });
    }

    // Create VA profile
    const va = await VA.create({
      ...req.body,
      user: req.user._id
    });

    // Update user
    req.user.va = va._id;
    await req.user.save();

    // Create role level and type
    await RoleLevel.create({ va: va._id });
    await RoleType.create({ va: va._id });

    res.status(201).json({
      success: true,
      data: va
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/vas/:id
// @desc    Update VA profile
// @access  Private (VA owner only)
router.put('/:id', protect, authorize('va'), async (req, res) => {
  try {
    let va = await VA.findById(req.params.id);

    if (!va) {
      return res.status(404).json({
        success: false,
        error: 'VA not found'
      });
    }

    // Check ownership
    if (va.user.toString() !== req.user._id.toString() && !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Update VA
    va = await VA.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: va
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/vas/:id/avatar
// @desc    Upload VA avatar
// @access  Private (VA owner only)
router.post('/:id/avatar', protect, authorize('va'), upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a file'
      });
    }

    const va = await VA.findById(req.params.id);

    if (!va) {
      return res.status(404).json({
        success: false,
        error: 'VA not found'
      });
    }

    // Check ownership
    if (va.user.toString() !== req.user._id.toString() && !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Update avatar URL
    va.avatar = `/uploads/${req.file.filename}`;
    await va.save();

    res.json({
      success: true,
      data: {
        avatar: va.avatar
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

// @route   PUT /api/vas/:id/specialties
// @desc    Update VA specialties
// @access  Private (VA owner only)
router.put('/:id/specialties', protect, authorize('va'), [
  body('specialties').isArray()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const va = await VA.findById(req.params.id);

    if (!va) {
      return res.status(404).json({
        success: false,
        error: 'VA not found'
      });
    }

    // Check ownership
    if (va.user.toString() !== req.user._id.toString() && !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Update specialties
    va.specialties = req.body.specialties;
    await va.save();

    // Update specialty counts
    await Specialty.updateMany(
      {},
      { $set: { vasCount: 0 } }
    );

    const specialtyCounts = await VA.aggregate([
      { $unwind: '$specialties' },
      { $group: { _id: '$specialties', count: { $sum: 1 } } }
    ]);

    for (const { _id, count } of specialtyCounts) {
      await Specialty.findByIdAndUpdate(_id, { vasCount: count });
    }

    res.json({
      success: true,
      data: va
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