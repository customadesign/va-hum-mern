const UserStatus = require('../models/UserStatus');
const User = require('../models/User');

// Get online status for multiple users
exports.getUserStatuses = async (req, res) => {
  try {
    const { userIds } = req.query; // Comma-separated user IDs
    
    let query = {};
    if (userIds) {
      const ids = userIds.split(',').filter(id => id);
      query.user = { $in: ids };
    }

    const statuses = await UserStatus.find(query)
      .populate('user', 'name email avatar')
      .lean();

    // Create a map for easy lookup
    const statusMap = {};
    statuses.forEach(status => {
      statusMap[status.user._id.toString()] = {
        status: status.status,
        lastSeen: status.lastSeen,
        customStatus: status.customStatus,
        isActive: status.isActive
      };
    });

    res.json({
      success: true,
      data: statusMap
    });
  } catch (error) {
    console.error('Get user statuses error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statuses'
    });
  }
};

// Get current user's status
exports.getMyStatus = async (req, res) => {
  try {
    let status = await UserStatus.findOne({ user: req.user.id });
    
    if (!status) {
      // Create default status
      status = await UserStatus.create({
        user: req.user.id,
        status: 'offline',
        lastSeen: new Date()
      });
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Get my status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch status'
    });
  }
};

// Update current user's status
exports.updateMyStatus = async (req, res) => {
  try {
    const { status: newStatus, customStatus } = req.body;

    let userStatus = await UserStatus.findOne({ user: req.user.id });
    
    if (!userStatus) {
      userStatus = new UserStatus({
        user: req.user.id
      });
    }

    // Update status
    if (newStatus) {
      if (['online', 'away', 'busy', 'offline'].includes(newStatus)) {
        userStatus.status = newStatus;
        if (newStatus === 'online') {
          userStatus.lastSeen = new Date();
        }
      }
    }

    // Update custom status
    if (customStatus !== undefined) {
      if (customStatus === null) {
        userStatus.customStatus = null;
      } else {
        userStatus.customStatus = {
          emoji: customStatus.emoji,
          text: customStatus.text,
          expiresAt: customStatus.duration 
            ? new Date(Date.now() + customStatus.duration)
            : null
        };
      }
    }

    await userStatus.save();

    // Emit status update to relevant users
    const io = req.app.get('io');
    
    // Get all conversations this user is part of
    const Conversation = require('../models/Conversation');
    const conversations = await Conversation.find({
      participants: req.user.id
    }).select('participants');

    // Collect all unique participant IDs
    const participantIds = new Set();
    conversations.forEach(conv => {
      conv.participants.forEach(p => {
        if (p.toString() !== req.user.id) {
          participantIds.add(p.toString());
        }
      });
    });

    // Notify all relevant users
    participantIds.forEach(participantId => {
      io.to(participantId).emit('user_status_changed', {
        userId: req.user.id,
        status: userStatus.status,
        lastSeen: userStatus.lastSeen,
        customStatus: userStatus.customStatus
      });
    });

    res.json({
      success: true,
      data: userStatus
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update status'
    });
  }
};

// Update status settings
exports.updateStatusSettings = async (req, res) => {
  try {
    const {
      showOnlineStatus,
      showLastSeen,
      showTypingIndicator,
      activeStatusTimeout
    } = req.body;

    let userStatus = await UserStatus.findOne({ user: req.user.id });
    
    if (!userStatus) {
      userStatus = new UserStatus({
        user: req.user.id
      });
    }

    // Update settings
    if (showOnlineStatus !== undefined) {
      userStatus.settings.showOnlineStatus = showOnlineStatus;
    }
    if (showLastSeen !== undefined) {
      userStatus.settings.showLastSeen = showLastSeen;
    }
    if (showTypingIndicator !== undefined) {
      userStatus.settings.showTypingIndicator = showTypingIndicator;
    }
    if (activeStatusTimeout !== undefined) {
      userStatus.settings.activeStatusTimeout = activeStatusTimeout;
    }

    await userStatus.save();

    res.json({
      success: true,
      data: userStatus.settings
    });
  } catch (error) {
    console.error('Update status settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update status settings'
    });
  }
};

// Set user online (called on connection)
exports.setOnline = async (req, res) => {
  try {
    const { socketId } = req.body;

    let userStatus = await UserStatus.findOne({ user: req.user.id });
    
    if (!userStatus) {
      userStatus = new UserStatus({
        user: req.user.id
      });
    }

    await userStatus.setOnline(socketId);

    // Notify relevant users
    const io = req.app.get('io');
    const Conversation = require('../models/Conversation');
    
    const conversations = await Conversation.find({
      participants: req.user.id
    }).select('participants');

    const participantIds = new Set();
    conversations.forEach(conv => {
      conv.participants.forEach(p => {
        if (p.toString() !== req.user.id) {
          participantIds.add(p.toString());
        }
      });
    });

    participantIds.forEach(participantId => {
      io.to(participantId).emit('user_came_online', {
        userId: req.user.id,
        status: 'online'
      });
    });

    res.json({
      success: true,
      data: userStatus
    });
  } catch (error) {
    console.error('Set online error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set online status'
    });
  }
};

// Set user offline (called on disconnection)
exports.setOffline = async (req, res) => {
  try {
    let userStatus = await UserStatus.findOne({ user: req.user.id });
    
    if (userStatus) {
      await userStatus.setOffline();

      // Notify relevant users
      const io = req.app.get('io');
      const Conversation = require('../models/Conversation');
      
      const conversations = await Conversation.find({
        participants: req.user.id
      }).select('participants');

      const participantIds = new Set();
      conversations.forEach(conv => {
        conv.participants.forEach(p => {
          if (p.toString() !== req.user.id) {
            participantIds.add(p.toString());
          }
        });
      });

      participantIds.forEach(participantId => {
        io.to(participantId).emit('user_went_offline', {
          userId: req.user.id,
          status: 'offline',
          lastSeen: userStatus.lastSeen
        });
      });
    }

    res.json({
      success: true,
      message: 'User set to offline'
    });
  } catch (error) {
    console.error('Set offline error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set offline status'
    });
  }
};

// Update last activity (heartbeat)
exports.updateActivity = async (req, res) => {
  try {
    let userStatus = await UserStatus.findOne({ user: req.user.id });
    
    if (!userStatus) {
      userStatus = new UserStatus({
        user: req.user.id,
        status: 'online'
      });
    }

    await userStatus.updateActivity();

    res.json({
      success: true,
      data: {
        status: userStatus.status,
        lastSeen: userStatus.lastSeen
      }
    });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update activity'
    });
  }
};

// Get online users in a conversation
exports.getConversationOnlineUsers = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const Conversation = require('../models/Conversation');
    const conversation = await Conversation.findById(conversationId)
      .select('participants');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Check authorization
    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user.id
    );

    if (!isParticipant && !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    const statuses = await UserStatus.find({
      user: { $in: conversation.participants },
      status: { $in: ['online', 'away', 'busy'] }
    }).populate('user', 'name email avatar');

    res.json({
      success: true,
      data: statuses
    });
  } catch (error) {
    console.error('Get conversation online users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch online users'
    });
  }
};

// Cleanup stale statuses (scheduled job)
exports.cleanupStaleStatuses = async (req, res) => {
  try {
    await UserStatus.cleanupStaleStatuses();
    
    res.json({
      success: true,
      message: 'Stale statuses cleaned up'
    });
  } catch (error) {
    console.error('Cleanup stale statuses error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup stale statuses'
    });
  }
};

module.exports = exports;