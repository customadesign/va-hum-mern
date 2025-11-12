const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const VA = require('../models/VA');
const Business = require('../models/Business');
const UserStatus = require('../models/UserStatus');
const Notification = require('../models/Notification');

// Get all conversations with enhanced data for messenger UI
exports.getConversations = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      status = 'active', // active, archived, all
      search,
      sortBy = 'lastMessageAt' // lastMessageAt, unread, pinned
    } = req.query;

    // Build query
    let query = {};
    
    if (req.user.admin) {
      // Admins see all conversations
      if (status !== 'all') {
        query.status = status;
      }
    } else {
      // Regular users see their conversations
      query.participants = req.user.id;
      
      // VAs don't see intercepted conversations
      if (req.user.role === 'va') {
        query.isIntercepted = { $ne: true };
      }
      
      if (status !== 'all') {
        query.status = status;
      }
    }

    // Search functionality
    if (search) {
      // This would need to be enhanced with proper text search
      // For now, we'll need to fetch and filter
    }

    // Get user's pinned conversations
    const pinnedConversations = await Conversation.find({
      ...query,
      'pinnedBy.user': req.user.id
    }).select('_id');
    const pinnedIds = pinnedConversations.map(c => c._id.toString());

    // Build sort options
    let sortOptions = {};
    switch (sortBy) {
      case 'unread':
        // Sort by unread count (would need aggregation)
        sortOptions = { lastMessageAt: -1 };
        break;
      case 'pinned':
        // Pinned first, then by last message
        sortOptions = { lastMessageAt: -1 };
        break;
      default:
        sortOptions = { lastMessageAt: -1 };
    }

    // Fetch conversations with pagination
    const skip = (page - 1) * limit;
    
    const [conversations, total] = await Promise.all([
      Conversation.find(query)
        .populate({
          path: 'va',
          select: 'name email avatar profile',
          populate: {
            path: 'user',
            select: 'name email avatar'
          }
        })
        .populate({
          path: 'business',
          select: 'name email avatar profile company',
          populate: {
            path: 'user',
            select: 'name email avatar'
          }
        })
        .populate('participants', 'name email avatar role')
        .populate('originalSender', 'name email avatar')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Conversation.countDocuments(query)
    ]);

    // Get last message for each conversation
    const conversationIds = conversations.map(c => c._id);
    const lastMessages = await Message.aggregate([
      { $match: { conversation: { $in: conversationIds } } },
      { $sort: { createdAt: -1 } },
      { 
        $group: {
          _id: '$conversation',
          lastMessage: { $first: '$$ROOT' }
        }
      }
    ]);

    // Create a map of last messages
    const lastMessageMap = {};
    lastMessages.forEach(item => {
      lastMessageMap[item._id.toString()] = item.lastMessage;
    });

    // Get online status for all participants
    const allParticipantIds = new Set();
    conversations.forEach(conv => {
      conv.participants.forEach(p => allParticipantIds.add(p._id.toString()));
    });

    const userStatuses = await UserStatus.find({
      user: { $in: Array.from(allParticipantIds) }
    }).lean();

    const statusMap = {};
    userStatuses.forEach(status => {
      statusMap[status.user.toString()] = {
        status: status.status,
        lastSeen: status.lastSeen,
        customStatus: status.customStatus
      };
    });

    // Enhance conversation data
    const enhancedConversations = conversations.map(conv => {
      const isPinned = pinnedIds.includes(conv._id.toString());
      const isMuted = conv.mutedBy?.some(m => {
        if (m.user.toString() !== req.user.id) return false;
        if (!m.mutedUntil) return true;
        return new Date(m.mutedUntil) > new Date();
      });

      // Get unread count for current user
      let unreadCount = 0;
      if (req.user.admin && conv.isIntercepted) {
        unreadCount = conv.unreadCount?.admin || 0;
      } else if (conv.va?._id?.toString() === req.user.id || conv.va?.user?._id?.toString() === req.user.id) {
        unreadCount = conv.unreadCount?.va || 0;
      } else if (conv.business?._id?.toString() === req.user.id || conv.business?.user?._id?.toString() === req.user.id) {
        unreadCount = conv.unreadCount?.business || 0;
      }

      // Get other participant info for display
      const otherParticipant = conv.participants.find(
        p => p._id.toString() !== req.user.id
      );

      const otherParticipantStatus = otherParticipant ? 
        statusMap[otherParticipant._id.toString()] : null;

      return {
        ...conv,
        lastMessage: lastMessageMap[conv._id.toString()] || null,
        isPinned,
        isMuted,
        unreadCount,
        otherParticipant: otherParticipant ? {
          ...otherParticipant,
          onlineStatus: otherParticipantStatus?.status || 'offline',
          lastSeen: otherParticipantStatus?.lastSeen,
          customStatus: otherParticipantStatus?.customStatus
        } : null,
        displayName: conv.isGroup ? conv.groupName : (otherParticipant?.name || otherParticipant?.email),
        displayAvatar: conv.isGroup ? conv.groupAvatar : otherParticipant?.avatar
      };
    });

    // Sort pinned conversations to top if requested
    if (sortBy === 'pinned') {
      enhancedConversations.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
      });
    }

    res.json({
      success: true,
      data: {
        conversations: enhancedConversations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations'
    });
  }
};

