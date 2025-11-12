const express = require('express');
const router = express.Router();
const { protect, authorize, optionalAuth } = require('../middleware/hybridAuth');
const Business = require('../models/Business');
const VA = require('../models/VA');
const User = require('../models/User');
const Conversation = require('../models/Conversation');

/**
 * Admin Intercept Routes
 * 
 * These routes handle the intercepted messaging system where businesses
 * must have 80%+ profile completion to message VAs directly.
 */

// @route   GET /api/admin/intercept/conversations
// @desc    Get all intercepted conversations for admin dashboard
// @access  Private (Admin only)
router.get('/conversations', protect, authorize('admin'), async (req, res) => {
  try {
    const { 
      status = 'all', // all, pending, forwarded, replied, resolved, spam
      search = '',
      page = 1, 
      limit = 20,
      sortBy = 'lastMessageAt',
      order = 'desc'
    } = req.query;

    // Build query
    let query = { isIntercepted: true };

    // Filter by status
    if (status === 'pending') {
      query['adminStatus'] = { $in: [undefined, 'pending'] };
    } else if (status === 'forwarded') {
      query['adminStatus'] = 'forwarded';
    } else if (status === 'replied') {
      query['adminStatus'] = 'replied';
    } else if (status === 'resolved') {
      query['adminStatus'] = 'resolved';
    } else if (status === 'spam') {
      query['adminStatus'] = 'spam';
    }

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const searchUsers = await User.find({
        $or: [
          { email: searchRegex },
          { 'profile.business.company': searchRegex },
          { 'profile.business.contactName': searchRegex },
          { 'profile.va.firstName': searchRegex },
          { 'profile.va.lastName': searchRegex }
        ]
      }).select('_id');
      
      const userIds = searchUsers.map(u => u._id);
      query['$or'] = [
        { participants: { $in: userIds } },
        { lastMessage: searchRegex }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    // Get conversations with pagination
    const conversations = await Conversation.find(query)
      .populate('va', 'email firstName lastName name profile')
      .populate('business', 'email firstName lastName name profile businessName company')
      .populate('messages.sender', 'email firstName lastName name profile')
      .populate('originalSender', 'email firstName lastName name profile')
      .populate('adminActions.performedBy', 'email firstName lastName name profile')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await Conversation.countDocuments(query);

    // Get unread count
    const unreadCount = await Conversation.countDocuments({
      isIntercepted: true,
      'unreadCount.admin': { $gt: 0 }
    });

    // Get status counts
    const statusCounts = await Conversation.aggregate([
      { $match: { isIntercepted: true } },
      {
        $group: {
          _id: '$adminStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const counts = {
      all: totalCount,
      pending: 0,
      forwarded: 0,
      replied: 0,
      resolved: 0,
      spam: 0
    };

    statusCounts.forEach(item => {
      if (!item._id || item._id === 'pending') {
        counts.pending += item.count;
      } else if (item._id === 'forwarded') {
        counts.forwarded = item.count;
      } else if (item._id === 'replied') {
        counts.replied = item.count;
      } else if (item._id === 'resolved') {
        counts.resolved = item.count;
      } else if (item._id === 'spam') {
        counts.spam = item.count;
      }
    });

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalCount / limit)
        },
        unreadCount,
        statusCounts: counts
      }
    });
  } catch (error) {
    console.error('Get intercepted conversations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch intercepted conversations'
    });
  }
});

// @route   PUT /api/admin/intercept/conversations/:id/read
// @desc    Mark a conversation as read by admin
// @access  Private (Admin only)
router.put('/conversations/:id/read', protect, authorize('admin'), async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Mark all messages from business as read
    let messagesMarked = 0;
    if (conversation.messages && Array.isArray(conversation.messages)) {
      conversation.messages.forEach(msg => {
        // Only mark business messages as read (messages from business that are unread)
        if (msg.sender.toString() === conversation.business.toString() && !msg.read) {
          msg.read = true;
          messagesMarked++;
        }
      });
    }

    // Reset admin unread count
    if (!conversation.unreadCount) {
      conversation.unreadCount = {};
    }
    conversation.unreadCount.admin = 0;

    await conversation.save();

    // Emit socket event to update admin unread count in real-time
    const io = req.app.get('io');
    if (io) {
      // Get updated unread count for all admin users
      const newUnreadCount = await Conversation.countDocuments({
        isIntercepted: true,
        'unreadCount.admin': { $gt: 0 }
      });
      
      // Emit to all connected admin clients
      io.emit('admin_unread_update', { 
        unreadCount: newUnreadCount,
        conversationId: conversation._id,
        action: 'read',
        messagesMarked
      });
    }

    res.json({
      success: true,
      data: {
        conversationId: conversation._id,
        messagesMarked,
        unreadCount: conversation.unreadCount
      }
    });
  } catch (error) {
    console.error('Mark conversation as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark conversation as read'
    });
  }
});

