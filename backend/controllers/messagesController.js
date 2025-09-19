const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const UserStatus = require('../models/UserStatus');
const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/email');

// Get messages for a conversation with enhanced data
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { 
      page = 1, 
      limit = 50,
      before, // Get messages before this messageId
      after   // Get messages after this messageId
    } = req.query;

    // Verify user has access to conversation
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

    // Build query
    const query = { 
      conversation: conversationId,
      $or: [
        { deletedForEveryone: false },
        { deletedForEveryone: { $exists: false } }
      ]
    };

    // Add pagination cursors if provided
    if (before) {
      const beforeMessage = await Message.findById(before);
      if (beforeMessage) {
        query.createdAt = { $lt: beforeMessage.createdAt };
      }
    } else if (after) {
      const afterMessage = await Message.findById(after);
      if (afterMessage) {
        query.createdAt = { $gt: afterMessage.createdAt };
      }
    }

    // Fetch messages with full population
    const messages = await Message.find(query)
      .sort({ createdAt: before ? -1 : 1 })
      .limit(parseInt(limit))
      .populate({
        path: 'sender',
        select: 'name email avatar role profile'
      })
      .populate({
        path: 'replyTo',
        select: 'body sender createdAt',
        populate: {
          path: 'sender',
          select: 'name avatar'
        }
      })
      .populate('readBy.user', 'name avatar')
      .populate('reactions.user', 'name avatar')
      .populate('deletedBy', 'name')
      .lean();

    // If fetching in reverse (before), reverse the results
    if (before) {
      messages.reverse();
    }

    // Mark messages as delivered for non-sender
    const undeliveredMessages = messages.filter(
      msg => msg.sender._id.toString() !== req.user.id && 
             msg.status === 'sent'
    );
    
    if (undeliveredMessages.length > 0) {
      await Message.updateMany(
        { 
          _id: { $in: undeliveredMessages.map(m => m._id) },
          status: 'sent'
        },
        { 
          $set: { 
            status: 'delivered',
            deliveredAt: new Date()
          }
        }
      );
    }

    // Get participant info for avatar and online status
    const participantIds = conversation.participants;
    const userStatuses = await UserStatus.find({
      user: { $in: participantIds }
    }).lean();

    const statusMap = {};
    userStatuses.forEach(status => {
      statusMap[status.user.toString()] = {
        status: status.status,
        lastSeen: status.lastSeen,
        isTyping: status.isTyping
      };
    });

    res.json({
      success: true,
      data: {
        messages,
        conversation: {
          _id: conversation._id,
          participants: conversation.participants,
          typingIndicators: conversation.typingIndicators,
          theme: conversation.theme,
          emoji: conversation.emoji
        },
        userStatuses: statusMap,
        hasMore: messages.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
};

// Send a message with enhanced features
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { 
      body, 
      messageType = 'text',
      attachments,
      replyTo,
      hiringFeeAcknowledged 
    } = req.body;

    // Get conversation
    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'name email avatar');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Verify user is participant
    const isParticipant = conversation.participants.some(
      p => p._id.toString() === req.user.id
    );
    
    if (!isParticipant && !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Determine sender model
    let senderModel = 'User';
    const user = await User.findById(req.user.id);
    if (user.role === 'va') senderModel = 'VA';
    else if (user.role === 'business') senderModel = 'Business';

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender: req.user.id,
      senderModel,
      body,
      bodyHtml: body, // Will be auto-converted
      messageType,
      attachments,
      replyTo,
      hiringFeeAcknowledged,
      status: 'sent'
    });

    // Populate message data for response
    await message.populate([
      { path: 'sender', select: 'name email avatar role' },
      { 
        path: 'replyTo', 
        select: 'body sender createdAt',
        populate: { path: 'sender', select: 'name avatar' }
      }
    ]);

    // Update conversation last message
    conversation.updateLastMessage(message);
    
    // Update unread counts
    const otherParticipants = conversation.participants.filter(
      p => p._id.toString() !== req.user.id
    );
    
    // Handle intercepted conversations
    if (conversation.isIntercepted && !req.user.admin) {
      conversation.unreadCount.admin = (conversation.unreadCount.admin || 0) + 1;
    } else {
      otherParticipants.forEach(participant => {
        if (participant.role === 'va') {
          conversation.unreadCount.va = (conversation.unreadCount.va || 0) + 1;
        } else if (participant.role === 'business') {
          conversation.unreadCount.business = (conversation.unreadCount.business || 0) + 1;
        }
      });
    }
    
    await conversation.save();

    // Create notifications for recipients
    for (const participant of otherParticipants) {
      await Notification.create({
        recipient: participant._id,
        type: 'new_message',
        title: `New message from ${user.name || user.email}`,
        message: messageType === 'text' ? body.substring(0, 100) : `Sent ${messageType}`,
        data: {
          conversationId: conversation._id,
          messageId: message._id,
          senderId: req.user.id,
          senderName: user.name || user.email,
          senderAvatar: user.avatar
        }
      });

      // Send email if enabled
      if (participant.inboxEnabled) {
        await sendEmail({
          email: participant.email,
          template: 'new-message',
          data: {
            senderName: user.name || user.email,
            messagePreview: body.substring(0, 200),
            conversationUrl: `${process.env.CLIENT_URL}/conversations/${conversation._id}`
          }
        }).catch(err => console.error('Email send error:', err));
      }
    }

    // Emit socket events
    const io = req.app.get('io');
    
    // Send to all participants
    otherParticipants.forEach(participant => {
      io.to(participant._id.toString()).emit('new_message', {
        conversation: conversation._id,
        message,
        sender: {
          _id: user._id,
          name: user.name,
          avatar: user.avatar
        }
      });
    });

    // If intercepted, notify admins
    if (conversation.isIntercepted && !req.user.admin) {
      io.to('admin-notifications').emit('intercepted_message', {
        conversation: conversation._id,
        message,
        originalSender: conversation.originalSender
      });
    }

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { messageIds } = req.body; // Array of message IDs to mark as read

    // Update messages
    const messages = await Message.find({
      _id: { $in: messageIds },
      conversation: conversationId,
      sender: { $ne: req.user.id }
    });

    // Mark each message as read
    for (const message of messages) {
      await message.markAsRead(req.user.id);
    }

    // Update conversation unread count
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      await conversation.markAsRead(req.user.id, req.user.admin);
      await conversation.save();
    }

    // Emit read receipts via socket
    const io = req.app.get('io');
    const readReceipts = messages.map(m => ({
      messageId: m._id,
      readBy: req.user.id,
      readAt: new Date()
    }));

    // Notify sender of read receipts
    const senderIds = [...new Set(messages.map(m => m.sender.toString()))];
    senderIds.forEach(senderId => {
      io.to(senderId).emit('messages_read', {
        conversationId,
        readReceipts,
        reader: {
          _id: req.user.id,
          name: req.user.name,
          avatar: req.user.avatar
        }
      });
    });

    res.json({
      success: true,
      data: {
        markedCount: messages.length,
        messageIds: messages.map(m => m._id)
      }
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read'
    });
  }
};

