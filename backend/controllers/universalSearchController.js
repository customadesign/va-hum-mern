const User = require('../models/User');
const VA = require('../models/VA');
const Business = require('../models/Business');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const SiteConfig = require('../models/SiteConfig');
const Conversation = require('../models/Conversation');
const mongoose = require('mongoose');

/**
 * Universal search controller for admin panel
 * Searches across multiple collections and returns categorized results
 */
class UniversalSearchController {
  /**
   * Perform universal search across multiple collections
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async search(req, res) {
    try {
      const { query, limit = 5, page = 1 } = req.query;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Search query must be at least 2 characters long'
        });
      }

      const searchTerm = query.trim();
      const regex = new RegExp(searchTerm, 'i'); // Case-insensitive regex

      // Execute searches in parallel for better performance
      const [
        vaResults,
        businessResults,
        userResults,
        messageResults,
        notificationResults,
        conversationResults
      ] = await Promise.all([
        this.searchVAs(regex, limit),
        this.searchBusinesses(regex, limit),
        this.searchUsers(regex, limit),
        this.searchMessages(regex, limit),
        this.searchNotifications(regex, limit),
        this.searchConversations(regex, limit)
      ]);

      // Combine and format results
      const results = {
        vas: this.formatVAResults(vaResults),
        businesses: this.formatBusinessResults(businessResults),
        users: this.formatUserResults(userResults),
        messages: this.formatMessageResults(messageResults),
        notifications: this.formatNotificationResults(notificationResults),
        conversations: this.formatConversationResults(conversationResults),
        totalResults:
          vaResults.length +
          businessResults.length +
          userResults.length +
          messageResults.length +
          notificationResults.length +
          conversationResults.length
      };

      console.log('🔍 Search Results for query:', searchTerm);
      console.log('📊 VA Results:', results.vas);
      console.log('🏢 Business Results:', results.businesses);
      console.log('👥 User Results:', results.users);

      res.json({
        success: true,
        data: results,
        query: searchTerm
      });
    } catch (error) {
      console.error('Universal search error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform search',
        details: error.message
      });
    }
  }

  /**
   * Search VAs collection
   */
  async searchVAs(regex, limit) {
    try {
      return await VA.find({
        $or: [
          { name: regex },
          { email: regex },
          { skills: { $in: [regex] } },
          { bio: regex },
          { 'experience.title': regex },
          { 'experience.company': regex }
        ]
      })
      .select('name email skills avatar hourlyRate status')
      .limit(limit)
      .lean();
    } catch (error) {
      console.error('VA search error:', error);
      return [];
    }
  }

  /**
   * Search Businesses collection
   */
  async searchBusinesses(regex, limit) {
    try {
      return await Business.find({
        $or: [
          { name: regex },
          { email: regex },
          { industry: regex },
          { description: regex },
          { contactPerson: regex }
        ]
      })
      .select('name email industry logo contactPerson status')
      .limit(limit)
      .lean();
    } catch (error) {
      console.error('Business search error:', error);
      return [];
    }
  }

  /**
   * Search Users collection
   */
  async searchUsers(regex, limit) {
    try {
      return await User.find({
        $or: [
          { name: regex },
          { email: regex },
          { firstName: regex },
          { lastName: regex },
          { displayName: regex },
          { bio: regex }
        ]
      })
      .select('name email firstName lastName displayName avatar role admin')
      .limit(limit)
      .lean();
    } catch (error) {
      console.error('User search error:', error);
      return [];
    }
  }

  /**
   * Search Messages collection
   */
  async searchMessages(regex, limit) {
    try {
      return await Message.find({
        content: regex
      })
      .populate('sender', 'name email')
      .populate('conversation', 'title')
      .select('content sender conversation createdAt')
      .limit(limit)
      .sort('-createdAt')
      .lean();
    } catch (error) {
      console.error('Message search error:', error);
      return [];
    }
  }

  /**
   * Search Notifications collection
   */
  async searchNotifications(regex, limit) {
    try {
      return await Notification.find({
        $or: [
          { title: regex },
          { content: regex }, // Changed from 'message' to 'content' to avoid ObjectId field
          { type: regex }
        ]
      })
      .populate('recipient', 'name email')
      .select('title content message type recipient read createdAt')
      .limit(limit)
      .sort('-createdAt')
      .lean();
    } catch (error) {
      console.error('Notification search error:', error);
      return [];
    }
  }