// Get single conversation with full details
exports.getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId)
      .populate({
        path: 'va',
        populate: {
          path: 'user',
          select: 'name email avatar'
        }
      })
      .populate({
        path: 'business',
        populate: {
          path: 'user',
          select: 'name email avatar'
        }
      })
      .populate('participants', 'name email avatar role')
      .populate('originalSender', 'name email avatar')
      .populate('typingIndicators.user', 'name avatar')
      .lean();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Check authorization
    const isParticipant = conversation.participants.some(
      p => p._id.toString() === req.user.id
    );

    if (!isParticipant && !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Get participant statuses
    const participantIds = conversation.participants.map(p => p._id);
    const userStatuses = await UserStatus.find({
      user: { $in: participantIds }
    }).lean();

    const statusMap = {};
    userStatuses.forEach(status => {
      statusMap[status.user.toString()] = {
        status: status.status,
        lastSeen: status.lastSeen,
        customStatus: status.customStatus,
        isTyping: status.isTyping && status.typingIn?.toString() === conversationId
      };
    });

    // Get display info for current user
    const displayInfo = {
      isPinned: conversation.pinnedBy?.some(p => p.user.toString() === req.user.id),
      isMuted: conversation.mutedBy?.some(m => {
        if (m.user.toString() !== req.user.id) return false;
        if (!m.mutedUntil) return true;
        return new Date(m.mutedUntil) > new Date();
      }),
      theme: conversation.theme,
      emoji: conversation.emoji
    };

    // Mark messages as read if participant
    if (isParticipant) {
      await Conversation.findByIdAndUpdate(conversationId, {
        $pull: { 
          'messages.$[elem].readBy': { user: req.user.id }
        }
      }, {
        arrayFilters: [{ 'elem.sender': { $ne: req.user.id } }]
      });

      // Update unread count
      const updateField = req.user.admin ? 'unreadCount.admin' :
                         req.user.role === 'va' ? 'unreadCount.va' :
                         'unreadCount.business';
      
      await Conversation.findByIdAndUpdate(conversationId, {
        [updateField]: 0
      });
    }

    res.json({
      success: true,
      data: {
        conversation,
        participantStatuses: statusMap,
        displayInfo
      }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation'
    });
  }
};

