const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const User = require('../models/User');
// HYBRID AUTH: Support both Clerk and legacy JWT during migration
const { protect } = require('../middleware/hybridAuth');
const { profileCompletionGate, calculateCompletionPercentage } = require('../middleware/profileCompletion');
const Business = require('../models/Business');

// Get all conversations for the current user (or all for admin)
router.get('/', protect, async (req, res) => {
  try {
    // Check profile completion gating for business users (non-admin, non-VA)
    if (!req.user.admin && !req.user.profile?.va) {
      // Business user - check profile completion
      const business = await Business.findOne({ user: req.user._id });
      
      if (!business) {
        return res.status(403).json({
          success: false,
          gated: true,
          error: 'PROFILE_INCOMPLETE',
          message: 'Welcome to your messages. To get started, visit your Dashboard to complete your profile and begin conversations.',
          profileCompletion: 0,
          requiredCompletion: 80
        });
      }
      
      const completionPercentage = calculateCompletionPercentage(business, 'business');
      
      // Gate if profile completion is NOT greater than 80%
      if (completionPercentage <= 80) {
        return res.status(403).json({
          success: false,
          gated: true,
          error: 'PROFILE_INCOMPLETE',
          message: 'Welcome to your messages. To get started, visit your Dashboard to complete your profile and begin conversations.',
          profileCompletion: completionPercentage,
          requiredCompletion: 80
        });
      }
    }

    let query = {};
    
    // Admins can see all conversations (including intercepted ones)
    if (req.user.admin) {
      // Admin sees all conversations
      query = {};
    } else if (req.user.profile?.va) {
      // VAs only see conversations where they are participants AND NOT intercepted
      // This excludes business-initiated conversations
      query = {
        participants: req.user.id,
        isIntercepted: { $ne: true }  // Exclude intercepted conversations from VA view
      };
    } else {
      // Business users see their conversations normally
      query = { participants: req.user.id };
    }

    const conversations = await Conversation.find(query)
      .populate('va', 'email profile')
      .populate('business', 'email profile') 
      .populate('messages.sender', 'email profile')
      .populate('originalSender', 'email profile')  // Populate original sender for intercepted convos
      .sort('-lastMessageAt');

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations'
    });
  }
});

// Get a specific conversation
router.get('/:id', protect, async (req, res) => {
  try {
    // Check profile completion gating for business users (non-admin, non-VA)
    if (!req.user.admin && !req.user.profile?.va) {
      // Business user - check profile completion
      const business = await Business.findOne({ user: req.user._id });
      
      if (!business) {
        return res.status(403).json({
          success: false,
          gated: true,
          error: 'PROFILE_INCOMPLETE',
          message: 'Welcome to your messages. To get started, visit your Dashboard to complete your profile and begin conversations.',
          profileCompletion: 0,
          requiredCompletion: 80
        });
      }
      
      const completionPercentage = calculateCompletionPercentage(business, 'business');
      
      // Gate if profile completion is NOT greater than 80%
      if (completionPercentage <= 80) {
        return res.status(403).json({
          success: false,
          gated: true,
          error: 'PROFILE_INCOMPLETE',
          message: 'Welcome to your messages. To get started, visit your Dashboard to complete your profile and begin conversations.',
          profileCompletion: completionPercentage,
          requiredCompletion: 80
        });
      }
    }

    const conversation = await Conversation.findById(req.params.id)
      .populate('va', 'email profile')
      .populate('business', 'email profile')
      .populate('messages.sender', 'email profile')
      .populate('originalSender', 'email profile');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Check authorization
    const isParticipant = conversation.participants.includes(req.user.id);
    const isVA = req.user.profile?.va && conversation.va.toString() === req.user.id;
    const isIntercepted = conversation.isIntercepted;

    // VAs cannot view intercepted conversations (business-initiated)
    if (isVA && isIntercepted) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this conversation'
      });
    }

    // Check if user is participant or admin
    if (!isParticipant && !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this conversation'
      });
    }

    // Mark messages as read for current user
    if (isParticipant || req.user.admin) {
      await conversation.markAsRead(req.user.id, req.user.admin);
      await conversation.save();
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation'
    });
  }
});