  /**
   * Search Conversations collection
   */
  async searchConversations(regex, limit) {
    try {
      return await Conversation.find({
        $or: [
          { title: regex },
          { description: regex }
        ]
      })
      .populate('participants.user', 'name email')
      .select('title description participants createdAt')
      .limit(limit)
      .sort('-updatedAt')
      .lean();
    } catch (error) {
      console.error('Conversation search error:', error);
      return [];
    }
  }

  /**
   * Format VA results for frontend
   */
  formatVAResults(vas) {
    return vas.map(va => ({
      id: va._id,
      type: 'va',
      title: va.name || 'Unnamed VA',
      description: `${va.email} - ${va.skills ? va.skills.slice(0, 3).join(', ') : 'No skills listed'}`,
      meta: {
        hourlyRate: va.hourlyRate,
        status: va.status
      },
      link: `/vas?highlight=${va._id}&search=${encodeURIComponent(va.name)}`,
      avatar: va.avatar
    }));
  }

  /**
   * Format Business results for frontend
   */
  formatBusinessResults(businesses) {
    return businesses.map(business => ({
      id: business._id,
      type: 'business',
      title: business.name || 'Unnamed Business',
      description: `${business.industry || 'No industry'} - ${business.contactPerson || business.email}`,
      meta: {
        status: business.status
      },
      link: `/business-management?highlight=${business._id}&search=${encodeURIComponent(business.name || business.company || business.email)}`,
      avatar: business.logo
    }));
  }

  /**
   * Format User results for frontend
   */
  formatUserResults(users) {
    return users.map(user => ({
      id: user._id,
      type: 'user',
      title: user.displayName || user.name || `${user.firstName} ${user.lastName}`.trim() || 'Unnamed User',
      description: `${user.email} - ${user.admin ? 'Admin' : user.role || 'User'}`,
      meta: {
        isAdmin: user.admin,
        role: user.role
      },
      link: `/users?highlight=${user._id}&search=${encodeURIComponent(user.displayName || user.name || user.email)}`,
      avatar: user.avatar
    }));
  }

  /**
   * Format Message results for frontend
   */
  formatMessageResults(messages) {
    return messages.map(message => ({
      id: message._id,
      type: 'message',
      title: `Message from ${message.sender?.name || 'Unknown'}`,
      description: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
      meta: {
        conversationId: message.conversation?._id,
        conversationTitle: message.conversation?.title,
        createdAt: message.createdAt
      },
      link: `/intercepted-messages?conversation=${message.conversation?._id}`,
      avatar: null
    }));
  }

  /**
   * Format Notification results for frontend
   */
  formatNotificationResults(notifications) {
    return notifications.map(notification => ({
      id: notification._id,
      type: 'notification',
      title: notification.title || 'Notification',
      description: notification.message.substring(0, 100) + (notification.message.length > 100 ? '...' : ''),
      meta: {
        type: notification.type,
        read: notification.read,
        recipient: notification.recipient?.name,
        createdAt: notification.createdAt
      },
      link: `/notifications`,
      avatar: null
    }));
  }

  /**
   * Format Conversation results for frontend
   */
  formatConversationResults(conversations) {
    return conversations.map(conversation => ({
      id: conversation._id,
      type: 'conversation',
      title: conversation.title || 'Untitled Conversation',
      description: conversation.description || `${conversation.participants?.length || 0} participants`,
      meta: {
        participantCount: conversation.participants?.length || 0,
        createdAt: conversation.createdAt
      },
      link: `/intercepted-messages?conversation=${conversation._id}`,
      avatar: null
    }));
  }

  /**
   * Create text indexes for better search performance
   * This should be called once during setup
   */
  async createTextIndexes() {
    try {
      // Create text indexes for each collection
      await VA.collection.createIndex({ 
        name: 'text', 
        email: 'text', 
        bio: 'text',
        skills: 'text'
      });

      await Business.collection.createIndex({ 
        name: 'text', 
        email: 'text', 
        industry: 'text',
        description: 'text'
      });

      await User.collection.createIndex({ 
        name: 'text', 
        email: 'text', 
        firstName: 'text',
        lastName: 'text',
        bio: 'text'
      });

      await Message.collection.createIndex({ 
        content: 'text' 
      });

      await Notification.collection.createIndex({ 
        title: 'text',
        message: 'text'
      });

      await Conversation.collection.createIndex({ 
        title: 'text',
        description: 'text'
      });

      console.log('Text indexes created successfully');
      return { success: true };
    } catch (error) {
      console.error('Error creating text indexes:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new UniversalSearchController();