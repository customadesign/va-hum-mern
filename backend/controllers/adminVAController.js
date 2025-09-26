const VA = require('../models/VA');
const User = require('../models/User');
const Location = require('../models/Location');
const Specialty = require('../models/Specialty');
const RoleLevel = require('../models/RoleLevel');
const RoleType = require('../models/RoleType');
const {
  handleSupabaseUpload,
  deleteFromSupabaseEnhanced,
  uploadProfileImages,
  uploadVAVideos,
  validateFileForBucket,
  checkStorageHealth
} = require('../utils/supabaseStorage');

/**
 * @desc    Get complete VA profile for admin editing
 * @route   GET /api/admin/vas/:id/full
 * @access  Private/Admin
 */
exports.getFullVAProfile = async (req, res) => {
  try {
    const va = await VA.findById(req.params.id)
      .populate('user', 'email phone suspended createdAt lastLoginAt')
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

    // Create comprehensive response with all editable fields
    const fullProfile = {
      // Basic Information
      _id: va._id,
      name: va.name,
      email: va.email,
      phone: va.phone,
      whatsapp: va.whatsapp,
      viber: va.viber,
      
      // Profile Content
      hero: va.hero,
      bio: va.bio,
      tagline: va.tagline,
      timezone: va.timezone,
      
      // Professional Information
      yearsOfExperience: va.yearsOfExperience,
      industry: va.industry,
      skills: va.skills,
      certifications: va.certifications,
      languages: va.languages,
      
      // Rate & Availability
      preferredMinHourlyRate: va.preferredMinHourlyRate,
      preferredMaxHourlyRate: va.preferredMaxHourlyRate,
      preferredMinSalary: va.preferredMinSalary,
      preferredMaxSalary: va.preferredMaxSalary,
      availability: va.availability,
      workingHours: va.workingHours,
      
      // Location & References
      location: va.location,
      specialties: va.specialties,
      roleLevel: va.roleLevel,
      roleType: va.roleType,
      
      // Social & Links
      website: va.website,
      github: va.github,
      gitlab: va.gitlab,
      linkedin: va.linkedin,
      twitter: va.twitter,
      facebook: va.facebook,
      meta: va.meta,
      instagram: va.instagram,
      mastodon: va.mastodon,
      stackoverflow: va.stackoverflow,
      schedulingLink: va.schedulingLink,
      
      // Media
      avatar: va.avatar,
      coverImage: va.coverImage,
      introVideo: va.videoIntroduction,
      videoIntroduction: va.videoIntroduction,
      videoTranscript: va.videoTranscription,
      videoTranscription: va.videoTranscription,
      portfolio: va.portfolio,
      
      // Status & Settings
      searchStatus: va.searchStatus,
      status: va.status,
      sourceContributor: va.sourceContributor,
      productAnnouncementNotifications: va.productAnnouncementNotifications,
      profileReminderNotifications: va.profileReminderNotifications,
      
      // Admin-only fields
      featured: va.featuredAt ? true : false,
      featuredAt: va.featuredAt,
      featuredUntil: va.featuredUntil,
      searchScore: va.searchScore,
      responseRate: va.responseRate,
      conversationsCount: va.conversationsCount,
      publicProfileKey: va.publicProfileKey,
      adminNotes: va.adminNotes,
      
      // DISC Assessment
      discAssessment: va.discAssessment,
      
      // User account information
      user: va.user,
      
      // Metadata
      completionPercentage: va.completionPercentage,
      profileUpdatedAt: va.profileUpdatedAt,
      createdAt: va.createdAt,
      updatedAt: va.updatedAt
    };

    res.json({
      success: true,
      data: fullProfile
    });
  } catch (error) {
    console.error('Error fetching full VA profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch VA profile',
      details: error.message
    });
  }
};

/**
 * @desc    Update any/all VA profile fields as admin
 * @route   PUT /api/admin/vas/:id/full
 * @access  Private/Admin
 */
