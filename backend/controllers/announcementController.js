const Announcement = require('../models/Announcement');
const AnnouncementRead = require('../models/AnnouncementRead');
const mongoose = require('mongoose');

// @desc    Create new announcement (admin only)
// @route   POST /api/announcements
// @access  Private (Admin only)
exports.createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      content,
      contentRichText,
      targetAudience,
      priority,
      expiresAt,
      category,
      tags,
      publishAt,
      attachments
    } = req.body;

    // Ensure user is admin
    if (!req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can create announcements'
      });
    }

    const announcement = await Announcement.create({
      title,
      content,
      contentRichText,
      targetAudience: targetAudience || 'all',
      priority: priority || 'normal',
      createdBy: req.user._id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      category: category || 'general',
      tags: tags || [],
      publishAt: publishAt ? new Date(publishAt) : Date.now(),
      attachments: attachments || [],
      isActive: true
    });

    await announcement.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create announcement'
    });
  }
};

// @desc    Get announcements for current user
// @route   GET /api/announcements
// @access  Private
exports.getAnnouncements = async (req, res) => {
  try {
    const { 
      limit = 20, 
      skip = 0, 
      priority, 
      category,
      includeRead = true,
      onlyUnread = false 
    } = req.query;

    // Build query
    const query = {
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ],
      publishAt: { $lte: new Date() }
    };

    // Filter by target audience based on user role
    if (!req.user.admin) {
      if (req.user.role === 'va') {
        query.targetAudience = { $in: ['va', 'all'] };
      } else if (req.user.role === 'business') {
        query.targetAudience = { $in: ['business', 'all'] };
      } else {
        query.targetAudience = 'all';
      }
    }

    // Filter by priority if specified
    if (priority) {
      query.priority = priority;
    }

    // Filter by category if specified
    if (category) {
      query.category = category;
    }

    // Get all announcements matching the query
    let announcements = await Announcement.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('createdBy', 'name email')
      .lean();

    // Get read status for each announcement
    const announcementIds = announcements.map(a => a._id);
    const readStatuses = await AnnouncementRead.find({
      user: req.user._id,
      announcement: { $in: announcementIds }
    }).lean();

    // Create a map of read statuses
    const readMap = new Map();
    readStatuses.forEach(rs => {
      readMap.set(rs.announcement.toString(), rs);
    });

    // Add read status to each announcement
    announcements = announcements.map(announcement => ({
      ...announcement,
      isRead: readMap.has(announcement._id.toString()),
      readAt: readMap.get(announcement._id.toString())?.readAt || null
    }));

    // Filter by read status if requested
    if (onlyUnread === 'true') {
      announcements = announcements.filter(a => !a.isRead);
    } else if (includeRead === 'false') {
      announcements = announcements.filter(a => !a.isRead);
    }

    // Get total count for pagination
    const totalCount = await Announcement.countDocuments(query);

    res.status(200).json({
      success: true,
      data: announcements,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: parseInt(skip) + announcements.length < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch announcements'
    });
  }
};

// @desc    Get all announcements (admin only)
// @route   GET /api/announcements/admin
// @access  Private (Admin only)
exports.getAllAnnouncements = async (req, res) => {
  try {
    // Ensure user is admin
    if (!req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can access all announcements'
      });
    }

    const { 
      limit = 50, 
      skip = 0, 
      filter = 'all', // 'all', 'active', 'inactive', 'expired'
      includeInactive = false, // Keep for backward compatibility
      targetAudience,
      priority,
      category
    } = req.query;

    // Build query based on filter type
    const query = {};
    const now = new Date();
    
    // Handle different filter types
    switch (filter) {
      case 'active':
        query.isActive = true;
        query.$or = [
          { expiresAt: null },
          { expiresAt: { $gt: now } }
        ];
        break;
      case 'inactive':
        query.isActive = false;
        break;
      case 'expired':
        query.expiresAt = { $lte: now };
        query.isActive = true; // Expired but was active
        break;
      case 'all':
      default:
        // No status filter - show all announcements
        break;
    }
    
    // Handle legacy includeInactive parameter for backward compatibility
    if (includeInactive === 'true' && filter === 'all') {
      // Don't add any isActive filter - show all
    } else if (includeInactive !== 'true' && filter === 'all') {
      query.isActive = true;
    }
    
    if (targetAudience) {
      query.targetAudience = targetAudience;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (category) {
      query.category = category;
    }

    const announcements = await Announcement.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('createdBy', 'name email');

    // Get read statistics for each announcement
    const announcementStats = await Promise.all(
      announcements.map(async (announcement) => {
        const readCount = await AnnouncementRead.countDocuments({ 
          announcement: announcement._id 
        });
        
        // Get basic stats without full calculation for performance
        return {
          ...announcement.toObject(),
          readBy: [], // Will be populated with actual read users if needed
          readCount: readCount,
          stats: {
            totalReads: readCount,
            uniqueReaders: readCount
          }
        };
      })
    );

    const totalCount = await Announcement.countDocuments(query);

    res.status(200).json({
      success: true,
      data: announcementStats,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: parseInt(skip) + announcements.length < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching all announcements:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch announcements'
    });
  }
};

