/**
 * Examples of how to use the real-time notification system
 * These examples show how to integrate notifications into various parts of the application
 */

// ============================================
// EXAMPLE 1: Creating notifications in route handlers
// ============================================

// In any route handler after the notification middleware is applied:
router.post('/api/some-action', protect, async (req, res) => {
  try {
    // Perform your action...
    const result = await someBusinessLogic();
    
    // Create a notification using the helper attached by middleware
    await req.createNotification({
      recipient: targetUserId,
      type: 'new_message',
      params: {
        title: 'New Message',
        message: 'You have received a new message',
        senderId: req.user._id,
        conversationId: result.conversationId
      },
      actionUrl: `/conversations/${result.conversationId}`
    });
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// EXAMPLE 2: Creating admin notifications
// ============================================

router.post('/api/report-issue', protect, async (req, res) => {
  try {
    const { title, description } = req.body;
    
    // Create issue in database
    const issue = await Issue.create({
      reportedBy: req.user._id,
      title,
      description
    });
    
    // Notify all admins
    await req.createAdminNotification(
      'New Issue Reported',
      `User ${req.user.email} reported: ${title}`,
      'admin_notification',
      'high'
    );
    
    res.json({ success: true, data: issue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// EXAMPLE 3: System-wide announcements
// ============================================

router.post('/api/admin/maintenance', protect, authorize('admin'), async (req, res) => {
  try {
    const { startTime, endTime, description } = req.body;
    
    // Create system announcement for all users
    await req.createSystemAnnouncement(
      'Scheduled Maintenance',
      `System maintenance scheduled from ${startTime} to ${endTime}. ${description}`
    );
    
    res.json({ 
      success: true, 
      message: 'Maintenance announcement sent to all users' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// EXAMPLE 4: Direct Socket.io usage (without middleware)
// ============================================

const { createNotificationWithSocket } = require('../utils/notificationHelper');

async function notifyUserDirectly(userId, message, io) {
  try {
    await createNotificationWithSocket({
      recipient: userId,
      type: 'system_announcement',
      params: {
        title: 'Important Update',
        message: message,
        priority: 'high'
      }
    }, io);
  } catch (error) {
    console.error('Failed to notify user:', error);
  }
}

// ============================================
// EXAMPLE 5: Batch notifications for multiple users
// ============================================

const { broadcastNotification } = require('../utils/notificationHelper');

router.post('/api/admin/campaign', protect, authorize('admin'), async (req, res) => {
  try {
    const { userIds, campaignMessage } = req.body;
    const io = req.app.get('io');
    
    // Send notification to multiple users at once
    const notifications = await broadcastNotification(
      userIds,
      {
        type: 'marketing',
        params: {
          title: 'Special Offer',
          message: campaignMessage,
          priority: 'low',
          campaignId: req.body.campaignId
        }
      },
      io
    );
    
    res.json({ 
      success: true, 
      notificationsSent: notifications.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// EXAMPLE 6: Notification with database triggers
// ============================================

// In a Mongoose post-save hook:
const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: String,
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' }
});

messageSchema.post('save', async function(doc) {
  try {
    // Get Socket.io instance (you'd need to make this accessible)
    const io = global.io || require('../server').io;
    
    // Create notification for new message
    await createNotificationWithSocket({
      recipient: doc.recipient,
      type: 'new_message',
      params: {
        title: 'New Message',
        message: `You have a new message from ${doc.sender.name}`,
        senderId: doc.sender,
        messagePreview: doc.content.substring(0, 50)
      },
      message: doc._id,
      conversation: doc.conversation,
      actionUrl: `/conversations/${doc.conversation}`
    }, io);
  } catch (error) {
    console.error('Failed to create message notification:', error);
  }
});

// ============================================
// EXAMPLE 7: Scheduled notifications
// ============================================

const schedule = require('node-schedule');

// Schedule daily summary notifications
schedule.scheduleJob('0 9 * * *', async function() {
  try {
    const io = global.io;
    const User = require('../models/User');
    
    // Get all active users
    const users = await User.find({ 
      suspended: false,
      'preferences.dailySummary': true 
    });
    
    for (const user of users) {
      // Calculate user's daily stats
      const stats = await calculateDailyStats(user._id);
      
      await createNotificationWithSocket({
        recipient: user._id,
        type: 'daily_summary',
        params: {
          title: 'Your Daily Summary',
          message: `You have ${stats.unreadMessages} unread messages and ${stats.pendingTasks} pending tasks`,
          stats: stats
        }
      }, io);
    }
    
    console.log(`Sent daily summaries to ${users.length} users`);
  } catch (error) {
    console.error('Failed to send daily summaries:', error);
  }
});

// ============================================
// EXAMPLE 8: Conditional notifications based on user preferences
// ============================================

async function sendNotificationIfEnabled(userId, notificationType, notificationData, io) {
  try {
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    // Check user's notification preferences
    const preferences = user.preferences?.notifications || {};
    
    // Map notification types to preference settings
    const preferenceMap = {
      'new_message': preferences.messages !== false,
      'profile_view': preferences.profileViews !== false,
      'system_announcement': preferences.systemAnnouncements !== false,
      'marketing': preferences.marketing === true // Opt-in for marketing
    };
    
    // Only send if user has this type enabled
    if (preferenceMap[notificationType] !== false) {
      await createNotificationWithSocket({
        recipient: userId,
        type: notificationType,
        ...notificationData
      }, io);
    }
  } catch (error) {
    console.error('Failed to send conditional notification:', error);
  }
}

// ============================================
// EXAMPLE 9: Error handling and fallback
// ============================================

async function safeCreateNotification(params, io) {
  try {
    return await createNotificationWithSocket(params, io);
  } catch (error) {
    console.error('Failed to create real-time notification:', error);
    
    // Fallback: Create notification without Socket.io
    try {
      const Notification = require('../models/Notification');
      return await Notification.create(params);
    } catch (fallbackError) {
      console.error('Fallback notification creation also failed:', fallbackError);
      // Log to error tracking service
      // Sentry.captureException(fallbackError);
    }
  }
}

// ============================================
// EXAMPLE 10: Testing notifications in development
// ============================================

if (process.env.NODE_ENV === 'development') {
  router.post('/api/test/notification', protect, async (req, res) => {
    try {
      const { type = 'test', title = 'Test Notification', message = 'This is a test' } = req.body;
      
      await req.createNotification({
        recipient: req.user._id,
        type,
        params: {
          title,
          message,
          priority: 'low',
          testMode: true
        }
      });
      
      res.json({ 
        success: true, 
        message: 'Test notification sent',
        userId: req.user._id
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = {
  // Export useful functions for other modules
  notifyUserDirectly,
  sendNotificationIfEnabled,
  safeCreateNotification
};