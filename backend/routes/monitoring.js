const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, authorize } = require('../middleware/hybridAuth');
const { getHealthCheck } = require('../config/monitoring');

// Performance metrics instance (will be set by server.js)
let performanceMetrics;

// Set the performance metrics instance
router.setMetrics = (metrics) => {
  performanceMetrics = metrics;
};

// @route   GET /api/monitoring/health
// @desc    Get system health status
// @access  Public
router.get('/health', async (req, res) => {
  try {
    const health = await getHealthCheck(mongoose, performanceMetrics);
    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'warning' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// @route   GET /api/monitoring/metrics
// @desc    Get performance metrics
// @access  Private/Admin
router.get('/metrics', protect, authorize('admin'), (req, res) => {
  if (!performanceMetrics) {
    return res.status(503).json({
      success: false,
      error: 'Performance monitoring not initialized'
    });
  }
  
  const metrics = performanceMetrics.getMetrics();
  
  res.json({
    success: true,
    metrics
  });
});

// @route   GET /api/monitoring/database
// @desc    Get database performance metrics
// @access  Private/Admin
router.get('/database', protect, authorize('admin'), async (req, res) => {
  try {
    const dbStats = await mongoose.connection.db.stats();
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    const collectionStats = await Promise.all(
      collections.map(async (col) => {
        const stats = await mongoose.connection.db.collection(col.name).stats();
        return {
          name: col.name,
          count: stats.count,
          size: stats.size,
          avgObjSize: stats.avgObjSize,
          storageSize: stats.storageSize,
          indexes: stats.nindexes
        };
      })
    );
    
    res.json({
      success: true,
      database: {
        name: dbStats.db,
        collections: dbStats.collections,
        objects: dbStats.objects,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes,
        indexSize: dbStats.indexSize,
        collectionStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve database metrics',
      message: error.message
    });
  }
});

// @route   GET /api/monitoring/errors
// @desc    Get error tracking data
// @access  Private/Admin
router.get('/errors', protect, authorize('admin'), (req, res) => {
  if (!performanceMetrics) {
    return res.status(503).json({
      success: false,
      error: 'Performance monitoring not initialized'
    });
  }
  
  const errors = performanceMetrics.metrics.errors;
  
  res.json({
    success: true,
    errors: {
      total: errors.total,
      byType: errors.byType,
      byRoute: errors.byRoute,
      errorRate: errors.total / performanceMetrics.metrics.requests.total || 0
    }
  });
});

// @route   GET /api/monitoring/memory
// @desc    Get memory usage metrics
// @access  Private/Admin
router.get('/memory', protect, authorize('admin'), (req, res) => {
  if (!performanceMetrics) {
    return res.status(503).json({
      success: false,
      error: 'Performance monitoring not initialized'
    });
  }
  
  const current = process.memoryUsage();
  const history = performanceMetrics.metrics.memory;
  
  res.json({
    success: true,
    memory: {
      current: {
        rss: `${(current.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(current.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(current.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        external: `${(current.external / 1024 / 1024).toFixed(2)} MB`,
        arrayBuffers: `${(current.arrayBuffers / 1024 / 1024).toFixed(2)} MB`
      },
      history: history.usage.slice(-60), // Last hour
      leaks: history.leaks
    }
  });
});

// @route   GET /api/monitoring/slow-queries
// @desc    Get slow database queries
// @access  Private/Admin
router.get('/slow-queries', protect, authorize('admin'), (req, res) => {
  if (!performanceMetrics) {
    return res.status(503).json({
      success: false,
      error: 'Performance monitoring not initialized'
    });
  }
  
  const slowQueries = performanceMetrics.metrics.database.slowQueries;
  
  res.json({
    success: true,
    slowQueries: slowQueries.slice(-50), // Last 50 slow queries
    averageQueryTime: performanceMetrics.metrics.database.averageQueryTime,
    totalQueries: performanceMetrics.metrics.database.queries
  });
});

// @route   POST /api/monitoring/reset
// @desc    Reset performance metrics
// @access  Private/Admin
router.post('/reset', protect, authorize('admin'), (req, res) => {
  if (!performanceMetrics) {
    return res.status(503).json({
      success: false,
      error: 'Performance monitoring not initialized'
    });
  }
  
  performanceMetrics.reset();
  
  res.json({
    success: true,
    message: 'Performance metrics reset successfully'
  });
});

// @route   GET /api/monitoring/report
// @desc    Get comprehensive performance report
// @access  Private/Admin
router.get('/report', protect, authorize('admin'), async (req, res) => {
  try {
    const { period = '1h' } = req.query;
    
    const metrics = performanceMetrics.getMetrics();
    const health = await getHealthCheck(mongoose, performanceMetrics);
    
    // Calculate period-specific metrics
    const now = Date.now();
    const periodMs = period === '1h' ? 3600000 :
                    period === '24h' ? 86400000 :
                    period === '7d' ? 604800000 : 3600000;
    
    const recentRequests = metrics.requests.responseTimes.filter((_, idx) => {
      return idx >= metrics.requests.responseTimes.length - (periodMs / 60000);
    });
    
    const report = {
      period,
      generatedAt: new Date(),
      summary: {
        status: health.status,
        uptime: `${Math.floor(metrics.uptime / 3600)} hours`,
        totalRequests: metrics.requests.total,
        successRate: `${((metrics.requests.successful / metrics.requests.total) * 100).toFixed(2)}%`,
        averageResponseTime: `${metrics.requests.averageResponseTime.toFixed(2)}ms`,
        totalDatabaseQueries: metrics.database.queries,
        averageQueryTime: `${metrics.database.averageQueryTime.toFixed(2)}ms`,
        memoryUsage: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
        errorRate: `${((metrics.errors.total / metrics.requests.total) * 100).toFixed(2)}%`
      },
      performance: {
        requests: {
          total: metrics.requests.total,
          successful: metrics.requests.successful,
          failed: metrics.requests.failed,
          averageResponseTime: metrics.requests.averageResponseTime,
          p95ResponseTime: calculatePercentile(metrics.requests.responseTimes, 95),
          p99ResponseTime: calculatePercentile(metrics.requests.responseTimes, 99)
        },
        database: {
          totalQueries: metrics.database.queries,
          averageQueryTime: metrics.database.averageQueryTime,
          slowQueries: metrics.database.slowQueries.length,
          p95QueryTime: calculatePercentile(metrics.database.queryTimes, 95),
          p99QueryTime: calculatePercentile(metrics.database.queryTimes, 99)
        }
      },
      issues: [],
      recommendations: []
    };
    
    // Add issues and recommendations
    if (health.status !== 'healthy') {
      report.issues.push({
        severity: 'high',
        message: 'System health check failed',
        details: health.warnings || health.error
      });
    }
    
    if (metrics.database.slowQueries.length > 10) {
      report.issues.push({
        severity: 'medium',
        message: `${metrics.database.slowQueries.length} slow queries detected`,
        details: 'Consider optimizing database queries or adding indexes'
      });
      report.recommendations.push('Review and optimize slow database queries');
      report.recommendations.push('Consider adding database indexes for frequently queried fields');
    }
    
    if (metrics.memory.leaks.length > 0) {
      report.issues.push({
        severity: 'high',
        message: 'Potential memory leak detected',
        details: `Average memory growth: ${(metrics.memory.leaks[0].averageGrowth / 1024 / 1024).toFixed(2)} MB`
      });
      report.recommendations.push('Investigate memory leak sources');
      report.recommendations.push('Review event listener cleanup and object references');
    }
    
    const errorRate = metrics.errors.total / metrics.requests.total;
    if (errorRate > 0.05) {
      report.issues.push({
        severity: 'medium',
        message: `High error rate: ${(errorRate * 100).toFixed(2)}%`,
        details: `Top errors: ${Object.keys(metrics.errors.byType).slice(0, 3).join(', ')}`
      });
      report.recommendations.push('Review and fix recurring errors');
      report.recommendations.push('Add better error handling and validation');
    }
    
    if (metrics.requests.averageResponseTime > 500) {
      report.issues.push({
        severity: 'low',
        message: `High average response time: ${metrics.requests.averageResponseTime.toFixed(2)}ms`,
        details: 'Consider optimizing slow endpoints'
      });
      report.recommendations.push('Implement caching for frequently accessed data');
      report.recommendations.push('Optimize database queries and API endpoints');
    }
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate performance report',
      message: error.message
    });
  }
});

// Helper function to calculate percentile
function calculatePercentile(arr, percentile) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index] || 0;
}

module.exports = router;