const express = require('express');
const router = express.Router();
const User = require('../models/User');
const VA = require('../models/VA');
const Business = require('../models/Business');
const Conversation = require('../models/Conversation');
const SiteConfig = require('../models/SiteConfig');
const File = require('../models/File');
const Announcement = require('../models/Announcement');
const AnnouncementRead = require('../models/AnnouncementRead');
// HYBRID AUTH: Support both Clerk and legacy JWT during migration
const { protect, authorize } = require('../middleware/hybridAuth');
const { handleSupabaseUpload, deleteFromSupabase } = require('../utils/supabaseStorage');
const { uploadLimiter } = require('../middleware/rateLimiter');

// Stop-impersonation route (needs special handling before admin check)
router.post('/stop-impersonation', protect, async (req, res) => {
  try {
    // Verify the current token is an impersonation token
    if (!req.user.isImpersonated || !req.user.impersonatedBy) {
      return res.status(400).json({
        success: false,
        error: 'Not currently impersonating a user'
      });
    }

    // Find the original admin user with populated data
    const adminUser = await User.findById(req.user.impersonatedBy)
      .populate('va')
      .populate('business');
      
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        error: 'Original admin user not found'
      });
    }

    // Verify admin is still an admin
    if (!adminUser.admin) {
      return res.status(403).json({
        success: false,
        error: 'Original user is no longer an admin'
      });
    }

    // Get the admin origin URL from the token (where to return to)
    const adminOriginUrl = req.user.adminOriginUrl || 'http://localhost:4000';

    // Generate a new admin token with full user data
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      {
        id: adminUser._id,
        email: adminUser.email,
        role: 'admin',
        admin: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Return the data structure expected by frontend
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: adminUser._id,
          email: adminUser.email,
          role: 'admin',
          admin: true,
          va: adminUser.va,
          business: adminUser.business,
          name: adminUser.profile?.name || adminUser.email
        },
        adminOriginUrl, // Include where to redirect back to
        message: 'Successfully returned to admin session'
      }
    });
  } catch (error) {
    console.error('Error stopping impersonation:', error);
    res.status(500).json({
      success: false,
      error: 'Server error stopping impersonation'
    });
  }
});

// All other routes require admin authorization
router.use(protect, authorize('admin'));

// @route   GET /api/admin/notifications
// @desc    Get admin's notifications with pagination and filtering
// @access  Private/Admin
router.get('/notifications', async (req, res) => {
  try {
    const { page = 1, limit = 10, unreadOnly = false, type, priority } = req.query;
    const Notification = require('../models/Notification');

    // Build query
    const query = { recipient: req.user._id };
    
    // Filter by read status
    if (unreadOnly === 'true') {
      query.readAt = null;
    }
    
    // Filter by type
    if (type) {
      query.type = type;
    }
    
    // Filter by priority (if exists in params)
    if (priority) {
      query['params.priority'] = priority;
    }

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('message')
        .populate('conversation')
        .populate('viewer')
        .populate('referral')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Notification.countDocuments(query),
      Notification.getUnreadCount(req.user._id)
    ]);
    
    // Add computed fields for each notification
    const enhancedNotifications = notifications.map(notification => ({
      ...notification,
      isRead: !!notification.readAt,
      title: notification.params?.title || getNotificationTitle(notification.type)
    }));

    res.json({
      success: true,
      data: enhancedNotifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

// Helper function for notification titles
function getNotificationTitle(type) {
  const titles = {
    'new_message': 'New Message',
    'new_conversation': 'New Conversation Started',
    'profile_view': 'Someone Viewed Your Profile',
    'profile_reminder': 'Complete Your Profile',
    'va_added': 'New VA Joined',
    'business_added': 'New Business Joined',
    'admin_notification': 'Admin Notification',
    'system_announcement': 'System Announcement',
    'referral_joined': 'Your Referral Joined',
    'celebration_package': 'Celebration Package Request',
    'hiring_invoice': 'Hiring Invoice Request'
  };
  return titles[type] || 'Notification';
}

// @route   PUT /api/admin/notifications/read
// @desc    Mark single admin notification as read with Socket.io
// @access  Private/Admin
router.put('/notifications/read', async (req, res) => {
  try {
    const { notificationId } = req.body;
    const Notification = require('../models/Notification');
    const { markNotificationsAsReadWithSocket } = require('../utils/notificationHelper');

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide notification ID'
      });
    }

    // Get Socket.io instance
    const io = req.app.get('io');
    
    // Mark as read with Socket.io emission
    const { result, unreadCount } = await markNotificationsAsReadWithSocket(
      notificationId,
      req.user._id,
      io
    );

    res.json({
      success: true,
      message: 'Notification marked as read',
      unreadCount,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// @route   PUT /api/admin/notifications/read-all
// @desc    Mark all admin notifications as read with Socket.io
// @access  Private/Admin
router.put('/notifications/read-all', async (req, res) => {
  try {
    const { markAllNotificationsAsReadWithSocket } = require('../utils/notificationHelper');
    
    // Get Socket.io instance
    const io = req.app.get('io');
    
    // Mark all as read with Socket.io emission
    const { result, notificationIds } = await markAllNotificationsAsReadWithSocket(
      req.user._id,
      io
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
      notificationIds
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
});

// @route   DELETE /api/admin/notifications/:id
// @desc    Delete an admin notification with Socket.io
// @access  Private/Admin
router.delete('/notifications/:id', async (req, res) => {
  try {
    const { deleteNotificationWithSocket } = require('../utils/notificationHelper');
    
    // Get Socket.io instance
    const io = req.app.get('io');
    
    // Delete notification with Socket.io emission
    const { notification, unreadCount } = await deleteNotificationWithSocket(
      req.params.id,
      req.user._id,
      io
    );

    res.json({
      success: true,
      message: 'Notification deleted',
      unreadCount
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    
    if (error.message === 'Notification not found or unauthorized') {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
});

// @route   GET /api/admin/notifications/unread-count
// @desc    Get unread notification count for efficiency
// @access  Private/Admin
router.get('/notifications/unread-count', async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const unreadCount = await Notification.getUnreadCount(req.user._id);
    
    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread count'
    });
  }
});

// @route   GET /api/admin/activity/new-users-today
// @desc    Get list of new users registered today
// @access  Private/Admin
router.get('/activity/new-users-today', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const newUsers = await User.find({
      createdAt: { $gte: startOfDay },
      admin: { $ne: true }
    })
    .select('email profile createdAt isVerified role')
    .populate('va', 'skills specialties location')
    .populate('business', 'company industry size')
    .sort('-createdAt')
    .lean();

    const formattedUsers = newUsers.map(user => ({
      _id: user._id,
      email: user.email,
      name: user.profile?.name || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'N/A',
      firstName: user.profile?.firstName,
      lastName: user.profile?.lastName,
      phone: user.profile?.phone,
      role: user.va ? 'va' : user.business ? 'business' : 'user',
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      // VA specific fields
      skills: user.va?.skills || [],
      specialties: user.va?.specialties || [],
      location: user.va?.location,
      // Business specific fields
      company: user.business?.company,
      industry: user.business?.industry,
      size: user.business?.size
    }));

    res.json({
      success: true,
      data: formattedUsers
    });
  } catch (error) {
    console.error('Error fetching new users today:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch new users'
    });
  }
});

// @route   GET /api/admin/activity/new-vas-today
// @desc    Get list of new VAs registered today
// @access  Private/Admin
router.get('/activity/new-vas-today', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const newVAs = await VA.find({
      createdAt: { $gte: startOfDay }
    })
    .populate('user', 'email profile isVerified createdAt')
    .sort('-createdAt')
    .lean();

    const formattedVAs = newVAs.map(va => ({
      _id: va._id,
      email: va.user?.email,
      name: `${va.firstName || ''} ${va.lastName || ''}`.trim() || va.user?.profile?.name || 'N/A',
      firstName: va.firstName,
      lastName: va.lastName,
      phone: va.phone,
      role: 'va',
      isVerified: va.user?.isVerified,
      createdAt: va.createdAt,
      skills: va.skills || [],
      specialties: va.specialties || [],
      location: va.location,
      hourlyRate: va.hourlyRate,
      availability: va.availability
    }));

    res.json({
      success: true,
      data: formattedVAs
    });
  } catch (error) {
    console.error('Error fetching new VAs today:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch new VAs'
    });
  }
});

// @route   GET /api/admin/activity/new-businesses-today
// @desc    Get list of new businesses registered today
// @access  Private/Admin
router.get('/activity/new-businesses-today', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const newBusinesses = await Business.find({
      createdAt: { $gte: startOfDay }
    })
    .populate('user', 'email profile isVerified createdAt')
    .sort('-createdAt')
    .lean();

    const formattedBusinesses = newBusinesses.map(business => ({
      _id: business._id,
      email: business.user?.email,
      name: business.contactName || business.user?.profile?.name || 'N/A',
      firstName: business.contactName?.split(' ')[0],
      lastName: business.contactName?.split(' ').slice(1).join(' '),
      phone: business.phone,
      role: 'business',
      isVerified: business.user?.isVerified,
      createdAt: business.createdAt,
      company: business.company,
      industry: business.industry,
      size: business.size,
      location: business.location,
      website: business.website
    }));

    res.json({
      success: true,
      data: formattedBusinesses
    });
  } catch (error) {
    console.error('Error fetching new businesses today:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch new businesses'
    });
  }
});

