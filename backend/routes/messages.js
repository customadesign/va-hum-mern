const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');
// HYBRID AUTH: Support both Clerk and legacy JWT during migration
const { protect } = require('../middleware/hybridAuth');
const { sendEmail } = require('../utils/email');

// @route   POST /api/messages
// @desc    Send a message in a conversation
// @access  Private (conversation participants only)
router.post('/', protect, [
  body('conversationId').notEmpty(),
  body('body').notEmpty().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { conversationId, body, hiringFeeAcknowledged } = req.body;

    // Get conversation
    const conversation = await Conversation.findById(conversationId)
      .populate('va')
      .populate('business');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Check if user is participant
    const isVA = req.user.va?.toString() === conversation.va._id.toString();
    const isBusiness = req.user.business?.toString() === conversation.business._id.toString();
    
    if (!isVA && !isBusiness) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
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
    const message = await Message.create({
      conversation: conversationId,
      sender: isVA ? conversation.va._id : conversation.business._id,
      senderModel: isVA ? 'VA' : 'Business',
      body,
      bodyHtml: body, // Will be auto-converted in pre-save hook
      hiringFeeAcknowledged: hiringFeeAcknowledged || false
    });

    // Update conversation
    const recipientUser = isVA ? conversation.business.user : conversation.va.user;
    conversation.userWithUnreadMessages = recipientUser;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Create notification for recipient
    await Notification.create({
      recipient: recipientUser,
      type: 'new_message',
      message: message._id,
      conversation: conversation._id,
      params: {
        senderName: isVA ? conversation.va.name : conversation.business.company,
        messagePreview: body.substring(0, 100)
      }
    });

    // Send email notification if enabled
    const recipientProfile = isVA ? conversation.business : conversation.va;
    const recipientUserDoc = await recipientProfile.user;
    
    if (recipientUserDoc.inboxEnabled) {
      await sendEmail({
        email: recipientProfile.email || recipientUserDoc.email,
        template: 'new-message',
        data: {
          senderName: isVA ? conversation.va.name : conversation.business.company,
          messagePreview: body.substring(0, 200),
          conversationUrl: `${process.env.CLIENT_URL}/conversations/${conversation._id}`
        }
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    io.to(recipientUser.toString()).emit('new_message', {
      conversation: conversation._id,
      message
    });

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/messages/:conversationId
// @desc    Get messages for a conversation
// @access  Private (conversation participants only)
router.get('/:conversationId', protect, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    // Get conversation to check permissions
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Check if user is participant
    const isVA = req.user.va?.toString() === conversation.va.toString();
    const isBusiness = req.user.business?.toString() === conversation.business.toString();
    
    if (!isVA && !isBusiness && !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Get messages with pagination
    const skip = (page - 1) * limit;
    
    const [messages, total] = await Promise.all([
      Message.find({ conversation: req.params.conversationId })
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Message.countDocuments({ conversation: req.params.conversationId })
    ]);

    res.json({
      success: true,
      data: messages.reverse(), // Reverse to show oldest first
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

// @route   PUT /api/messages/:id/read
// @desc    Mark message as read
// @access  Private (message recipient only)
router.put('/:id/read', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Get conversation to check permissions
    const conversation = await Conversation.findById(message.conversation);
    
    // Check if user is the recipient
    const isVA = req.user.va?.toString() === conversation.va.toString();
    const isBusiness = req.user.business?.toString() === conversation.business.toString();
    const isRecipient = (message.senderModel === 'VA' && isBusiness) || 
                       (message.senderModel === 'Business' && isVA);
    
    if (!isRecipient) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Mark as read
    await message.markAsRead();

    res.json({
      success: true,
      data: message
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