const User = require('../models/User');
const VA = require('../models/VA');
const Business = require('../models/Business');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const File = require('../models/File');
const Notification = require('../models/Notification');

// Content moderation flags
const MODERATION_FLAGS = {
  SPAM: 'spam',
  INAPPROPRIATE: 'inappropriate',
  HARASSMENT: 'harassment',
  FAKE_PROFILE: 'fake_profile',
  SCAM: 'scam',
  COPYRIGHT: 'copyright',
  OTHER: 'other'
};

// User activity monitoring
exports.getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const [
      loginHistory,
      messages,
      conversations,
      uploads,
      profileUpdates
    ] = await Promise.all([
      // Get login activity (would need login tracking model)
      User.findById(userId).select('lastLogin loginCount'),
      
      // Get message activity
      Message.find({ 
        sender: userId,
        createdAt: { $gte: startDate }
      }).sort('-createdAt').limit(100),
      
      // Get conversation participation
      Conversation.find({
        participants: userId,
        lastMessageAt: { $gte: startDate }
      }).populate('participants', 'email'),
      
      // Get file uploads
      File.find({
        uploadedBy: userId,
        createdAt: { $gte: startDate }
      }).select('filename mimetype size createdAt'),
      
      // Get profile update history (would need audit log)
      User.findById(userId).select('updatedAt')
    ]);
    
    res.json({
      success: true,
      data: {
        userId,
        period: `${days} days`,
        loginHistory,
        messageCount: messages.length,
        recentMessages: messages.slice(0, 10),
        conversationCount: conversations.length,
        recentConversations: conversations.slice(0, 10),
        uploadCount: uploads.length,
        recentUploads: uploads.slice(0, 10),
        lastProfileUpdate: profileUpdates?.updatedAt
      }
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user activity'
    });
  }
};

// Content moderation queue
exports.getModerationQueue = async (req, res) => {
  try {
    const { 
      type = 'all', // all, messages, profiles, files
      status = 'pending', // pending, reviewed, flagged
      page = 1,
      limit = 20
    } = req.query;
    
    const skip = (page - 1) * limit;
    const query = { moderationStatus: status };
    
    let items = [];
    let total = 0;
    
    if (type === 'messages' || type === 'all') {
      const messages = await Message.find({
        ...query,
        flagged: true
      })
      .populate('sender', 'email')
      .populate('conversation')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);
      
      items = items.concat(messages.map(m => ({
        type: 'message',
        item: m,
        flaggedAt: m.flaggedAt,
        flags: m.flags
      })));
      
      total += await Message.countDocuments({
        ...query,
        flagged: true
      });
    }
    
    if (type === 'profiles' || type === 'all') {
      const profiles = await VA.find({
        ...query,
        'moderation.flagged': true
      })
      .populate('user', 'email')
      .sort('-moderation.flaggedAt')
      .skip(skip)
      .limit(limit);
      
      items = items.concat(profiles.map(p => ({
        type: 'profile',
        item: p,
        flaggedAt: p.moderation?.flaggedAt,
        flags: p.moderation?.flags
      })));
      
      total += await VA.countDocuments({
        ...query,
        'moderation.flagged': true
      });
    }
    
    if (type === 'files' || type === 'all') {
      const files = await File.find({
        ...query,
        'moderation.flagged': true
      })
      .populate('uploadedBy', 'email')
      .sort('-moderation.flaggedAt')
      .skip(skip)
      .limit(limit);
      
      items = items.concat(files.map(f => ({
        type: 'file',
        item: f,
        flaggedAt: f.moderation?.flaggedAt,
        flags: f.moderation?.flags
      })));
      
      total += await File.countDocuments({
        ...query,
        'moderation.flagged': true
      });
    }
    
    // Sort combined results by flagged date
    items.sort((a, b) => (b.flaggedAt || 0) - (a.flaggedAt || 0));
    
    res.json({
      success: true,
      data: {
        items: items.slice(0, limit),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get moderation queue error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve moderation queue'
    });
  }
};

