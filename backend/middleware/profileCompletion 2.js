const Business = require('../models/Business');
const VA = require('../models/VA');

// Define required fields for profile completion
const REQUIRED_FIELDS = {
  business: {
    basic: ['contactName', 'company', 'bio', 'email', 'phone'],
    location: ['city', 'state', 'country'],
    company: ['industry', 'companySize'],
    optional: [
      'website', 'contactRole', 'streetAddress', 'postalCode',
      'foundedYear', 'employeeCount', 'specialties', 'companyCulture',
      'benefits', 'workEnvironment', 'headquartersLocation',
      'linkedin', 'facebook', 'twitter', 'instagram', 'youtube',
      'certifications', 'awards', 'avatar'
    ]
  },
  va: {
    basic: ['name', 'email', 'phone', 'bio'],
    location: ['location.city', 'location.state', 'location.country'],
    professional: ['hourlyRate', 'skills', 'experience'],
    optional: [
      'languages', 'certifications', 'portfolio', 'availability',
      'timezone', 'workingHours', 'avatar', 'resume',
      'linkedin', 'website', 'education'
    ]
  }
};

// Weight for different field categories
const FIELD_WEIGHTS = {
  basic: 40,      // 40% weight for basic fields
  location: 20,   // 20% weight for location fields
  company: 20,    // 20% weight for company/professional fields
  optional: 20    // 20% weight for optional fields
};

/**
 * Calculate profile completion percentage
 */
const calculateCompletionPercentage = (profile, userType) => {
  const fields = REQUIRED_FIELDS[userType];
  if (!fields) return 0;

  let totalScore = 0;
  let maxScore = 0;

  // Calculate basic fields score
  const basicFields = fields.basic;
  const basicCompleted = basicFields.filter(field => {
    const value = getNestedValue(profile, field);
    return value && value.toString().trim().length > 0;
  }).length;
  totalScore += (basicCompleted / basicFields.length) * FIELD_WEIGHTS.basic;
  maxScore += FIELD_WEIGHTS.basic;

  // Calculate location fields score
  const locationFields = fields.location;
  const locationCompleted = locationFields.filter(field => {
    const value = getNestedValue(profile, field);
    return value && value.toString().trim().length > 0;
  }).length;
  totalScore += (locationCompleted / locationFields.length) * FIELD_WEIGHTS.location;
  maxScore += FIELD_WEIGHTS.location;

  // Calculate company/professional fields score
  if (userType === 'business' && fields.company) {
    const companyFields = fields.company;
    const companyCompleted = companyFields.filter(field => {
      const value = getNestedValue(profile, field);
      return value && value.toString().trim().length > 0;
    }).length;
    totalScore += (companyCompleted / companyFields.length) * FIELD_WEIGHTS.company;
    maxScore += FIELD_WEIGHTS.company;
  } else if (userType === 'va' && fields.professional) {
    const professionalFields = fields.professional;
    const professionalCompleted = professionalFields.filter(field => {
      const value = getNestedValue(profile, field);
      if (field === 'skills' || field === 'experience') {
        return Array.isArray(value) && value.length > 0;
      }
      return value && value.toString().trim().length > 0;
    }).length;
    totalScore += (professionalCompleted / professionalFields.length) * FIELD_WEIGHTS.company;
    maxScore += FIELD_WEIGHTS.company;
  }

  // Calculate optional fields score
  const optionalFields = fields.optional;
  const optionalCompleted = optionalFields.filter(field => {
    const value = getNestedValue(profile, field);
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value && value.toString().trim().length > 0;
  }).length;
  
  // Optional fields contribute proportionally to their weight
  if (optionalFields.length > 0) {
    totalScore += (optionalCompleted / optionalFields.length) * FIELD_WEIGHTS.optional;
    maxScore += FIELD_WEIGHTS.optional;
  }

  return Math.round((totalScore / maxScore) * 100);
};

/**
 * Get nested value from object using dot notation
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

/**
 * Get missing required fields
 */
const getMissingFields = (profile, userType) => {
  const fields = REQUIRED_FIELDS[userType];
  if (!fields) return [];

  const missing = {
    basic: [],
    location: [],
    company: [],
    professional: []
  };

  // Check basic fields
  fields.basic.forEach(field => {
    const value = getNestedValue(profile, field);
    if (!value || value.toString().trim().length === 0) {
      missing.basic.push(field);
    }
  });

  // Check location fields
  fields.location.forEach(field => {
    const value = getNestedValue(profile, field);
    if (!value || value.toString().trim().length === 0) {
      missing.location.push(field);
    }
  });

  // Check company/professional fields
  if (userType === 'business' && fields.company) {
    fields.company.forEach(field => {
      const value = getNestedValue(profile, field);
      if (!value || value.toString().trim().length === 0) {
        missing.company.push(field);
      }
    });
  } else if (userType === 'va' && fields.professional) {
    fields.professional.forEach(field => {
      const value = getNestedValue(profile, field);
      if (field === 'skills' || field === 'experience') {
        if (!Array.isArray(value) || value.length === 0) {
          missing.professional.push(field);
        }
      } else if (!value || value.toString().trim().length === 0) {
        missing.professional.push(field);
      }
    });
  }

  return missing;
};

/**
 * Profile completion gate middleware
 * Ensures user has completed at least X% of their profile
 */
