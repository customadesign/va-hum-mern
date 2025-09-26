const Notification = require('../models/Notification');
const User = require('../models/User');
const VA = require('../models/VA');
const Business = require('../models/Business');
const { sendEmail } = require('../utils/email');
const { createNotificationWithSocket, broadcastNotification } = require('../utils/notificationHelper');

// Notification types that admins can control
const ADMIN_NOTIFICATION_TYPES = {
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
  MAINTENANCE: 'maintenance',
  FEATURE_UPDATE: 'feature_update',
  SECURITY_ALERT: 'security_alert',
  POLICY_UPDATE: 'policy_update',
  MARKETING: 'marketing',
  SURVEY: 'survey',
  REMINDER: 'reminder'
};

// Notification priority levels
const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Send notification to specific users
 */
exports.sendTargetedNotification = async (req, res) => {
  try {
    const {
      userIds,
      title,
      message,
      type = ADMIN_NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
      priority = PRIORITY_LEVELS.MEDIUM,
      data = {},
      sendEmailNotification = false
    } = req.body;

    if (!userIds || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No users specified'
      });
    }

    const notifications = [];
    const emailPromises = [];

    // Get Socket.io instance from Express app
    const io = req.app.get('io');
    
    for (const userId of userIds) {
      const notification = await createNotificationWithSocket({
        recipient: userId,
        type,
        params: {
          title,
          message,
          priority,
          ...data,
          sentBy: req.user._id,
          sentAt: new Date()
        }
      }, io);
      notifications.push(notification);

      // Send email notification if requested
      if (sendEmailNotification) {
        const user = await User.findById(userId);
        if (user && user.email) {
          emailPromises.push(
            sendEmail({
              to: user.email,
              subject: title,
              html: `
                <h2>${title}</h2>
                <p>${message}</p>
                <p>Priority: ${priority}</p>
                <p>Login to your account to view more details.</p>
              `
            })
          );
        }
      }
    }

    // Send emails in parallel
    if (emailPromises.length > 0) {
      await Promise.allSettled(emailPromises);
    }

    res.json({
      success: true,
      message: `Notification sent to ${notifications.length} users`,
      notifications: notifications.map(n => ({
        id: n._id,
        recipient: n.recipient,
        status: n.status
      }))
    });
  } catch (error) {
    console.error('Send targeted notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notifications'
    });
  }
};

/**
 * Send broadcast notification to all users or specific groups
 */
