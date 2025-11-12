const Business = require('../models/Business');
const User = require('../models/User');
const { handleSupabaseUpload, deleteFromSupabase } = require('../utils/supabaseStorage');

/**
 * @desc    Get complete Business profile for admin editing
 * @route   GET /api/admin/businesses/:id/full
 * @access  Private/Admin
 */
exports.getFullBusinessProfile = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id)
      .populate('user', 'email phone suspended createdAt lastLoginAt');

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    // Create comprehensive response with all editable fields
    const fullProfile = {
      // Basic Information
      _id: business._id,
      company: business.company,
      contactName: business.contactName,
      contactRole: business.contactRole,
      email: business.email,
      phone: business.phone,
      
      // Company Details
      bio: business.bio,
      website: business.website,
      missionStatement: business.missionStatement,
      vaRequirements: business.vaRequirements,
      
      // Location
      streetAddress: business.streetAddress,
      city: business.city,
      state: business.state,
      postalCode: business.postalCode,
      country: business.country,
      headquartersLocation: business.headquartersLocation,
      
      // Company Information
      companySize: business.companySize,
      industry: business.industry,
      foundedYear: business.foundedYear,
      employeeCount: business.employeeCount,
      workEnvironment: business.workEnvironment,
      workingHours: business.workingHours,
      
      // Arrays
      specialties: business.specialties,
      benefits: business.benefits,
      certifications: business.certifications,
      awards: business.awards,
      companyValues: business.companyValues,
      languages: business.languages,
      
      // Social Media
      linkedin: business.linkedin,
      facebook: business.facebook,
      twitter: business.twitter,
      instagram: business.instagram,
      youtube: business.youtube,
      
      // Settings & Preferences
      vaNotifications: business.vaNotifications,
      invisible: business.invisible,
      status: business.status,
      surveyRequestNotifications: business.surveyRequestNotifications,
      
      // Email Notifications
      emailNotifications: business.emailNotifications,
      
      // Communication Preferences
      communicationPreferences: business.communicationPreferences,
      
      // Privacy Settings
      privacySettings: business.privacySettings,
      
      // Media
      avatar: business.avatar,
      companyCulture: business.companyCulture,
      
      // Metrics
      conversationsCount: business.conversationsCount,
      
      // User Info (if populated)
      userInfo: business.user ? {
        email: business.user.email,
        suspended: business.user.suspended,
        createdAt: business.user.createdAt,
        lastLoginAt: business.user.lastLoginAt
      } : null,
      
      // Timestamps
      createdAt: business.createdAt,
      updatedAt: business.updatedAt
    };

    res.status(200).json({
      success: true,
      data: fullProfile
    });
  } catch (error) {
    console.error('Error fetching business profile:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error fetching business profile'
    });
  }
};

/**
 * @desc    Update any/all Business profile fields as admin
 * @route   PUT /api/admin/businesses/:id/full
 * @access  Private/Admin
 */
exports.updateFullBusinessProfile = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    // Track which fields were modified
    const modifiedFields = [];
    const updateData = { ...req.body };

    // Remove fields that shouldn't be directly updated
    delete updateData._id;
    delete updateData.user;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.conversationsCount;

    // Process array fields
    const arrayFields = [
      'specialties', 'benefits', 'certifications', 
      'awards', 'companyValues', 'languages'
    ];
    
    arrayFields.forEach(field => {
      if (updateData[field] && !Array.isArray(updateData[field])) {
        updateData[field] = [updateData[field]];
      }
    });

    // Track changes
    Object.keys(updateData).forEach(key => {
      if (JSON.stringify(business[key]) !== JSON.stringify(updateData[key])) {
        modifiedFields.push(key);
        business[key] = updateData[key];
      }
    });

    if (modifiedFields.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No changes detected',
        data: business
      });
    }

    // Save changes
    await business.save();

    // Create audit log
    const auditLog = {
      adminId: req.user.id,
      adminEmail: req.user.email,
      businessId: business._id,
      company: business.company,
      modifiedFields,
      timestamp: new Date(),
      action: 'UPDATE_FULL_PROFILE'
    };
    console.log('Admin Business Profile Update:', auditLog);

    res.status(200).json({
      success: true,
      message: `Updated ${modifiedFields.length} fields successfully`,
      modifiedFields,
      data: business
    });
  } catch (error) {
    console.error('Error updating business profile:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error updating business profile'
    });
  }
};

/**
 * @desc    Bulk update multiple businesses
 * @route   POST /api/admin/businesses/bulk-update
 * @access  Private/Admin
 */
exports.bulkUpdateBusinesses = async (req, res) => {
  try {
    const { businessIds, updates } = req.body;

    if (!businessIds || !Array.isArray(businessIds) || businessIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide business IDs to update'
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const businessId of businessIds) {
      try {
        const business = await Business.findByIdAndUpdate(
          businessId,
          updates,
          { new: true, runValidators: true }
        );

        if (business) {
          results.successful.push({
            id: businessId,
            company: business.company
          });
        } else {
          results.failed.push({
            id: businessId,
            error: 'Business not found'
          });
        }
      } catch (error) {
        results.failed.push({
          id: businessId,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully updated ${results.successful.length} businesses`,
      results
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during bulk update'
    });
  }
};

/**
 * @desc    Update business media (avatar)
 * @route   POST /api/admin/businesses/:id/media
 * @access  Private/Admin
 */
exports.updateBusinessMedia = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    const { avatar } = req.body;
    const updatedFields = [];

    if (avatar !== undefined) {
      // Delete old avatar if exists and is from Supabase
      if (business.avatar && business.avatar.includes('supabase')) {
        try {
          await deleteFromSupabase(business.avatar);
        } catch (error) {
          console.error('Error deleting old avatar:', error);
        }
      }
      business.avatar = avatar;
      updatedFields.push('avatar');
    }

    if (updatedFields.length > 0) {
      await business.save();
    }

    res.status(200).json({
      success: true,
      message: 'Media updated successfully',
      updatedFields,
      data: {
        avatar: business.avatar
      }
    });
  } catch (error) {
    console.error('Error updating business media:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error updating media'
    });
  }
};

/**
 * @desc    Get business edit history
 * @route   GET /api/admin/businesses/:id/history
 * @access  Private/Admin
 */
exports.getBusinessEditHistory = async (req, res) => {
  try {
    // In production, you might store this in a separate AuditLog collection
    // For now, return a placeholder
    res.status(200).json({
      success: true,
      data: {
        businessId: req.params.id,
        history: [],
        message: 'Edit history tracking not yet implemented'
      }
    });
  } catch (error) {
    console.error('Error fetching edit history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error fetching history'
    });
  }
};

/**
 * @desc    Toggle business featured status
 * @route   POST /api/admin/businesses/:id/toggle-featured
 * @access  Private/Admin
 */
exports.toggleBusinessFeatured = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    // Toggle featured status (you might need to add this field to the model)
    business.featured = !business.featured;
    if (business.featured) {
      business.featuredAt = new Date();
      business.featuredUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    } else {
      business.featuredAt = null;
      business.featuredUntil = null;
    }

    await business.save();

    res.status(200).json({
      success: true,
      message: business.featured ? 'Business featured successfully' : 'Business unfeatured',
      data: {
        featured: business.featured,
        featuredAt: business.featuredAt,
        featuredUntil: business.featuredUntil
      }
    });
  } catch (error) {
    console.error('Error toggling featured status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error toggling featured status'
    });
  }
};