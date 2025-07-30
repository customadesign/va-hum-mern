const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const VA = require('../models/VA');
const Business = require('../models/Business');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

// @route   GET /api/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const query = {};
    
    // Get user's profile
    if (req.user.va) {
      query.va = req.user.va;
    } else if (req.user.business) {
      query.business = req.user.business;
    } else {
      return res.status(400).json({
        success: false,
        error: 'User must have a VA or Business profile'
      });
    }

    const conversations = await Conversation.find(query)
      .populate('va', 'name avatar')
      .populate('business', 'company avatar')
      .sort('-lastMessageAt');

    // Get last message for each conversation
    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await Message.findOne({ conversation: conv._id })
          .sort('-createdAt')
          .limit(1);
        
        return {
          ...conv.toObject(),
          lastMessage,
          hasUnread: conv.userWithUnreadMessages?.toString() === req.user._id.toString()
        };
      })
    );

    res.json({
      success: true,
      data: conversationsWithMessages
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/conversations
// @desc    Start a new conversation
// @access  Private (Business only)
router.post('/', protect, authorize('business'), [
  body('vaId').notEmpty(),
  body('message').notEmpty().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { vaId, message } = req.body;

    // Check if VA exists
    const va = await VA.findById(vaId).populate('user');
    if (!va) {
      return res.status(404).json({
        success: false,
        error: 'VA not found'
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      va: vaId,
      business: req.business._id
    });

    // Create conversation if it doesn't exist
    if (!conversation) {
      conversation = await Conversation.create({
        va: vaId,
        business: req.business._id
      });
    }

    // Check if conversation is blocked
    if (conversation.isBlocked) {
      return res.status(403).json({
        success: false,
        error: 'This conversation is blocked'
      });
    }

    // Create message
    const newMessage = await Message.create({
      conversation: conversation._id,
      sender: req.business._id,
      senderModel: 'Business',
      body: message,
      bodyHtml: message // Will be auto-converted in pre-save hook
    });

    // Update conversation
    conversation.userWithUnreadMessages = va.user._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Create notification for VA
    await Notification.create({
      recipient: va.user._id,
      type: 'new_message',
      message: newMessage._id,
      conversation: conversation._id,
      params: {
        senderName: req.business.company,
        messagePreview: message.substring(0, 100)
      }
    });

    // Send email notification if enabled
    if (va.user.inboxEnabled) {
      await sendEmail({
        email: va.email || va.user.email,
        template: 'new-message',
        data: {
          senderName: req.business.company,
          messagePreview: message.substring(0, 200),
          conversationUrl: `${process.env.CLIENT_URL}/conversations/${conversation._id}`
        }
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    io.to(va.user._id.toString()).emit('new_message', {
      conversation: conversation._id,
      message: newMessage
    });

    res.status(201).json({
      success: true,
      data: {
        conversation,
        message: newMessage
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

// @route   GET /api/conversations/:id
// @desc    Get single conversation with messages
// @access  Private (participants only)
router.get('/:id', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('va', 'name avatar hero bio website')
      .populate('business', 'company avatar bio website');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Check if user is participant
    const isVA = req.user.va?.toString() === conversation.va._id.toString();
    const isBusiness = req.user.business?.toString() === conversation.business._id.toString();
    
    if (!isVA && !isBusiness && !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Get messages
    const messages = await Message.find({ conversation: conversation._id })
      .sort('createdAt')
      .limit(100);

    // Mark conversation as read
    await conversation.markAsRead(req.user._id);

    // Mark messages as read
    const unreadMessages = messages.filter(m => 
      !m.readAt && m.senderModel !== (isVA ? 'VA' : 'Business')
    );
    
    await Promise.all(unreadMessages.map(m => m.markAsRead()));

    res.json({
      success: true,
      data: {
        conversation,
        messages
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

// @route   POST /api/conversations/:id/block
// @desc    Block a conversation
// @access  Private (participants only)
router.post('/:id/block', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Check if user is participant
    const isVA = req.user.va?.toString() === conversation.va.toString();
    const isBusiness = req.user.business?.toString() === conversation.business.toString();
    
    if (!isVA && !isBusiness) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Block conversation
    await conversation.block(isVA ? 'va' : 'business');

    res.json({
      success: true,
      data: conversation
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/conversations/:id/unblock
// @desc    Unblock a conversation
// @access  Private (participants only)
router.post('/:id/unblock', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Check if user is participant
    const isVA = req.user.va?.toString() === conversation.va.toString();
    const isBusiness = req.user.business?.toString() === conversation.business.toString();
    
    if (!isVA && !isBusiness) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Unblock conversation
    await conversation.unblock(isVA ? 'va' : 'business');

    res.json({
      success: true,
      data: conversation
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;