// Start a new conversation with a VA
// Start conversation requires > 80% profile completion for business users
router.post('/start/:vaId', protect, profileCompletionGate(80), async (req, res) => {
  try {
    const { message } = req.body;
    const vaId = req.params.vaId;

    // Check if VA exists (vaId is the VA model ID, not User ID)
    const VA = require('../models/VA');
    const va = await VA.findById(vaId).populate('user');
    if (!va) {
      return res.status(404).json({
        success: false,
        error: 'VA not found'
      });
    }
    
    // Get the user ID associated with this VA
    const vaUserId = va.user._id || va.user;

    // Determine if this should be an intercepted conversation
    // All messages from business users (including admins) to VAs should be intercepted
    const isVAUser = req.user.profile?.va || req.user.va;
    const isBusinessUser = !isVAUser; // If not a VA, they're a business user
    const isIntercepted = isBusinessUser; // Business-to-VA conversations are intercepted

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, vaUserId] },
      isIntercepted: isIntercepted
    });

    if (conversation) {
      // Add message to existing conversation
      conversation.addMessage(req.user.id, message, req.user.admin);
    } else {
      // Create new conversation
      conversation = new Conversation({
        participants: [req.user.id, vaUserId],
        va: vaUserId,
        business: req.user.id,
        messages: [{
          sender: req.user.id,
          content: message
        }],
        lastMessage: message,
        lastMessageAt: new Date(),
        unreadCount: {
          va: isIntercepted ? 0 : 1,  // VA doesn't get notified if intercepted
          business: 0,
          admin: isIntercepted ? 1 : 0  // Admin gets notified if intercepted
        },
        // Mark as intercepted if business is initiating
        isIntercepted: isIntercepted,
        originalSender: isIntercepted ? req.user.id : undefined,
        interceptedAt: isIntercepted ? new Date() : undefined
      });
    }

    await conversation.save();

    // Populate for response
    await conversation.populate([
      { path: 'va', select: 'email profile' },
      { path: 'business', select: 'email profile' },
      { path: 'messages.sender', select: 'email profile' },
      { path: 'originalSender', select: 'email profile' }
    ]);

    res.json({
      success: true,
      data: conversation,
      intercepted: isIntercepted  // Let frontend know if this was intercepted
    });
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start conversation'
    });
  }
});

// Send a message in an existing conversation
router.post('/:id/messages', protect, async (req, res) => {
  try {
    const { message } = req.body;
    
    const conversation = await Conversation.findById(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Check authorization
    const isParticipant = conversation.participants.includes(req.user.id);
    const isVA = req.user.profile?.va && conversation.va.toString() === req.user.id;
    const isIntercepted = conversation.isIntercepted;

    // VAs cannot send messages in intercepted conversations
    if (isVA && isIntercepted) {
      return res.status(403).json({
        success: false,
        error: 'Cannot send messages in this conversation'
      });
    }

    // Check if user is participant or admin
    if (!isParticipant && !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to send messages in this conversation'
      });
    }

    // Add message with admin flag
    const newMessage = conversation.addMessage(req.user.id, message, req.user.admin);
    await conversation.save();

    // Populate sender info for response
    await User.populate(newMessage, {
      path: 'sender',
      select: 'email profile'
    });

    res.json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

// Get unread count for current user
router.get('/unread/count', protect, async (req, res) => {
  try {
    // Check profile completion gating for business users (non-admin, non-VA)
    if (!req.user.admin && !req.user.profile?.va) {
      // Business user - check profile completion
      const business = await Business.findOne({ user: req.user._id });
      
      if (!business) {
        return res.json({
          success: true,
          data: { 
            unreadCount: 0,
            gated: true
          }
        });
      }
      
      const completionPercentage = calculateCompletionPercentage(business, 'business');
      
      // Gate if profile completion is NOT greater than 80%
      if (completionPercentage <= 80) {
        return res.json({
          success: true,
          data: { 
            unreadCount: 0,
            gated: true,
            profileCompletion: completionPercentage
          }
        });
      }
    }

    let unreadCount = 0;
    let interceptedCount = 0;

    if (req.user.admin) {
      // Admins see unread count from intercepted conversations
      const interceptedConversations = await Conversation.find({
        isIntercepted: true
      });
      
      interceptedConversations.forEach(conv => {
        unreadCount += conv.unreadCount.admin || 0;
      });
      interceptedCount = interceptedConversations.length;

      // Also count direct admin conversations
      const directConversations = await Conversation.find({
        participants: req.user.id,
        isIntercepted: false
      });

      directConversations.forEach(conv => {
        if (conv.business.toString() === req.user.id) {
          unreadCount += conv.unreadCount.business || 0;
        }
      });
    } else {
      // Regular users (VAs and Businesses) - exclude intercepted conversations for VAs
      const query = req.user.profile?.va 
        ? { participants: req.user.id, isIntercepted: { $ne: true } }
        : { participants: req.user.id };

      const conversations = await Conversation.find(query);

      conversations.forEach(conv => {
        if (conv.va.toString() === req.user.id) {
          unreadCount += conv.unreadCount.va;
        } else if (conv.business.toString() === req.user.id) {
          unreadCount += conv.unreadCount.business;
        }
      });
    }

    res.json({
      success: true,
      data: { 
        unreadCount,
        ...(req.user.admin && { interceptedCount })
      }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread count'
    });
  }
});

// Archive a conversation
router.put('/:id/archive', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Check if user is participant or admin
    if (!conversation.participants.includes(req.user.id) && !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Not protectorized to archive this conversation'
      });
    }

    conversation.status = 'archived';
    await conversation.save();

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to archive conversation'
    });
  }
});

module.exports = router;