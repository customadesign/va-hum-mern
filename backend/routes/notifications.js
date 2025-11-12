const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
// HYBRID AUTH: Support both Clerk and legacy JWT during migration
const { protect } = require('../middleware/hybridAuth');

// Simple request counter to debug infinite loops
let requestCounter = 0;
const requestTimestamps = new Map(); // Track requests by IP

// @route   GET /api/notifications
// @desc    Get user notifications (excludes archived by default)
// @access  Private
router.get('/', protect, async (req, res) => {
  requestCounter++;
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Simple rate limiting: max 10 requests per minute per IP
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  if (!requestTimestamps.has(clientIP)) {
    requestTimestamps.set(clientIP, []);
  }
  
  const timestamps = requestTimestamps.get(clientIP);
  const recentRequests = timestamps.filter(timestamp => timestamp > oneMinuteAgo);
  
  if (recentRequests.length > 10) {
    console.log(`Rate limit exceeded for IP ${clientIP}: ${recentRequests.length} requests in 1 minute`);
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please wait before trying again.',
      retryAfter: 60
    });
  }
  
  timestamps.push(now);
  requestTimestamps.set(clientIP, timestamps);
  
  console.log(`=== Notifications request #${requestCounter} from ${clientIP} ===`);
  
  try {
    // Debug: Check what's in req.user
    console.log('Notifications route - req.user:', req.user);
    console.log('Notifications route - req.clerkUserId:', req.clerkUserId);
    console.log('Notifications route - Request headers:', req.headers.authorization ? 'Has auth header' : 'No auth header');
    console.log('Notifications route - Request IP:', req.ip);
    
    if (!req.user || !req.user._id) {
      console.log('Notifications route - User not authenticated, returning 401');
      return res.status(401).json({
        success: false,
        error: 'User not properly authenticated',
        debug: {
          hasUser: !!req.user,
          userId: req.user?._id,
          clerkUserId: req.clerkUserId
        }
      });
    }

    const { 
      page = 1, 
      limit = 20, 
      unreadOnly = false, 
      includeArchived = false,
      search = ''
    } = req.query;

    const query = { recipient: req.user._id };
    
    // By default, exclude archived notifications unless specifically requested
    if (includeArchived !== 'true') {
      query.archived = false;
    }
    
    if (unreadOnly === 'true') {
      query.readAt = null;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { 'params.title': { $regex: search, $options: 'i' } },
        { 'params.message': { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount, archivedCount] = await Promise.all([
      Notification.find(query)
        .populate('message')
        .populate('conversation')
        .populate('viewer')
        .populate('referral', 'email')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query),
      Notification.getUnreadCount(req.user._id),
      Notification.getArchivedCount(req.user._id)
    ]);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      archivedCount,
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

// @route   PUT /api/notifications/read
// @desc    Mark notifications as read
// @access  Private
router.put('/read', protect, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        error: 'User not properly authenticated'
      });
    }

    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide notification IDs'
      });
    }

    await Notification.markManyAsRead(notificationIds, req.user._id);

    res.json({
      success: true,
      message: 'Notifications marked as read'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        error: 'User not properly authenticated'
      });
    }

    await Notification.updateMany(
      {
        recipient: req.user._id,
        readAt: null
      },
      {
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/notifications/archived
// @desc    Get archived notifications with pagination
// @access  Private
router.get('/archived', protect, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        error: 'User not properly authenticated'
      });
    }

    const { 
      page = 1, 
      limit = 20,
      search = '',
      sortBy = 'archivedAt', // archivedAt or createdAt
      sortOrder = 'desc'
    } = req.query;

    const query = { 
      recipient: req.user._id,
      archived: true 
    };

    // Add search functionality for archived notifications
    if (search) {
      query.$or = [
        { 'params.title': { $regex: search, $options: 'i' } },
        { 'params.message': { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sortField = sortBy === 'createdAt' ? 'createdAt' : 'archivedAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate('message')
        .populate('conversation')
        .populate('viewer')
        .populate('referral', 'email')
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get archived notifications error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/notifications/:id/archive
// @desc    Archive a specific notification
// @access  Private
router.put('/:id/archive', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Check ownership
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to archive this notification'
      });
    }

    // Archive the notification
    await notification.archive();

    res.json({
      success: true,
      message: 'Notification archived successfully',
      data: notification
    });
  } catch (err) {
    console.error('Archive notification error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/notifications/:id/unarchive
// @desc    Unarchive a notification
// @access  Private
router.put('/:id/unarchive', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Check ownership
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to unarchive this notification'
      });
    }

    // Unarchive the notification
    await notification.unarchive();

    res.json({
      success: true,
      message: 'Notification unarchived successfully',
      data: notification
    });
  } catch (err) {
    console.error('Unarchive notification error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/notifications/archive-multiple
// @desc    Archive multiple notifications by IDs
// @access  Private
router.put('/archive-multiple', protect, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        error: 'User not properly authenticated'
      });
    }

    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide notification IDs to archive'
      });
    }

    const result = await Notification.archiveMany(notificationIds, req.user._id);

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications archived`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('Archive multiple notifications error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/notifications/unarchive-multiple
// @desc    Unarchive multiple notifications by IDs
// @access  Private
router.put('/unarchive-multiple', protect, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        error: 'User not properly authenticated'
      });
    }

    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide notification IDs to unarchive'
      });
    }

    const result = await Notification.unarchiveMany(notificationIds, req.user._id);

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications unarchived`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('Unarchive multiple notifications error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/notifications/archived/clear
// @desc    Clear all archived notifications (with confirmation)
// @access  Private
router.delete('/archived/clear', protect, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        error: 'User not properly authenticated'
      });
    }

    // Require confirmation flag for safety
    const { confirm } = req.query;
    
    if (confirm !== 'true') {
      return res.status(400).json({
        success: false,
        error: 'Please confirm deletion by setting confirm=true in query params',
        warning: 'This will permanently delete all archived notifications'
      });
    }

    const result = await Notification.clearArchivedForUser(req.user._id);

    res.json({
      success: true,
      message: `Permanently deleted ${result.deletedCount} archived notifications`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('Clear archived notifications error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/notifications/auto-archive
// @desc    Auto-archive old read notifications (admin/system endpoint)
// @access  Private (Admin or system cron job)
router.post('/auto-archive', protect, async (req, res) => {
  try {
    // Check if user is admin or this is a system call
    if (!req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { daysOld = 30 } = req.body;

    if (daysOld < 7) {
      return res.status(400).json({
        success: false,
        error: 'Minimum age for auto-archiving is 7 days'
      });
    }

    const result = await Notification.autoArchiveOldNotifications(daysOld);

    res.json({
      success: true,
      message: `Auto-archived ${result.modifiedCount} notifications older than ${daysOld} days`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('Auto-archive notifications error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    await notification.remove();

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