// @route   GET /api/admin/intercept/conversations/:id
// @desc    Get specific intercepted conversation with full details
// @access  Private (Admin only)
router.get('/conversations/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('va', 'email firstName lastName name profile')
      .populate('business', 'email firstName lastName name profile businessName company')
      .populate('messages.sender', 'email firstName lastName name profile')
      .populate('originalSender', 'email firstName lastName name profile')
      .populate('adminActions.performedBy', 'email firstName lastName name profile');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Mark admin messages as read
    await conversation.markAsRead(req.user.id, true);
    await conversation.save();

    // Emit socket event to update admin unread count in real-time
    const io = req.app.get('io');
    if (io) {
      // Get updated unread count for all admin users
      const newUnreadCount = await Conversation.countDocuments({
        isIntercepted: true,
        'unreadCount.admin': { $gt: 0 }
      });
      
      // Emit to all connected admin clients
      io.emit('admin_unread_update', { 
        unreadCount: newUnreadCount,
        conversationId: conversation._id,
        action: 'read'
      });
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Get conversation details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation details'
    });
  }
});

// @route   POST /api/admin/intercept/forward/:conversationId
// @desc    Forward intercepted conversation to VA
// @access  Private (Admin only)
router.post('/forward/:conversationId', protect, authorize('admin'), async (req, res) => {
  try {
    const { message, includeHistory = false } = req.body;
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation || !conversation.isIntercepted) {
      return res.status(404).json({
        success: false,
        error: 'Intercepted conversation not found'
      });
    }

    // Get business info for the forwarded message
    const businessInfo = await Business.findById(conversation.business).select('name email');
    
    // Create or find conversation between business and VA
    let vaConversation = await Conversation.findOne({
      participants: { $all: [conversation.business, conversation.va] },
      va: conversation.va,
      business: conversation.business,
      isIntercepted: false
    });

    if (!vaConversation) {
      // Create new business-to-VA conversation
      vaConversation = new Conversation({
        participants: [conversation.business, conversation.va],
        va: conversation.va,
        business: conversation.business,
        messages: [],
        isIntercepted: false,
        adminForwarded: true,
        adminConversationId: conversation._id
      });
    }

    // Add forwarding message
    let forwardMessage = `[Admin Message on behalf of ${businessInfo?.name || businessInfo?.email || 'Business'}]\n\n`;
    if (includeHistory) {
      forwardMessage += '--- Previous Conversation ---\n';
      conversation.messages.forEach(msg => {
        const senderName = msg.sender.toString() === conversation.business.toString() ? 'Business' : 'You';
        forwardMessage += `${senderName}: ${msg.content}\n`;
      });
      forwardMessage += '--- End of History ---\n\n';
    }
    if (message) {
      forwardMessage += message;
    }

    // Add message as coming from the business (admin is forwarding on their behalf)
    vaConversation.addMessage(conversation.business, forwardMessage);
    await vaConversation.save();

    // Update original conversation status
    conversation.adminStatus = 'forwarded';
    conversation.forwardedAt = new Date();
    
    // Add admin action record
    if (!conversation.adminActions) {
      conversation.adminActions = [];
    }
    conversation.adminActions.push({
      action: 'forwarded',
      performedBy: req.user.id,
      performedAt: new Date(),
      details: { message, includeHistory }
    });

    await conversation.save();

    // Populate for response
    await conversation.populate([
      { path: 'va', select: 'email firstName lastName name profile' },
      { path: 'business', select: 'email firstName lastName name profile businessName company' },
      { path: 'adminActions.performedBy', select: 'email firstName lastName name profile' }
    ]);

    res.json({
      success: true,
      data: {
        originalConversation: conversation,
        vaConversation
      }
    });
  } catch (error) {
    console.error('Forward conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to forward conversation'
    });
  }
});