// @route   GET /api/admin/activity/active-users-30days
// @desc    Get list of active users in the last 30 days
// @access  Private/Admin
router.get('/activity/active-users-30days', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = await User.find({
      'stats.lastActive': { $gte: thirtyDaysAgo },
      admin: { $ne: true }
    })
    .select('email profile createdAt isVerified role stats.lastActive')
    .populate('va', 'skills specialties location')
    .populate('business', 'company industry size')
    .sort('-stats.lastActive')
    .limit(100) // Limit to 100 most recently active
    .lean();

    const formattedUsers = activeUsers.map(user => ({
      _id: user._id,
      email: user.email,
      name: user.profile?.name || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'N/A',
      firstName: user.profile?.firstName,
      lastName: user.profile?.lastName,
      phone: user.profile?.phone,
      role: user.va ? 'va' : user.business ? 'business' : 'user',
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      lastActive: user.stats?.lastActive,
      // VA specific fields
      skills: user.va?.skills || [],
      specialties: user.va?.specialties || [],
      location: user.va?.location,
      // Business specific fields
      company: user.business?.company,
      industry: user.business?.industry,
      size: user.business?.size
    }));

    res.json({
      success: true,
      data: formattedUsers
    });
  } catch (error) {
    console.error('Error fetching active users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active users'
    });
  }
});

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Private/Admin
router.get('/stats', async (req, res) => {
  try {
    // Calculate date 30 days ago for active VAs
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalVAs,
      activeVAs,
      totalBusinesses,
      // pendingApprovals removed - no longer needed
      activeAnnouncements,
      unreadAnnouncementsVA,
      unreadAnnouncementsBusiness
    ] = await Promise.all([
      VA.countDocuments(),
      // Active VAs: Those whose associated users have logged in within the last 30 days
      VA.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $unwind: '$userInfo'
        },
        {
          $match: {
            'userInfo.stats.lastActive': { $gte: thirtyDaysAgo }
          }
        },
        {
          $count: 'total'
        }
      ]).then(result => result[0]?.total || 0),
      Business.countDocuments(),
      // Announcement statistics
      Announcement.countDocuments({ isActive: true }),
      // For now, use simplified counts - we'll improve this later
      Promise.resolve(0), // unreadAnnouncementsVA - placeholder
      Promise.resolve(0)  // unreadAnnouncementsBusiness - placeholder
    ]);

    // Get growth data for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [vaGrowthData, businessGrowthData] = await Promise.all([
      VA.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Business.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    // Format growth data for chart
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last6Months = [];
    const vaGrowth = [];
    const businessGrowth = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      
      last6Months.push(months[monthIndex]);
      
      // Find data for this month
      const vaData = vaGrowthData.find(d => d._id.year === year && d._id.month === monthIndex + 1);
      const bizData = businessGrowthData.find(d => d._id.year === year && d._id.month === monthIndex + 1);
      
      vaGrowth.push(vaData ? vaData.count : 0);
      businessGrowth.push(bizData ? bizData.count : 0);
    }

    // Fetch recent activities from both VAs and Businesses
    const [recentVAs, recentBusinesses] = await Promise.all([
      VA.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name createdAt status')
        .lean(),
      Business.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('company contactName createdAt')
        .lean()
    ]);

    // Combine and sort activities by date
    const recentActivity = [
      ...recentVAs.map(va => ({
        type: 'va',
        title: `New VA: ${va.name}`,
        description: `${va.name} registered (${va.status})`,
        createdAt: va.createdAt,
        timestamp: va.createdAt
      })),
      ...recentBusinesses.map(biz => ({
        type: 'business',
        title: `New Business: ${biz.company || biz.contactName}`,
        description: `${biz.company || biz.contactName} registered`,
        createdAt: biz.createdAt,
        timestamp: biz.createdAt
      }))
    ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10); // Keep only the 10 most recent activities

    res.json({
      success: true,
      data: {
        totalVAs,
        activeVAs,
        totalBusinesses,
        // pendingApprovals removed - no longer tracked
        activeAnnouncements,
        unreadAnnouncementsVA,
        unreadAnnouncementsBusiness,
        totalRevenue: 0, // Placeholder
        activeContracts: 0, // Placeholder
        recentActivity,
        growthChart: {
          labels: last6Months,
          vaGrowth,
          businessGrowth
        }
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

// @route   POST /api/admin/impersonate
// @desc    Impersonate a user (VA or Business) for admin editing
// @access  Private/Admin
router.post('/impersonate', async (req, res) => {
  try {
    const { userId, adminOriginUrl } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Find the user to impersonate with VA/Business data
    const user = await User.findById(userId)
      .populate('va')
      .populate('business');
      
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Determine the role based on populated data
    let role = 'user';
    if (user.admin) {
      role = 'admin';
    } else if (user.va) {
      role = 'va';
    } else if (user.business) {
      role = 'business';
    }

        // Generate a new JWT token for the impersonated user
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      {
        id: user._id,
        role: role,
        isImpersonated: true,
        impersonatedBy: req.user.id, // Track who is doing the impersonation
        adminOriginUrl: adminOriginUrl || 'http://localhost:4000', // Store where to return to
        va: user.va?._id,
        business: user.business?._id
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Shorter expiration for security
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: role,
          isImpersonated: true,
          admin: user.admin,
          va: user.va ? {
            _id: user.va._id,
            name: user.va.name
          } : null,
          business: user.business ? {
            _id: user.business._id,
            company: user.business.company
          } : null
        },
        message: `Successfully impersonating ${user.email}`
      }
    });

  } catch (err) {
    console.error('Impersonation error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error during impersonation'
    });
  }
});