exports.sendBroadcastNotification = async (req, res) => {
  try {
    const {
      targetGroup = 'all', // all, vas, businesses, admins
      title,
      message,
      type = ADMIN_NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
      priority = PRIORITY_LEVELS.MEDIUM,
      data = {},
      sendEmailNotification = false,
      filters = {}
    } = req.body;

    let users = [];

    // Get target users based on group
    switch (targetGroup) {
      case 'all':
        users = await User.find({ suspended: false });
        break;
      
      case 'vas':
        const vaQuery = {};
        if (filters.searchStatus) {
          vaQuery.searchStatus = filters.searchStatus;
        }
        if (filters.status) {
          vaQuery.status = filters.status;
        }
        const vas = await VA.find(vaQuery).populate('user');
        users = vas.map(va => va.user);
        break;
      
      case 'businesses':
        const businessQuery = {};
        if (filters.industry) {
          businessQuery.industry = filters.industry;
        }
        if (filters.companySize) {
          businessQuery.companySize = filters.companySize;
        }
        const businesses = await Business.find(businessQuery).populate('user');
        users = businesses.map(b => b.user);
        break;
      
      case 'admins':
        users = await User.find({ admin: true, suspended: false });
        break;
      
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid target group'
        });
    }

    const notifications = [];
    const emailPromises = [];

    // Get Socket.io instance from Express app
    const io = req.app.get('io');
    
    // Create notifications for all users
    for (const user of users) {
      if (!user || !user._id) continue;

      const notification = await createNotificationWithSocket({
        recipient: user._id,
        type,
        params: {
          title,
          message,
          priority,
          ...data,
          sentBy: req.user._id,
          sentAt: new Date(),
          broadcast: true,
          targetGroup
        }
      }, io);
      notifications.push(notification);

      // Send email notification if requested and user has email notifications enabled
      if (sendEmailNotification && user.email) {
        // Check user preferences
        const userPreferences = user.preferences?.notifications?.email;
        if (userPreferences?.systemAnnouncements !== false) {
          emailPromises.push(
            sendEmail({
              to: user.email,
              subject: title,
              html: `
                <h2>${title}</h2>
                <p>${message}</p>
                <p>Priority: ${priority}</p>
                <hr>
                <p>This is a ${targetGroup === 'all' ? 'system-wide' : targetGroup} notification.</p>
                <p>Login to your account to manage your notification preferences.</p>
              `
            })
          );
        }
      }
    }

    // Send emails in parallel (batch to avoid overwhelming email service)
    const batchSize = 50;
    for (let i = 0; i < emailPromises.length; i += batchSize) {
      const batch = emailPromises.slice(i, i + batchSize);
      await Promise.allSettled(batch);
    }

    res.json({
      success: true,
      message: `Broadcast sent to ${notifications.length} users`,
      summary: {
        totalRecipients: notifications.length,
        targetGroup,
        emailsSent: emailPromises.length,
        priority,
        type
      }
    });
  } catch (error) {
    console.error('Send broadcast notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send broadcast notification'
    });
  }
};

/**
 * Schedule a notification for future delivery
 */
exports.scheduleNotification = async (req, res) => {
  try {
    const {
      scheduledFor,
      targetUsers = [],
      targetGroup,
      title,
      message,
      type = ADMIN_NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
      priority = PRIORITY_LEVELS.MEDIUM,
      data = {},
      sendEmailNotification = false
    } = req.body;

    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Scheduled date must be in the future'
      });
    }

    // Create scheduled notification record
    const scheduledNotification = {
      scheduledFor: scheduledDate,
      targetUsers,
      targetGroup,
      title,
      message,
      type,
      priority,
      data,
      sendEmailNotification,
      createdBy: req.user._id,
      status: 'scheduled'
    };

    // In production, you would save this to a ScheduledNotification model
    // and have a cron job or task queue process it
    
    res.json({
      success: true,
      message: 'Notification scheduled successfully',
      scheduledNotification: {
        ...scheduledNotification,
        id: new Date().getTime() // Temporary ID
      }
    });
  } catch (error) {
    console.error('Schedule notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule notification'
    });
  }
};

/**
 * Get notification templates
 */