// @route   POST /api/admin/intercept/reply/:conversationId
// @desc    Reply to business as admin (acting as VA)
// @access  Private (Admin only)
router.post('/reply/:conversationId', protect, authorize('admin'), async (req, res) => {
  try {
    const { message, asVA = false } = req.body;
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation || !conversation.isIntercepted) {
      return res.status(404).json({
        success: false,
        error: 'Intercepted conversation not found'
      });
    }

    // Mark all messages as read when admin replies
    conversation.unreadCount.admin = 0;
    conversation.messages.forEach(msg => {
      if (!msg.read) {
        msg.read = true;
      }
    });

    // Add reply message - always send as VA to maintain the appearance
    // that the message is coming from the VA, not the admin
    const newMessage = conversation.addMessage(
      conversation.va, // Always use VA as sender
      message, // Send message without any admin prefix
      true
    );

    // Update conversation status to 'replied' to indicate admin has responded
    conversation.adminStatus = 'replied';
    conversation.repliedAt = new Date();

    // Add admin action record
    if (!conversation.adminActions) {
      conversation.adminActions = [];
    }
    conversation.adminActions.push({
      action: 'replied',
      performedBy: req.user.id,
      performedAt: new Date(),
      details: { asVA: true, messageLength: message.length } // Always marked as sent as VA
    });

    await conversation.save();

    // Emit socket event to update admin unread count in real-time
    const io = req.app.get('io');
    if (io) {
      // Get updated unread count for all admin users
      const newUnreadCount = await Conversation.countDocuments({
        isIntercepted: true,
        'unreadCount.admin': { $gt: 0 }
      });
      
      // Emit to all connected admin clients
      io.emit('admin_unread_update', {
        unreadCount: newUnreadCount,
        conversationId: conversation._id,
        action: 'replied'
      });

      // Emit new message event to conversation participants
      io.to(`conversation-${conversation._id}`).emit('new_message', {
        conversationId: conversation._id,
        message: newMessage,
        sender: conversation.va, // Message appears to come from VA
        action: 'admin_reply'
      });

      // Also emit to any admin users viewing this conversation
      io.emit('conversation_updated', {
        conversationId: conversation._id,
        lastMessage: message,
        lastMessageAt: new Date(),
        action: 'admin_reply'
      });
    }

    // Populate for response
    await User.populate(newMessage, {
      path: 'sender',
      select: 'email profile'
    });

    res.json({
      success: true,
      data: {
        message: newMessage,
        conversation
      }
    });
  } catch (error) {
    console.error('Reply to conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send reply'
    });
  }
});

// @route   PUT /api/admin/intercept/notes/:conversationId
// @desc    Add or update admin notes for a conversation
// @access  Private (Admin only)
router.put('/notes/:conversationId', protect, authorize('admin'), async (req, res) => {
  try {
    const { notes } = req.body;
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation || !conversation.isIntercepted) {
      return res.status(404).json({
        success: false,
        error: 'Intercepted conversation not found'
      });
    }

    // Update admin notes
    conversation.adminNotes = notes;

    // Add admin action record
    if (!conversation.adminActions) {
      conversation.adminActions = [];
    }
    conversation.adminActions.push({
      action: 'notes_updated',
      performedBy: req.user.id,
      performedAt: new Date(),
      details: { notesLength: notes.length }
    });

    await conversation.save();

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Update notes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notes'
    });
  }
});

// @route   PUT /api/admin/intercept/status/:conversationId
// @desc    Update conversation status
// @access  Private (Admin only)
router.put('/status/:conversationId', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'forwarded', 'replied', 'awaiting_reply', 'resolved', 'spam'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation || !conversation.isIntercepted) {
      return res.status(404).json({
        success: false,
        error: 'Intercepted conversation not found'
      });
    }

    // Update status
    conversation.adminStatus = status;

    // Add admin action record
    if (!conversation.adminActions) {
      conversation.adminActions = [];
    }
    conversation.adminActions.push({
      action: 'status_changed',
      performedBy: req.user.id,
      performedAt: new Date(),
      details: { newStatus: status }
    });

    await conversation.save();

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update status'
    });
  }
});