// Flag content for review
exports.flagContent = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const { reason, details, severity = 'medium' } = req.body;
    
    let content;
    
    switch (contentType) {
      case 'message':
        content = await Message.findById(contentId);
        if (content) {
          content.flagged = true;
          content.flags = content.flags || [];
          content.flags.push({
            reason,
            details,
            severity,
            flaggedBy: req.user._id,
            flaggedAt: new Date()
          });
          content.moderationStatus = 'pending';
          await content.save();
        }
        break;
        
      case 'profile':
        content = await VA.findById(contentId);
        if (content) {
          content.moderation = content.moderation || {};
          content.moderation.flagged = true;
          content.moderation.flags = content.moderation.flags || [];
          content.moderation.flags.push({
            reason,
            details,
            severity,
            flaggedBy: req.user._id,
            flaggedAt: new Date()
          });
          content.moderation.status = 'pending';
          await content.save();
        }
        break;
        
      case 'file':
        content = await File.findById(contentId);
        if (content) {
          content.moderation = content.moderation || {};
          content.moderation.flagged = true;
          content.moderation.flags = content.moderation.flags || [];
          content.moderation.flags.push({
            reason,
            details,
            severity,
            flaggedBy: req.user._id,
            flaggedAt: new Date()
          });
          content.moderation.status = 'pending';
          await content.save();
        }
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid content type'
        });
    }
    
    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }
    
    // Create notification for admins
    const admins = await User.find({ admin: true });
    for (const admin of admins) {
      await Notification.create({
        recipient: admin._id,
        type: 'moderation_flag',
        title: `Content flagged for review`,
        message: `${contentType} flagged as ${reason}`,
        data: {
          contentType,
          contentId,
          reason,
          severity
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Content flagged for review'
    });
  } catch (error) {
    console.error('Flag content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to flag content'
    });
  }
};

// Review flagged content
exports.reviewContent = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const { 
      action, // approve, remove, warn, suspend
      notes,
      banDuration // for suspend action
    } = req.body;
    
    let content;
    let contentOwner;
    
    switch (contentType) {
      case 'message':
        content = await Message.findById(contentId).populate('sender');
        contentOwner = content?.sender;
        break;
      case 'profile':
        content = await VA.findById(contentId).populate('user');
        contentOwner = content?.user;
        break;
      case 'file':
        content = await File.findById(contentId).populate('uploadedBy');
        contentOwner = content?.uploadedBy;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid content type'
        });
    }
    
    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }
    
    // Take action based on review
    switch (action) {
      case 'approve':
        // Clear flags and approve content
        if (contentType === 'message') {
          content.flagged = false;
          content.moderationStatus = 'approved';
        } else {
          content.moderation.flagged = false;
          content.moderation.status = 'approved';
        }
        await content.save();
        break;
        
      case 'remove':
        // Remove or soft delete content
        if (contentType === 'message') {
          content.deleted = true;
          content.deletedBy = req.user._id;
          content.deletedAt = new Date();
        } else if (contentType === 'file') {
          await content.softDelete();
        } else if (contentType === 'profile') {
          content.status = 'removed';
          content.moderation.removedAt = new Date();
          content.moderation.removedBy = req.user._id;
        }
        await content.save();
        
        // Notify content owner
        if (contentOwner) {
          await Notification.create({
            recipient: contentOwner._id,
            type: 'content_removed',
            title: 'Content Removed',
            message: `Your ${contentType} has been removed for violating community guidelines`,
            priority: 'high'
          });
        }
        break;
        
      case 'warn':
        // Issue warning to user
        if (contentOwner) {
          contentOwner.warnings = contentOwner.warnings || [];
          contentOwner.warnings.push({
            reason: 'Content violation',
            details: notes,
            issuedAt: new Date(),
            issuedBy: req.user._id
          });
          await contentOwner.save();
          
          await Notification.create({
            recipient: contentOwner._id,
            type: 'warning',
            title: 'Community Guidelines Warning',
            message: notes || 'You have received a warning for violating community guidelines',
            priority: 'high'
          });
        }
        break;
        
      case 'suspend':
        // Suspend user account
        if (contentOwner) {
          contentOwner.suspended = true;
          contentOwner.suspendedAt = new Date();
          contentOwner.suspendedUntil = banDuration 
            ? new Date(Date.now() + banDuration * 24 * 60 * 60 * 1000)
            : null;
          contentOwner.suspensionReason = notes;
          await contentOwner.save();
          
          await Notification.create({
            recipient: contentOwner._id,
            type: 'account_suspended',
            title: 'Account Suspended',
            message: `Your account has been suspended${banDuration ? ` for ${banDuration} days` : ''}`,
            priority: 'critical'
          });
        }
        break;
    }
    
    // Log moderation action
    if (contentType === 'message') {
      content.moderationLog = content.moderationLog || [];
      content.moderationLog.push({
        action,
        notes,
        moderator: req.user._id,
        timestamp: new Date()
      });
    } else {
      content.moderation.log = content.moderation.log || [];
      content.moderation.log.push({
        action,
        notes,
        moderator: req.user._id,
        timestamp: new Date()
      });
    }
    await content.save();
    
    res.json({
      success: true,
      message: `Content ${action} successfully`
    });
  } catch (error) {
    console.error('Review content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to review content'
    });
  }
};

