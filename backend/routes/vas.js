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

    // Transform the data structure to match frontend expectations
    const transformedVAs = filteredVAs.map(va => ({
      ...va.toObject(),
      roleType: va.roleType ? {
        part_time_contract: va.roleType.partTimeContract || false,
        full_time_contract: va.roleType.fullTimeContract || false,
        full_time_employment: va.roleType.fullTimeEmployment || false
      } : {
        part_time_contract: false,
        full_time_contract: false,
        full_time_employment: false
      },
      roleLevel: va.roleLevel ? {
        junior: va.roleLevel.junior || false,
        mid: va.roleLevel.mid || false,
        senior: va.roleLevel.senior || false,
        principal: va.roleLevel.principal || false,
        c_level: va.roleLevel.cLevel || false
      } : {
        junior: false,
        mid: false,
        senior: false,
        principal: false,
        c_level: false
      }
    }));

    res.json({
      success: true,
      data: transformedVAs,
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

// @route   GET /api/vas/me
// @desc    Get current VA's profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    console.log('GET /api/vas/me - User ID:', req.user._id);
    
    let va = await VA.findOne({ user: req.user._id })
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

    // Fix missing roleType/roleLevel references if they don't exist
    let needsReload = false;
    
    if (!va.roleType) {
      console.log('Fixing missing roleType reference for VA:', va._id);
      let roleType = await RoleType.findOne({ va: va._id });
      if (!roleType) {
        console.log('Creating new roleType for VA:', va._id);
        roleType = await RoleType.create({ va: va._id });
      }
      console.log('Linking roleType', roleType._id, 'to VA', va._id);
      await VA.findByIdAndUpdate(va._id, { roleType: roleType._id });
      needsReload = true;
    }
    
    if (!va.roleLevel) {
      console.log('Fixing missing roleLevel reference for VA:', va._id);
      let roleLevel = await RoleLevel.findOne({ va: va._id });
      if (!roleLevel) {
        console.log('Creating new roleLevel for VA:', va._id);
        roleLevel = await RoleLevel.create({ va: va._id });
      }
      console.log('Linking roleLevel', roleLevel._id, 'to VA', va._id);
      await VA.findByIdAndUpdate(va._id, { roleLevel: roleLevel._id });
      needsReload = true;
    }
    
    // Re-populate after fixing references
    if (needsReload) {
      console.log('Reloading VA with fixed references...');
      va = await VA.findById(va._id)
        .populate('location')
        .populate('specialties')
        .populate('roleLevel')
        .populate('roleType');
    }

    console.log('GET /api/vas/me - VA profile found:', {
      _id: va._id,
      roleType: va.roleType,
      roleLevel: va.roleLevel
    });

    // Transform the data structure to match frontend expectations
    const transformedVA = {
      ...va.toObject(),
      roleType: va.roleType ? {
        part_time_contract: va.roleType.partTimeContract || false,
        full_time_contract: va.roleType.fullTimeContract || false,
        full_time_employment: va.roleType.fullTimeEmployment || false
      } : {
        part_time_contract: false,
        full_time_contract: false,
        full_time_employment: false
      },
      roleLevel: va.roleLevel ? {
        junior: va.roleLevel.junior || false,
        mid: va.roleLevel.mid || false,
        senior: va.roleLevel.senior || false,
        principal: va.roleLevel.principal || false,
        c_level: va.roleLevel.cLevel || false
      } : {
        junior: false,
        mid: false,
        senior: false,
        principal: false,
        c_level: false
      }
    };

    console.log('GET /api/vas/me - Transformed data:', {
      roleType: transformedVA.roleType,
      roleLevel: transformedVA.roleLevel
    });

    res.json({
      success: true,
      data: transformedVA
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

    // Transform the data structure to match frontend expectations
    const transformedVA = {
      ...va.toObject(),
      roleType: va.roleType ? {
        part_time_contract: va.roleType.partTimeContract || false,
        full_time_contract: va.roleType.fullTimeContract || false,
        full_time_employment: va.roleType.fullTimeEmployment || false
      } : {
        part_time_contract: false,
        full_time_contract: false,
        full_time_employment: false
      },
      roleLevel: va.roleLevel ? {
        junior: va.roleLevel.junior || false,
        mid: va.roleLevel.mid || false,
        senior: va.roleLevel.senior || false,
        principal: va.roleLevel.principal || false,
        c_level: va.roleLevel.cLevel || false
      } : {
        junior: false,
        mid: false,
        senior: false,
        principal: false,
        c_level: false
      }
    };

    res.json({
      success: true,
      data: transformedVA
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

    // Create role level and type and link them to VA
    const roleLevel = await RoleLevel.create({ va: va._id });
    const roleType = await RoleType.create({ va: va._id });
    
    // Update VA with references to role level and type
    va.roleLevel = roleLevel._id;
    va.roleType = roleType._id;
    await va.save();

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

// @route   PUT /api/vas/me
// @desc    Update current VA's profile
// @access  Private
router.put('/me', protect, async (req, res) => {
  try {
    console.log('PUT /api/vas/me - User ID:', req.user._id);
    console.log('PUT /api/vas/me - Request body:', req.body);

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
      'meta',
      'instagram',
      'schedulingLink',
      'preferredMinHourlyRate',
      'preferredMaxHourlyRate',
      'preferredMinSalary',
      'preferredMaxSalary',
      'searchStatus',
      'videoIntroduction',
      'location',
      'email',
      'phone',
      'whatsapp',
      'viber',
      'specialtyIds',
      // 'roleType' and 'roleLevel' removed - these are handled separately
      'profileReminderNotifications',
      'productAnnouncementNotifications',
      // DISC Assessment fields
      'discPrimaryType',
      'discDominance',
      'discInfluence',
      'discSteadiness',
      'discConscientiousness'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    console.log('PUT /api/vas/me - Update data:', JSON.stringify(updateData, null, 2));

    // Log specific fields we're having issues with
    console.log('PUT /api/vas/me - Email from request:', req.body.email);
    console.log('PUT /api/vas/me - Phone from request:', req.body.phone);
    console.log('PUT /api/vas/me - SpecialtyIds from request:', req.body.specialtyIds);

    // Handle location if provided
    if (updateData.location) {
      console.log('Processing location:', updateData.location);
      const Location = require('../models/Location');
      const mongoose = require('mongoose');
      
      // Check if it's a location object or ObjectId
      if (typeof updateData.location === 'object' && updateData.location !== null) {
        // It's a location object - find or create the location
        const locationData = updateData.location;
        console.log('Location object received:', locationData);
        
        // Validate required fields
        if (!locationData.city || !locationData.country) {
          return res.status(400).json({
            success: false,
            error: 'Location must have city and country'
          });
        }
        
        // Try to find existing location (match by city, state, and country)
        let location = await Location.findOne({
          city: locationData.city,
          state: locationData.state || locationData.province,
          country: locationData.country || 'Philippines'
        });
        
        if (!location) {
          // Create new location
          console.log('Creating new location:', locationData);
          location = await Location.create({
            city: locationData.city,
            state: locationData.state || locationData.province || '',
            country: locationData.country || 'Philippines',
            countryCode: locationData.country_code || 'PH',
            streetAddress: locationData.street || locationData.streetAddress || '',
            postalCode: locationData.postal_code || locationData.postalCode || '',
            barangay: locationData.barangay || '',
            timeZone: 'Asia/Manila',
            utcOffset: 8
          });
          console.log('Created location:', location._id);
        } else {
          // Update existing location with additional details if provided
          let locationUpdated = false;
          if ((locationData.street || locationData.streetAddress) && !location.streetAddress) {
            location.streetAddress = locationData.street || locationData.streetAddress;
            locationUpdated = true;
          }
          if ((locationData.postal_code || locationData.postalCode) && !location.postalCode) {
            location.postalCode = locationData.postal_code || locationData.postalCode;
            locationUpdated = true;
          }
          if (locationData.barangay && !location.barangay) {
            location.barangay = locationData.barangay;
            locationUpdated = true;
          }
          
          if (locationUpdated) {
            await location.save();
            console.log('Updated existing location with additional details:', location._id);
          } else {
            console.log('Found existing location:', location._id);
          }
        }
        
        // Replace location object with ObjectId
        updateData.location = location._id;
        
      } else if (typeof updateData.location === 'string') {
        // It's a string - validate as ObjectId
        if (!mongoose.Types.ObjectId.isValid(updateData.location)) {
          console.log('Invalid ObjectId format:', updateData.location);
          return res.status(400).json({
            success: false,
            error: 'Invalid location ID format'
          });
        }
        
        const locationExists = await Location.findById(updateData.location);
        if (!locationExists) {
          console.log('Location not found:', updateData.location);
          return res.status(400).json({
            success: false,
            error: 'Location not found'
          });
        }
        console.log('Location validated:', locationExists.city, locationExists.country);
      }
    }

    // Handle specialties update
    if (updateData.specialtyIds) {
      updateData.specialties = updateData.specialtyIds;
      delete updateData.specialtyIds;
      console.log('Updated specialties:', updateData.specialties);
    }

    // First update the VA profile
    const va = await VA.findOneAndUpdate(
      { user: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    console.log('PUT /api/vas/me - VA after update:', {
      _id: va?._id,
      email: va?.email,
      phone: va?.phone,
      specialties: va?.specialties
    });

    // Handle role type and level updates after we have the VA
    if ((req.body.roleType || req.body.roleLevel) && va) {
      console.log('Updating role type/level:', { roleType: req.body.roleType, roleLevel: req.body.roleLevel });
      
      if (req.body.roleType) {
        const RoleType = require('../models/RoleType');
        // Transform frontend roleType structure to match database schema
        const roleTypeData = {
          partTimeContract: req.body.roleType.part_time_contract || false,
          fullTimeContract: req.body.roleType.full_time_contract || false,
          fullTimeEmployment: req.body.roleType.full_time_employment || false
        };
        const roleTypeDoc = await RoleType.findOneAndUpdate(
          { va: va._id },
          roleTypeData,
          { upsert: true, new: true }
        );
        
        console.log('RoleType document created/updated:', roleTypeDoc);
        
        // Update VA model with roleType reference
        const updatedVA = await VA.findByIdAndUpdate(va._id, { roleType: roleTypeDoc._id }, { new: true });
        console.log('VA updated with roleType reference:', updatedVA.roleType);
      }
      
      if (req.body.roleLevel) {
        const RoleLevel = require('../models/RoleLevel');
        // Transform frontend roleLevel structure to match database schema
        const roleLevelData = {
          junior: req.body.roleLevel.junior || false,
          mid: req.body.roleLevel.mid || false,
          senior: req.body.roleLevel.senior || false,
          principal: req.body.roleLevel.principal || false,
          cLevel: req.body.roleLevel.c_level || false
        };
        const roleLevelDoc = await RoleLevel.findOneAndUpdate(
          { va: va._id },
          roleLevelData,
          { upsert: true, new: true }
        );
        
        console.log('RoleLevel document created/updated:', roleLevelDoc);
        
        // Update VA model with roleLevel reference
        const updatedVA = await VA.findByIdAndUpdate(va._id, { roleLevel: roleLevelDoc._id }, { new: true });
        console.log('VA updated with roleLevel reference:', updatedVA.roleLevel);
      }
    }

    // Handle DISC assessment updates
    if ((req.body.discPrimaryType || req.body.discDominance || req.body.discInfluence || 
         req.body.discSteadiness || req.body.discConscientiousness) && va) {
      
      // Check if DISC data has actually changed
      const currentDisc = va.discAssessment || {};
      const hasChanged = 
        req.body.discPrimaryType !== currentDisc.primaryType ||
        parseInt(req.body.discDominance) !== currentDisc.scores?.dominance ||
        parseInt(req.body.discInfluence) !== currentDisc.scores?.influence ||
        parseInt(req.body.discSteadiness) !== currentDisc.scores?.steadiness ||
        parseInt(req.body.discConscientiousness) !== currentDisc.scores?.conscientiousness;
      
      if (!hasChanged) {
        console.log('DISC assessment data unchanged, skipping update');
      } else {
        console.log('Updating DISC assessment:', {
          discPrimaryType: req.body.discPrimaryType,
          discDominance: req.body.discDominance,
          discInfluence: req.body.discInfluence,
          discSteadiness: req.body.discSteadiness,
          discConscientiousness: req.body.discConscientiousness
        });
      
      // Initialize discAssessment if it doesn't exist
      if (!va.discAssessment) {
        va.discAssessment = {
          isCompleted: false,
          primaryType: null,
          scores: {},
          completedAt: null,
          assessmentData: {}
        };
      }
      
      // Update DISC assessment data
      if (req.body.discPrimaryType && ['D', 'I', 'S', 'C'].includes(req.body.discPrimaryType)) {
        va.discAssessment.primaryType = req.body.discPrimaryType;
      }
      
      if (req.body.discDominance !== undefined) {
        va.discAssessment.scores.dominance = parseInt(req.body.discDominance) || 0;
      }
      
      if (req.body.discInfluence !== undefined) {
        va.discAssessment.scores.influence = parseInt(req.body.discInfluence) || 0;
      }
      
      if (req.body.discSteadiness !== undefined) {
        va.discAssessment.scores.steadiness = parseInt(req.body.discSteadiness) || 0;
      }
      
      if (req.body.discConscientiousness !== undefined) {
        va.discAssessment.scores.conscientiousness = parseInt(req.body.discConscientiousness) || 0;
      }
      
      // Mark as completed if primary type is set
      if (va.discAssessment.primaryType) {
        va.discAssessment.isCompleted = true;
        // Only update completedAt if it's not already set
        if (!va.discAssessment.completedAt) {
          va.discAssessment.completedAt = new Date();
        }
      }
      
        await va.save();
        console.log('DISC assessment updated successfully');
      }
    }

    if (!va) {
      console.log('VA profile not found for user:', req.user._id);
      return res.status(404).json({
        success: false,
        error: 'VA profile not found. Please create a VA profile first.'
      });
    }

    // Populate the updated VA profile with all related fields
    const populatedVA = await VA.findById(va._id)
      .populate('location')
      .populate('specialties')
      .populate('roleLevel')
      .populate('roleType');

    console.log('PUT /api/vas/me - Final populated VA:', {
      _id: populatedVA?._id,
      email: populatedVA?.email,
      phone: populatedVA?.phone,
      specialties: populatedVA?.specialties?.map(s => ({ _id: s._id, name: s.name })),
      roleType: populatedVA?.roleType,
      roleLevel: populatedVA?.roleLevel
    });

    // Transform the data structure to match frontend expectations
    const transformedVA = {
      ...populatedVA.toObject(),
      roleType: populatedVA.roleType ? {
        part_time_contract: populatedVA.roleType.partTimeContract || false,
        full_time_contract: populatedVA.roleType.fullTimeContract || false,
        full_time_employment: populatedVA.roleType.fullTimeEmployment || false
      } : {
        part_time_contract: false,
        full_time_contract: false,
        full_time_employment: false
      },
      roleLevel: populatedVA.roleLevel ? {
        junior: populatedVA.roleLevel.junior || false,
        mid: populatedVA.roleLevel.mid || false,
        senior: populatedVA.roleLevel.senior || false,
        principal: populatedVA.roleLevel.principal || false,
        c_level: populatedVA.roleLevel.cLevel || false
      } : {
        junior: false,
        mid: false,
        senior: false,
        principal: false,
        c_level: false
      }
    };

    console.log('VA profile updated successfully:', va._id);
    res.json({
      success: true,
      data: transformedVA
    });
  } catch (err) {
    console.error('PUT /api/vas/me error:', {
      message: err.message,
      stack: err.stack,
      userId: req.user._id,
      body: req.body
    });
    res.status(500).json({
      success: false,
      error: 'Server error: ' + err.message
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

// @route   GET /api/vas/fix-references
// @desc    Fix missing roleType/roleLevel references for all VAs
// @access  Public (temporary)
router.get('/fix-references', async (req, res) => {
  try {
    console.log('Starting fix-references process...');
    const vas = await VA.find({});
    console.log(`Found ${vas.length} VA profiles to check`);
    const fixed = [];
    
    for (const va of vas) {
      let needsUpdate = false;
      const updates = {};
      
      console.log(`Checking VA ${va._id}, current roleType: ${va.roleType}, roleLevel: ${va.roleLevel}`);
      
      // Check and fix roleType reference
      if (!va.roleType) {
        const roleType = await RoleType.findOne({ va: va._id });
        console.log(`Found roleType for VA ${va._id}:`, roleType?._id);
        if (roleType) {
          updates.roleType = roleType._id;
          needsUpdate = true;
        }
      }
      
      // Check and fix roleLevel reference  
      if (!va.roleLevel) {
        const roleLevel = await RoleLevel.findOne({ va: va._id });
        console.log(`Found roleLevel for VA ${va._id}:`, roleLevel?._id);
        if (roleLevel) {
          updates.roleLevel = roleLevel._id;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        console.log(`Updating VA ${va._id} with:`, updates);
        await VA.findByIdAndUpdate(va._id, updates);
        fixed.push({
          vaId: va._id,
          updates
        });
      }
    }
    
    console.log(`Fixed ${fixed.length} VA profiles`);
    res.json({
      success: true,
      message: `Fixed ${fixed.length} VA profiles`,
      fixed
    });
  } catch (error) {
    console.error('fix-references error:', error);
    res.status(500).json({
      success: false,
      error: error.message
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
  // Use Supabase if configured and either in production or forced
  const forceSupabase = process.env.FORCE_SUPABASE === 'true';
  if ((process.env.NODE_ENV === 'production' || forceSupabase) && supabase) {
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
    // Use local storage if Supabase not configured or not forced
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
  // Use Supabase if configured and either in production or forced
  const forceSupabase = process.env.FORCE_SUPABASE === 'true';
  if ((process.env.NODE_ENV === 'production' || forceSupabase) && supabase) {
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
    // Use local storage if Supabase not configured or not forced
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

// @route   POST /api/vas/me/disc-assessment
// @desc    Submit DISC personality assessment results
// @access  Private
router.post('/me/disc-assessment', protect, async (req, res) => {
  try {
    const { primaryType, scores, assessmentData } = req.body;

    // Validate primary type
    if (!primaryType || !['D', 'I', 'S', 'C'].includes(primaryType)) {
      return res.status(400).json({
        success: false,
        error: 'Valid primary DISC type is required (D, I, S, or C)'
      });
    }

    // Validate scores
    if (!scores || typeof scores !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'DISC scores are required'
      });
    }

    const requiredScores = ['dominance', 'influence', 'steadiness', 'conscientiousness'];
    for (const scoreType of requiredScores) {
      if (typeof scores[scoreType] !== 'number' || scores[scoreType] < 0 || scores[scoreType] > 100) {
        return res.status(400).json({
          success: false,
          error: `Valid ${scoreType} score (0-100) is required`
        });
      }
    }

    // Find VA profile
    const va = await VA.findOne({ user: req.user._id });
    if (!va) {
      return res.status(404).json({
        success: false,
        error: 'VA profile not found'
      });
    }

    // Update DISC assessment data
    va.discAssessment = {
      isCompleted: true,
      primaryType,
      scores,
      completedAt: new Date(),
      assessmentData: assessmentData || {}
    };

    await va.save();

    res.json({
      success: true,
      data: {
        discAssessment: va.discAssessment
      }
    });

  } catch (err) {
    console.error('DISC assessment submission error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/vas/me/disc-assessment
// @desc    Get DISC personality assessment results
// @access  Private
router.get('/me/disc-assessment', protect, async (req, res) => {
  try {
    const va = await VA.findOne({ user: req.user._id });
    if (!va) {
      return res.status(404).json({
        success: false,
        error: 'VA profile not found'
      });
    }

    res.json({
      success: true,
      data: {
        discAssessment: va.discAssessment || {
          isCompleted: false,
          primaryType: null,
          scores: null,
          completedAt: null
        }
      }
    });

  } catch (err) {
    console.error('DISC assessment retrieval error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/vas/me/disc-assessment
// @desc    Update DISC personality assessment results
// @access  Private
router.put('/me/disc-assessment', protect, async (req, res) => {
  try {
    const { primaryType, scores, assessmentData } = req.body;

    const va = await VA.findOne({ user: req.user._id });
    if (!va) {
      return res.status(404).json({
        success: false,
        error: 'VA profile not found'
      });
    }

    // Update only provided fields
    if (primaryType && ['D', 'I', 'S', 'C'].includes(primaryType)) {
      va.discAssessment.primaryType = primaryType;
    }

    if (scores && typeof scores === 'object') {
      va.discAssessment.scores = { ...va.discAssessment.scores, ...scores };
    }

    if (assessmentData) {
      va.discAssessment.assessmentData = assessmentData;
    }

    va.discAssessment.isCompleted = true;
    va.discAssessment.completedAt = new Date();

    await va.save();

    res.json({
      success: true,
      data: {
        discAssessment: va.discAssessment
      }
    });

  } catch (err) {
    console.error('DISC assessment update error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});


module.exports = router;