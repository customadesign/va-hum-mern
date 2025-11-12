const SavedVA = require('../models/SavedVA');
const VA = require('../models/VA');
const Business = require('../models/Business');

// Configuration
const MAX_SAVED_VAS_PER_BUSINESS = process.env.MAX_SAVED_VAS || 500;

// Helper function to check if user is E-Systems business
const isESystemsBusiness = (user) => {
  // Check if user is authenticated, has business role, and is in E-Systems context
  // In production, this would check against actual brand configuration
  const isBusinessRole = user.business && user.role === 'business';

  // Check multiple ways to identify E-Systems users
  const isESystemsBrand =
    process.env.BRAND === 'esystems' ||
    process.env.ESYSTEMS_MODE === 'true' ||
    user.brand === 'esystems' ||
    (user.email && user.email.includes('@esystemsmanagement.com'));

  return isBusinessRole && isESystemsBrand;
};

// Save a VA
exports.saveVA = async (req, res) => {
  try {
    const { vaId } = req.body;
    const userId = req.user.id;

    // Validate user is E-Systems business
    if (!isESystemsBusiness(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'This feature is available to E-Systems business accounts only'
      });
    }

    // Validate VA exists
    const va = await VA.findById(vaId);
    if (!va) {
      return res.status(404).json({
        success: false,
        error: 'VA not found'
      });
    }

    // Get business ID
    const business = await Business.findOne({ user: userId });
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    // Check if already saved (idempotent)
    const existingSave = await SavedVA.findOne({
      business: business._id,
      va: vaId
    });

    if (existingSave) {
      return res.status(200).json({
        success: true,
        message: 'VA already saved',
        data: existingSave
      });
    }

    // Check saved limit
    const savedCount = await SavedVA.getSavedCount(business._id);
    if (savedCount >= MAX_SAVED_VAS_PER_BUSINESS) {
      return res.status(409).json({
        success: false,
        error: `You've reached your Saved VAs limit (${MAX_SAVED_VAS_PER_BUSINESS}). Remove some to add more.`
      });
    }

    // Create saved VA record
    const savedVA = new SavedVA({
      business: business._id,
      va: vaId,
      user: userId,
      brand: 'esystems',
      notes: req.body.notes || null
    });

    await savedVA.save();

    // Track analytics event
    if (req.app.locals.analytics) {
      req.app.locals.analytics.track({
        userId: userId,
        event: 'save_va_success',
        properties: {
          va_id: vaId,
          business_id: business._id,
          brand: 'esystems',
          context: req.body.context || 'va_profile'
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'VA saved successfully',
      data: savedVA
    });
  } catch (error) {
    console.error('Error saving VA:', error);
    res.status(500).json({
      success: false,
      error: 'We couldn\'t save this VA. Please try again.'
    });
  }
};

// Unsave a VA
exports.unsaveVA = async (req, res) => {
  try {
    const { vaId } = req.params;
    const userId = req.user.id;

    // Validate user is E-Systems business
    if (!isESystemsBusiness(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'This feature is available to E-Systems business accounts only'
      });
    }

    // Get business ID
    const business = await Business.findOne({ user: userId });
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    // Find and delete saved VA
    const savedVA = await SavedVA.findOneAndDelete({
      business: business._id,
      va: vaId
    });

    if (!savedVA) {
      return res.status(404).json({
        success: false,
        error: 'VA not found in saved list'
      });
    }

    // Track analytics event
    if (req.app.locals.analytics) {
      req.app.locals.analytics.track({
        userId: userId,
        event: 'unsave_va_success',
        properties: {
          va_id: vaId,
          business_id: business._id,
          brand: 'esystems',
          context: req.body.context || 'va_profile'
        }
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error unsaving VA:', error);
    res.status(500).json({
      success: false,
      error: 'We couldn\'t remove this VA. Please try again.'
    });
  }
};

// Get saved VAs list
exports.getSavedVAs = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate user is E-Systems business
    if (!isESystemsBusiness(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'This feature is available to E-Systems business accounts only'
      });
    }

    // Get business ID
    const business = await Business.findOne({ user: userId });
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter query
    const filterQuery = { business: business._id };

    // Build sort options
    let sortOptions = { savedAt: -1 }; // Default: recently saved
    if (req.query.sortBy) {
      switch (req.query.sortBy) {
        case 'name':
          sortOptions = { 'va.firstName': 1, 'va.lastName': 1 };
          break;
        case 'experience':
          sortOptions = { 'va.yearsOfExperience': -1 };
          break;
        case 'last_active':
          sortOptions = { 'va.lastActive': -1 };
          break;
        case 'saved_date':
        default:
          sortOptions = { savedAt: -1 };
      }
    }

    // Get total count
    const totalCount = await SavedVA.countDocuments(filterQuery);

    // Get saved VAs with populated VA details
    const savedVAs = await SavedVA.find(filterQuery)
      .populate({
        path: 'va',
        select: 'firstName lastName hero title skills rating hourlyRate availability timezone avatar bio status specialties languages experience industry location yearsOfExperience'
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    // Filter out deactivated VAs and mark them
    const processedVAs = savedVAs.map(saved => {
      const va = saved.va;
      if (!va || va.status === 'inactive' || va.status === 'suspended') {
        return {
          ...saved,
          va: {
            ...va,
            unavailable: true
          }
        };
      }
      return saved;
    });

    // Apply additional filters if provided
    let filteredVAs = processedVAs;

    // Apply search filter
    if (req.query.search && req.query.search.trim()) {
      const searchTerm = req.query.search.trim().toLowerCase();
      filteredVAs = filteredVAs.filter(saved => {
        if (!saved.va) return false;
        const va = saved.va;

        // Search in name, hero, skills, specialties
        const searchableText = [
          va.firstName,
          va.lastName,
          va.hero,
          va.title,
          ...(va.skills || []),
          ...(va.specialties || []).map(s => s.name || s),
          va.bio
        ].filter(Boolean).join(' ').toLowerCase();

        return searchableText.includes(searchTerm);
      });
    }

    // Apply status filter
    if (req.query.status && req.query.status !== 'all') {
      filteredVAs = filteredVAs.filter(saved => {
        if (!saved.va) return req.query.status === 'inactive';
        if (req.query.status === 'active') {
          return saved.va.status === 'active' && !saved.va.unavailable;
        } else if (req.query.status === 'inactive') {
          return saved.va.status !== 'active' || saved.va.unavailable;
        }
        return true;
      });
    }

    // Apply industry filter
    if (req.query.industry && Array.isArray(req.query.industry)) {
      filteredVAs = filteredVAs.filter(saved =>
        saved.va && req.query.industry.includes(saved.va.industry)
      );
    }

    if (req.query.skills) {
      const skills = req.query.skills.split(',');
      filteredVAs = filteredVAs.filter(saved =>
        saved.va && saved.va.skills &&
        skills.some(skill => saved.va.skills.includes(skill))
      );
    }

    if (req.query.rateMin || req.query.rateMax) {
      const rateMin = parseFloat(req.query.rateMin) || 0;
      const rateMax = parseFloat(req.query.rateMax) || Infinity;
      filteredVAs = filteredVAs.filter(saved =>
        saved.va && saved.va.hourlyRate >= rateMin && saved.va.hourlyRate <= rateMax
      );
    }

    if (req.query.availability) {
      filteredVAs = filteredVAs.filter(saved =>
        saved.va && saved.va.availability === req.query.availability
      );
    }

    if (req.query.timezone) {
      filteredVAs = filteredVAs.filter(saved =>
        saved.va && saved.va.timezone === req.query.timezone
      );
    }

    // Track analytics event
    if (req.app.locals.analytics) {
      req.app.locals.analytics.track({
        userId: userId,
        event: 'saved_list_viewed',
        properties: {
          business_id: business._id,
          brand: 'esystems',
          total_saved: totalCount,
          page: page,
          filters_applied: Object.keys(req.query).filter(k =>
            ['skills', 'rateMin', 'rateMax', 'availability', 'timezone'].includes(k)
          )
        }
      });
    }

    res.json({
      success: true,
      data: filteredVAs,
      pagination: {
        page,
        limit,
        total: filteredVAs.length, // Use filtered count for consistency
        pages: Math.ceil(filteredVAs.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching saved VAs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch saved VAs'
    });
  }
};

// Check if a VA is saved
exports.checkIfSaved = async (req, res) => {
  try {
    const { vaId } = req.params;
    const userId = req.user.id;

    // Validate user is E-Systems business
    if (!isESystemsBusiness(req.user)) {
      return res.json({
        success: true,
        data: { saved: false }
      });
    }

    // Get business ID
    const business = await Business.findOne({ user: userId });
    if (!business) {
      return res.json({
        success: true,
        data: { saved: false }
      });
    }

    // Check if saved
    const isSaved = await SavedVA.isSaved(business._id, vaId);

    res.json({
      success: true,
      data: { saved: isSaved }
    });
  } catch (error) {
    console.error('Error checking saved status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check saved status'
    });
  }
};

// Get saved count for profile dropdown
exports.getSavedCount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate user is E-Systems business
    if (!isESystemsBusiness(req.user)) {
      return res.json({
        success: true,
        data: { count: 0 }
      });
    }

    // Get business ID
    const business = await Business.findOne({ user: userId });
    if (!business) {
      return res.json({
        success: true,
        data: { count: 0 }
      });
    }

    // Get count
    const count = await SavedVA.getSavedCount(business._id);

    res.json({
      success: true,
      data: {
        count: count,
        displayCount: count > 99 ? '99+' : count.toString()
      }
    });
  } catch (error) {
    console.error('Error getting saved count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get saved count'
    });
  }
};