const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const multer = require('multer');
const VA = require('../models/VA');
const Location = require('../models/Location');
const Specialty = require('../models/Specialty');
const RoleLevel = require('../models/RoleLevel');
const RoleType = require('../models/RoleType');
const { protect, authorize, optionalAuth, checkESystemsVAAccess } = require('../middleware/auth');
// Use Supabase storage in production, local storage in development
const isProduction = process.env.NODE_ENV === 'production';
const useSupabase = isProduction && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;

// Import both upload utilities
const localUpload = require('../utils/upload');
const { handleSupabaseUpload, uploadToSupabase, deleteFromSupabase } = require('../utils/supabaseStorage');
const supabase = require('../config/supabase');

// Use appropriate upload handler
const upload = useSupabase ? require('../utils/supabaseStorage').uploadSupabase : localUpload;

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
router.post('/:id/avatar', protect, authorize('va'), async (req, res) => {
  // Handle upload based on environment
  if (useSupabase) {
    handleSupabaseUpload('avatar', 'avatars')(req, res, async (err) => {
      if (err) return; // Error already handled by middleware
      
      try {
        console.log('Avatar update attempt:', {
          vaId: req.params.id,
          userId: req.user._id,
          fileUrl: req.file.path
        });

        const va = await VA.findById(req.params.id);
        if (!va) {
          console.error('VA not found with ID:', req.params.id);
          return res.status(404).json({
            success: false,
            error: 'VA not found'
          });
        }

        // Check ownership
        if (va.user.toString() !== req.user._id.toString() && !req.user.admin) {
          console.error('Authorization failed:', {
            vaOwner: va.user.toString(),
            requestUser: req.user._id.toString(),
            isAdmin: req.user.admin
          });
          return res.status(403).json({
            success: false,
            error: 'Not authorized'
          });
        }

        // Update avatar URL (req.file.path contains the Supabase URL)
        va.avatar = req.file.path;
        console.log('Saving VA with new avatar:', va.avatar);
        
        await va.save();
        console.log('VA saved successfully');

        res.json({
          success: true,
          data: {
            avatar: va.avatar
          }
        });
      } catch (error) {
        console.error('Avatar update error - Full details:', {
          message: error.message,
          stack: error.stack,
          vaId: req.params.id,
          userId: req.user?._id
        });
        res.status(500).json({
          success: false,
          error: 'Failed to update avatar: ' + error.message
        });
      }
    });
  } else {
    // Local upload
    upload.single('avatar')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }

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
      } catch (error) {
        console.error('Avatar update error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to update avatar'
        });
      }
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
    console.log('GET /api/vas/me - User ID:', req.user._id);
    
    const va = await VA.findOne({ user: req.user._id })
      .populate('location')
      .populate('specialties')
      .populate('roleLevel')
      .populate('roleType');

    if (!va) {
      console.log('VA profile not found for user:', req.user._id);
      return res.status(404).json({
        success: false,
        error: 'VA profile not found'
      });
    }

    console.log('VA profile found:', va._id);
    res.json({
      success: true,
      data: va
    });
  } catch (err) {
    console.error('GET /api/vas/me error:', {
      message: err.message,
      stack: err.stack,
      userId: req.user._id,
      mongoDbConnected: require('mongoose').connection.readyState
    });
    res.status(500).json({
      success: false,
      error: 'Server error: ' + err.message
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

// @route   GET /api/vas/test-upload
// @desc    Test upload configuration
// @access  Public
router.get('/test-upload', async (req, res) => {
  try {
    const supabaseStatus = {
      configured: !!supabase,
      bucketName: process.env.SUPABASE_BUCKET || 'linkage-va-hub',
      environment: process.env.NODE_ENV,
      urlConfigured: !!process.env.SUPABASE_URL,
      keyConfigured: !!process.env.SUPABASE_ANON_KEY
    };

    if (supabase) {
      try {
        // Test bucket access
        const { data, error } = await supabase.storage.from(supabaseStatus.bucketName).list('', { limit: 1 });
        supabaseStatus.bucketAccessible = !error;
        supabaseStatus.bucketError = error?.message;
      } catch (e) {
        supabaseStatus.bucketAccessible = false;
        supabaseStatus.bucketError = e.message;
      }
    }

    res.json({
      success: true,
      uploadConfig: supabaseStatus,
      fallbackEnabled: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/vas/me/upload
// @desc    Upload image for VA profile (avatar or cover)
// @access  Private (VA only)
router.post('/me/upload', protect, authorize('va'), async (req, res, next) => {
  // Use Supabase in production if configured
  if (process.env.NODE_ENV === 'production' && supabase) {
    console.log('Attempting Supabase upload...');
    
    // First try with Supabase
    handleSupabaseUpload('image', 'avatars')(req, res, async (err) => {
      if (err) {
        console.error('Supabase upload failed, falling back to local storage:', err);
        
        // Fallback to local storage
        upload.single('image')(req, res, function (uploadErr) {
          if (uploadErr) {
            console.error('Local upload also failed:', uploadErr);
            return res.status(400).json({
              success: false,
              error: uploadErr.message || 'Failed to upload file'
            });
          }

          if (!req.file) {
            return res.status(400).json({
              success: false,
              error: 'Please upload a file'
            });
          }

          const baseUrl = process.env.SERVER_URL || `https://${req.get('host')}`;
          const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

          console.log('Fallback: Image uploaded locally:', imageUrl);

          res.json({
            success: true,
            url: imageUrl,
            storage: 'local'
          });
        });
        return;
      }

      if (!req.file) {
        return; // Error already handled
      }

      try {
        const imageUrl = req.file.path; // Supabase URL is in req.file.path
        console.log('Image uploaded to Supabase:', imageUrl);

        res.json({
          success: true,
          url: imageUrl,
          storage: 'supabase'
        });
      } catch (error) {
        console.error('Processing error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to process uploaded file'
        });
      }
    });
  } else {
    // Use local storage in development
    upload.single('image')(req, res, function (err) {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({
          success: false,
          error: err.message || 'Failed to upload file'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Please upload a file'
        });
      }

      const baseUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
      const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

      console.log('Image uploaded locally:', imageUrl);

      res.json({
        success: true,
        url: imageUrl
      });
    });
  }
});

// @route   POST /api/vas/me/upload-video
// @desc    Upload video for VA profile
// @access  Private (VA only)
router.post('/me/upload-video', protect, authorize('va'), async (req, res, next) => {
  // Use Supabase in production if configured
  if (process.env.NODE_ENV === 'production' && supabase) {
    console.log('Attempting Supabase video upload...');
    
    handleSupabaseUpload('video', 'videos')(req, res, async (err) => {
      if (err) {
        console.error('Supabase video upload failed, falling back to local storage:', err);
        
        // Fallback to local storage
        upload.single('video')(req, res, function (uploadErr) {
          if (uploadErr) {
            console.error('Local video upload also failed:', uploadErr);
            return res.status(400).json({
              success: false,
              error: uploadErr.message || 'Failed to upload video'
            });
          }

          if (!req.file) {
            return res.status(400).json({
              success: false,
              error: 'Please upload a video file'
            });
          }

          const baseUrl = process.env.SERVER_URL || `https://${req.get('host')}`;
          const videoUrl = `${baseUrl}/uploads/${req.file.filename}`;

          console.log('Fallback: Video uploaded locally:', videoUrl);

          res.json({
            success: true,
            url: videoUrl,
            storage: 'local'
          });
        });
        return;
      }

      if (!req.file) {
        return; // Error already handled
      }

      try {
        const videoUrl = req.file.path; // Supabase URL is in req.file.path
        console.log('Video uploaded to Supabase:', videoUrl);

        res.json({
          success: true,
          url: videoUrl,
          storage: 'supabase'
        });
      } catch (error) {
        console.error('Processing error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to process uploaded file'
        });
      }
    });
  } else {
    // Use local storage in development
    upload.single('video')(req, res, function (err) {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({
          success: false,
          error: err.message || 'Failed to upload file'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Please upload a video file'
        });
      }

      // Check file type
      if (!req.file.mimetype.startsWith('video/')) {
        return res.status(400).json({
          success: false,
          error: 'Please upload a valid video file'
        });
      }

      const baseUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
      const videoUrl = `${baseUrl}/uploads/${req.file.filename}`;

      console.log('Video uploaded locally:', videoUrl);

      res.json({
        success: true,
        url: videoUrl
      });
    });
  }
});


module.exports = router;