// Bulk moderation actions
exports.bulkModeration = async (req, res) => {
  try {
    const { items, action, notes } = req.body;
    
    const results = [];
    
    for (const item of items) {
      try {
        const reviewReq = {
          params: { 
            contentType: item.type, 
            contentId: item.id 
          },
          body: { action, notes },
          user: req.user
        };
        
        // Process each item
        await exports.reviewContent(reviewReq, {
          json: (data) => results.push({ ...item, result: data }),
          status: () => ({ json: (data) => results.push({ ...item, error: data }) })
        });
      } catch (error) {
        results.push({ ...item, error: error.message });
      }
    }
    
    res.json({
      success: true,
      results,
      summary: {
        total: items.length,
        successful: results.filter(r => r.result?.success).length,
        failed: results.filter(r => r.error).length
      }
    });
  } catch (error) {
    console.error('Bulk moderation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk moderation'
    });
  }
};

// Get moderation statistics
exports.getModerationStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    const [
      totalFlags,
      pendingReview,
      approvedContent,
      removedContent,
      warningsIssued,
      suspensions
    ] = await Promise.all([
      // Total flagged content
      Message.countDocuments({ flagged: true }),
      
      // Pending review
      Message.countDocuments({ 
        flagged: true, 
        moderationStatus: 'pending' 
      }),
      
      // Approved after review
      Message.countDocuments({ 
        moderationStatus: 'approved',
        ...(dateFilter && { 'moderationLog.timestamp': dateFilter })
      }),
      
      // Removed content
      Message.countDocuments({ 
        deleted: true,
        ...(dateFilter && { deletedAt: dateFilter })
      }),
      
      // Warnings issued
      User.countDocuments({
        'warnings.0': { $exists: true },
        ...(dateFilter && { 'warnings.issuedAt': dateFilter })
      }),
      
      // Account suspensions
      User.countDocuments({
        suspended: true,
        ...(dateFilter && { suspendedAt: dateFilter })
      })
    ]);
    
    // Get top violation reasons
    const flagReasons = await Message.aggregate([
      { $match: { flagged: true } },
      { $unwind: '$flags' },
      { $group: { 
        _id: '$flags.reason',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    res.json({
      success: true,
      data: {
        overview: {
          totalFlags,
          pendingReview,
          approvedContent,
          removedContent,
          warningsIssued,
          suspensions
        },
        topViolations: flagReasons,
        responseTime: {
          average: '2.5 hours', // Would calculate from actual data
          median: '1.8 hours'
        }
      }
    });
  } catch (error) {
    console.error('Get moderation stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve moderation statistics'
    });
  }
};

// Automated content scanning (placeholder for ML integration)
exports.scanContent = async (req, res) => {
  try {
    const { content, type } = req.body;
    
    // Placeholder for content scanning logic
    // In production, this would integrate with ML services like:
    // - AWS Rekognition for images
    // - AWS Comprehend for text analysis
    // - Custom trained models for specific violations
    
    const scanResults = {
      safe: true,
      confidence: 0.95,
      flags: [],
      suggestions: []
    };
    
    // Simple keyword-based scanning (replace with ML)
    const inappropriateKeywords = ['spam', 'scam', 'fake'];
    const lowerContent = content.toLowerCase();
    
    for (const keyword of inappropriateKeywords) {
      if (lowerContent.includes(keyword)) {
        scanResults.safe = false;
        scanResults.flags.push({
          type: 'keyword_match',
          keyword,
          severity: 'medium'
        });
      }
    }
    
    res.json({
      success: true,
      data: scanResults
    });
  } catch (error) {
    console.error('Scan content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scan content'
    });
  }
};

module.exports = exports;