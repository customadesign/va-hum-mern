const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

// Initialize Sentry for error and performance monitoring
const initSentry = (app) => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [
        // Enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // Enable Express.js middleware tracing
        new Sentry.Integrations.Express({ app }),
        // Enable profiling
        new ProfilingIntegration(),
        // MongoDB integration
        new Sentry.Integrations.Mongo({
          useMongoose: true
        })
      ],
      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // Profiling
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      environment: process.env.NODE_ENV || 'development',
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          // Remove sensitive headers
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
          // Remove sensitive body data
          if (event.request.data) {
            delete event.request.data.password;
            delete event.request.data.confirmPassword;
            delete event.request.data.token;
          }
        }
        return event;
      }
    });
    
    console.log('Sentry APM initialized');
  } else {
    console.log('Sentry DSN not configured, APM disabled');
  }
};

// Initialize New Relic (alternative APM)
const initNewRelic = () => {
  if (process.env.NEW_RELIC_LICENSE_KEY) {
    require('newrelic');
    console.log('New Relic APM initialized');
  } else {
    console.log('New Relic license key not configured');
  }
};

// Custom performance metrics collector
class PerformanceMetrics {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
        responseTimes: []
      },
      database: {
        queries: 0,
        averageQueryTime: 0,
        queryTimes: [],
        slowQueries: []
      },
      memory: {
        usage: [],
        leaks: []
      },
      errors: {
        total: 0,
        byType: {},
        byRoute: {}
      }
    };
    
    // Start collecting memory metrics every minute
    this.startMemoryMonitoring();
  }
  
  startMemoryMonitoring() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.metrics.memory.usage.push({
        timestamp: new Date(),
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external
      });
      
      // Keep only last hour of data
      const oneHourAgo = Date.now() - 3600000;
      this.metrics.memory.usage = this.metrics.memory.usage.filter(
        m => m.timestamp.getTime() > oneHourAgo
      );
      
      // Detect potential memory leaks
      if (this.metrics.memory.usage.length > 10) {
        const recent = this.metrics.memory.usage.slice(-10);
        const avgGrowth = recent.reduce((acc, curr, idx) => {
          if (idx === 0) return 0;
          return acc + (curr.heapUsed - recent[idx - 1].heapUsed);
        }, 0) / (recent.length - 1);
        
        if (avgGrowth > 1024 * 1024) { // More than 1MB average growth
          this.metrics.memory.leaks.push({
            timestamp: new Date(),
            averageGrowth: avgGrowth,
            currentHeap: memUsage.heapUsed
          });
        }
      }
    }, 60000); // Every minute
  }
  
  recordRequest(method, path, statusCode, responseTime) {
    this.metrics.requests.total++;
    
    if (statusCode < 400) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }
    
    this.metrics.requests.responseTimes.push(responseTime);
    
    // Keep only last 1000 response times
    if (this.metrics.requests.responseTimes.length > 1000) {
      this.metrics.requests.responseTimes.shift();
    }
    
    // Calculate average
    const sum = this.metrics.requests.responseTimes.reduce((a, b) => a + b, 0);
    this.metrics.requests.averageResponseTime = 
      sum / this.metrics.requests.responseTimes.length;
  }
  
  recordDatabaseQuery(operation, collection, duration) {
    this.metrics.database.queries++;
    this.metrics.database.queryTimes.push(duration);
    
    // Keep only last 1000 query times
    if (this.metrics.database.queryTimes.length > 1000) {
      this.metrics.database.queryTimes.shift();
    }
    
    // Calculate average
    const sum = this.metrics.database.queryTimes.reduce((a, b) => a + b, 0);
    this.metrics.database.averageQueryTime = 
      sum / this.metrics.database.queryTimes.length;
    
    // Track slow queries (> 100ms)
    if (duration > 100) {
      this.metrics.database.slowQueries.push({
        operation,
        collection,
        duration,
        timestamp: new Date()
      });
      
      // Keep only last 100 slow queries
      if (this.metrics.database.slowQueries.length > 100) {
        this.metrics.database.slowQueries.shift();
      }
    }
  }
  
  recordError(error, route) {
    this.metrics.errors.total++;
    
    const errorType = error.name || 'Unknown';
    this.metrics.errors.byType[errorType] = 
      (this.metrics.errors.byType[errorType] || 0) + 1;
    
    if (route) {
      this.metrics.errors.byRoute[route] = 
        (this.metrics.errors.byRoute[route] || 0) + 1;
    }
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      timestamp: new Date()
    };
  }
  
  reset() {
    this.metrics.requests.responseTimes = [];
    this.metrics.database.queryTimes = [];
    this.metrics.database.slowQueries = [];
    this.metrics.memory.leaks = [];
  }
}

// Database query performance monitoring
const monitorDatabasePerformance = (mongoose, metrics) => {
  // Monitor all MongoDB operations
  mongoose.set('debug', (collectionName, method, query, doc, options) => {
    const startTime = Date.now();
    
    // Wrap the original callback if it exists
    const originalCallback = options?.callback;
    if (originalCallback) {
      options.callback = function(...args) {
        const duration = Date.now() - startTime;
        metrics.recordDatabaseQuery(method, collectionName, duration);
        originalCallback.apply(this, args);
      };
    }
  });
};

// Create performance monitoring middleware
const performanceMiddleware = (metrics) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Override res.end to capture response time (avoid setting headers after sent)
    const originalEnd = res.end;
    res.end = function(...args) {
      const responseTime = Date.now() - startTime;
      metrics.recordRequest(req.method, req.path, res.statusCode, responseTime);
      
      // Add response time header only if headers are not already sent
      if (!res.headersSent) {
        res.set('X-Response-Time', `${responseTime}ms`);
      }
      
      originalEnd.apply(res, args);
    };
    
    next();
  };
};

// Error tracking middleware
const errorTrackingMiddleware = (metrics) => {
  return (err, req, res, next) => {
    metrics.recordError(err, req.path);
    
    // Send to Sentry if configured
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(err);
    }
    
    next(err);
  };
};

// Health check endpoint data
const getHealthCheck = async (mongoose, metrics) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: {
      status: 'unknown',
      responseTime: null
    },
    performance: metrics.getMetrics()
  };
  
  // Check database connection
  try {
    const startTime = Date.now();
    await mongoose.connection.db.admin().ping();
    healthCheck.database.status = 'connected';
    healthCheck.database.responseTime = Date.now() - startTime;
  } catch (error) {
    healthCheck.database.status = 'disconnected';
    healthCheck.database.error = error.message;
    healthCheck.status = 'unhealthy';
  }
  
  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const maxHeap = 512 * 1024 * 1024; // 512MB threshold
  if (memoryUsage.heapUsed > maxHeap) {
    healthCheck.status = 'warning';
    healthCheck.warnings = healthCheck.warnings || [];
    healthCheck.warnings.push('High memory usage detected');
  }
  
  // Check error rate
  const errorRate = metrics.metrics.errors.total / metrics.metrics.requests.total;
  if (errorRate > 0.05) { // More than 5% error rate
    healthCheck.status = 'warning';
    healthCheck.warnings = healthCheck.warnings || [];
    healthCheck.warnings.push('High error rate detected');
  }
  
  return healthCheck;
};

module.exports = {
  initSentry,
  initNewRelic,
  PerformanceMetrics,
  monitorDatabasePerformance,
  performanceMiddleware,
  errorTrackingMiddleware,
  getHealthCheck,
  Sentry
};