// The stop-impersonation route is defined earlier in this file, before the admin authorization middleware

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private/Admin
router.get('/dashboard', async (req, res) => {
  try {
    // Calculate date 30 days ago for active VAs
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      totalVAs,
      activeVAs,
      totalBusinesses,
      activeConversations,
      newUsersToday,
      newVAsToday,
      newBusinessesToday
    ] = await Promise.all([
      User.countDocuments(),
      VA.countDocuments(),
      // Active VAs: Those whose associated users have logged in within the last 30 days
      VA.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $unwind: '$userInfo'
        },
        {
          $match: {
            'userInfo.stats.lastActive': { $gte: thirtyDaysAgo }
          }
        },
        {
          $count: 'total'
        }
      ]).then(result => result[0]?.total || 0),
      Business.countDocuments(),
      Conversation.countDocuments({ 
        lastMessageAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      User.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      VA.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      Business.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalVAs,
        activeVAs,
        totalBusinesses,
        activeConversations,
        newUsersToday,
        newVAsToday,
        newBusinessesToday
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

// @route   GET /api/admin/users
// @desc    Get all users (with filters)
// @access  Private/Admin
router.get('/users', async (req, res) => {
  try {
    const { 
      search, 
      role, 
      suspended, 
      page = 1, 
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    const query = {};
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role === 'va') {
      query.va = { $exists: true };
    } else if (role === 'business') {
      query.business = { $exists: true };
    } else if (role === 'admin') {
      query.admin = true;
    }
    
    if (suspended === 'true') {
      query.suspended = true;
    }

    const skip = (page - 1) * limit;

    let users, total;
    
    if (search) {
      // When searching, we need to use aggregation to search across populated fields
      const aggregationPipeline = [
        {
          $lookup: {
            from: 'vas',
            localField: 'va',
            foreignField: '_id',
            as: 'va'
          }
        },
        {
          $lookup: {
            from: 'businesses',
            localField: 'business',
            foreignField: '_id',
            as: 'business'
          }
        },
        {
          $unwind: {
            path: '$va',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: '$business',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: {
            $and: [
              // Apply role filter
              ...(role === 'va' ? [{ va: { $exists: true } }] :
                  role === 'business' ? [{ business: { $exists: true } }] :
                  role === 'admin' ? [{ admin: true }] : []),
              // Apply suspended filter
              ...(suspended === 'true' ? [{ suspended: true }] : []),
              // Apply search filter
              {
                $or: [
                  { email: { $regex: search, $options: 'i' } },
                  { phone: { $regex: search, $options: 'i' } },
                  { 'va.name': { $regex: search, $options: 'i' } },
                  { 'va.phone': { $regex: search, $options: 'i' } },
                  { 'business.company': { $regex: search, $options: 'i' } },
                  { 'business.contactName': { $regex: search, $options: 'i' } },
                  { 'business.phone': { $regex: search, $options: 'i' } }
                ]
              }
            ]
          }
        },
        {
          $sort: sort === '-createdAt' ? { createdAt: -1 } : { createdAt: 1 }
        }
      ];

      const [usersResult, totalResult] = await Promise.all([
        User.aggregate([
          ...aggregationPipeline,
          { $skip: skip },
          { $limit: parseInt(limit) }
        ]),
        User.aggregate([
          ...aggregationPipeline,
          { $count: 'total' }
        ])
      ]);

      users = usersResult;
      total = totalResult[0]?.total || 0;
    } else {
      // When not searching, use the simpler query
      [users, total] = await Promise.all([
        User.find(query)
          .populate('va', 'name')
          .populate('business', 'company')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        User.countDocuments(query)
      ]);
    }

    res.json({
      success: true,
      data: users,
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

// @route   PUT /api/admin/users/:id/suspend
// @desc    Suspend/unsuspend user
// @access  Private/Admin
router.put('/users/:id/suspend', async (req, res) => {
  try {
    const { suspended } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { suspended },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/admin/users/:id/admin
// @desc    Grant/revoke admin privileges
// @access  Private/Admin
router.put('/users/:id/admin', async (req, res) => {
  try {
    const { admin } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { admin },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Helper function to flatten nested objects
function flattenObject(obj, prefix = '') {
  const flattened = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}_${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, fullKey));
    } else {
      flattened[fullKey] = value;
    }
  }
  return flattened;
}

// @route   POST /api/admin/settings/reset
// @desc    Reset settings to defaults (all or specific category)
// @access  Private/Admin
router.post('/settings/reset', async (req, res) => {
  try {
    const { category } = req.body;
    
    console.log('Resetting settings for category:', category || 'all');
    
    // Define default settings
    const defaultSettings = {
      general: {
        siteName: 'Linkage VA Hub',
        siteDescription: 'Virtual Assistant Platform',
        contactEmail: 'support@linkagevahub.com',
        maintenanceMode: false
      },
      email: {
        sendgridApiKey: '',
        fromName: 'Linkage VA Hub',
        fromEmail: 'noreply@linkagevahub.com'
      },
      security: {
        twoFactorAuth: {
          enabled: false,
          required: false
        },
        sessionTimeout: 30,
        loginAttempts: {
          maxAttempts: 5,
          lockoutDuration: 15
        },
        passwordRequirements: {
          minLength: 8,
          requireUppercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          expirationDays: 90
        }
      },
      notifications: {
        email: {
          enabled: true,
          criticalAlerts: true,
          userActivity: false,
          systemUpdates: false,
          digestFrequency: 'weekly'
        },
        inApp: {
          enabled: true,
          allUpdates: false,
          soundEnabled: false,
          desktopNotifications: false
        },
        slack: {
          enabled: false,
          webhookUrl: '',
          channels: {
            alerts: '#alerts',
            general: '#general'
          }
        }
      },
      regional: {
        language: 'en',
        timezone: 'Asia/Manila',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        autoDetectTimezone: false,
        useSystemLocale: false,
        firstDayOfWeek: 'sunday'
      },
      performance: {
        cache: {
          enabled: false,
          duration: 86400,
          strategy: 'memory',
          maxSize: '100MB'
        },
        pagination: {
          defaultLimit: 25,
          maxLimit: 100
        },
        autoSave: {
          enabled: false,
          interval: 60,
          showNotification: false
        },
        lazyLoading: {
          enabled: false,
          threshold: 0.1
        }
      },
      features: {},
      limits: {}
    };
    
    // Determine which settings to reset
    let settingsToReset = {};
    if (category && defaultSettings[category]) {
      settingsToReset[category] = defaultSettings[category];
    } else if (!category) {
      settingsToReset = defaultSettings;
    } else {
      return res.status(400).json({
        success: false,
        error: `Invalid category: ${category}`
      });
    }
    
    // Reset the settings in database
    const updates = [];
    const errors = [];
    
    for (const [cat, catSettings] of Object.entries(settingsToReset)) {
      const flattenedSettings = flattenObject(catSettings, cat);
      for (const [key, value] of Object.entries(flattenedSettings)) {
        try {
          const existingConfig = await SiteConfig.findOne({ key });
          
          if (existingConfig) {
            existingConfig.value = value;
            existingConfig.markModified('value');
            await existingConfig.save();
          } else {
            await SiteConfig.create({
              key,
              value,
              valueType: detectValueType(value),
              category: cat,
              description: generateDescription(key),
              isPublic: false,
              isEditable: true
            });
          }
          updates.push(key);
        } catch (error) {
          errors.push({ key, error: error.message });
        }
      }
    }
    
    console.log(`Reset ${updates.length} settings, ${errors.length} errors`);
    
    // Return the reset settings
    res.json({
      success: true,
      message: category ? `Reset ${category} settings to defaults` : 'Reset all settings to defaults',
      resetCount: updates.length,
      errors: errors.length > 0 ? errors : undefined,
      settings: settingsToReset
    });
    
  } catch (err) {
    console.error('Error resetting settings:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to reset settings'
    });
  }
});

// @route   GET /api/admin/settings/:key
// @desc    Get a specific configuration value
// @access  Private/Admin
router.get('/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const config = await SiteConfig.findOne({ key });
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: `Configuration key '${key}' not found`
      });
    }

    const value = await SiteConfig.getValue(key);
    
    res.json({
      success: true,
      data: {
        key: config.key,
        value,
        description: config.description,
        valueType: config.valueType,
        category: config.category,
        isPublic: config.isPublic,
        isEditable: config.isEditable
      }
    });
  } catch (err) {
    console.error('Error fetching config value:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch configuration value'
    });
  }
});

// @route   GET /api/admin/config
// @desc    Get site configuration (legacy endpoint - use /settings instead)
// @access  Private/Admin
router.get('/config', async (req, res) => {
  try {
    // Initialize default configs if none exist
    const configCount = await SiteConfig.countDocuments();
    if (configCount === 0) {
      const initializeConfig = require('../scripts/initializeConfig');
      await initializeConfig(true); // Run in silent mode
    }

    const configs = await SiteConfig.find({ isEditable: true });
    
    const configMap = {};
    for (const config of configs) {
      configMap[config.key] = {
        value: await SiteConfig.getValue(config.key),
        category: config.category,
        description: config.description,
        valueType: config.valueType,
        isPublic: config.isPublic,
        isEditable: config.isEditable
      };
    }

    // If no configs found, return default structure
    if (Object.keys(configMap).length === 0) {
      // Return a minimal default configuration
      configMap['site_name'] = {
        value: 'Linkage VA Hub',
        category: 'general',
        description: 'The name of your platform',
        valueType: 'text',
        isPublic: true,
        isEditable: true
      };
      configMap['registration_enabled'] = {
        value: true,
        category: 'features',
        description: 'Enable new user registration',
        valueType: 'boolean',
        isPublic: true,
        isEditable: true
      };
      configMap['max_vas_per_page'] = {
        value: 20,
        category: 'limits',
        description: 'Maximum number of VAs to display per page',
        valueType: 'number',
        isPublic: false,
        isEditable: true
      };
    }

    res.json({
      success: true,
      data: configMap
    });
  } catch (err) {
    console.error('Error fetching config:', err);
    res.status(500).json({
      success: false,
      error: 'Server error fetching configuration'
    });
  }
});

// @route   PUT /api/admin/configs
// @desc    Update site configuration (frontend expects this endpoint)
// @access  Private/Admin
router.put('/configs', async (req, res) => {
  try {
    const { configs } = req.body;

    if (!configs || typeof configs !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration data'
      });
    }

    console.log('Updating configurations:', Object.keys(configs));

    const updates = [];
    const errors = [];
    const updatedConfigs = {};

    for (const [key, value] of Object.entries(configs)) {
      try {
        // Find existing config to get its metadata
        const existingConfig = await SiteConfig.findOne({ key });

        if (existingConfig) {
          // Store the old value BEFORE updating
          const oldValue = existingConfig.value;

          // Log the change for debugging
          console.log(`Updating config ${key}: ${existingConfig.value} -> ${value}`);

          // Update existing config
          existingConfig.value = value;
          // Critical: Mark the Mixed type field as modified so Mongoose tracks the change
          existingConfig.markModified('value');
          await existingConfig.save();

          updates.push({
            key,
            oldValue: oldValue,
            newValue: value
          });

          updatedConfigs[key] = value;
        } else {
          // Create new config with default metadata
          console.log(`Creating new config ${key} with value: ${value}`);

          await SiteConfig.create({
            key,
            value,
            valueType: detectValueType(value),
            category: detectCategory(key),
            description: generateDescription(key),
            isPublic: false,
            isEditable: true
          });

          updates.push({
            key,
            newValue: value,
            created: true
          });

          updatedConfigs[key] = value;
        }
      } catch (configError) {
        console.error(`Error updating config ${key}:`, configError);
        errors.push({ key, error: configError.message });
      }
    }

    if (errors.length > 0) {
      return res.status(207).json({ // 207 Multi-Status for partial success
        success: false,
        message: `Updated ${updates.length} configuration(s), ${errors.length} failed`,
        errors,
        updated: updates,
        updatedConfigs
      });
    }

    // Get all updated configs to return to frontend
    const allConfigs = await SiteConfig.find({ isEditable: true });
    const configMap = {};

    for (const config of allConfigs) {
      configMap[config.key] = {
        value: await SiteConfig.getValue(config.key),
        description: config.description,
        valueType: config.valueType,
        category: config.category,
        isPublic: config.isPublic,
        isEditable: config.isEditable
      };
    }

    console.log(`Successfully updated ${updates.length} configuration(s)`);

    res.json({
      success: true,
      message: `Successfully updated ${updates.length} setting(s)`,
      data: configMap,
      updated: updates,
      updatedConfigs
    });
  } catch (err) {
    console.error('Error updating configs:', err);
    res.status(500).json({
      success: false,
      error: 'Server error updating configuration'
    });
  }
});

// @route   PUT /api/admin/config
// @desc    Update site configuration (legacy endpoint - use /settings instead)
// @access  Private/Admin
router.put('/config', async (req, res) => {
  try {
    const { configs } = req.body;

    if (!configs || typeof configs !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration data'
      });
    }

    const updates = [];
    const errors = [];

    for (const [key, value] of Object.entries(configs)) {
      try {
        // Find existing config to get its metadata
        const existingConfig = await SiteConfig.findOne({ key });

        if (existingConfig) {
          // Update existing config
          existingConfig.value = value;
          // Critical: Mark the Mixed type field as modified so Mongoose tracks the change
          existingConfig.markModified('value');
          await existingConfig.save();
          updates.push(key);
        } else {
          // Create new config with default metadata
          await SiteConfig.create({
            key,
            value,
            valueType: detectValueType(value),
            category: detectCategory(key),
            description: generateDescription(key),
            isPublic: false,
            isEditable: true
          });
          updates.push(key);
        }
      } catch (configError) {
        console.error(`Error updating config ${key}:`, configError);
        errors.push({ key, error: configError.message });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some configurations could not be updated',
        errors,
        updated: updates
      });
    }

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      updated: updates
    });
  } catch (err) {
    console.error('Error updating config:', err);
    res.status(500).json({
      success: false,
      error: 'Server error updating configuration'
    });
  }
});

