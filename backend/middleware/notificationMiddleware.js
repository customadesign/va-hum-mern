const { createNotificationWithSocket } = require('../utils/notificationHelper');

/**
 * Middleware to attach notification creation helper to request
 * This makes it easy to create notifications from any route
 */
function attachNotificationHelper(req, res, next) {
  // Get Socket.io instance from app
  const io = req.app.get('io');
  
  // Attach helper function to request
  req.createNotification = async (params) => {
    try {
      return await createNotificationWithSocket(params, io);
    } catch (error) {
      console.error('Error creating notification via middleware:', error);
      throw error;
    }
  };
  
  // Helper to create admin notifications
  req.createAdminNotification = async (title, message, type = 'admin_notification', priority = 'medium') => {
    try {
      const User = require('../models/User');
      
      // Get all admin users
      const admins = await User.find({ admin: true, suspended: false });
      
      const notifications = [];
      for (const admin of admins) {
        const notification = await createNotificationWithSocket({
          recipient: admin._id,
          type,
          params: {
            title,
            message,
            priority,
            sentAt: new Date()
          }
        }, io);
        notifications.push(notification);
      }
      
      return notifications;
    } catch (error) {
      console.error('Error creating admin notifications:', error);
      throw error;
    }
  };
  
  // Helper to create system-wide announcements
  req.createSystemAnnouncement = async (title, message, targetUserIds = null) => {
    try {
      const User = require('../models/User');
      
      // Get target users
      let users;
      if (targetUserIds) {
        users = await User.find({ _id: { $in: targetUserIds }, suspended: false });
      } else {
        users = await User.find({ suspended: false });
      }
      
      const notifications = [];
      for (const user of users) {
        const notification = await createNotificationWithSocket({
          recipient: user._id,
          type: 'system_announcement',
          params: {
            title,
            message,
            priority: 'high',
            sentAt: new Date(),
            isSystemWide: true
          }
        }, io);
        notifications.push(notification);
      }
      
      return notifications;
    } catch (error) {
      console.error('Error creating system announcement:', error);
      throw error;
    }
  };
  
  next();
}

/**
 * Middleware to track notification interactions
 */
function trackNotificationInteraction(req, res, next) {
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Override res.json to track successful notification operations
  res.json = function(data) {
    // Log notification operations for analytics
    if (req.path.includes('/notifications') && res.statusCode < 400) {
      const operation = req.method === 'GET' ? 'view' : 
                       req.method === 'PUT' ? 'update' :
                       req.method === 'DELETE' ? 'delete' :
                       req.method === 'POST' ? 'create' : 'other';
      
      console.log(`Notification operation: ${operation} by user: ${req.user?._id}`);
      
      // Here you could add analytics tracking, metrics, etc.
    }
    
    return originalJson.call(this, data);
  };
  
  // Override res.send for non-JSON responses
  res.send = function(data) {
    if (req.path.includes('/notifications') && res.statusCode < 400) {
      console.log(`Notification operation completed: ${req.method} ${req.path}`);
    }
    return originalSend.call(this, data);
  };
  
  next();
}

module.exports = {
  attachNotificationHelper,
  trackNotificationInteraction
};