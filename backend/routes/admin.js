const express = require('express');
const router = express.Router();
const User = require('../models/User');
const VA = require('../models/VA');
const Business = require('../models/Business');
const Conversation = require('../models/Conversation');
const SiteConfig = require('../models/SiteConfig');
// HYBRID AUTH: Support both Clerk and legacy JWT during migration
const { protect, authorize } = require('../middleware/hybridAuth');

// All routes require admin authorization
router.use(protect, authorize('admin'));

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Private/Admin
router.get('/stats', async (req, res) => {
  try {
    const [
      totalVAs,
      activeVAs,
      totalBusinesses,
      pendingApprovals
    ] = await Promise.all([
      VA.countDocuments(),
      VA.countDocuments({ searchStatus: { $in: ['actively_looking', 'open'] } }),
      Business.countDocuments(),
      VA.countDocuments({ status: 'pending' })
    ]);

    const recentActivity = await VA.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name createdAt')
      .lean()
      .then(vas => vas.map(va => ({
        title: `New VA registered: ${va.name}`,
        description: `${va.name} joined the platform`,
        createdAt: va.createdAt
      })));

    res.json({
      success: true,
      data: {
        totalVAs,
        activeVAs,
        totalBusinesses,
        pendingApprovals,
        totalRevenue: 0, // Placeholder
        activeContracts: 0, // Placeholder
        recentActivity
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

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private/Admin
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalVAs,
      totalBusinesses,
      activeConversations,
      newUsersToday,
      newVAsToday,
      newBusinessesToday
    ] = await Promise.all([
      User.countDocuments(),
      VA.countDocuments(),
      Business.countDocuments(),
      Conversation.countDocuments({ 
        lastMessageAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      User.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      VA.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      Business.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalVAs,
        totalBusinesses,
        activeConversations,
        newUsersToday,
        newVAsToday,
        newBusinessesToday
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

// @route   GET /api/admin/users
// @desc    Get all users (with filters)
// @access  Private/Admin
router.get('/users', async (req, res) => {
  try {
    const { 
      search, 
      role, 
      suspended, 
      page = 1, 
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    const query = {};
    
    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }
    
    if (role === 'va') {
      query.va = { $exists: true };
    } else if (role === 'business') {
      query.business = { $exists: true };
    } else if (role === 'admin') {
      query.admin = true;
    }
    
    if (suspended === 'true') {
      query.suspended = true;
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .populate('va', 'name')
        .populate('business', 'company')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: users,
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

// @route   PUT /api/admin/users/:id/suspend
// @desc    Suspend/unsuspend user
// @access  Private/Admin
router.put('/users/:id/suspend', async (req, res) => {
  try {
    const { suspended } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { suspended },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/admin/users/:id/admin
// @desc    Grant/revoke admin privileges
// @access  Private/Admin
router.put('/users/:id/admin', async (req, res) => {
  try {
    const { admin } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { admin },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/admin/config
// @desc    Get site configuration
// @access  Private/Admin
router.get('/config', async (req, res) => {
  try {
    const configs = await SiteConfig.find({ isEditable: true });
    
    const configMap = {};
    for (const config of configs) {
      configMap[config.key] = {
        value: await SiteConfig.getValue(config.key),
        category: config.category,
        description: config.description,
        valueType: config.valueType
      };
    }

    res.json({
      success: true,
      data: configMap
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/admin/config
// @desc    Update site configuration
// @access  Private/Admin
router.put('/config', async (req, res) => {
  try {
    const { configs } = req.body;

    for (const [key, value] of Object.entries(configs)) {
      await SiteConfig.setValue(key, value);
    }

    res.json({
      success: true,
      message: 'Configuration updated successfully'
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