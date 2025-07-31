const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const VA = require('../models/VA');
const Location = require('../models/Location');
const Specialty = require('../models/Specialty');
const RoleLevel = require('../models/RoleLevel');
const RoleType = require('../models/RoleType');
const { protect, authorize, optionalAuth, checkESystemsVAAccess } = require('../middleware/auth');
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
      industry,
      yearsOfExperience,
      availability,
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

    // Industry filter
    if (industry) {
      const industries = Array.isArray(industry) ? industry : [industry];
      query.industry = { $in: industries };
    }

    // Years of experience filter
    if (yearsOfExperience) {
      const years = parseInt(yearsOfExperience);
      if (!isNaN(years)) {
        query.yearsOfExperience = { $gte: years };
      }
    }

    // Availability filter
    if (availability) {
      query.availability = availability;
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

// @route   GET /api/vas/industries
// @desc    Get all available industries with counts
// @access  Public
router.get('/industries', async (req, res) => {
  try {
    const industries = await VA.aggregate([
      {
        $match: {
          searchStatus: { $in: ['actively_looking', 'open'] },
          industry: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$industry',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const formattedIndustries = industries.map(ind => ({
      value: ind._id,
      label: ind._id.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      count: ind.count
    }));

    res.json({
      success: true,
      data: formattedIndustries
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

// @route   GET /api/vas/profile
// @desc    Get current user's VA profile
// @access  Private (VA only)
router.get('/profile', protect, authorize('va'), async (req, res) => {
  try {
    // Get VA profile with all populated fields
    const va = await VA.findById(req.user.va)
      .populate('user', 'email')
      .populate('location')
      .populate('specialties')
      .populate('roleLevel')
      .populate('roleType');

    if (!va) {
      return res.status(404).json({
        success: false,
        error: 'VA profile not found'
      });
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
router.post('/', protect, checkESystemsVAAccess, [
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

// @route   POST /api/vas/:id/cover-image
// @desc    Upload VA cover image
// @access  Private (VA owner only)
router.post('/:id/cover-image', protect, authorize('va'), upload.single('coverImage'), async (req, res) => {
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

    // Update cover image URL
    va.coverImage = `/uploads/${req.file.filename}`;
    await va.save();

    res.json({
      success: true,
      data: {
        coverImage: va.coverImage
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

// @route   GET /api/vas/me
// @desc    Get current VA's profile
// @access  Private (VA only)
router.get('/me', protect, authorize('va'), async (req, res) => {
  try {
    const va = await VA.findOne({ user: req.user._id })
      .populate('location')
      .populate('specialties')
      .populate('roleLevel')
      .populate('roleType');

    if (!va) {
      return res.status(404).json({
        success: false,
        error: 'VA profile not found'
      });
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

// @route   PUT /api/vas/me
// @desc    Update current VA's profile
// @access  Private (VA only)
router.put('/me', protect, authorize('va'), async (req, res) => {
  try {
    const allowedFields = [
      'name',
      'hero',
      'bio',
      'coverImage',
      'avatar',
      'website',
      'github',
      'linkedin',
      'twitter',
      'schedulingLink',
      'preferredMinHourlyRate',
      'preferredMaxHourlyRate',
      'preferredMinSalary',
      'preferredMaxSalary',
      'searchStatus',
      'videoIntroduction'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const va = await VA.findOneAndUpdate(
      { user: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!va) {
      return res.status(404).json({
        success: false,
        error: 'VA profile not found'
      });
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

// @route   POST /api/vas/me/upload
// @desc    Upload image for VA profile (avatar or cover)
// @access  Private (VA only)
router.post('/me/upload', protect, authorize('va'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a file'
      });
    }

    // For now, we'll return the file path
    // In production, you'd upload to cloudinary/S3 and return the URL
    const imageUrl = `/uploads/${req.file.filename}`;

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


module.exports = router;