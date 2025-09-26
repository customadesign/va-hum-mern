const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create a notification and emit Socket.io event
 * @param {Object} params - Notification parameters
 * @param {String} params.recipient - Recipient user ID
 * @param {String} params.type - Notification type
 * @param {Object} params.params - Additional notification parameters
 * @param {String} params.actionUrl - Optional action URL
 * @param {Object} params.message - Optional message reference
 * @param {Object} params.conversation - Optional conversation reference
 * @param {Object} io - Socket.io instance
 * @returns {Promise<Object>} Created notification
 */
async function createNotificationWithSocket(params, io) {
  try {
    // Create the notification in database
    const notification = await Notification.create(params);
    
    // Populate necessary fields for the frontend
    const populatedNotification = await Notification.findById(notification._id)
      .populate('message')
      .populate('conversation')
      .populate('viewer')
      .populate('referral')
      .lean();

    // Add computed fields that frontend expects
    populatedNotification.isRead = !!populatedNotification.readAt;
    populatedNotification.title = getNotificationTitle(populatedNotification.type);
    
    // Emit to the specific user's room
    if (io) {
      // Emit to user's specific room
      io.to(params.recipient.toString()).emit('new-notification', {
        notification: populatedNotification,
        unreadCount: await Notification.getUnreadCount(params.recipient)
      });
      
      // Also emit to admin rooms if recipient is an admin
      const recipientUser = await User.findById(params.recipient);
      if (recipientUser && recipientUser.admin) {
        io.to('admin-notifications').emit('new-notification', {
          notification: populatedNotification,
          unreadCount: await Notification.getUnreadCount(params.recipient)
        });
      }
    }
    
    return populatedNotification;
  } catch (error) {
    console.error('Error creating notification with socket:', error);
    throw error;
  }
}

/**
 * Mark notifications as read and emit Socket.io event
 * @param {Array|String} notificationIds - Notification ID(s) to mark as read
 * @param {String} userId - User ID
 * @param {Object} io - Socket.io instance
 * @returns {Promise<Object>} Update result
 */
async function markNotificationsAsReadWithSocket(notificationIds, userId, io) {
  try {
    const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
    
    // Update notifications
    const result = await Notification.updateMany(
      {
        _id: { $in: ids },
        recipient: userId,
        readAt: null
      },
      {
        readAt: new Date()
      }
    );
    
    // Get updated unread count
    const unreadCount = await Notification.getUnreadCount(userId);
    
    // Emit socket event
    if (io) {
      io.to(userId.toString()).emit('notification-read', {
        notificationIds: ids,
        unreadCount
      });
      
      // Also emit to admin room if user is admin
      const user = await User.findById(userId);
      if (user && user.admin) {
        io.to('admin-notifications').emit('notification-read', {
          notificationIds: ids,
          unreadCount
        });
      }
    }
    
    return { result, unreadCount };
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 * @param {String} userId - User ID
 * @param {Object} io - Socket.io instance
 * @returns {Promise<Object>} Update result
 */
async function markAllNotificationsAsReadWithSocket(userId, io) {
  try {
    // Get all unread notification IDs for the socket event
    const unreadNotifications = await Notification.find({
      recipient: userId,
      readAt: null
    }).select('_id');
    
    const notificationIds = unreadNotifications.map(n => n._id);
    
    // Update all notifications
    const result = await Notification.updateMany(
      {
        recipient: userId,
        readAt: null
      },
      {
        readAt: new Date()
      }
    );
    
    // Emit socket event
    if (io) {
      io.to(userId.toString()).emit('all-notifications-read', {
        notificationIds,
        unreadCount: 0
      });
      
      // Also emit to admin room if user is admin
      const user = await User.findById(userId);
      if (user && user.admin) {
        io.to('admin-notifications').emit('all-notifications-read', {
          notificationIds,
          unreadCount: 0
        });
      }
    }
    
    return { result, notificationIds };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Broadcast notification to multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {Object} notificationData - Notification data
 * @param {Object} io - Socket.io instance
 * @returns {Promise<Array>} Created notifications
 */
async function broadcastNotification(userIds, notificationData, io) {
  try {
    const notifications = [];
    
    for (const userId of userIds) {
      const notification = await createNotificationWithSocket({
        ...notificationData,
        recipient: userId
      }, io);
      notifications.push(notification);
    }
    
    return notifications;
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    throw error;
  }
}

/**
 * Get notification title based on type
 * @param {String} type - Notification type
 * @returns {String} Notification title
 */
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

/**
 * Delete notification and emit Socket.io event
 * @param {String} notificationId - Notification ID to delete
 * @param {String} userId - User ID
 * @param {Object} io - Socket.io instance
 * @returns {Promise<Object>} Delete result
 */
async function deleteNotificationWithSocket(notificationId, userId, io) {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });
    
    if (!notification) {
      throw new Error('Notification not found or unauthorized');
    }
    
    // Get updated unread count
    const unreadCount = await Notification.getUnreadCount(userId);
    
    // Emit socket event
    if (io) {
      io.to(userId.toString()).emit('notification-deleted', {
        notificationId,
        unreadCount
      });
      
      // Also emit to admin room if user is admin
      const user = await User.findById(userId);
      if (user && user.admin) {
        io.to('admin-notifications').emit('notification-deleted', {
          notificationId,
          unreadCount
        });
      }
    }
    
    return { notification, unreadCount };
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

module.exports = {
  createNotificationWithSocket,
  markNotificationsAsReadWithSocket,
  markAllNotificationsAsReadWithSocket,
  broadcastNotification,
  deleteNotificationWithSocket,
  getNotificationTitle
};