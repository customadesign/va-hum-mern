const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { protect } = require('../middleware/hybridAuth');
const { profileCompletionGate } = require('../middleware/profileCompletion');
const conversationsController = require('../controllers/conversationsController');

// Validation middleware
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

// Get all conversations with enhanced messenger data
// GET /api/conversations/enhanced
router.get('/',
  protect,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['active', 'archived', 'all']),
    query('sortBy').optional().isIn(['lastMessageAt', 'unread', 'pinned'])
  ],
  handleValidationErrors,
  conversationsController.getConversations
);

// Get single conversation with full details
// GET /api/conversations/enhanced/:conversationId
router.get('/:conversationId',
  protect,
  conversationsController.getConversation
);

// Start or get existing conversation (requires 80% profile completion)
// POST /api/conversations/enhanced/start
router.post('/start',
  protect,
  profileCompletionGate(80),
  [
    body('recipientId').optional().isMongoId(),
    body('vaId').optional().isMongoId(),
    body('businessId').optional().isMongoId(),
    body('message').optional().trim()
  ],
  handleValidationErrors,
  conversationsController.startConversation
);

// Update conversation settings (theme, emoji, mute, pin, etc.)
// PUT /api/conversations/enhanced/:conversationId/settings
router.put('/:conversationId/settings',
  protect,
  [
    body('theme').optional().isString(),
    body('emoji').optional().isString(),
    body('nickname').optional().isString(),
    body('mute').optional().isBoolean(),
    body('muteUntil').optional().isISO8601(),
    body('pin').optional().isBoolean()
  ],
  handleValidationErrors,
  conversationsController.updateConversationSettings
);

// Archive a conversation
// PUT /api/conversations/enhanced/:conversationId/archive
router.put('/:conversationId/archive',
  protect,
  conversationsController.archiveConversation
);

// Unarchive a conversation
// PUT /api/conversations/enhanced/:conversationId/unarchive
router.put('/:conversationId/unarchive',
  protect,
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const Conversation = require('../models/Conversation');
      
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

      conversation.status = 'active';
      await conversation.save();

      res.json({
        success: true,
        data: conversation
      });
    } catch (error) {
      console.error('Unarchive conversation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unarchive conversation'
      });
    }
  }
);

// Block a conversation (admin only)
// PUT /api/conversations/enhanced/:conversationId/block
router.put('/:conversationId/block',
  protect,
  body('reason').optional().isString(),
  handleValidationErrors,
  conversationsController.blockConversation
);

// Get unread message counts
// GET /api/conversations/enhanced/unread/counts
router.get('/unread/counts',
  protect,
  conversationsController.getUnreadCounts
);

// Search conversations
// GET /api/conversations/enhanced/search
router.get('/search',
  protect,
  [
    query('q').notEmpty().withMessage('Search query required'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { q, page = 1, limit = 20 } = req.query;
      const Conversation = require('../models/Conversation');
      const Message = require('../models/Message');
      
      // Build search query
      const searchRegex = new RegExp(q, 'i');
      
      // Search in messages
      const messageMatches = await Message.find({
        body: searchRegex
      }).distinct('conversation');

      // Search in conversations (by participant names)
      const conversationQuery = {
        $or: [
          { _id: { $in: messageMatches } },
          { 'participants.name': searchRegex },
          { 'participants.email': searchRegex }
        ]
      };

      // Add user filter
      if (!req.user.admin) {
        conversationQuery.participants = req.user.id;
        if (req.user.role === 'va') {
          conversationQuery.isIntercepted = { $ne: true };
        }
      }

      const skip = (page - 1) * limit;
      
      const [conversations, total] = await Promise.all([
        Conversation.find(conversationQuery)
          .populate('participants', 'name email avatar')
          .populate('va.user', 'name email avatar')
          .populate('business.user', 'name email avatar')
          .sort('-lastMessageAt')
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Conversation.countDocuments(conversationQuery)
      ]);

      res.json({
        success: true,
        data: {
          conversations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Search conversations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search conversations'
      });
    }
  }
);

module.exports = router;