// Start or get existing conversation
exports.startConversation = async (req, res) => {
  try {
    const { recipientId, vaId, businessId, message } = req.body;

    let otherParticipantId;
    let conversationType;

    // Determine the other participant
    if (recipientId) {
      // Direct user-to-user conversation
      otherParticipantId = recipientId;
      conversationType = 'direct';
    } else if (vaId) {
      // Business starting conversation with VA
      const va = await VA.findById(vaId).populate('user');
      if (!va) {
        return res.status(404).json({
          success: false,
          error: 'VA not found'
        });
      }
      otherParticipantId = va.user._id;
      conversationType = 'business-to-va';
    } else if (businessId) {
      // VA starting conversation with Business
      const business = await Business.findById(businessId).populate('user');
      if (!business) {
        return res.status(404).json({
          success: false,
          error: 'Business not found'
        });
      }
      otherParticipantId = business.user._id;
      conversationType = 'va-to-business';
    } else {
      return res.status(400).json({
        success: false,
        error: 'Recipient not specified'
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { 
        $all: [req.user.id, otherParticipantId],
        $size: 2
      },
      isGroup: false
    });

    if (conversation) {
      // Return existing conversation
      await conversation.populate([
        { path: 'participants', select: 'name email avatar role' },
        { path: 'va.user', select: 'name email avatar' },
        { path: 'business.user', select: 'name email avatar' }
      ]);

      return res.json({
        success: true,
        data: {
          conversation,
          isNew: false
        }
      });
    }

    // Determine if conversation should be intercepted
    const isIntercepted = conversationType === 'business-to-va' && req.user.role === 'business';

    // Create new conversation
    const participantIds = [req.user.id, otherParticipantId];
    
    // Determine VA and Business IDs
    let vaUserId, businessUserId;
    if (conversationType === 'business-to-va') {
      vaUserId = otherParticipantId;
      businessUserId = req.user.id;
    } else if (conversationType === 'va-to-business') {
      vaUserId = req.user.id;
      businessUserId = otherParticipantId;
    } else {
      // For direct conversations, determine based on roles
      const users = await User.find({ _id: { $in: participantIds } });
      const vaUser = users.find(u => u.role === 'va');
      const businessUser = users.find(u => u.role === 'business');
      vaUserId = vaUser?._id;
      businessUserId = businessUser?._id;
    }

    conversation = new Conversation({
      participants: participantIds,
      va: vaUserId,
      business: businessUserId,
      status: 'active',
      isIntercepted,
      originalSender: isIntercepted ? req.user.id : undefined,
      interceptedAt: isIntercepted ? new Date() : undefined,
      lastMessageAt: new Date()
    });

    // Add initial message if provided
    if (message) {
      conversation.messages.push({
        sender: req.user.id,
        content: message,
        read: false
      });
      conversation.lastMessage = message;
      
      // Set unread counts
      if (isIntercepted) {
        conversation.unreadCount.admin = 1;
      } else {
        if (vaUserId && vaUserId.toString() !== req.user.id) {
          conversation.unreadCount.va = 1;
        }
        if (businessUserId && businessUserId.toString() !== req.user.id) {
          conversation.unreadCount.business = 1;
        }
      }
    }

    await conversation.save();

    // Populate for response
    await conversation.populate([
      { path: 'participants', select: 'name email avatar role' },
      { path: 'va', populate: { path: 'user', select: 'name email avatar' } },
      { path: 'business', populate: { path: 'user', select: 'name email avatar' } },
      { path: 'originalSender', select: 'name email avatar' }
    ]);

    // Send notification to recipient
    if (message) {
      const recipientUserId = isIntercepted ? null : otherParticipantId;
      
      if (recipientUserId) {
        await Notification.create({
          recipient: recipientUserId,
          type: 'new_conversation',
          title: 'New conversation started',
          message: `${req.user.name || req.user.email} started a conversation with you`,
          data: {
            conversationId: conversation._id,
            senderId: req.user.id,
            senderName: req.user.name || req.user.email
          }
        });
      }

      // Notify admins if intercepted
      if (isIntercepted) {
        const admins = await User.find({ admin: true });
        for (const admin of admins) {
          await Notification.create({
            recipient: admin._id,
            type: 'intercepted_conversation',
            title: 'New intercepted conversation',
            message: `Business user ${req.user.name || req.user.email} attempted to contact a VA`,
            data: {
              conversationId: conversation._id,
              originalSenderId: req.user.id,
              targetVaId: vaUserId
            }
          });
        }
      }
    }

    // Emit socket event
    const io = req.app.get('io');
    if (!isIntercepted && otherParticipantId) {
      io.to(otherParticipantId.toString()).emit('new_conversation', {
        conversation,
        initiator: {
          _id: req.user.id,
          name: req.user.name,
          avatar: req.user.avatar
        }
      });
    }

    res.status(201).json({
      success: true,
      data: {
        conversation,
        isNew: true,
        isIntercepted
      }
    });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start conversation'
    });
  }
};