exports.updateFullVAProfile = async (req, res) => {
  try {
    const va = await VA.findById(req.params.id);
    
    if (!va) {
      return res.status(404).json({
        success: false,
        error: 'VA profile not found'
      });
    }

    // Define which fields can be updated
    const allowedFields = [
      // Basic Information
      'name', 'email', 'phone', 'whatsapp', 'viber',
      
      // Profile Content
      'hero', 'bio',
      
      // Professional Information
      'yearsOfExperience', 'industry', 'skills', 'certifications', 'languages',
      
      // Rate & Availability
      'preferredMinHourlyRate', 'preferredMaxHourlyRate',
      'preferredMinSalary', 'preferredMaxSalary',
      'availability', 'workingHours',
      
      // Social & Links
      'website', 'github', 'gitlab', 'linkedin', 'twitter',
      'meta', 'instagram', 'mastodon', 'stackoverflow', 'schedulingLink',
      
      // Status & Settings
      'searchStatus', 'status',
      'sourceContributor',
      'productAnnouncementNotifications',
      'profileReminderNotifications',
      
      // Admin-only fields
      'featuredAt', 'searchScore', 'responseRate', 'conversationsCount',
      
      // DISC Assessment
      'discAssessment'
    ];

    // Special handling for reference fields
    const referenceFields = ['location', 'specialties', 'roleLevel', 'roleType'];
    
    // Track changes for audit
    const changes = {};
    const originalValues = {};

    // Update allowed fields
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        // Store original value for audit
        originalValues[field] = va[field];
        
        // Validate specific fields
        if (field === 'email' && req.body[field]) {
          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(req.body[field])) {
            return res.status(400).json({
              success: false,
              error: `Invalid email format for field: ${field}`
            });
          }
        }
        
        if (field === 'skills' && req.body[field]) {
          // Ensure skills is an array
          if (!Array.isArray(req.body[field])) {
            req.body[field] = [req.body[field]];
          }
          // Clean and trim skills
          req.body[field] = req.body[field].map(skill => 
            typeof skill === 'string' ? skill.trim() : skill
          ).filter(skill => skill);
        }

        if (field === 'languages' && req.body[field]) {
          // Validate languages structure
          if (!Array.isArray(req.body[field])) {
            return res.status(400).json({
              success: false,
              error: 'Languages must be an array'
            });
          }
          // Validate each language entry
          for (const lang of req.body[field]) {
            if (!lang.language || !lang.proficiency) {
              return res.status(400).json({
                success: false,
                error: 'Each language must have language and proficiency fields'
              });
            }
            if (!['native', 'fluent', 'conversational', 'basic'].includes(lang.proficiency)) {
              return res.status(400).json({
                success: false,
                error: 'Invalid language proficiency level'
              });
            }
          }
        }

        if (field === 'portfolio' && req.body[field]) {
          // Validate portfolio structure
          if (!Array.isArray(req.body[field])) {
            return res.status(400).json({
              success: false,
              error: 'Portfolio must be an array'
            });
          }
        }

        // Apply the change
        va[field] = req.body[field];
        changes[field] = req.body[field];
      }
    }

    // Handle reference fields (location, specialties, etc.)
    for (const field of referenceFields) {
      if (req.body[field] !== undefined) {
        originalValues[field] = va[field];
        
        if (field === 'location' && req.body[field]) {
          // Handle location - could be an ID or an object to create
          if (typeof req.body[field] === 'string') {
            // Assume it's a location ID
            va[field] = req.body[field];
          } else if (typeof req.body[field] === 'object') {
            // Create new location
            const newLocation = await Location.create(req.body[field]);
            va[field] = newLocation._id;
          }
        } else if (field === 'specialties' && req.body[field]) {
          // Ensure it's an array of IDs
          if (!Array.isArray(req.body[field])) {
            req.body[field] = [req.body[field]];
          }
          va[field] = req.body[field];
        } else {
          va[field] = req.body[field];
        }
        
        changes[field] = va[field];
      }
    }

    // Handle media uploads separately if provided
    if (req.body.avatar !== undefined) {
      originalValues.avatar = va.avatar;
      va.avatar = req.body.avatar;
      changes.avatar = req.body.avatar;
    }

    if (req.body.coverImage !== undefined) {
      originalValues.coverImage = va.coverImage;
      va.coverImage = req.body.coverImage;
      changes.coverImage = req.body.coverImage;
    }

    if (req.body.videoIntroduction !== undefined) {
      originalValues.videoIntroduction = va.videoIntroduction;
      va.videoIntroduction = req.body.videoIntroduction;
      changes.videoIntroduction = req.body.videoIntroduction;
    }

    // Update profile timestamp
    va.profileUpdatedAt = new Date();

    // Save changes
    await va.save();

    // Create audit log entry
    console.log(`Admin ${req.user.email} updated VA ${va.name}:`, {
      vaId: va._id,
      adminId: req.user.id,
      changes: Object.keys(changes),
      timestamp: new Date()
    });

    // Fetch updated VA with populated fields
    const updatedVA = await VA.findById(va._id)
      .populate('user', 'email phone suspended')
      .populate('location')
      .populate('specialties')
      .populate('roleLevel')
      .populate('roleType');

    res.json({
      success: true,
      message: 'VA profile updated successfully',
      data: updatedVA,
      changes: Object.keys(changes).length,
      modifiedFields: Object.keys(changes)
    });
  } catch (error) {
    console.error('Error updating full VA profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update VA profile',
      details: error.message
    });
  }
};