// @route   GET /api/admin/configs
// @desc    Get site configuration (frontend expects this endpoint)
// @access  Private/Admin
router.get('/configs', async (req, res) => {
  try {
    // Initialize default configs if none exist
    const configCount = await SiteConfig.countDocuments();
    if (configCount === 0) {
      const initializeConfig = require('../scripts/initializeConfig');
      await initializeConfig(true); // Run in silent mode
    }

    const configs = await SiteConfig.find({ isEditable: true });

    const configMap = {};
    for (const config of configs) {
      configMap[config.key] = {
        value: await SiteConfig.getValue(config.key),
        description: config.description,
        valueType: config.valueType,
        category: config.category,
        isPublic: config.isPublic,
        isEditable: config.isEditable
      };
    }

    // If no configs found, return default structure
    if (Object.keys(configMap).length === 0) {
      // Return a minimal default configuration
      configMap['site_name'] = {
        value: 'Linkage VA Hub',
        category: 'general',
        description: 'The name of your platform',
        valueType: 'text',
        isPublic: true,
        isEditable: true
      };
      configMap['registration_enabled'] = {
        value: true,
        category: 'features',
        description: 'Enable new user registration',
        valueType: 'boolean',
        isPublic: true,
        isEditable: true
      };
      configMap['max_vas_per_page'] = {
        value: 20,
        category: 'limits',
        description: 'Maximum number of VAs to display per page',
        valueType: 'number',
        isPublic: false,
        isEditable: true
      };
    }

    res.json({
      success: true,
      data: configMap
    });
  } catch (err) {
    console.error('Error fetching configs:', err);
    res.status(500).json({
      success: false,
      error: 'Server error fetching configuration'
    });
  }
});