// Add reaction to message
exports.addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId)
      .populate('conversation');

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Verify user has access
    const conversation = await Conversation.findById(message.conversation);
    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user.id
    );

    if (!isParticipant && !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Add or update reaction
    await message.addReaction(req.user.id, emoji);

    // Emit socket event
    const io = req.app.get('io');
    conversation.participants.forEach(participantId => {
      if (participantId.toString() !== req.user.id) {
        io.to(participantId.toString()).emit('reaction_added', {
          messageId: message._id,
          conversationId: conversation._id,
          reaction: {
            user: req.user.id,
            emoji,
            userName: req.user.name,
            userAvatar: req.user.avatar
          }
        });
      }
    });

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add reaction'
    });
  }
};

// Remove reaction from message
exports.removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    await message.removeReaction(req.user.id);

    // Emit socket event
    const io = req.app.get('io');
    const conversation = await Conversation.findById(message.conversation);
    
    conversation.participants.forEach(participantId => {
      if (participantId.toString() !== req.user.id) {
        io.to(participantId.toString()).emit('reaction_removed', {
          messageId: message._id,
          conversationId: conversation._id,
          userId: req.user.id
        });
      }
    });

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove reaction'
    });
  }
};

// Edit message
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { body } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Only sender can edit their message
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to edit this message'
      });
    }

    // Edit message within 15 minutes
    const editTimeLimit = 15 * 60 * 1000; // 15 minutes
    if (Date.now() - message.createdAt > editTimeLimit) {
      return res.status(400).json({
        success: false,
        error: 'Message can only be edited within 15 minutes'
      });
    }

    await message.editMessage(body);

    // Emit socket event
    const io = req.app.get('io');
    const conversation = await Conversation.findById(message.conversation);
    
    conversation.participants.forEach(participantId => {
      if (participantId.toString() !== req.user.id) {
        io.to(participantId.toString()).emit('message_edited', {
          messageId: message._id,
          conversationId: conversation._id,
          newBody: body,
          editedAt: message.editedAt
        });
      }
    });

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to edit message'
    });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { forEveryone = false } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Check authorization
    const canDelete = message.sender.toString() === req.user.id || req.user.admin;
    if (!canDelete) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this message'
      });
    }

    // Delete within 1 hour for everyone, anytime for self
    if (forEveryone) {
      const deleteTimeLimit = 60 * 60 * 1000; // 1 hour
      if (Date.now() - message.createdAt > deleteTimeLimit && !req.user.admin) {
        return res.status(400).json({
          success: false,
          error: 'Message can only be deleted for everyone within 1 hour'
        });
      }
    }

    await message.softDelete(req.user.id, forEveryone);

    // Emit socket event
    const io = req.app.get('io');
    const conversation = await Conversation.findById(message.conversation);
    
    if (forEveryone) {
      conversation.participants.forEach(participantId => {
        io.to(participantId.toString()).emit('message_deleted', {
          messageId: message._id,
          conversationId: conversation._id,
          deletedBy: req.user.id
        });
      });
    }

    res.json({
      success: true,
      message: `Message deleted ${forEveryone ? 'for everyone' : 'for you'}`
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message'
    });
  }
};

