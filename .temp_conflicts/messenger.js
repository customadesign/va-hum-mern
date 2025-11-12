/**
 * Messenger Routes with Server-Side Aggregation
 * Tasks 45/46: Enriched conversation and message endpoints
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Business = require('../models/Business');
const VA = require('../models/VA');
const User = require('../models/User');
const { protect } = require('../middleware/hybridAuth');

/**
 * GET /api/messenger/conversations/:id
 * Returns enriched conversation with business and VA names via aggregation
 */
router.get('/conversations/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid conversation ID'
      });
    }

    // Aggregation pipeline to enrich conversation with business/VA names
    const result = await Conversation.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) }
      },
      // Lookup business info
      {
        $lookup: {
          from: 'users',
          localField: 'business',
          foreignField: '_id',
          as: 'businessUser'
        }
      },
      {
        $unwind: { path: '$businessUser', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'businesses',
          localField: 'businessUser._id',
          foreignField: 'user',
          as: 'businessProfile'
        }
      },
      {
        $unwind: { path: '$businessProfile', preserveNullAndEmptyArrays: true }
      },
      // Lookup VA info
      {
        $lookup: {
          from: 'users',
          localField: 'va',
          foreignField: '_id',
          as: 'vaUser'
        }
      },
      {
        $unwind: { path: '$vaUser', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'vas',
          localField: 'vaUser._id',
          foreignField: 'user',
          as: 'vaProfile'
        }
      },
      {
        $unwind: { path: '$vaProfile', preserveNullAndEmptyArrays: true }
      },
      // Project to desired shape
      {
        $project: {
          id: '$_id',
          businessId: '$business',
          businessName: {
            $ifNull: [
              '$businessProfile.company',
              { $ifNull: ['$businessProfile.contactName', null] }
            ]
          },
          vaId: '$va',
          vaName: {
            $ifNull: [
              '$vaProfile.name',
              { $ifNull: ['$vaUser.name', null] }
            ]
          },
          participants: 1,
          type: 1,
          lastMessage: 1,
          lastMessageAt: 1,
          status: 1,
          unreadCount: 1,
          isIntercepted: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ]);

    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    const conversation = result[0];

    // Check authorization
    const isAdmin = req.user.admin;
    const isParticipant = conversation.participants?.some(
      p => p.toString() === req.user.id.toString()
    );

    if (!isAdmin && !isParticipant) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this conversation'
      });
    }

    // Log warning if names are missing
    if (!conversation.businessName || !conversation.vaName) {
      console.warn('messenger:missing-names', {
        conversationId: id,
        businessName: conversation.businessName,
        vaName: conversation.vaName
      });
    }

    res.json({
      success: true,
      data: conversation
    });

  } catch (error) {
    console.error('Error fetching enriched conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation'
    });
  }
});

/**
 * GET /api/messenger/conversations/:id/messages
 * Returns enriched messages with business and VA names via aggregation
 * Query params: limit (default 50, max 100), before (createdAt cursor for pagination)
 */
router.get('/conversations/:id/messages', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const before = req.query.before; // ISO date string

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid conversation ID'
      });
    }

    // First check if user has access to this conversation
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    const isAdmin = req.user.admin;
    const isParticipant = conversation.participants?.some(
      p => p.toString() === req.user.id.toString()
    );

    if (!isAdmin && !isParticipant) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this conversation'
      });
    }

    // Build match criteria
    const matchCriteria = {
      conversation: new mongoose.Types.ObjectId(id)
    };

    if (before) {
      matchCriteria.createdAt = { $lt: new Date(before) };
    }

    // Aggregation pipeline to enrich messages
    const messages = await Message.aggregate([
      {
        $match: matchCriteria
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: limit
      },
      // Lookup conversation to get businessId and vaId
      {
        $lookup: {
          from: 'conversations',
          localField: 'conversation',
          foreignField: '_id',
          as: 'conversationDoc'
        }
      },
      {
        $unwind: { path: '$conversationDoc', preserveNullAndEmptyArrays: true }
      },
      // Lookup business user and profile
      {
        $lookup: {
          from: 'users',
          localField: 'conversationDoc.business',
          foreignField: '_id',
          as: 'businessUser'
        }
      },
      {
        $unwind: { path: '$businessUser', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'businesses',
          localField: 'businessUser._id',
          foreignField: 'user',
          as: 'businessProfile'
        }
      },
      {
        $unwind: { path: '$businessProfile', preserveNullAndEmptyArrays: true }
      },
      // Lookup VA user and profile
      {
        $lookup: {
          from: 'users',
          localField: 'conversationDoc.va',
          foreignField: '_id',
          as: 'vaUser'
        }
      },
      {
        $unwind: { path: '$vaUser', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'vas',
          localField: 'vaUser._id',
          foreignField: 'user',
          as: 'vaProfile'
        }
      },
      {
        $unwind: { path: '$vaProfile', preserveNullAndEmptyArrays: true }
      },
      // Project to desired shape
      {
        $project: {
          id: '$_id',
          conversationId: '$conversation',
          text: { $ifNull: ['$body', ''] },
          body: 1,
          bodyHtml: 1,
          bodyHtmlSafe: 1,
          senderType: 1,
          senderId: 1,
          sender: 1,
          senderModel: 1,
          businessId: '$conversationDoc.business',
          businessName: {
            $ifNull: [
              '$businessProfile.company',
              { $ifNull: ['$businessProfile.contactName', null] }
            ]
          },
          vaId: '$conversationDoc.va',
          vaName: {
            $ifNull: [
              '$vaProfile.name',
              { $ifNull: ['$vaUser.name', null] }
            ]
          },
          timestamps: {
            createdAt: '$createdAt',
            updatedAt: '$updatedAt'
          },
          createdAt: 1,
          updatedAt: 1,
          status: 1,
          messageType: 1,
          attachments: 1,
          readBy: 1,
          isSystem: 1,
          displayedSenderName: 1,
          disguisedAs: 1
        }
      },
      {
        $sort: { createdAt: 1 } // Return in chronological order
      }
    ]);

    // Log warnings for messages missing names
    const messagesWithMissingNames = messages.filter(m => !m.businessName || !m.vaName);
    if (messagesWithMissingNames.length > 0) {
      console.warn('messenger:missing-sender', {
        conversationId: id,
        count: messagesWithMissingNames.length,
        messageIds: messagesWithMissingNames.map(m => m.id)
      });
    }

    res.json({
      success: true,
      data: {
        messages,
        hasMore: messages.length === limit,
        nextCursor: messages.length > 0 ? messages[messages.length - 1].createdAt.toISOString() : null
      }
    });

  } catch (error) {
    console.error('Error fetching enriched messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
});

module.exports = router;