// @route   GET /api/admin/settings
// @desc    Get all settings (system config + invitation status)
// @access  Private/Admin
router.get('/settings', async (req, res) => {
  try {
    // Initialize default configs if none exist
    const configCount = await SiteConfig.countDocuments();
    if (configCount === 0) {
      const initializeConfig = require('../scripts/initializeConfig');
      await initializeConfig(true); // Run in silent mode
    }

    // Get all editable configs organized by category
    const configs = await SiteConfig.find({ isEditable: true });
    const configsByCategory = {
      general: {},
      email: {},
      security: {},
      notifications: {},
      features: {},
      limits: {},
      regional: {},
      performance: {}
    };

    // Process configs into categorized structure
    for (const config of configs) {
      const value = await SiteConfig.getValue(config.key);
      if (configsByCategory[config.category]) {
        configsByCategory[config.category][config.key] = {
          value,
          description: config.description,
          valueType: config.valueType,
          isPublic: config.isPublic,
          isEditable: config.isEditable
        };
      }
    }

    // Get admin invitation statistics
    const AdminInvitation = require('../models/AdminInvitation');
    const invitationStats = {
      total: await AdminInvitation.countDocuments(),
      pending: await AdminInvitation.countDocuments({
        status: 'pending',
        expiresAt: { $gt: new Date() }
      }),
      accepted: await AdminInvitation.countDocuments({ status: 'accepted' }),
      expired: await AdminInvitation.countDocuments({
        status: 'pending',
        expiresAt: { $lt: new Date() }
      }),
      cancelled: await AdminInvitation.countDocuments({ status: 'cancelled' })
    };

    // Get recent invitations for display
    const recentInvitations = await AdminInvitation.find()
      .populate('invitedBy', 'email')
      .populate('acceptedBy', 'email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Helper function to unflatten settings from database keys
    function unflattenSettings(flatConfigs) {
      const result = {};
      for (const [key, configData] of Object.entries(flatConfigs)) {
        const parts = key.split('_');
        let current = result;
        
        // Navigate/create nested structure
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
        
        // Set the final value
        const lastPart = parts[parts.length - 1];
        current[lastPart] = configData.value;
      }
      return result;
    }

    // Create a properly nested settings object for the frontend
    const flatSettings = {};
    for (const [category, categoryConfigs] of Object.entries(configsByCategory)) {
      if (Object.keys(categoryConfigs).length > 0) {
        // Unflatten the settings for this category
        const unflattenedCategory = unflattenSettings(categoryConfigs);
        flatSettings[category] = unflattenedCategory[category] || {};
      }
    }

    // Add default settings if categories are empty
    if (Object.keys(flatSettings).length === 0) {
      flatSettings.general = {
        siteName: 'Linkage VA Hub',
        siteDescription: '',
        contactEmail: '',
        maintenanceMode: false
      };
      flatSettings.regional = {
        language: 'en',
        timezone: 'Asia/Manila',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h'
      };
      flatSettings.performance = {
        cache: {
          enabled: false,
          duration: 86400,
          strategy: 'memory',
          maxSize: '100MB'
        },
        pagination: {
          defaultLimit: 25,
          maxLimit: 100
        },
        autoSave: {
          enabled: false,
          interval: 60,
          showNotification: false
        },
        lazyLoading: {
          enabled: false,
          threshold: 0.1
        }
      };
    }

    console.log('Settings loaded, categories:', Object.keys(flatSettings));
    console.log('Sample performance settings:', flatSettings.performance);

    res.json({
      success: true,
      settings: flatSettings,  // Frontend expects 'settings'
      defaults: {},  // Can be populated with default values if needed
      dbCount: configs.length,
      data: {
        configs: configsByCategory,  // Keep for backwards compatibility
        invitations: {
          stats: invitationStats,
          recent: recentInvitations
        },
        metadata: {
          totalConfigs: configs.length,
          categories: Object.keys(configsByCategory)
        }
      }
    });
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings'
    });
  }
});

