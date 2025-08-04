const User = require('../models/User');

// Dashboard analytics data
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Mock analytics data for now - in a real app you'd query from actual data
    let analytics = {
      activeConversations: 0,
      profileViews: 0,
      contactsMade: 0,
      totalEarnings: 0,
      completedProjects: 0,
      averageRating: 0,
      responseTime: '0 hours'
    };

    // For VAs, focus on profile views and conversations
    if (user.accountType === 'va') {
      analytics = {
        ...analytics,
        profileViews: Math.floor(Math.random() * 50), // Mock data - replace with real queries
        activeConversations: Math.floor(Math.random() * 5),
        totalEarnings: Math.floor(Math.random() * 10000),
        employersWorkedWith: Math.floor(Math.random() * 8), // Number of different employers/clients
        averageRating: (4 + Math.random()).toFixed(1),
        responseTime: '2 hours'
      };
    } else {
      // For businesses, focus on contacts made and VA interactions  
      analytics = {
        ...analytics,
        contactsMade: Math.floor(Math.random() * 25),
        activeConversations: Math.floor(Math.random() * 8),
        totalSpent: Math.floor(Math.random() * 15000),
        activeProjects: Math.floor(Math.random() * 10),
        averageProjectValue: Math.floor(Math.random() * 2000)
      };
    }

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Error fetching dashboard analytics:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics data',
      details: error.message
    });
  }
};

// Profile views analytics (for VAs)
exports.getProfileViews = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Mock data - in real app, you'd track actual profile views
    const viewsData = {
      totalViews: Math.floor(Math.random() * 200),
      thisWeek: Math.floor(Math.random() * 25),
      thisMonth: Math.floor(Math.random() * 80),
      recentViews: Array.from({length: 7}, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        views: Math.floor(Math.random() * 10)
      })).reverse()
    };

    res.json({
      success: true,
      profileViews: viewsData
    });

  } catch (error) {
    console.error('Error fetching profile views:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile views data',
      details: error.message
    });
  }
};

// Conversation analytics
exports.getConversationAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Mock data - in real app, you'd query actual conversation data
    const conversationData = {
      activeConversations: Math.floor(Math.random() * 10),
      totalConversations: Math.floor(Math.random() * 50),
      averageResponseTime: '3 hours',
      unreadMessages: Math.floor(Math.random() * 5),
      recentActivity: Array.from({length: 5}, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        conversations: Math.floor(Math.random() * 3),
        messages: Math.floor(Math.random() * 10)
      })).reverse()
    };

    res.json({
      success: true,
      conversations: conversationData
    });

  } catch (error) {
    console.error('Error fetching conversation analytics:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation analytics',
      details: error.message
    });
  }
};