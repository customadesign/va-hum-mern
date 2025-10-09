const ProfileView = require('../models/ProfileView');
const User = require('../models/User');
const VA = require('../models/VA');

// In-memory cache for query results (60 second TTL)
const cache = new Map();
const CACHE_TTL = 60 * 1000; // 60 seconds

/**
 * Get cache key for a query
 */
function getCacheKey(queryType, params) {
  return `${queryType}:${JSON.stringify(params)}`;
}

/**
 * Get cached result if available and not expired
 */
function getCached(key) {
  const cached = cache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

/**
 * Set cache entry
 */
function setCached(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });

  // Clean up old cache entries periodically
  if (cache.size > 1000) {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (now - v.timestamp > CACHE_TTL) {
        cache.delete(k);
      }
    }
  }
}

/**
 * Track a profile view with deduplication and validation
 * @param {String} vaId - User ID of the VA being viewed
 * @param {Object} viewerData - Data about the viewer
 * @returns {Object} - Result with success status and details
 */
exports.trackView = async (vaId, viewerData) => {
  try {
    // Check if analytics is enabled
    if (process.env.ANALYTICS_PROFILE_VIEWS_ENABLED !== 'true') {
      return {
        success: false,
        error: 'Profile views tracking is disabled',
        tracked: false
      };
    }

    // Validate VA exists and has VA profile
    const vaUser = await User.findById(vaId).populate('va');
    if (!vaUser) {
      return {
        success: false,
        error: 'VA user not found',
        tracked: false
      };
    }

    if (!vaUser.va) {
      return {
        success: false,
        error: 'User is not a VA',
        tracked: false
      };
    }

    // Check if VA profile is public
    const vaProfile = await VA.findById(vaUser.va);
    if (!vaProfile) {
      return {
        success: false,
        error: 'VA profile not found',
        tracked: false
      };
    }

    // Check if profile is invisible
    if (vaProfile.searchStatus === 'invisible') {
      return {
        success: false,
        error: 'Profile is not public',
        tracked: false
      };
    }

    // Reject self-views
    if (viewerData.viewerUser && viewerData.viewerUser.toString() === vaId.toString()) {
      return {
        success: false,
        error: 'Self-views are not tracked',
        tracked: false,
        selfView: true
      };
    }

    // Filter bot user agents
    if (viewerData.userAgent && ProfileView.isBot(viewerData.userAgent)) {
      return {
        success: false,
        error: 'Bot views are not tracked',
        tracked: false,
        bot: true
      };
    }

    // Hash IP if provided
    let ipHash = null;
    if (viewerData.ip) {
      ipHash = ProfileView.hashIp(viewerData.ip);
    }

    // Extract viewer key for deduplication
    const viewerKey = ProfileView.extractViewerKey({
      viewerUser: viewerData.viewerUser,
      anonId: viewerData.anonId,
      ipHash
    });

    // Generate deduplication hash
    const now = Date.now();
    const dedupHash = ProfileView.generateDedupHash(vaId, viewerKey, now);

    // Try to create profile view (will fail if duplicate within time window)
    try {
      const profileView = await ProfileView.create({
        va: vaId,
        viewerUser: viewerData.viewerUser || null,
        anonId: viewerData.anonId || null,
        sessionId: viewerData.sessionId || null,
        referrer: viewerData.referrer || null,
        userAgent: viewerData.userAgent || null,
        ipHash,
        dedupHash,
        createdAt: new Date()
      });

      // Update user stats (increment profile views)
      await User.findByIdAndUpdate(vaId, {
        $inc: { 'stats.profileViews': 1 }
      });

      // Clear cache for this VA
      clearVaCache(vaId);

      return {
        success: true,
        tracked: true,
        view: profileView,
        duplicate: false
      };
    } catch (error) {
      // Check if it's a duplicate key error (expected for deduplication)
      if (error.code === 11000) {
        return {
          success: true,
          tracked: false,
          duplicate: true,
          message: 'View already tracked within time window'
        };
      }
      throw error; // Re-throw other errors
    }
  } catch (error) {
    console.error('Error tracking profile view:', error);
    return {
      success: false,
      error: error.message,
      tracked: false
    };
  }
};

/**
 * Get summary statistics for profile views
 * @param {String} vaId - User ID of the VA
 * @param {Date} from - Start date
 * @param {Date} to - End date
 * @param {Boolean} unique - Count unique viewers only
 * @returns {Object} - Summary statistics
 */
