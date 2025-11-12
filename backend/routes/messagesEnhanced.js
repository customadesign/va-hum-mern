const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/hybridAuth');
const { profileCompletionGate } = require('../middleware/profileCompletion');
const messagesController = require('../controllers/messagesController');

// Validation middleware
const validateMessage = [
  body('body').notEmpty().trim().withMessage('Message body is required'),
  body('messageType').optional().isIn(['text', 'image', 'video', 'file', 'audio', 'link', 'emoji', 'sticker']),
  body('attachments').optional().isArray(),
  body('replyTo').optional().isMongoId()
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }
  next();
};

// Get messages for a conversation with enhanced data
// GET /api/messages/enhanced/:conversationId
router.get('/:conversationId', 
  protect, 
  messagesController.getMessages
);

// Send a message with enhanced features (requires 80% profile completion)
// POST /api/messages/enhanced/:conversationId
router.post('/:conversationId',
  protect,
  profileCompletionGate(80),
  validateMessage,
  handleValidationErrors,
  messagesController.sendMessage
);

// Mark messages as read with read receipts
// POST /api/messages/enhanced/:conversationId/read
router.post('/:conversationId/read',
  protect,
  body('messageIds').isArray().withMessage('messageIds must be an array'),
  handleValidationErrors,
  messagesController.markAsRead
);

// Add reaction to a message
// POST /api/messages/enhanced/:messageId/reactions
router.post('/:messageId/reactions',
  protect,
  body('emoji').notEmpty().withMessage('Emoji is required'),
  handleValidationErrors,
  messagesController.addReaction
);

// Remove reaction from a message
// DELETE /api/messages/enhanced/:messageId/reactions
router.delete('/:messageId/reactions',
  protect,
  messagesController.removeReaction
);

// Edit a message (within 15 minutes)
// PUT /api/messages/enhanced/:messageId
router.put('/:messageId',
  protect,
  body('body').notEmpty().trim().withMessage('Message body is required'),
  handleValidationErrors,
  messagesController.editMessage
);

// Delete a message (soft delete)
// DELETE /api/messages/enhanced/:messageId
router.delete('/:messageId',
  protect,
  body('forEveryone').optional().isBoolean(),
  messagesController.deleteMessage
);

// Set typing status in a conversation
// POST /api/messages/enhanced/:conversationId/typing
router.post('/:conversationId/typing',
  protect,
  body('isTyping').isBoolean().withMessage('isTyping must be a boolean'),
  handleValidationErrors,
  messagesController.setTypingStatus
);

// Admin routes for moderation

// Forward a message (admin only)
// POST /api/messages/enhanced/:messageId/forward
router.post('/:messageId/forward',
  protect,
  body('toConversationId').isMongoId().withMessage('Valid conversation ID required'),
  body('note').optional().isString(),
  handleValidationErrors,
  messagesController.forwardMessage
);

// Add admin note to a message (admin only)
// POST /api/messages/enhanced/:messageId/admin-note
router.post('/:messageId/admin-note',
  protect,
  body('note').notEmpty().withMessage('Note is required'),
  handleValidationErrors,
  messagesController.addAdminNote
);

module.exports = router;