// Update conversation settings
exports.updateConversationSettings = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { 
      theme,
      emoji,
      nickname,
      mute,
      muteUntil,
      pin 
    } = req.body;

    const conversation = await Conversation.findById(conversationId);
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

    // Update theme and emoji (affects all participants)
    if (theme !== undefined) {
      conversation.theme = theme;
    }
    if (emoji !== undefined) {
      conversation.emoji = emoji;
    }

    // Update nickname for other participant
    if (nickname !== undefined) {
      const existingNickname = conversation.nickname.find(
        n => n.user.toString() === req.user.id
      );
      if (existingNickname) {
        existingNickname.nickname = nickname;
      } else {
        conversation.nickname.push({
          user: req.user.id,
          nickname
        });
      }
    }

    // Handle mute settings
    if (mute !== undefined) {
      if (mute) {
        await conversation.muteConversation(req.user.id, muteUntil);
      } else {
        await conversation.unmuteConversation(req.user.id);
      }
    }

    // Handle pin settings
    if (pin !== undefined) {
      if (pin) {
        await conversation.pinConversation(req.user.id);
      } else {
        await conversation.unpinConversation(req.user.id);
      }
    }

    await conversation.save();

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Update conversation settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update conversation settings'
    });
  }
};

// Archive conversation
exports.archiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
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

    conversation.status = 'archived';
    await conversation.save();

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Archive conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to archive conversation'
    });
  }
};

// Block conversation (admin only)
exports.blockConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { reason } = req.body;

    if (!req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    conversation.status = 'blocked';
    conversation.adminActions.push({
      action: 'blocked',
      performedBy: req.user.id,
      details: { reason }
    });

    await conversation.save();

    // Notify participants
    for (const participantId of conversation.participants) {
      await Notification.create({
        recipient: participantId,
        type: 'conversation_blocked',
        title: 'Conversation blocked',
        message: 'This conversation has been blocked by an administrator',
        priority: 'high'
      });
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Block conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to block conversation'
    });
  }
};

// Get unread counts
exports.getUnreadCounts = async (req, res) => {
  try {
    let totalUnread = 0;
    let conversationCounts = [];

    if (req.user.admin) {
      // Admin sees intercepted conversation counts
      const interceptedConversations = await Conversation.find({
        isIntercepted: true,
        'unreadCount.admin': { $gt: 0 }
      }).select('_id unreadCount.admin');

      interceptedConversations.forEach(conv => {
        totalUnread += conv.unreadCount.admin;
        conversationCounts.push({
          conversationId: conv._id,
          unreadCount: conv.unreadCount.admin
        });
      });
    } else {
      // Regular users
      const userField = req.user.role === 'va' ? 'va' : 'business';
      const unreadField = `unreadCount.${userField}`;
      
      const query = {
        participants: req.user.id,
        [unreadField]: { $gt: 0 }
      };

      // VAs don't see intercepted conversations
      if (req.user.role === 'va') {
        query.isIntercepted = { $ne: true };
      }

      const conversations = await Conversation.find(query)
        .select(`_id ${unreadField}`);

      conversations.forEach(conv => {
        const count = conv.unreadCount[userField];
        totalUnread += count;
        conversationCounts.push({
          conversationId: conv._id,
          unreadCount: count
        });
      });
    }

    res.json({
      success: true,
      data: {
        totalUnread,
        conversations: conversationCounts
      }
    });
  } catch (error) {
    console.error('Get unread counts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread counts'
    });
  }
};

module.exports = exports;