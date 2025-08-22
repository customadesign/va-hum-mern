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
      query.$or = [
        { email: { $regex: search, $options: 'i' } }
      ];
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

    let users, total;
    
    if (search) {
      // When searching, we need to use aggregation to search across populated fields
      const aggregationPipeline = [
        {
          $lookup: {
            from: 'vas',
            localField: 'va',
            foreignField: '_id',
            as: 'va'
          }
        },
        {
          $lookup: {
            from: 'businesses',
            localField: 'business',
            foreignField: '_id',
            as: 'business'
          }
        },
        {
          $unwind: {
            path: '$va',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: '$business',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: {
            $and: [
              // Apply role filter
              ...(role === 'va' ? [{ va: { $exists: true } }] :
                  role === 'business' ? [{ business: { $exists: true } }] :
                  role === 'admin' ? [{ admin: true }] : []),
              // Apply suspended filter
              ...(suspended === 'true' ? [{ suspended: true }] : []),
              // Apply search filter
              {
                $or: [
                  { email: { $regex: search, $options: 'i' } },
                  { phone: { $regex: search, $options: 'i' } },
                  { 'va.name': { $regex: search, $options: 'i' } },
                  { 'va.phone': { $regex: search, $options: 'i' } },
                  { 'business.company': { $regex: search, $options: 'i' } },
                  { 'business.contactName': { $regex: search, $options: 'i' } },
                  { 'business.phone': { $regex: search, $options: 'i' } }
                ]
              }
            ]
          }
        },
        {
          $sort: sort === '-createdAt' ? { createdAt: -1 } : { createdAt: 1 }
        }
      ];

      const [usersResult, totalResult] = await Promise.all([
        User.aggregate([
          ...aggregationPipeline,
          { $skip: skip },
          { $limit: parseInt(limit) }
        ]),
        User.aggregate([
          ...aggregationPipeline,
          { $count: 'total' }
        ])
      ]);

      users = usersResult;
      total = totalResult[0]?.total || 0;
    } else {
      // When not searching, use the simpler query
      [users, total] = await Promise.all([
        User.find(query)
          .populate('va', 'name')
          .populate('business', 'company')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        User.countDocuments(query)
      ]);
    }

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

// @route   GET /api/admin/analytics
// @desc    Get comprehensive analytics data
// @access  Private/Admin
router.get('/analytics', async (req, res) => {
  try {
    const { timeRange = '30' } = req.query;
    const days = parseInt(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Platform Overview Stats
    const [
      totalUsers,
      totalVAs,
      totalBusinesses,
      newUsersToday,
      newVAsToday,
      newBusinessesToday
    ] = await Promise.all([
      User.countDocuments(),
      VA.countDocuments(),
      Business.countDocuments(),
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

    // Growth Trends (last 30 days)
    const growthData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const [dailyUsers, dailyVAs, dailyBusinesses] = await Promise.all([
        User.countDocuments({
          createdAt: { $gte: dayStart, $lte: dayEnd }
        }),
        VA.countDocuments({
          createdAt: { $gte: dayStart, $lte: dayEnd }
        }),
        Business.countDocuments({
          createdAt: { $gte: dayStart, $lte: dayEnd }
        })
      ]);

      growthData.push({
        date: dayStart.toISOString().split('T')[0],
        users: dailyUsers,
        vas: dailyVAs,
        businesses: dailyBusinesses
      });
    }

    // VA Analytics
    const vaStatusDistribution = await VA.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const vaLocationDistribution = await VA.aggregate([
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const vaSkillsDistribution = await VA.aggregate([
      { $unwind: '$skills' },
      {
        $group: {
          _id: '$skills',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]);

    // Business Analytics
    const businessIndustryDistribution = await Business.aggregate([
      {
        $group: {
          _id: '$industry',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const businessSizeDistribution = await Business.aggregate([
      {
        $group: {
          _id: '$companySize',
          count: { $sum: 1 }
        }
      }
    ]);

    // User Activity Metrics
    const activeUsersLast7Days = await User.countDocuments({
      lastLoginAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const activeUsersLast30Days = await User.countDocuments({
      lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    // Profile Completion Rates
    const vaProfileCompletion = await VA.aggregate([
      {
        $project: {
          completionScore: {
            $add: [
              { $cond: [{ $ne: ['$name', null] }, 1, 0] },
              { $cond: [{ $ne: ['$bio', null] }, 1, 0] },
              { $cond: [{ $ne: ['$location', null] }, 1, 0] },
              { $cond: [{ $gt: [{ $size: { $ifNull: ['$skills', []] } }, 0] }, 1, 0] },
              { $cond: [{ $ne: ['$avatar', null] }, 1, 0] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgCompletion: { $avg: { $multiply: ['$completionScore', 20] } }
        }
      }
    ]);

    const businessProfileCompletion = await Business.aggregate([
      {
        $project: {
          completionScore: {
            $add: [
              { $cond: [{ $ne: ['$company', null] }, 1, 0] },
              { $cond: [{ $ne: ['$bio', null] }, 1, 0] },
              { $cond: [{ $ne: ['$industry', null] }, 1, 0] },
              { $cond: [{ $ne: ['$companySize', null] }, 1, 0] },
              { $cond: [{ $ne: ['$website', null] }, 1, 0] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgCompletion: { $avg: { $multiply: ['$completionScore', 20] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalVAs,
          totalBusinesses,
          newUsersToday,
          newVAsToday,
          newBusinessesToday,
          activeUsersLast7Days,
          activeUsersLast30Days
        },
        growth: growthData,
        vaAnalytics: {
          statusDistribution: vaStatusDistribution,
          locationDistribution: vaLocationDistribution,
          skillsDistribution: vaSkillsDistribution,
          profileCompletion: vaProfileCompletion[0]?.avgCompletion || 0
        },
        businessAnalytics: {
          industryDistribution: businessIndustryDistribution,
          sizeDistribution: businessSizeDistribution,
          profileCompletion: businessProfileCompletion[0]?.avgCompletion || 0
        }
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

// @route   GET /api/admin/vas
// @desc    Get all VAs for admin management
// @access  Private/Admin
router.get('/vas', async (req, res) => {
  try {
    const {
      search,
      status,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [vas, total] = await Promise.all([
      VA.find(query)
        .populate('user', 'email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      VA.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: vas,
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

// @route   PUT /api/admin/vas/:id
// @desc    Update VA status (admin only)
// @access  Private/Admin
router.put('/vas/:id', async (req, res) => {
  try {
    const va = await VA.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!va) {
      return res.status(404).json({
        success: false,
        error: 'VA not found'
      });
    }

    res.json({
      success: true,
      data: va
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/admin/vas/:id
// @desc    Delete VA (admin only)
// @access  Private/Admin
router.delete('/vas/:id', async (req, res) => {
  try {
    const va = await VA.findById(req.params.id);

    if (!va) {
      return res.status(404).json({
        success: false,
        error: 'VA not found'
      });
    }

    await VA.findByIdAndDelete(req.params.id);

    // Update user reference
    if (va.user) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(va.user, { $unset: { va: 1 } });
    }

    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/admin/businesses
// @desc    Get all businesses for admin management
// @access  Private/Admin
router.get('/businesses', async (req, res) => {
  try {
    const {
      search,
      status,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    const query = {};
    
    if (search) {
      query.$or = [
        { company: { $regex: search, $options: 'i' } },
        { contactName: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [businesses, total] = await Promise.all([
      Business.find(query)
        .populate('user', 'email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Business.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: businesses,
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

// @route   PUT /api/admin/businesses/:id
// @desc    Update business status (admin only)
// @access  Private/Admin
router.put('/businesses/:id', async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    res.json({
      success: true,
      data: business
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/admin/businesses/:id
// @desc    Delete business (admin only)
// @access  Private/Admin
router.delete('/businesses/:id', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    await Business.findByIdAndDelete(req.params.id);

    // Update user reference
    if (business.user) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(business.user, { $unset: { business: 1 } });
    }

    res.json({
      success: true,
      data: {}
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