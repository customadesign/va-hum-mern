const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const User = require('../models/User');
// HYBRID AUTH: Support both Clerk and legacy JWT during migration
const { protect } = require('../middleware/hybridAuth');

// Get all conversations for the current user (or all for admin)
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    // Admins can see all conversations
    if (!req.user.admin) {
      query = { participants: req.user.id };
    }

    const conversations = await Conversation.find(query)
      .populate('va', 'email profile')
      .populate('business', 'email profile') 
      .populate('messages.sender', 'email profile')
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
    const conversation = await Conversation.findById(req.params.id)
      .populate('va', 'email profile')
      .populate('business', 'email profile')
      .populate('messages.sender', 'email profile');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Check if user is participant or admin
    const isParticipant = conversation.participants.includes(req.user.id);
    if (!isParticipant && !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Not protectorized to view this conversation'
      });
    }

    // Mark messages as read for current user
    if (isParticipant) {
      await conversation.markAsRead(req.user.id);
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
router.post('/start/:vaId', protect, async (req, res) => {
  try {
    const { message } = req.body;
    const vaId = req.params.vaId;

    // Check if VA exists
    const vaUser = await User.findById(vaId);
    if (!vaUser || !vaUser.profile?.va) {
      return res.status(404).json({
        success: false,
        error: 'VA not found'
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, vaId] }
    });

    if (conversation) {
      // Add message to existing conversation
      conversation.addMessage(req.user.id, message);
    } else {
      // Create new conversation
      conversation = new Conversation({
        participants: [req.user.id, vaId],
        va: vaId,
        business: req.user.id,
        messages: [{
          sender: req.user.id,
          content: message
        }],
        lastMessage: message,
        lastMessageAt: new Date(),
        unreadCount: {
          va: 1,
          business: 0
        }
      });
    }

    await conversation.save();

    // Populate for response
    await conversation.populate([
      { path: 'va', select: 'email profile' },
      { path: 'business', select: 'email profile' },
      { path: 'messages.sender', select: 'email profile' }
    ]);

    res.json({
      success: true,
      data: conversation
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

    // Check if user is participant
    if (!conversation.participants.includes(req.user.id) && !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Not protectorized to send messages in this conversation'
      });
    }

    // Add message
    const newMessage = conversation.addMessage(req.user.id, message);
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
    const conversations = await Conversation.find({
      participants: req.user.id
    });

    let unreadCount = 0;
    conversations.forEach(conv => {
      if (conv.va.toString() === req.user.id) {
        unreadCount += conv.unreadCount.va;
      } else if (conv.business.toString() === req.user.id) {
        unreadCount += conv.unreadCount.business;
      }
    });

    res.json({
      success: true,
      data: { unreadCount }
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