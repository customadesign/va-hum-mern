const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
// HYBRID AUTH: Support both Clerk and legacy JWT during migration
const { protect } = require('../middleware/hybridAuth');

// Simple request counter to debug infinite loops
let requestCounter = 0;
const requestTimestamps = new Map(); // Track requests by IP

// @route   GET /api/notifications
// @desc    Get user notifications
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

    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { recipient: req.user._id };
    if (unreadOnly === 'true') {
      query.readAt = null;
    }

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('message')
        .populate('conversation')
        .populate('viewer')
        .populate('referral', 'email')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query),
      Notification.getUnreadCount(req.user._id)
    ]);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
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