// @route   POST /api/admin/intercept/batch
// @desc    Perform batch operations on conversations
// @access  Private (Admin only)
router.post('/batch', protect, authorize('admin'), async (req, res) => {
  try {
    const { conversationIds, action, data } = req.body;

    if (!conversationIds || !Array.isArray(conversationIds) || conversationIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid conversation IDs'
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const id of conversationIds) {
      try {
        const conversation = await Conversation.findById(id);
        
        if (!conversation || !conversation.isIntercepted) {
          results.failed.push({ id, error: 'Not found or not intercepted' });
          continue;
        }

        switch (action) {
          case 'markAsRead':
            await conversation.markAsRead(req.user.id, true);
            break;
          
          case 'updateStatus':
            conversation.adminStatus = data.status;
            break;
          
          case 'archive':
            conversation.status = 'archived';
            break;
          
          default:
            results.failed.push({ id, error: 'Invalid action' });
            continue;
        }

        // Add admin action record
        if (!conversation.adminActions) {
          conversation.adminActions = [];
        }
        conversation.adminActions.push({
          action: `batch_${action}`,
          performedBy: req.user.id,
          performedAt: new Date(),
          details: data
        });

        await conversation.save();
        results.successful.push(id);
      } catch (err) {
        results.failed.push({ id, error: err.message });
      }
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Batch operation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform batch operation'
    });
  }
});