exports.getNotificationTemplates = async (req, res) => {
  try {
    // Predefined templates for common notifications
    const templates = [
      {
        id: 'maintenance',
        name: 'System Maintenance',
        type: ADMIN_NOTIFICATION_TYPES.MAINTENANCE,
        priority: PRIORITY_LEVELS.HIGH,
        title: 'Scheduled System Maintenance',
        message: 'Our platform will undergo scheduled maintenance on [DATE] from [START_TIME] to [END_TIME]. During this time, the service may be temporarily unavailable. We apologize for any inconvenience.',
        variables: ['DATE', 'START_TIME', 'END_TIME']
      },
      {
        id: 'feature_update',
        name: 'New Feature Announcement',
        type: ADMIN_NOTIFICATION_TYPES.FEATURE_UPDATE,
        priority: PRIORITY_LEVELS.MEDIUM,
        title: 'Exciting New Feature: [FEATURE_NAME]',
        message: 'We are thrilled to announce the launch of [FEATURE_NAME]! This new feature will [FEATURE_BENEFITS]. Start using it today by [ACTION_STEPS].',
        variables: ['FEATURE_NAME', 'FEATURE_BENEFITS', 'ACTION_STEPS']
      },
      {
        id: 'security_alert',
        name: 'Security Alert',
        type: ADMIN_NOTIFICATION_TYPES.SECURITY_ALERT,
        priority: PRIORITY_LEVELS.CRITICAL,
        title: 'Important Security Update Required',
        message: 'We have identified a security concern that requires your immediate attention. Please [REQUIRED_ACTION] to ensure your account remains secure.',
        variables: ['REQUIRED_ACTION']
      },
      {
        id: 'policy_update',
        name: 'Policy Update',
        type: ADMIN_NOTIFICATION_TYPES.POLICY_UPDATE,
        priority: PRIORITY_LEVELS.MEDIUM,
        title: 'Updates to Our [POLICY_TYPE]',
        message: 'We have updated our [POLICY_TYPE] effective [EFFECTIVE_DATE]. The key changes include: [KEY_CHANGES]. Please review the full policy at [POLICY_URL].',
        variables: ['POLICY_TYPE', 'EFFECTIVE_DATE', 'KEY_CHANGES', 'POLICY_URL']
      },
      {
        id: 'survey_request',
        name: 'Survey Request',
        type: ADMIN_NOTIFICATION_TYPES.SURVEY,
        priority: PRIORITY_LEVELS.LOW,
        title: 'We Value Your Feedback!',
        message: 'Help us improve by taking our [SURVEY_DURATION] minute survey about [SURVEY_TOPIC]. Your feedback is invaluable in shaping the future of our platform. [SURVEY_LINK]',
        variables: ['SURVEY_DURATION', 'SURVEY_TOPIC', 'SURVEY_LINK']
      }
    ];

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Get notification templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve notification templates'
    });
  }
};

/**
 * Get notification statistics
 */
exports.getNotificationStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    const query = dateFilter.$gte || dateFilter.$lte ? { createdAt: dateFilter } : {};

    const [
      totalNotifications,
      readNotifications,
      unreadNotifications,
      byType,
      byPriority
    ] = await Promise.all([
      Notification.countDocuments(query),
      Notification.countDocuments({ ...query, status: 'read' }),
      Notification.countDocuments({ ...query, status: 'unread' }),
      Notification.aggregate([
        { $match: query },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Notification.aggregate([
        { $match: query },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ])
    ]);

    // Calculate read rate
    const readRate = totalNotifications > 0 
      ? ((readNotifications / totalNotifications) * 100).toFixed(2)
      : 0;

    // Get recent notification activity
    const recentNotifications = await Notification.find(query)
      .sort('-createdAt')
      .limit(10)
      .populate('recipient', 'email')
      .select('title type priority status createdAt');

    res.json({
      success: true,
      stats: {
        total: totalNotifications,
        read: readNotifications,
        unread: unreadNotifications,
        readRate: `${readRate}%`,
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byPriority: byPriority.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentNotifications
      }
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve notification statistics'
    });
  }
};

/**
 * Delete notifications
 */