exports.getSummary = async (vaId, from, to, unique = false) => {
  try {
    // Check cache first
    const cacheKey = getCacheKey('summary', { vaId, from, to, unique });
    const cached = getCached(cacheKey);
    if (cached) {
      return { success: true, ...cached, cached: true };
    }

    const query = {
      va: vaId,
      createdAt: { $gte: from, $lte: to }
    };

    let total, uniqueTotal;

    if (unique) {
      // Count unique viewers by grouping on viewer identifier
      const uniqueViewers = await ProfileView.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              $cond: [
                { $ne: ['$viewerUser', null] },
                { type: 'user', id: '$viewerUser' },
                {
                  $cond: [
                    { $ne: ['$anonId', null] },
                    { type: 'anon', id: '$anonId' },
                    { type: 'ip', id: '$ipHash' }
                  ]
                }
              ]
            }
          }
        },
        { $count: 'uniqueCount' }
      ]);

      uniqueTotal = uniqueViewers[0]?.uniqueCount || 0;
      total = uniqueTotal; // For unique mode, total = unique
    } else {
      // Count all views
      total = await ProfileView.countDocuments(query);

      // Also get unique count for comparison
      const uniqueViewers = await ProfileView.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              $cond: [
                { $ne: ['$viewerUser', null] },
                { type: 'user', id: '$viewerUser' },
                {
                  $cond: [
                    { $ne: ['$anonId', null] },
                    { type: 'anon', id: '$anonId' },
                    { type: 'ip', id: '$ipHash' }
                  ]
                }
              ]
            }
          }
        },
        { $count: 'uniqueCount' }
      ]);

      uniqueTotal = uniqueViewers[0]?.uniqueCount || 0;
    }

    // Get first and last view times
    const firstView = await ProfileView.findOne(query).sort({ createdAt: 1 }).select('createdAt');
    const lastView = await ProfileView.findOne(query).sort({ createdAt: -1 }).select('createdAt');

    // Calculate trend (compare with previous period)
    const periodDuration = to - from;
    const previousFrom = new Date(from.getTime() - periodDuration);
    const previousTo = from;

    const previousQuery = {
      va: vaId,
      createdAt: { $gte: previousFrom, $lt: previousTo }
    };

    const previousTotal = await ProfileView.countDocuments(previousQuery);

    let trend = 0;
    if (previousTotal > 0) {
      trend = ((total - previousTotal) / previousTotal) * 100;
    } else if (total > 0) {
      trend = 100; // 100% increase from 0
    }

    const result = {
      total,
      uniqueTotal,
      firstViewAt: firstView?.createdAt || null,
      lastViewAt: lastView?.createdAt || null,
      trend: Math.round(trend * 10) / 10, // Round to 1 decimal place
      period: {
        from,
        to
      }
    };

    // Cache the result
    setCached(cacheKey, result);

    return {
      success: true,
      ...result,
      cached: false
    };
  } catch (error) {
    console.error('Error getting profile views summary:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get time-series data for profile views
 * @param {String} vaId - User ID of the VA
 * @param {Date} from - Start date
 * @param {Date} to - End date
 * @param {String} interval - Time interval: 'hour', 'day', 'week', 'month'
 * @param {Boolean} unique - Count unique viewers only
 * @returns {Object} - Time-series data
 */
exports.getSeries = async (vaId, from, to, interval = 'day', unique = false) => {
  try {
    // Check cache first
    const cacheKey = getCacheKey('series', { vaId, from, to, interval, unique });
    const cached = getCached(cacheKey);
    if (cached) {
      return { success: true, ...cached, cached: true };
    }

    // Determine date format based on interval
    let dateFormat;
    let groupId;

    switch (interval) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00';
        groupId = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' }
        };
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        groupId = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'week':
        dateFormat = '%Y-W%V';
        groupId = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'month':
        dateFormat = '%Y-%m';
        groupId = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      default:
        dateFormat = '%Y-%m-%d';
        groupId = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }

    const query = {
      va: vaId,
      createdAt: { $gte: from, $lte: to }
    };

    let series;

    if (unique) {
      // For unique views, we need to group by viewer first, then by time period
      series = await ProfileView.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              period: groupId,
              viewer: {
                $cond: [
                  { $ne: ['$viewerUser', null] },
                  { type: 'user', id: '$viewerUser' },
                  {
                    $cond: [
                      { $ne: ['$anonId', null] },
                      { type: 'anon', id: '$anonId' },
                      { type: 'ip', id: '$ipHash' }
                    ]
                  }
                ]
              }
            }
          }
        },
        {
          $group: {
            _id: '$_id.period',
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]);
    } else {
      // Count all views by time period
      series = await ProfileView.aggregate([
        { $match: query },
        {
          $group: {
            _id: groupId,
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]);
    }

    // Format the results
    const formattedSeries = series.map(item => ({
      period: item._id,
      count: item.count
    }));

    const result = {
      series: formattedSeries,
      interval,
      period: {
        from,
        to
      }
    };

    // Cache the result
    setCached(cacheKey, result);

    return {
      success: true,
      ...result,
      cached: false
    };
  } catch (error) {
    console.error('Error getting profile views series:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get top referrers for profile views
 * @param {String} vaId - User ID of the VA
 * @param {Date} from - Start date
 * @param {Date} to - End date
 * @param {Number} limit - Maximum number of referrers to return
 * @returns {Object} - Top referrers data
 */
exports.getReferrers = async (vaId, from, to, limit = 10) => {
  try {
    // Check cache first
    const cacheKey = getCacheKey('referrers', { vaId, from, to, limit });
    const cached = getCached(cacheKey);
    if (cached) {
      return { success: true, ...cached, cached: true };
    }

    const query = {
      va: vaId,
      createdAt: { $gte: from, $lte: to },
      referrer: { $ne: null, $ne: '' }
    };

    const referrers = await ProfileView.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$referrer',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          referrer: '$_id',
          count: 1
        }
      }
    ]);

    // Count views with no referrer (direct traffic)
    const directCount = await ProfileView.countDocuments({
      va: vaId,
      createdAt: { $gte: from, $lte: to },
      $or: [
        { referrer: null },
        { referrer: '' }
      ]
    });

    const result = {
      referrers,
      directTraffic: directCount,
      period: {
        from,
        to
      }
    };

    // Cache the result
    setCached(cacheKey, result);

    return {
      success: true,
      ...result,
      cached: false
    };
  } catch (error) {
    console.error('Error getting profile views referrers:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Clear cache for a specific VA
 */
function clearVaCache(vaId) {
  for (const key of cache.keys()) {
    if (key.includes(vaId.toString())) {
      cache.delete(key);
    }
  }
}

module.exports = exports;