// @route   PUT /api/admin/settings/category/:category
// @desc    Update settings for a specific category
// @access  Private/Admin
router.put('/settings/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { configs } = req.body;
    
    const validCategories = ['general', 'email', 'security', 'features', 'limits'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category: ${category}`
      });
    }

    if (!configs || typeof configs !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration data'
      });
    }

    const updates = [];
    const errors = [];

    // Only update configs that belong to this category
    for (const [key, value] of Object.entries(configs)) {
      try {
        const existingConfig = await SiteConfig.findOne({ key, category });
        
        if (existingConfig) {
          const validatedValue = validateConfigValue(value, existingConfig.valueType);
          existingConfig.value = validatedValue;
          await existingConfig.save();
          updates.push({ key, value: validatedValue });
        }
      } catch (configError) {
        console.error(`Error updating config ${key}:`, configError);
        errors.push({ key, error: configError.message });
      }
    }

    // Get updated configs for this category
    const updatedConfigs = await SiteConfig.find({ category, isEditable: true });
    const categoryConfigs = {};
    
    for (const config of updatedConfigs) {
      const value = await SiteConfig.getValue(config.key);
      categoryConfigs[config.key] = {
        value,
        description: config.description,
        valueType: config.valueType,
        isPublic: config.isPublic,
        isEditable: config.isEditable
      };
    }

    res.json({
      success: true,
      message: `${category} settings updated successfully`,
      data: {
        category,
        configs: categoryConfigs,
        updated: updates,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (err) {
    console.error('Error updating category settings:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update category settings'
    });
  }
});

// @route   PUT /api/admin/settings
// @desc    Update system settings
// @access  Private/Admin
router.put('/settings', async (req, res) => {
  try {
    // Accept both 'settings' and 'configs' for backwards compatibility
    const configs = req.body.settings || req.body.configs;

    if (!configs || typeof configs !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration data'
      });
    }

    console.log('Updating settings:', Object.keys(configs).slice(0, 10), '...');

    const updates = [];
    const errors = [];

    // Flatten nested settings object before processing
    const flattenedConfigs = flattenObject(configs);
    console.log('Flattened configs:', flattenedConfigs);

    // Process each configuration update
    for (const [key, value] of Object.entries(flattenedConfigs)) {
      try {
        // Find existing config
        const existingConfig = await SiteConfig.findOne({ key });
        
        if (existingConfig) {
          console.log(`Updating existing config ${key}: ${existingConfig.value} -> ${value}`);
          
          // Validate value type
          const validatedValue = validateConfigValue(value, existingConfig.valueType);
          
          // Update existing config
          existingConfig.value = validatedValue;
          existingConfig.markModified('value'); // Important for Mixed types
          await existingConfig.save();
          updates.push({ key, value: validatedValue });
        } else {
          console.log(`Creating new config ${key} with value: ${value}`);
          
          // Create new config if it doesn't exist
          const newConfig = await SiteConfig.create({
            key,
            value,
            valueType: detectValueType(value),
            category: detectCategory(key),
            description: generateDescription(key),
            isPublic: false,
            isEditable: true
          });
          updates.push({ key, value: newConfig.value });
        }
      } catch (configError) {
        console.error(`Error updating config ${key}:`, configError);
        errors.push({ key, error: configError.message });
      }
    }

    // Return response with update summary
    if (errors.length > 0) {
      return res.status(207).json({ // 207 Multi-Status
        success: false,
        message: 'Some configurations could not be updated',
        data: {
          updated: updates,
          errors
        }
      });
    }

    // Get updated configuration for response
    const updatedConfigs = await SiteConfig.find({ isEditable: true });
    const configsByCategory = {
      general: {},
      email: {},
      security: {},
      notifications: {},
      regional: {},
      performance: {},
      features: {},
      limits: {}
    };

    for (const config of updatedConfigs) {
      const value = await SiteConfig.getValue(config.key);
      if (configsByCategory[config.category]) {
        configsByCategory[config.category][config.key] = {
          value,
          description: config.description,
          valueType: config.valueType,
          isPublic: config.isPublic,
          isEditable: config.isEditable
        };
      }
    }

    console.log(`Successfully updated ${updates.length} settings`);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        configs: configsByCategory,
        updated: updates
      }
    });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
});

// Helper function to validate configuration values
function validateConfigValue(value, valueType) {
  switch (valueType) {
    case 'boolean':
      return value === true || value === 'true' || value === 1 || value === '1';
    case 'number':
      const num = Number(value);
      if (isNaN(num)) throw new Error('Invalid number value');
      return num;
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) throw new Error('Invalid email format');
      return value;
    case 'url':
      try {
        new URL(value);
        return value;
      } catch {
        throw new Error('Invalid URL format');
      }
    case 'array':
      return Array.isArray(value) ? value : [value];
    case 'json':
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          throw new Error('Invalid JSON format');
        }
      }
      return value;
    case 'text':
    case 'textarea':
    case 'string':
    default:
      return String(value);
  }
}

// Helper functions for config management
function detectValueType(value) {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') {
    if (value.includes('@')) return 'email';
    if (value.startsWith('http://') || value.startsWith('https://')) return 'url';
    if (value.length > 100) return 'textarea';
    return 'text';
  }
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'json';
  return 'string';
}

function detectCategory(key) {
  if (key.includes('email') || key.includes('smtp') || key.includes('mail')) return 'email';
  if (key.includes('password') || key.includes('security') || key.includes('2fa') || key.includes('auth')) return 'security';
  if (key.includes('limit') || key.includes('max') || key.includes('rate')) return 'limits';
  if (key.includes('enable') || key.includes('_enabled') || key.includes('feature')) return 'features';
  return 'general';
}

function generateDescription(key) {
  // Convert snake_case to human readable
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/Va\b/g, 'VA')
    .replace(/Smtp/g, 'SMTP')
    .replace(/2fa/gi, '2FA')
    .replace(/Url/g, 'URL');
}

// @route   GET /api/admin/analytics
// @desc    Get comprehensive analytics data
// @access  Private/Admin
router.get('/analytics', async (req, res) => {
  const startTime = Date.now();
  console.log('[Analytics] Request received with timeRange:', req.query.timeRange);
  
  try {
    const { timeRange = '30' } = req.query;
    const days = parseInt(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    console.log(`[Analytics] Fetching data for last ${days} days`);

    // Platform Overview Stats
    const [
      totalUsers,
      totalVAs,
      totalBusinesses,
      newUsersToday,
      newVAsToday,
      newBusinessesToday
    ] = await Promise.all([
      User.countDocuments(),
      VA.countDocuments(),
      Business.countDocuments(),
      User.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      VA.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      Business.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      })
    ]);

    // Growth Trends - Optimized aggregation pipeline
    const growthPipeline = [
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ];

    // Execute all growth queries in parallel
    const [userGrowth, vaGrowth, businessGrowth] = await Promise.all([
      User.aggregate(growthPipeline),
      VA.aggregate(growthPipeline),
      Business.aggregate(growthPipeline)
    ]);

    // Create a date map for easier lookup
    const userGrowthMap = {};
    const vaGrowthMap = {};
    const businessGrowthMap = {};

    userGrowth.forEach(item => {
      userGrowthMap[item._id.date] = item.count;
    });
    vaGrowth.forEach(item => {
      vaGrowthMap[item._id.date] = item.count;
    });
    businessGrowth.forEach(item => {
      businessGrowthMap[item._id.date] = item.count;
    });

    // Build growth data array with all dates in range
    const growthData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      growthData.push({
        date: dateStr,
        users: userGrowthMap[dateStr] || 0,
        vas: vaGrowthMap[dateStr] || 0,
        businesses: businessGrowthMap[dateStr] || 0
      });
    }

    // VA Analytics
    const vaStatusDistribution = await VA.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const vaLocationDistribution = await VA.aggregate([
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const vaSkillsDistribution = await VA.aggregate([
      { $unwind: '$skills' },
      {
        $group: {
          _id: '$skills',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]);

    // Business Analytics
    const businessIndustryDistribution = await Business.aggregate([
      {
        $group: {
          _id: '$industry',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const businessSizeDistribution = await Business.aggregate([
      {
        $group: {
          _id: '$companySize',
          count: { $sum: 1 }
        }
      }
    ]);

    // User Activity Metrics
    const activeUsersLast7Days = await User.countDocuments({
      lastLoginAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const activeUsersLast30Days = await User.countDocuments({
      lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    // Profile Completion Rates
    const vaProfileCompletion = await VA.aggregate([
      {
        $project: {
          completionScore: {
            $add: [
              { $cond: [{ $ne: ['$name', null] }, 1, 0] },
              { $cond: [{ $ne: ['$bio', null] }, 1, 0] },
              { $cond: [{ $ne: ['$location', null] }, 1, 0] },
              { $cond: [{ $gt: [{ $size: { $ifNull: ['$skills', []] } }, 0] }, 1, 0] },
              { $cond: [{ $ne: ['$avatar', null] }, 1, 0] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgCompletion: { $avg: { $multiply: ['$completionScore', 20] } }
        }
      }
    ]);

    const businessProfileCompletion = await Business.aggregate([
      {
        $project: {
          completionScore: {
            $add: [
              { $cond: [{ $ne: ['$company', null] }, 1, 0] },
              { $cond: [{ $ne: ['$bio', null] }, 1, 0] },
              { $cond: [{ $ne: ['$industry', null] }, 1, 0] },
              { $cond: [{ $ne: ['$companySize', null] }, 1, 0] },
              { $cond: [{ $ne: ['$website', null] }, 1, 0] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgCompletion: { $avg: { $multiply: ['$completionScore', 20] } }
        }
      }
    ]);

    const executionTime = Date.now() - startTime;
    console.log(`[Analytics] Data fetched successfully in ${executionTime}ms`);
    
    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalVAs,
          totalBusinesses,
          newUsersToday,
          newVAsToday,
          newBusinessesToday,
          activeUsersLast7Days,
          activeUsersLast30Days
        },
        growth: growthData,
        vaAnalytics: {
          statusDistribution: vaStatusDistribution,
          locationDistribution: vaLocationDistribution,
          skillsDistribution: vaSkillsDistribution,
          profileCompletion: vaProfileCompletion[0]?.avgCompletion || 0
        },
        businessAnalytics: {
          industryDistribution: businessIndustryDistribution,
          sizeDistribution: businessSizeDistribution,
          profileCompletion: businessProfileCompletion[0]?.avgCompletion || 0
        }
      }
    });
  } catch (err) {
    const executionTime = Date.now() - startTime;
    console.error(`[Analytics] Error after ${executionTime}ms:`, err);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: err.message
    });
  }
});

// @route   GET /api/admin/vas
// @desc    Get all VAs for admin management
// @access  Private/Admin
router.get('/vas', async (req, res) => {
  try {
    // Get the max_vas_per_page setting from SiteConfig
    const defaultLimit = await SiteConfig.getValue('max_vas_per_page', 20);

    const {
      search,
      status,
      page = 1,
      limit = defaultLimit,
      sort = '-createdAt'
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [vas, total] = await Promise.all([
      VA.find(query)
        .populate('user', '_id email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      VA.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: vas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching VAs:', err);
    res.status(500).json({
      success: false,
      error: 'Server error fetching VAs'
    });
  }
});

// @route   PUT /api/admin/vas/:id
// @desc    Update VA status (admin only)
// @access  Private/Admin
router.put('/vas/:id', async (req, res) => {
  try {
    const va = await VA.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!va) {
      return res.status(404).json({
        success: false,
        error: 'VA not found'
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

// @route   DELETE /api/admin/vas/:id
// @desc    Delete VA (admin only)
// @access  Private/Admin
router.delete('/vas/:id', async (req, res) => {
  try {
    const va = await VA.findById(req.params.id);

    if (!va) {
      return res.status(404).json({
        success: false,
        error: 'VA not found'
      });
    }

    await VA.findByIdAndDelete(req.params.id);

    // Update user reference
    if (va.user) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(va.user, { $unset: { va: 1 } });
    }

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

// Import the new admin VA controller
const adminVAController = require('../controllers/adminVAController');
// Import the new admin Business controller
const adminBusinessController = require('../controllers/adminBusinessController');
// Import the admin billing controller
const adminBillingController = require('../controllers/adminBillingController');

// Comprehensive VA Profile Editing Routes
// @route   GET /api/admin/vas/:id/full
// @desc    Get complete VA profile for admin editing
// @access  Private/Admin
router.get('/vas/:id/full', adminVAController.getFullVAProfile);

// @route   PUT /api/admin/vas/:id/full
// @desc    Update any/all VA profile fields as admin
// @access  Private/Admin
router.put('/vas/:id/full', adminVAController.updateFullVAProfile);

// @route   POST /api/admin/vas/bulk-update
// @desc    Bulk update multiple VAs
// @access  Private/Admin
router.post('/vas/bulk-update', adminVAController.bulkUpdateVAs);

// @route   POST /api/admin/vas/:id/media
// @desc    Update VA media (avatar, cover, video)
// @access  Private/Admin
router.post('/vas/:id/media', uploadLimiter, adminVAController.updateVAMedia);

// @route   GET /api/admin/vas/:id/history
// @desc    Get VA edit history/audit log
// @access  Private/Admin
router.get('/vas/:id/history', adminVAController.getVAEditHistory);

// @route   POST /api/admin/vas/:id/toggle-featured
// @desc    Toggle VA featured status
// @access  Private/Admin
router.post('/vas/:id/toggle-featured', adminVAController.toggleVAFeatured);

// Comprehensive Business Profile Editing Routes
// @route   GET /api/admin/businesses/:id/full
// @desc    Get complete Business profile for admin editing
// @access  Private/Admin
router.get('/businesses/:id/full', adminBusinessController.getFullBusinessProfile);

// @route   PUT /api/admin/businesses/:id/full
// @desc    Update any/all Business profile fields as admin
// @access  Private/Admin
router.put('/businesses/:id/full', adminBusinessController.updateFullBusinessProfile);

// @route   POST /api/admin/businesses/bulk-update
// @desc    Bulk update multiple businesses
// @access  Private/Admin
router.post('/businesses/bulk-update', adminBusinessController.bulkUpdateBusinesses);

// @route   POST /api/admin/businesses/:id/media
// @desc    Update business media (avatar)
// @access  Private/Admin
router.post('/businesses/:id/media', uploadLimiter, adminBusinessController.updateBusinessMedia);

// @route   GET /api/admin/businesses/:id/history
// @desc    Get business edit history/audit log
// @access  Private/Admin
router.get('/businesses/:id/history', adminBusinessController.getBusinessEditHistory);

// @route   POST /api/admin/businesses/:id/toggle-featured
// @desc    Toggle business featured status
// @access  Private/Admin
router.post('/businesses/:id/toggle-featured', adminBusinessController.toggleBusinessFeatured);

// @route   GET /api/admin/businesses
// @desc    Get all businesses for admin management
// @access  Private/Admin
router.get('/businesses', async (req, res) => {
  try {
    const {
      search,
      status,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    const query = {};
    
    if (search) {
      query.$or = [
        { company: { $regex: search, $options: 'i' } },
        { contactName: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [businesses, total] = await Promise.all([
      Business.find(query)
        .populate('user', '_id email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Business.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: businesses,
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

// @route   PUT /api/admin/businesses/:id
// @desc    Update business status (admin only)
// @access  Private/Admin
router.put('/businesses/:id', async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    res.json({
      success: true,
      data: business
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/admin/businesses/:id
// @desc    Delete business (admin only)
// @access  Private/Admin
router.delete('/businesses/:id', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    await Business.findByIdAndDelete(req.params.id);

    // Update user reference
    if (business.user) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(business.user, { $unset: { business: 1 } });
    }

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

// @route   GET /api/admin/profile
// @desc    Get admin profile
// @access  Private/Admin
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -refreshToken -resetPasswordToken -confirmationToken')
      .populate('va')
      .populate('business')
      .populate('avatarFileId');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name || user.email,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        // Regional settings - use both old and new fields for compatibility
        timezone: user.preferences?.display?.timezone || user.location?.timezone || 'Asia/Manila',
        language: user.preferences?.display?.language || user.language || 'en',
        dateFormat: user.preferences?.display?.dateFormat || 'MM/DD/YYYY',
        timeFormat: user.preferences?.display?.timeFormat || '12h',
        emailNotifications: user.emailNotifications !== false,
        pushNotifications: user.pushNotifications !== false,
        twoFactorEnabled: user.twoFactorEnabled || false,
        avatar: user.avatar,
        role: 'admin',
        admin: true,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile'
    });
  }
});

// @route   PUT /api/admin/profile
// @desc    Update admin profile
// @access  Private/Admin
router.put('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update allowed fields
    const allowedFields = [
      'name', 'phone', 'bio', 
      'emailNotifications', 'pushNotifications', 'twoFactorEnabled'
    ];

    // Handle regional settings separately
    const regionalFields = ['timezone', 'language', 'dateFormat', 'timeFormat'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    // Update regional settings in preferences.display
    if (!user.preferences) {
      user.preferences = {
        notifications: {},
        privacy: {},
        display: {}
      };
    }
    if (!user.preferences.display) {
      user.preferences.display = {};
    }

    regionalFields.forEach(field => {
      if (req.body[field] !== undefined) {
        // Update in preferences.display for new structure
        user.preferences.display[field] = req.body[field];
        
        // Also update location.timezone for backwards compatibility
        if (field === 'timezone') {
          if (!user.location) {
            user.location = {};
          }
          user.location.timezone = req.body[field];
        }
      }
    });

    // Update stats
    user.stats.lastActive = new Date();

    // Mark nested objects as modified for Mongoose
    user.markModified('preferences');
    user.markModified('location');

    await user.save();

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name || user.email,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        // Return regional settings
        timezone: user.preferences?.display?.timezone || user.location?.timezone || 'Asia/Manila',
        language: user.preferences?.display?.language || user.language || 'en',
        dateFormat: user.preferences?.display?.dateFormat || 'MM/DD/YYYY',
        timeFormat: user.preferences?.display?.timeFormat || '12h',
        emailNotifications: user.emailNotifications !== false,
        pushNotifications: user.pushNotifications !== false,
        twoFactorEnabled: user.twoFactorEnabled || false,
        avatar: user.avatar,
        role: 'admin',
        admin: true,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// @route   POST /api/admin/profile/avatar
// @desc    Upload admin profile picture
// @access  Private/Admin
router.post('/profile/avatar', uploadLimiter, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // For now, create a simple local file upload solution
    // This will be replaced with Supabase when properly configured
    const multer = require('multer');
    const path = require('path');
    const fs = require('fs');

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Configure multer for local storage
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadsDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
      }
    });

    const upload = multer({
      storage: storage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'));
        }
      }
    });

    // Handle the upload
    upload.single('avatar')(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({
          success: false,
          error: err.message || 'Upload failed'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      try {
        // Create local file URL
        const fileUrl = `${process.env.SERVER_URL || 'http://localhost:8000'}/uploads/avatars/${req.file.filename}`;

        // Delete old avatar file if exists
        if (user.avatar && user.avatar.includes('/uploads/avatars/')) {
          const oldFileName = path.basename(user.avatar);
          const oldFilePath = path.join(uploadsDir, oldFileName);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }

        // Update user profile
        user.avatar = fileUrl;
        await user.save();

        res.json({
          success: true,
          data: {
            avatar: fileUrl,
            message: 'Avatar updated successfully'
          }
        });
      } catch (error) {
        console.error('Database update error:', error);

        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
          success: false,
          error: 'Failed to update profile'
        });
      }
    });

  } catch (error) {
    console.error('Admin avatar upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload avatar'
    });
  }
});

// ==========================================
// BILLING MANAGEMENT ROUTES
// ==========================================

// @route   GET /api/admin/billing/overview
// @desc    Get billing overview for all businesses
// @access  Private/Admin
router.get('/billing/overview', adminBillingController.getBillingOverview);

// @route   GET /api/admin/businesses/:businessId/billing
// @desc    Get billing information for a specific business
// @access  Private/Admin
router.get('/businesses/:businessId/billing', adminBillingController.getBusinessBilling);

// @route   PUT /api/admin/businesses/:businessId/billing
// @desc    Update billing information for a business
// @access  Private/Admin
router.put('/businesses/:businessId/billing', adminBillingController.updateBusinessBilling);

// @route   GET /api/admin/businesses/:businessId/billing/history
// @desc    Get billing history for a business
// @access  Private/Admin
router.get('/businesses/:businessId/billing/history', adminBillingController.getBillingHistory);

// @route   POST /api/admin/businesses/:businessId/billing/charge
// @desc    Add a manual charge/payment for a business
// @access  Private/Admin
router.post('/businesses/:businessId/billing/charge', adminBillingController.addManualCharge);

// @route   POST /api/admin/billing/history/:transactionId/refund
// @desc    Process a refund for a transaction
// @access  Private/Admin
router.post('/billing/history/:transactionId/refund', adminBillingController.processRefund);

// @route   GET /api/admin/businesses/:businessId/billing/export
// @desc    Export billing data for a business
// @access  Private/Admin
router.get('/businesses/:businessId/billing/export', adminBillingController.exportBillingData);

// @route   POST /api/admin/settings/validate-sendgrid
// @desc    Validate SendGrid API credentials and fetch account info
// @access  Private/Admin
router.post('/settings/validate-sendgrid', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey || !apiKey.startsWith('SG.')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid SendGrid API key format'
      });
    }

    // Validate API key by making requests to SendGrid API
    const sgMail = require('@sendgrid/mail');
    const https = require('https');
    
    // Set the API key
    sgMail.setApiKey(apiKey);
    
    // Function to make SendGrid API requests
    const makeRequest = (endpoint, method = 'GET') => {
      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'api.sendgrid.com',
          port: 443,
          path: endpoint,
          method: method,
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve(result);
              } else {
                reject(new Error(result.errors?.[0]?.message || `HTTP ${res.statusCode}`));
              }
            } catch (error) {
              reject(new Error('Invalid JSON response'));
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.end();
      });
    };

    try {
      // Test API key validity and get user info
      const userInfo = await makeRequest('/v3/user/account');
      
      // Get sender identities
      const senderIdentities = await makeRequest('/v3/verified_senders');
      
      // Get domain authentication status
      let domainAuthenticated = false;
      try {
        const domains = await makeRequest('/v3/whitelabel/domains');
        domainAuthenticated = domains.some(domain => domain.valid === true);
      } catch (error) {
        // Domain authentication might not be available for all account types
        console.log('Could not fetch domain authentication:', error.message);
      }

      // Validate by sending a test request to SendGrid API
      const validationResult = {
        success: true,
        accountType: userInfo.type || 'free',
        username: userInfo.username,
        senderIdentities: senderIdentities || [],
        domainAuthenticated,
        apiKeyValid: true,
        reputation: userInfo.reputation || null
      };

      res.json({
        success: true,
        message: 'SendGrid credentials validated successfully',
        ...validationResult
      });

    } catch (sgError) {
      console.error('SendGrid validation error:', sgError);
      
      let errorMessage = 'Failed to validate SendGrid credentials';
      if (sgError.message.includes('Unauthorized')) {
        errorMessage = 'Invalid SendGrid API key';
      } else if (sgError.message.includes('Forbidden')) {
        errorMessage = 'SendGrid API key does not have sufficient permissions';
      } else if (sgError.message.includes('Not Found')) {
        errorMessage = 'SendGrid API endpoint not found';
      }
      
      res.status(400).json({
        success: false,
        error: errorMessage,
        details: sgError.message
      });
    }

  } catch (error) {
    console.error('SendGrid validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during SendGrid validation'
    });
  }
});

// @route   POST /api/admin/settings/test-sender
// @desc    Test individual SendGrid sender address verification
// @access  Private/Admin
router.post('/settings/test-sender', async (req, res) => {
  try {
    const { apiKey, senderEmail } = req.body;
    
    if (!apiKey || !senderEmail) {
      return res.status(400).json({
        success: false,
        error: 'API key and sender email are required'
      });
    }

    const https = require('https');
    
    // Function to make SendGrid API requests
    const makeRequest = (endpoint, method = 'GET') => {
      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'api.sendgrid.com',
          port: 443,
          path: endpoint,
          method: method,
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve(result);
              } else {
                reject(new Error(result.errors?.[0]?.message || `HTTP ${res.statusCode}`));
              }
            } catch (error) {
              reject(new Error('Invalid JSON response'));
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.end();
      });
    };

    try {
      // Get verified senders from SendGrid
      const senderIdentities = await makeRequest('/v3/verified_senders');
      
      // Check if the specific email is verified
      const isVerified = senderIdentities.some(sender =>
        sender.email === senderEmail && sender.verified === true
      );
      
      res.json({
        success: true,
        verified: isVerified,
        email: senderEmail,
        message: isVerified
          ? `${senderEmail} is verified and ready to use`
          : `${senderEmail} is not verified in your SendGrid account`
      });

    } catch (sgError) {
      console.error('SendGrid sender test error:', sgError);
      
      let errorMessage = 'Failed to test sender address';
      if (sgError.message.includes('Unauthorized')) {
        errorMessage = 'Invalid SendGrid API key';
      } else if (sgError.message.includes('Forbidden')) {
        errorMessage = 'SendGrid API key does not have sufficient permissions';
      }
      
      res.status(400).json({
        success: false,
        verified: false,
        error: errorMessage,
        details: sgError.message
      });
    }

  } catch (error) {
    console.error('Sender test error:', error);
    res.status(500).json({
      success: false,
      verified: false,
      error: 'Server error during sender test'
    });
  }
});

module.exports = router;