const profileCompletionGate = (requiredPercentage = 80) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      // Skip for admin users
      if (user.admin) {
        return next();
      }

      let profile;
      let userType;

      // Determine user type and fetch profile
      if (user.business) {
        profile = await Business.findOne({ user: user._id });
        userType = 'business';
      } else if (user.va) {
        profile = await VA.findOne({ user: user._id });
        userType = 'va';
      } else {
        // User has no profile yet
        return res.status(403).json({
          success: false,
          error: 'Profile setup required',
          message: 'Please complete your profile setup to access this feature',
          profileCompletion: 0,
          requiredCompletion: requiredPercentage
        });
      }

      if (!profile) {
        return res.status(403).json({
          success: false,
          error: 'Profile not found',
          message: 'Please complete your profile setup to access this feature',
          profileCompletion: 0,
          requiredCompletion: requiredPercentage
        });
      }

      // Calculate completion percentage
      const completionPercentage = calculateCompletionPercentage(profile, userType);

      // Check if meets minimum requirement
      if (completionPercentage < requiredPercentage) {
        const missingFields = getMissingFields(profile, userType);
        
        return res.status(403).json({
          success: false,
          error: 'Incomplete profile',
          message: `Your profile is ${completionPercentage}% complete. Please complete at least ${requiredPercentage}% to access this feature.`,
          profileCompletion: completionPercentage,
          requiredCompletion: requiredPercentage,
          missingFields,
          suggestions: getCompletionSuggestions(missingFields, userType)
        });
      }

      // Add completion info to request
      req.profileCompletion = {
        percentage: completionPercentage,
        userType,
        profileId: profile._id
      };

      next();
    } catch (error) {
      console.error('Profile completion gate error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify profile completion'
      });
    }
  };
};

/**
 * Get suggestions for profile completion
 */
const getCompletionSuggestions = (missingFields, userType) => {
  const suggestions = [];

  if (missingFields.basic.length > 0) {
    suggestions.push({
      priority: 'high',
      category: 'Basic Information',
      message: `Complete basic information: ${missingFields.basic.join(', ')}`,
      fields: missingFields.basic
    });
  }

  if (missingFields.location.length > 0) {
    suggestions.push({
      priority: 'high',
      category: 'Location',
      message: 'Add your location details to help others find you',
      fields: missingFields.location
    });
  }

  if (userType === 'business' && missingFields.company.length > 0) {
    suggestions.push({
      priority: 'medium',
      category: 'Company Information',
      message: 'Provide company details to build trust',
      fields: missingFields.company
    });
  }

  if (userType === 'va' && missingFields.professional.length > 0) {
    suggestions.push({
      priority: 'medium',
      category: 'Professional Information',
      message: 'Add your professional details to attract clients',
      fields: missingFields.professional
    });
  }

  return suggestions;
};

/**
 * Profile completion check endpoint
 */
const getProfileCompletionStatus = async (req, res) => {
  try {
    const user = req.user;
    
    let profile;
    let userType;

    // Determine user type and fetch profile
    if (user.business) {
      profile = await Business.findOne({ user: user._id });
      userType = 'business';
    } else if (user.va) {
      profile = await VA.findOne({ user: user._id });
      userType = 'va';
    } else {
      return res.json({
        success: true,
        completion: {
          percentage: 0,
          userType: null,
          missingFields: null,
          suggestions: ['Please complete your profile setup']
        }
      });
    }

    if (!profile) {
      return res.json({
        success: true,
        completion: {
          percentage: 0,
          userType,
          missingFields: null,
          suggestions: ['Profile not found. Please create your profile.']
        }
      });
    }

    const completionPercentage = calculateCompletionPercentage(profile, userType);
    const missingFields = getMissingFields(profile, userType);
    const suggestions = getCompletionSuggestions(missingFields, userType);

    res.json({
      success: true,
      completion: {
        percentage: completionPercentage,
        userType,
        isComplete: completionPercentage >= 80,
        missingFields,
        suggestions,
        profile: {
          id: profile._id,
          lastUpdated: profile.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Get profile completion status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile completion status'
    });
  }
};

/**
 * Soft gate - just warns about incomplete profile
 */
const profileCompletionWarning = (recommendedPercentage = 80) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      // Skip for admin users
      if (user.admin) {
        return next();
      }

      let profile;
      let userType;

      // Determine user type and fetch profile
      if (user.business) {
        profile = await Business.findOne({ user: user._id });
        userType = 'business';
      } else if (user.va) {
        profile = await VA.findOne({ user: user._id });
        userType = 'va';
      }

      if (profile) {
        const completionPercentage = calculateCompletionPercentage(profile, userType);
        
        // Add warning header if profile is incomplete
        if (completionPercentage < recommendedPercentage) {
          res.set('X-Profile-Completion-Warning', `Profile is ${completionPercentage}% complete. Recommended: ${recommendedPercentage}%`);
          res.set('X-Profile-Completion-Percentage', completionPercentage.toString());
        }
      }

      next();
    } catch (error) {
      // Don't block request on error, just log it
      console.error('Profile completion warning error:', error);
      next();
    }
  };
};

module.exports = {
  profileCompletionGate,
  profileCompletionWarning,
  getProfileCompletionStatus,
  calculateCompletionPercentage,
  getMissingFields
};