exports.deleteNotifications = async (req, res) => {
  try {
    const { notificationIds, deleteAll, olderThan } = req.body;

    let result;

    if (deleteAll) {
      // Delete all notifications (be careful!)
      result = await Notification.deleteMany({});
    } else if (olderThan) {
      // Delete notifications older than specified date
      const date = new Date(olderThan);
      result = await Notification.deleteMany({ createdAt: { $lt: date } });
    } else if (notificationIds && notificationIds.length > 0) {
      // Delete specific notifications
      result = await Notification.deleteMany({ _id: { $in: notificationIds } });
    } else {
      return res.status(400).json({
        success: false,
        error: 'No deletion criteria specified'
      });
    }

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} notifications`
    });
  } catch (error) {
    console.error('Delete notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notifications'
    });
  }
};

/**
 * Update notification settings for users
 */
exports.updateUserNotificationSettings = async (req, res) => {
  try {
    const { userIds, settings } = req.body;

    if (!userIds || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No users specified'
      });
    }

    const updatePromises = userIds.map(userId =>
      User.findByIdAndUpdate(
        userId,
        {
          $set: {
            'preferences.notifications': settings
          }
        },
        { new: true }
      )
    );

    const updatedUsers = await Promise.all(updatePromises);

    res.json({
      success: true,
      message: `Updated notification settings for ${updatedUsers.length} users`,
      updatedUsers: updatedUsers.map(u => ({
        id: u._id,
        email: u.email,
        notifications: u.preferences?.notifications
      }))
    });
  } catch (error) {
    console.error('Update user notification settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification settings'
    });
  }
};

/**
 * Get archived notifications statistics for admin
 */
exports.getArchivedStats = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    const query = { archived: true };
    if (dateFilter.$gte || dateFilter.$lte) {
      query.archivedAt = dateFilter;
    }
    if (userId) {
      query.recipient = userId;
    }

    const [
      totalArchived,
      archivedByType,
      archivedByUser,
      recentlyArchived
    ] = await Promise.all([
      Notification.countDocuments(query),
      Notification.aggregate([
        { $match: query },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Notification.aggregate([
        { $match: query },
        { $group: { _id: '$recipient', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }},
        { $unwind: '$user' },
        { $project: {
          count: 1,
          email: '$user.email'
        }}
      ]),
      Notification.find(query)
        .sort('-archivedAt')
        .limit(10)
        .populate('recipient', 'email')
        .select('type archivedAt createdAt recipient')
    ]);

    res.json({
      success: true,
      stats: {
        totalArchived,
        byType: archivedByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        topUsersByArchived: archivedByUser,
        recentlyArchived
      }
    });
  } catch (error) {
    console.error('Get archived stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve archived statistics'
    });
  }
};

/**
 * Bulk archive notifications for admin
 */
exports.bulkArchiveNotifications = async (req, res) => {
  try {
    const { criteria } = req.body;
    
    if (!criteria) {
      return res.status(400).json({
        success: false,
        error: 'Archive criteria required'
      });
    }

    const query = { archived: false };

    // Build query based on criteria
    if (criteria.olderThan) {
      query.createdAt = { $lt: new Date(criteria.olderThan) };
    }
    if (criteria.type) {
      query.type = criteria.type;
    }
    if (criteria.read === true) {
      query.readAt = { $ne: null };
    }
    if (criteria.userId) {
      query.recipient = criteria.userId;
    }

    const result = await Notification.updateMany(
      query,
      {
        archived: true,
        archivedAt: new Date()
      }
    );

    res.json({
      success: true,
      message: `Archived ${result.modifiedCount} notifications`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk archive error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk archive notifications'
    });
  }
};

/**
 * Restore archived notifications for admin
 */
exports.restoreArchivedNotifications = async (req, res) => {
  try {
    const { notificationIds, criteria } = req.body;
    
    let result;

    if (notificationIds && notificationIds.length > 0) {
      result = await Notification.updateMany(
        { _id: { $in: notificationIds }, archived: true },
        {
          archived: false,
          $unset: { archivedAt: 1 }
        }
      );
    } else if (criteria) {
      const query = { archived: true };
      
      if (criteria.archivedAfter) {
        query.archivedAt = { $gte: new Date(criteria.archivedAfter) };
      }
      if (criteria.type) {
        query.type = criteria.type;
      }
      if (criteria.userId) {
        query.recipient = criteria.userId;
      }

      result = await Notification.updateMany(
        query,
        {
          archived: false,
          $unset: { archivedAt: 1 }
        }
      );
    } else {
      return res.status(400).json({
        success: false,
        error: 'No restoration criteria specified'
      });
    }

    res.json({
      success: true,
      message: `Restored ${result.modifiedCount} notifications`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Restore archived error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restore archived notifications'
    });
  }
};

module.exports = exports;