/**
 * @desc    Bulk update multiple VAs
 * @route   POST /api/admin/vas/bulk-update
 * @access  Private/Admin
 */
exports.bulkUpdateVAs = async (req, res) => {
  try {
    const { vaIds, updates } = req.body;

    if (!vaIds || !Array.isArray(vaIds) || vaIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of VA IDs'
      });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Please provide updates object'
      });
    }

    // Only allow certain fields for bulk update
    const allowedBulkFields = [
      'status', 'searchStatus', 'featured', 
      'productAnnouncementNotifications', 
      'profileReminderNotifications'
    ];

    const bulkUpdates = {};
    for (const field of allowedBulkFields) {
      if (updates[field] !== undefined) {
        bulkUpdates[field] = updates[field];
      }
    }

    if (Object.keys(bulkUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    // Add profile update timestamp
    bulkUpdates.profileUpdatedAt = new Date();

    // Perform bulk update
    const result = await VA.updateMany(
      { _id: { $in: vaIds } },
      { $set: bulkUpdates }
    );

    console.log(`Admin ${req.user.email} bulk updated ${result.modifiedCount} VAs:`, {
      adminId: req.user.id,
      vaCount: result.modifiedCount,
      updates: bulkUpdates,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} VA profiles`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        updates: bulkUpdates
      }
    });
  } catch (error) {
    console.error('Error in bulk VA update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk update VAs',
      details: error.message
    });
  }
};

/**
 * @desc    Update VA media (avatar, cover, video)
 * @route   POST /api/admin/vas/:id/media
 * @access  Private/Admin
 */
exports.updateVAMedia = async (req, res) => {
  try {
    const va = await VA.findById(req.params.id);
    
    if (!va) {
      return res.status(404).json({
        success: false,
        error: 'VA profile not found'
      });
    }

    const updates = {};
    
    // Handle file uploads with enhanced bucket-specific handling
    if (req.files) {
      // Handle avatar upload
      if (req.files.avatar) {
        try {
          // Delete old avatar if exists
          if (va.avatar && va.avatar.includes('supabase')) {
            const deleteResult = await deleteFromSupabaseEnhanced(va.avatar, 'profile-images');
            console.log('Old avatar deletion result:', deleteResult);
          }
          
          // Upload new avatar to profile-images bucket
          const avatarFile = req.files.avatar[0];
          const validation = validateFileForBucket(avatarFile, 'profile-images');
          
          if (!validation.valid) {
            throw new Error(`Avatar upload validation failed: ${validation.error}`);
          }
          
          const avatarResult = await uploadToSupabaseEnhanced(avatarFile, 'profile-images', 'avatars', {
            metadata: {
              vaId: va._id.toString(),
              vaName: va.name,
              uploadType: 'avatar'
            }
          });
          
          updates.avatar = avatarResult.url;
          console.log('✅ Avatar uploaded successfully:', avatarResult.url);
        } catch (uploadError) {
          console.error('❌ Avatar upload error:', uploadError);
          // Continue with other uploads even if avatar fails
        }
      }

      // Handle cover image upload
      if (req.files.coverImage) {
        try {
          // Delete old cover if exists
          if (va.coverImage && va.coverImage.includes('supabase')) {
            const deleteResult = await deleteFromSupabaseEnhanced(va.coverImage, 'profile-images');
            console.log('Old cover image deletion result:', deleteResult);
          }
          
          // Upload new cover to profile-images bucket
          const coverFile = req.files.coverImage[0];
          const validation = validateFileForBucket(coverFile, 'profile-images');
          
          if (!validation.valid) {
            throw new Error(`Cover image upload validation failed: ${validation.error}`);
          }
          
          const coverResult = await uploadToSupabaseEnhanced(coverFile, 'profile-images', 'covers', {
            metadata: {
              vaId: va._id.toString(),
              vaName: va.name,
              uploadType: 'cover'
            }
          });
          
          updates.coverImage = coverResult.url;
          console.log('✅ Cover image uploaded successfully:', coverResult.url);
        } catch (uploadError) {
          console.error('❌ Cover image upload error:', uploadError);
        }
      }

      // Handle video upload
      if (req.files.videoIntroduction) {
        try {
          // Delete old video if exists
          if (va.videoIntroduction && va.videoIntroduction.includes('supabase')) {
            const deleteResult = await deleteFromSupabaseEnhanced(va.videoIntroduction, 'va-videos');
            console.log('Old video deletion result:', deleteResult);
          }
          
          // Upload new video to va-videos bucket
          const videoFile = req.files.videoIntroduction[0];
          const validation = validateFileForBucket(videoFile, 'va-videos');
          
          if (!validation.valid) {
            throw new Error(`Video upload validation failed: ${validation.error}`);
          }
          
          const videoResult = await uploadToSupabaseEnhanced(videoFile, 'va-videos', 'introductions', {
            metadata: {
              vaId: va._id.toString(),
              vaName: va.name,
              uploadType: 'introduction_video'
            }
          });
          
          updates.videoIntroduction = videoResult.url;
          updates.videoTranscriptionStatus = 'pending'; // Reset transcription status
          console.log('✅ Video uploaded successfully:', videoResult.url);
        } catch (uploadError) {
          console.error('❌ Video upload error:', uploadError);
        }
      }
    }

    // Handle direct URL updates (if not using file upload)
    if (req.body.avatar !== undefined) {
      updates.avatar = req.body.avatar;
    }
    if (req.body.coverImage !== undefined) {
      updates.coverImage = req.body.coverImage;
    }
    if (req.body.videoIntroduction !== undefined) {
      updates.videoIntroduction = req.body.videoIntroduction;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No media updates provided'
      });
    }

    // Update VA with new media
    Object.assign(va, updates);
    va.profileUpdatedAt = new Date();
    await va.save();

    console.log(`Admin ${req.user.email} updated media for VA ${va.name}:`, {
      vaId: va._id,
      adminId: req.user.id,
      mediaUpdated: Object.keys(updates),
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'VA media updated successfully',
      data: {
        _id: va._id,
        name: va.name,
        avatar: va.avatar,
        coverImage: va.coverImage,
        videoIntroduction: va.videoIntroduction,
        updatedFields: Object.keys(updates)
      }
    });
  } catch (error) {
    console.error('Error updating VA media:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update VA media',
      details: error.message
    });
  }
};

/**
 * @desc    Get VA edit history/audit log
 * @route   GET /api/admin/vas/:id/history
 * @access  Private/Admin
 */
exports.getVAEditHistory = async (req, res) => {
  try {
    // This would typically query an audit log collection
    // For now, return basic timestamp information
    const va = await VA.findById(req.params.id)
      .select('profileUpdatedAt createdAt updatedAt');

    if (!va) {
      return res.status(404).json({
        success: false,
        error: 'VA profile not found'
      });
    }

    res.json({
      success: true,
      data: {
        vaId: va._id,
        createdAt: va.createdAt,
        lastUpdated: va.updatedAt,
        profileLastUpdated: va.profileUpdatedAt,
        // In production, you'd fetch from an audit log collection
        history: []
      }
    });
  } catch (error) {
    console.error('Error fetching VA edit history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch VA edit history',
      details: error.message
    });
  }
};

/**
 * @desc    Toggle VA featured status
 * @route   POST /api/admin/vas/:id/toggle-featured
 * @access  Private/Admin
 */
exports.toggleVAFeatured = async (req, res) => {
  try {
    const va = await VA.findById(req.params.id);
    
    if (!va) {
      return res.status(404).json({
        success: false,
        error: 'VA profile not found'
      });
    }

    // Toggle featured status
    if (va.featuredAt) {
      va.featuredAt = null;
    } else {
      va.featuredAt = new Date();
    }

    await va.save();

    console.log(`Admin ${req.user.email} ${va.featuredAt ? 'featured' : 'unfeatured'} VA ${va.name}`);

    res.json({
      success: true,
      message: `VA ${va.featuredAt ? 'featured' : 'unfeatured'} successfully`,
      data: {
        _id: va._id,
        name: va.name,
        featuredAt: va.featuredAt
      }
    });
  } catch (error) {
    console.error('Error toggling VA featured status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle featured status',
      details: error.message
    });
  }
};