// @route   GET /api/admin/intercept/stats
// @desc    Get comprehensive statistics for intercepted conversations
// @access  Private (Admin only)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateQuery = {};
    if (startDate || endDate) {
      dateQuery.interceptedAt = {};
      if (startDate) dateQuery.interceptedAt.$gte = new Date(startDate);
      if (endDate) dateQuery.interceptedAt.$lte = new Date(endDate);
    }

    // Get overall statistics
    const [
      totalIntercepted,
      pendingCount,
      forwardedCount,
      repliedCount,
      businesses,
      profileStats
    ] = await Promise.all([
      Conversation.countDocuments({ isIntercepted: true, ...dateQuery }),
      Conversation.countDocuments({ 
        isIntercepted: true, 
        adminStatus: { $in: [undefined, 'pending'] },
        ...dateQuery 
      }),
      Conversation.countDocuments({ 
        isIntercepted: true, 
        adminStatus: 'forwarded',
        ...dateQuery 
      }),
      Conversation.countDocuments({ 
        isIntercepted: true, 
        adminStatus: 'replied',
        ...dateQuery 
      }),
      Business.find({}),
      Business.aggregate([
        {
          $group: {
            _id: null,
            avgCompletion: { $avg: '$completionPercentage' },
            canMessage: {
              $sum: {
                $cond: [{ $gte: ['$completionPercentage', 80] }, 1, 0]
              }
            },
            cannotMessage: {
              $sum: {
                $cond: [{ $lt: ['$completionPercentage', 80] }, 1, 0]
              }
            }
          }
        }
      ])
    ]);

    // Get response time statistics
    const responseTimeStats = await Conversation.aggregate([
      {
        $match: {
          isIntercepted: true,
          adminStatus: { $in: ['forwarded', 'replied'] },
          ...dateQuery
        }
      },
      {
        $project: {
          responseTime: {
            $subtract: [
              { $ifNull: ['$forwardedAt', '$repliedAt'] },
              '$interceptedAt'
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' },
          minResponseTime: { $min: '$responseTime' },
          maxResponseTime: { $max: '$responseTime' }
        }
      }
    ]);

    // Get activity by hour
    const activityByHour = await Conversation.aggregate([
      {
        $match: {
          isIntercepted: true,
          ...dateQuery
        }
      },
      {
        $group: {
          _id: { $hour: '$interceptedAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get top businesses by message count
    const topBusinesses = await Conversation.aggregate([
      {
        $match: {
          isIntercepted: true,
          ...dateQuery
        }
      },
      {
        $group: {
          _id: '$business',
          messageCount: { $sum: { $size: '$messages' } },
          conversationCount: { $sum: 1 }
        }
      },
      { $sort: { messageCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'businessUser'
        }
      }
    ]);

    const stats = {
      overview: {
        totalIntercepted,
        pendingCount,
        forwardedCount,
        repliedCount,
        totalBusinesses: businesses.length,
        businessesCanMessage: profileStats[0]?.canMessage || 0,
        businessesCannotMessage: profileStats[0]?.cannotMessage || 0,
        averageProfileCompletion: Math.round(profileStats[0]?.avgCompletion || 0)
      },
      responseTime: responseTimeStats[0] || {
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0
      },
      activityByHour: activityByHour.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      topBusinesses: topBusinesses.map(b => ({
        businessId: b._id,
        email: b.businessUser[0]?.email,
        messageCount: b.messageCount,
        conversationCount: b.conversationCount
      })),
      completionRanges: {
        '0-20': 0,
        '21-40': 0,
        '41-60': 0,
        '61-80': 0,
        '81-100': 0
      }
    };

    // Calculate completion ranges
    businesses.forEach(business => {
      const completion = business.completionPercentage || 0;
      if (completion <= 20) stats.completionRanges['0-20']++;
      else if (completion <= 40) stats.completionRanges['21-40']++;
      else if (completion <= 60) stats.completionRanges['41-60']++;
      else if (completion <= 80) stats.completionRanges['61-80']++;
      else stats.completionRanges['81-100']++;
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get intercept stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// @route   GET /api/admin/intercept/check-messaging-eligibility/:vaId
// @desc    Check if current user can message a specific VA
// @access  Public (with optional auth)
router.get('/check-messaging-eligibility/:vaId', optionalAuth, async (req, res) => {
  try {
    const { vaId } = req.params;
    
    // Find the VA
    const va = await VA.findById(vaId);
    if (!va) {
      return res.status(404).json({
        success: false,
        error: 'VA not found'
      });
    }

    // Default response for unauthenticated users
    let response = {
      success: true,
      canMessage: false,
      isAuthenticated: false,
      userType: null,
      profileCompletion: 0,
      actionRequired: {
        type: 'register',
        text: 'Register Your Business To Chat',
        url: process.env.ESYSTEMS_FRONTEND_URL || 'https://esystems-management-hub.onrender.com/sign-up'
      }
    };

    // Check if user is authenticated
    if (req.user) {
      response.isAuthenticated = true;
      
      // Check if user is a business
      if (req.user.business) {
        response.userType = 'business';
        const business = await Business.findById(req.user.business);
        
        if (business) {
          response.profileCompletion = business.completionPercentage || 0;
          
          if (response.profileCompletion >= 80) {
            response.canMessage = true;
            response.actionRequired = {
              type: 'message',
              text: 'Send Message',
              url: null
            };
          } else {
            response.actionRequired = {
              type: 'complete_profile',
              text: `Complete Your Profile To Chat (${response.profileCompletion}% complete)`,
              url: process.env.ESYSTEMS_FRONTEND_URL 
                ? `${process.env.ESYSTEMS_FRONTEND_URL}/profile` 
                : 'https://esystems-management-hub.onrender.com/profile'
            };
          }
        }
      } 
      // Check if user is a VA
      else if (req.user.va) {
        response.userType = 'va';
        response.canMessage = true;
        response.profileCompletion = 100; // VAs can always message
        response.actionRequired = {
          type: 'message',
          text: 'Send Message',
          url: null
        };
      } 
      // User is authenticated but has no profile
      else {
        response.userType = 'none';
        response.actionRequired = {
          type: 'create_profile',
          text: 'Create a Business Profile To Chat',
          url: process.env.ESYSTEMS_FRONTEND_URL 
            ? `${process.env.ESYSTEMS_FRONTEND_URL}/register` 
            : 'https://esystems-management-hub.onrender.com/sign-up'
        };
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Check messaging eligibility error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/admin/intercept/direct-message/:vaId
// @desc    Start a direct conversation with a VA without forwarding any existing message
// @access  Private (Admin only)
router.post('/direct-message/:vaId', protect, authorize('admin'), async (req, res) => {
  try {
    const { message } = req.body;
    const { vaId } = req.params;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Find the VA user
    const vaUser = await User.findById(vaId);
    if (!vaUser || !vaUser.profile?.va) {
      return res.status(404).json({
        success: false,
        error: 'VA not found'
      });
    }

    // Check if a direct admin-to-VA conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, vaId] },
      isIntercepted: false,
      adminConversationId: null // Direct chat, not forwarded from an intercepted conversation
    });

    if (!conversation) {
      // Create new direct admin-to-VA conversation
      conversation = new Conversation({
        participants: [req.user.id, vaId],
        va: vaId,
        business: req.user.id, // Admin acts as business in this context
        messages: [{
          sender: req.user.id,
          content: message,
          isAdminMessage: true
        }],
        lastMessage: message,
        lastMessageAt: new Date(),
        unreadCount: {
          va: 1,
          business: 0,
          admin: 0
        },
        isIntercepted: false,
        adminConversationId: null, // This indicates it's a direct admin-VA chat
        status: 'active'
      });
    } else {
      // Add message to existing conversation
      conversation.addMessage(req.user.id, message, true);
    }

    await conversation.save();

    // Populate for response
    await conversation.populate([
      { path: 'va', select: 'email profile' },
      { path: 'business', select: 'email profile' },
      { path: 'messages.sender', select: 'email profile' }
    ]);

    // Emit socket event to notify VA of new message
    const io = req.app.get('io');
    if (io) {
      io.to(vaId).emit('new_message', {
        conversationId: conversation._id,
        message: {
          sender: req.user.id,
          content: message,
          timestamp: new Date()
        }
      });
    }

    res.json({
      success: true,
      data: {
        conversation,
        message: 'Direct message sent to VA successfully'
      }
    });
  } catch (error) {
    console.error('Direct message to VA error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send direct message to VA'
    });
  }
});

// @route   GET /api/admin/intercept/profile-completion-requirements
// @desc    Get the requirements for profile completion
// @access  Public
router.get('/profile-completion-requirements', (req, res) => {
  res.json({
    success: true,
    requirements: {
      minimumPercentage: 80,
      requiredFields: {
        basic: [
          { field: 'contactName', label: 'Contact Name', weight: 10 },
          { field: 'company', label: 'Company Name', weight: 10 },
          { field: 'bio', label: 'Company Bio', weight: 10 },
          { field: 'website', label: 'Website', weight: 5 },
          { field: 'contactRole', label: 'Contact Role', weight: 5 },
          { field: 'email', label: 'Email', weight: 10 },
          { field: 'phone', label: 'Phone', weight: 5 },
          { field: 'avatar', label: 'Company Logo', weight: 5 }
        ],
        professional: [
          { field: 'companySize', label: 'Company Size', weight: 3 },
          { field: 'industry', label: 'Industry', weight: 3 },
          { field: 'foundedYear', label: 'Founded Year', weight: 2 },
          { field: 'specialties', label: 'Specialties', weight: 3 },
          { field: 'companyCulture', label: 'Company Culture', weight: 3 },
          { field: 'workEnvironment', label: 'Work Environment', weight: 3 },
          { field: 'headquartersLocation', label: 'Headquarters', weight: 3 },
          { field: 'missionStatement', label: 'Mission Statement', weight: 3 },
          { field: 'vaRequirements', label: 'VA Requirements', weight: 2 }
        ],
        location: [
          { field: 'streetAddress', label: 'Street Address', weight: 2 },
          { field: 'city', label: 'City', weight: 2 },
          { field: 'state', label: 'State/Province', weight: 2 },
          { field: 'postalCode', label: 'Postal Code', weight: 2 },
          { field: 'country', label: 'Country', weight: 2 }
        ],
        social: [
          { field: 'linkedin', label: 'LinkedIn', weight: 2 },
          { field: 'facebook', label: 'Facebook', weight: 1 },
          { field: 'twitter', label: 'Twitter', weight: 1 },
          { field: 'instagram', label: 'Instagram', weight: 1 }
        ]
      },
      tips: [
        'Complete all required basic information fields for 60% completion',
        'Add professional details to reach 85% completion',
        'Include at least 3 location fields for the location bonus',
        'Add at least one social media link for the social bonus',
        'Upload a company logo/avatar for better profile visibility'
      ]
    }
  });
});

module.exports = router;