// @desc    Update announcement (admin only)
// @route   PUT /api/announcements/:id
// @access  Private (Admin only)
exports.updateAnnouncement = async (req, res) => {
  try {
    // Ensure user is admin
    if (!req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can update announcements'
      });
    }

    const { id } = req.params;
    const updateData = { ...req.body };

    // Handle date fields
    if (updateData.expiresAt) {
      updateData.expiresAt = new Date(updateData.expiresAt);
    }
    if (updateData.publishAt) {
      updateData.publishAt = new Date(updateData.publishAt);
    }

    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.createdBy;
    delete updateData.totalReads;

    const announcement = await Announcement.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('createdBy', 'name email');

    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found'
      });
    }

    res.status(200).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update announcement'
    });
  }
};

// @desc    Delete announcement (admin only)
// @route   DELETE /api/announcements/:id
// @access  Private (Admin only)
exports.deleteAnnouncement = async (req, res) => {
  try {
    // Ensure user is admin
    if (!req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can delete announcements'
      });
    }

    const { id } = req.params;

    // Delete the announcement
    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found'
      });
    }

    // Also delete all read records for this announcement
    await AnnouncementRead.deleteMany({ announcement: id });

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete announcement'
    });
  }
};

// @desc    Mark announcement as read
// @route   POST /api/announcements/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { interaction = 'viewed', timeSpent = 0 } = req.body;

    // Check if announcement exists and is active
    const announcement = await Announcement.findById(id);
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found'
      });
    }

    if (!announcement.canBeViewedBy(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this announcement'
      });
    }

    // Mark as read
    const readRecord = await AnnouncementRead.markAsRead(
      id,
      req.user._id,
      {
        interaction,
        timeSpent,
        deviceInfo: {
          userAgent: req.headers['user-agent'],
          platform: req.headers['sec-ch-ua-platform'],
          ip: req.ip
        }
      }
    );

    res.status(200).json({
      success: true,
      data: readRecord
    });
  } catch (error) {
    console.error('Error marking announcement as read:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mark announcement as read'
    });
  }
};

// @desc    Get unread announcements count
// @route   GET /api/announcements/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    // Build query for user's announcements
    const query = {
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ],
      publishAt: { $lte: new Date() }
    };

    // Filter by target audience based on user role
    if (!req.user.admin) {
      if (req.user.role === 'va') {
        query.targetAudience = { $in: ['va', 'all'] };
      } else if (req.user.role === 'business') {
        query.targetAudience = { $in: ['business', 'all'] };
      } else {
        query.targetAudience = 'all';
      }
    }

    // Get all relevant announcements
    const announcements = await Announcement.find(query).select('_id');
    const announcementIds = announcements.map(a => a._id);

    // Get read announcements by user
    const readAnnouncements = await AnnouncementRead.find({
      user: req.user._id,
      announcement: { $in: announcementIds }
    }).select('announcement');

    const readIds = new Set(readAnnouncements.map(r => r.announcement.toString()));
    const unreadCount = announcementIds.filter(id => !readIds.has(id.toString())).length;

    // Also get count by priority
    const unreadByPriority = {};
    const priorityGroups = await Announcement.aggregate([
      {
        $match: {
          ...query,
          _id: { $in: announcementIds.filter(id => !readIds.has(id.toString())) }
        }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    priorityGroups.forEach(group => {
      unreadByPriority[group._id] = group.count;
    });

    res.status(200).json({
      success: true,
      data: {
        total: unreadCount,
        byPriority: unreadByPriority,
        urgent: unreadByPriority.urgent || 0,
        high: unreadByPriority.high || 0,
        normal: unreadByPriority.normal || 0,
        low: unreadByPriority.low || 0
      }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get unread count'
    });
  }
};

// @desc    Archive expired announcements (scheduled task)
// @route   POST /api/announcements/archive-expired
// @access  Private (Admin only or system task)
exports.archiveExpired = async (req, res) => {
  try {
    // This could be called by a cron job or admin
    if (!req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can archive announcements'
      });
    }

    const result = await Announcement.archiveExpired();

    res.status(200).json({
      success: true,
      message: `Archived ${result.modifiedCount} expired announcements`
    });
  } catch (error) {
    console.error('Error archiving expired announcements:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to archive expired announcements'
    });
  }
};

// @desc    Get announcement statistics (admin only)
// @route   GET /api/announcements/:id/stats
// @access  Private (Admin only)
exports.getAnnouncementStats = async (req, res) => {
  try {
    // Ensure user is admin
    if (!req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can view announcement statistics'
      });
    }

    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found'
      });
    }

    const stats = await AnnouncementRead.getAnnouncementStats(id);

    // Get unique readers count
    const uniqueReaders = await AnnouncementRead.countDocuments({ 
      announcement: id 
    });

    // Get target audience size for calculating reach percentage
    let targetAudienceSize = 0;
    const User = mongoose.model('User');
    
    if (announcement.targetAudience === 'all') {
      targetAudienceSize = await User.countDocuments({ suspended: false });
    } else if (announcement.targetAudience === 'va') {
      targetAudienceSize = await User.countDocuments({ role: 'va', suspended: false });
    } else if (announcement.targetAudience === 'business') {
      targetAudienceSize = await User.countDocuments({ role: 'business', suspended: false });
    }

    const reachPercentage = targetAudienceSize > 0 
      ? (uniqueReaders / targetAudienceSize * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        announcement: {
          id: announcement._id,
          title: announcement.title,
          priority: announcement.priority,
          targetAudience: announcement.targetAudience,
          createdAt: announcement.createdAt
        },
        stats: {
          ...stats,
          uniqueReaders,
          targetAudienceSize,
          reachPercentage: `${reachPercentage}%`
        }
      }
    });
  } catch (error) {
    console.error('Error getting announcement statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get announcement statistics'
    });
  }
};