// Handle typing indicator
exports.setTypingStatus = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { isTyping } = req.body;

    // Update conversation typing indicators
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Update typing indicator
    if (isTyping) {
      await conversation.addTypingIndicator(req.user.id);
    } else {
      await conversation.removeTypingIndicator(req.user.id);
    }

    // Update user status
    const userStatus = await UserStatus.findOne({ user: req.user.id });
    if (userStatus) {
      await userStatus.setTyping(conversationId, isTyping);
    }

    // Emit socket event
    const io = req.app.get('io');
    conversation.participants.forEach(participantId => {
      if (participantId.toString() !== req.user.id) {
        io.to(participantId.toString()).emit('typing_status', {
          conversationId: conversation._id,
          userId: req.user.id,
          userName: req.user.name,
          isTyping
        });
      }
    });

    res.json({
      success: true,
      data: { isTyping }
    });
  } catch (error) {
    console.error('Set typing status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update typing status'
    });
  }
};

// Forward message (for admin moderation)
exports.forwardMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { toConversationId, note } = req.body;

    if (!req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const originalMessage = await Message.findById(messageId)
      .populate('sender', 'name email avatar');

    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Create forwarded message
    const forwardedMessage = await Message.create({
      conversation: toConversationId,
      sender: req.user.id,
      senderModel: 'User',
      body: originalMessage.body,
      bodyHtml: originalMessage.bodyHtml,
      messageType: originalMessage.messageType,
      attachments: originalMessage.attachments,
      forwardedFrom: originalMessage._id,
      adminNote: note,
      status: 'sent'
    });

    // Update conversation
    const conversation = await Conversation.findById(toConversationId);
    conversation.updateLastMessage(forwardedMessage);
    await conversation.save();

    res.json({
      success: true,
      data: forwardedMessage
    });
  } catch (error) {
    console.error('Forward message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to forward message'
    });
  }
};

// Add admin note to message
exports.addAdminNote = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { note } = req.body;

    if (!req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    message.adminNote = note;
    await message.save();

    // Log admin action
    const conversation = await Conversation.findById(message.conversation);
    conversation.adminActions.push({
      action: 'note_added',
      performedBy: req.user.id,
      details: { messageId, note }
    });
    await conversation.save();

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Add admin note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add admin note'
    });
  }
};

module.exports = exports;