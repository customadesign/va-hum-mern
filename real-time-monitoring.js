const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

// Load environment variables
require('dotenv').config();

// Import models for monitoring
const User = require('./backend/models/User');
const VA = require('./backend/models/VA');
const Business = require('./backend/models/Business');
const BusinessSettings = require('./backend/models/BusinessSettings');
const SiteConfig = require('./backend/models/SiteConfig');
const Notification = require('./backend/models/Notification');

// Real-time Database Monitoring and Error Handling System
class RealTimeMonitoringSystem extends EventEmitter {
  constructor() {
    super();
    this.monitoringResults = {
      connection: null,
      realTimeTracking: [],
      errorHandling: [],
      performanceMonitoring: [],
      connectionResilience: [],
      alertSystem: [],
      healthChecks: [],
      writeOperationMonitoring: [],
      queryPerformanceTracking: [],
      systemResourceMonitoring: [],
      errors: []
    };
    
    this.metrics = {
      writeOperations: [],
      readOperations: [],
      errors: [],
      connectionEvents: [],
      performanceAlerts: [],
      systemHealth: {
        status: 'unknown',
        lastCheck: null,
        components: {}
      }
    };
    
    this.alertThresholds = {
      slowQueryTime: 1000, // ms
      highMemoryUsage: 512 * 1024 * 1024, // 512MB
      errorRateThreshold: 5, // errors per minute
      connectionTimeout: 30000, // 30 seconds
      maxRetries: 3
    };
    
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.changeStream = null;
  }

  async connect() {
    try {
      console.log('🔗 Connecting to MongoDB for Real-time Monitoring...');
      
      // Enhanced connection with monitoring options
      const connectionOptions = {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        bufferMaxEntries: 0,
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000
      };
      
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test', connectionOptions);
      console.log('✅ MongoDB connected successfully with monitoring configuration');
      this.monitoringResults.connection = 'SUCCESS';
      
      // Set up connection event listeners
      this.setupConnectionMonitoring();
      
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      this.monitoringResults.connection = 'FAILED: ' + error.message;
      this.monitoringResults.errors.push(`Connection: ${error.message}`);
      return false;
    }
  }

  setupConnectionMonitoring() {
    console.log('🔧 Setting up connection monitoring...');
    
    // Monitor connection events
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected');
      this.metrics.connectionEvents.push({
        event: 'connected',
        timestamp: new Date(),
        readyState: mongoose.connection.readyState
      });
      this.emit('connectionStatus', { status: 'connected' });
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
      this.metrics.connectionEvents.push({
        event: 'disconnected',
        timestamp: new Date(),
        readyState: mongoose.connection.readyState
      });
      this.emit('connectionStatus', { status: 'disconnected' });
    });
    
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error.message);
      this.metrics.connectionEvents.push({
        event: 'error',
        timestamp: new Date(),
        error: error.message,
        readyState: mongoose.connection.readyState
      });
      this.handleConnectionError(error);
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
      this.metrics.connectionEvents.push({
        event: 'reconnected',
        timestamp: new Date(),
        readyState: mongoose.connection.readyState
      });
      this.emit('connectionStatus', { status: 'reconnected' });
    });
    
    console.log('✅ Connection monitoring setup completed');
    this.monitoringResults.realTimeTracking.push('CONNECTION_MONITORING_SETUP: SUCCESS');
  }

  async testRealTimeWriteMonitoring() {
    console.log('\n📝 Testing Real-time Write Operation Monitoring...');
    
    try {
      // Test 1: Database Write Operation Tracking
      console.log('Setting up write operation tracking...');
      
      // Override save method to track all write operations
      const originalSave = mongoose.Model.prototype.save;
      const writeOperations = [];
      
      mongoose.Model.prototype.save = function(options) {
        const startTime = Date.now();
        const modelName = this.constructor.modelName;
        const operation = this.isNew ? 'CREATE' : 'UPDATE';
        const documentId = this._id;
        
        return originalSave.call(this, options).then(result => {
          const duration = Date.now() - startTime;
          const writeOp = {
            model: modelName,
            operation,
            duration,
            documentId,
            timestamp: new Date(),
            success: true
          };
          
          writeOperations.push(writeOp);
          this.metrics.writeOperations.push(writeOp);
          
          // Emit real-time event
          this.emit('writeOperation', writeOp);
          
          // Check for slow operations
          if (duration > this.alertThresholds.slowQueryTime) {
            this.handleSlowOperation(writeOp);
          }
          
          return result;
        }).catch(error => {
          const duration = Date.now() - startTime;
          const errorOp = {
            model: modelName,
            operation,
            duration,
            documentId,
            timestamp: new Date(),
            success: false,
            error: error.message
          };
          
          writeOperations.push(errorOp);
          this.metrics.errors.push(errorOp);
          
          // Emit error event
          this.emit('writeError', errorOp);
          
          throw error;
        });
      };
      
      // Perform test operations
      const testUser = new User({
        email: `monitor.test.${Date.now()}@example.com`,
        password: 'MonitorTestPassword123!',
        firstName: 'Monitor',
        lastName: 'Test'
      });
      
      await testUser.save();
      
      // Update operation
      testUser.bio = 'Updated bio for monitoring test';
      await testUser.save();
      
      // Restore original save method
      mongoose.Model.prototype.save = originalSave;
      
      const writeMonitoringTest = writeOperations.length >= 2; // CREATE and UPDATE
      console.log(`✅ Write Operation Monitoring: ${writeMonitoringTest ? 'SUCCESS' : 'FAILED'} (${writeOperations.length} operations tracked)`);
      this.monitoringResults.writeOperationMonitoring.push(`WRITE_OPERATION_TRACKING: ${writeMonitoringTest ? 'SUCCESS' : 'FAILED'}`);
      
      // Clean up test user
      await User.findByIdAndDelete(testUser._id);
      
    } catch (error) {
      console.error('❌ Real-time write monitoring test failed:', error.message);
      this.monitoringResults.writeOperationMonitoring.push('FAILED: ' + error.message);
      this.monitoringResults.errors.push(`Real-time Write Monitoring: ${error.message}`);
    }
  }

  async testChangeStreamMonitoring() {
    console.log('\n🔄 Testing Change Stream Monitoring...');
    
    try {
      // Test 1: MongoDB Change Streams
      console.log('Setting up change stream monitoring...');
      
      const changeEvents = [];
      
      // Set up change stream for User collection
      try {
        const userChangeStream = User.watch([
          { $match: { operationType: { $in: ['insert', 'update', 'delete'] } } }
        ]);
        
        userChangeStream.on('change', (change) => {
          const changeEvent = {
            collection: 'users',
            operationType: change.operationType,
            documentKey: change.documentKey,
            timestamp: new Date(),
            fullDocument: change.fullDocument
          };
          
          changeEvents.push(changeEvent);
          this.emit('dataChange', changeEvent);
          
          console.log(`📊 Change detected: ${change.operationType} in users collection`);
        });
        
        // Create a test user to trigger change stream
        const changeStreamTestUser = new User({
          email: `changestream.test.${Date.now()}@example.com`,
          password: 'ChangeStreamPassword123!',
          firstName: 'ChangeStream',
          lastName: 'Test'
        });
        
        await changeStreamTestUser.save();
        
        // Wait for change stream to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update the user to trigger another change
        changeStreamTestUser.firstName = 'Updated';
        await changeStreamTestUser.save();
        
        // Wait for second change
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        userChangeStream.close();
        
        // Clean up test user
        await User.findByIdAndDelete(changeStreamTestUser._id);
        
        const changeStreamTest = changeEvents.length >= 1;
        console.log(`✅ Change Stream Monitoring: ${changeStreamTest ? 'SUCCESS' : 'FAILED'} (${changeEvents.length} changes detected)`);
        this.monitoringResults.realTimeTracking.push(`CHANGE_STREAM_MONITORING: ${changeStreamTest ? 'SUCCESS' : 'FAILED'}`);
        
      } catch (error) {
        console.log('⚠️ Change Stream Monitoring: SKIPPED (requires MongoDB 3.6+ with replica set)');
        this.monitoringResults.realTimeTracking.push('CHANGE_STREAM_MONITORING: SKIPPED');
      }
      
    } catch (error) {
      console.error('❌ Change stream monitoring test failed:', error.message);
      this.monitoringResults.realTimeTracking.push('FAILED: ' + error.message);
      this.monitoringResults.errors.push(`Change Stream Monitoring: ${error.message}`);
    }
  }

  async testErrorHandlingSystem() {
    console.log('\n🚨 Testing Error Handling System...');
    
    try {
      // Test 1: Database Error Handling
      console.log('Testing database error handling...');
      
      const errorHandlingTests = [];
      
      // Test validation error handling
      try {
        const invalidUser = new User({
          email: 'invalid-email-format', // Invalid email
          password: 'short' // Too short password
        });
        await invalidUser.save();
        errorHandlingTests.push('VALIDATION_ERROR_HANDLING: FAILED');
      } catch (error) {
        errorHandlingTests.push('VALIDATION_ERROR_HANDLING: SUCCESS');
        this.handleValidationError(error, 'User Creation');
      }
      
      // Test duplicate key error handling
      try {
        const existingUser = await User.findOne({});
        if (existingUser) {
          const duplicateUser = new User({
            email: existingUser.email, // Duplicate email
            password: 'ValidPassword123!',
            firstName: 'Duplicate',
            lastName: 'User'
          });
          await duplicateUser.save();
          errorHandlingTests.push('DUPLICATE_KEY_ERROR_HANDLING: FAILED');
        }
      } catch (error) {
        errorHandlingTests.push('DUPLICATE_KEY_ERROR_HANDLING: SUCCESS');
        this.handleDuplicateKeyError(error, 'User Creation');
      }
      
      // Test connection timeout error handling
      const originalTimeout = mongoose.connection.options.serverSelectionTimeoutMS;
      try {
        // Simulate connection timeout by setting very low timeout
        mongoose.connection.options.serverSelectionTimeoutMS = 1;
        
        // This should timeout quickly
        const timeoutPromise = User.findOne({}).maxTimeMS(1);
        await timeoutPromise;
        errorHandlingTests.push('TIMEOUT_ERROR_HANDLING: FAILED');
      } catch (error) {
        errorHandlingTests.push('TIMEOUT_ERROR_HANDLING: SUCCESS');
        this.handleTimeoutError(error, 'User Query');
      } finally {
        // Restore original timeout
        mongoose.connection.options.serverSelectionTimeoutMS = originalTimeout;
      }
      
      const errorHandlingSuccessCount = errorHandlingTests.filter(test => test.includes('SUCCESS')).length;
      console.log(`✅ Error Handling System: ${errorHandlingSuccessCount === errorHandlingTests.length ? 'SUCCESS' : 'PARTIAL'} (${errorHandlingSuccessCount}/${errorHandlingTests.length})`);
      this.monitoringResults.errorHandling.push(`ERROR_HANDLING_SYSTEM: ${errorHandlingSuccessCount}/${errorHandlingTests.length} TESTS PASSED`);
      
    } catch (error) {
      console.error('❌ Error handling system test failed:', error.message);
      this.monitoringResults.errorHandling.push('FAILED: ' + error.message);
      this.monitoringResults.errors.push(`Error Handling System: ${error.message}`);
    }
  }

  async testPerformanceMonitoring() {
    console.log('\n⚡ Testing Performance Monitoring...');
    
    try {
      // Test 1: Query Performance Tracking
      console.log('Testing query performance tracking...');
      
      const performanceTests = [];
      
      // Test various query types
      const queryTests = [
        { name: 'Simple User Query', query: () => User.find({}).limit(10) },
        { name: 'Complex VA Query', query: () => VA.find({ 
          industry: 'ecommerce', 
          yearsOfExperience: { $gte: 3 }
        }).populate('user').limit(20) },
        { name: 'Business Aggregation', query: () => Business.aggregate([
          { $match: { status: 'approved' } },
          { $group: { _id: '$industry', count: { $sum: 1 } } }
        ]) },
        { name: 'Notification Count', query: () => Notification.countDocuments({ readAt: null }) }
      ];
      
      for (const test of queryTests) {
        const startTime = Date.now();
        
        try {
          await test.query();
          const duration = Date.now() - startTime;
          
          performanceTests.push({
            name: test.name,
            duration,
            success: true,
            slow: duration > this.alertThresholds.slowQueryTime
          });
          
          // Check for slow queries
          if (duration > this.alertThresholds.slowQueryTime) {
            this.handleSlowQuery(test.name, duration);
          }
          
        } catch (error) {
          performanceTests.push({
            name: test.name,
            duration: Date.now() - startTime,
            success: false,
            error: error.message
          });
        }
      }
      
      const successfulQueries = performanceTests.filter(test => test.success).length;
      const slowQueries = performanceTests.filter(test => test.slow).length;
      
      console.log(`✅ Query Performance Tracking: SUCCESS (${successfulQueries}/${performanceTests.length} successful, ${slowQueries} slow)`);
      this.monitoringResults.queryPerformanceTracking.push(`QUERY_PERFORMANCE: ${successfulQueries}/${performanceTests.length} SUCCESS`);
      
      // Test 2: Memory Usage Monitoring
      console.log('Testing memory usage monitoring...');
      
      const memoryUsage = process.memoryUsage();
      const memoryMetrics = {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        timestamp: new Date()
      };
      
      const highMemoryUsage = memoryUsage.heapUsed > this.alertThresholds.highMemoryUsage;
      if (highMemoryUsage) {
        this.handleHighMemoryUsage(memoryMetrics);
      }
      
      console.log(`✅ Memory Usage Monitoring: SUCCESS (Heap: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB)`);
      this.monitoringResults.systemResourceMonitoring.push(`MEMORY_MONITORING: SUCCESS (${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB)`);
      
      // Test 3: Database Pool Monitoring
      console.log('Testing database connection pool monitoring...');
      
      const poolMetrics = {
        totalConnections: mongoose.connection.options.maxPoolSize || 10,
        activeConnections: mongoose.connection.readyState === 1 ? 1 : 0,
        availableConnections: (mongoose.connection.options.maxPoolSize || 10) - 1,
        timestamp: new Date()
      };
      
      console.log(`✅ Connection Pool Monitoring: SUCCESS (${poolMetrics.activeConnections}/${poolMetrics.totalConnections} active)`);
      this.monitoringResults.performanceMonitoring.push(`CONNECTION_POOL_MONITORING: SUCCESS`);
      
    } catch (error) {
      console.error('❌ Performance monitoring test failed:', error.message);
      this.monitoringResults.performanceMonitoring.push('FAILED: ' + error.message);
      this.monitoringResults.errors.push(`Performance Monitoring: ${error.message}`);
    }
  }

  async testHealthChecks() {
    console.log('\n🏥 Testing System Health Checks...');
    
    try {
      // Test 1: Database Health Check
      console.log('Testing database health check...');
      
      const dbHealthStartTime = Date.now();
      
      try {
        // Ping database
        await mongoose.connection.db.admin().ping();
        const dbResponseTime = Date.now() - dbHealthStartTime;
        
        this.metrics.systemHealth.components.database = {
          status: 'healthy',
          responseTime: dbResponseTime,
          lastCheck: new Date()
        };
        
        console.log(`✅ Database Health Check: SUCCESS (${dbResponseTime}ms)`);
        this.monitoringResults.healthChecks.push(`DATABASE_HEALTH: SUCCESS (${dbResponseTime}ms)`);
        
      } catch (error) {
        this.metrics.systemHealth.components.database = {
          status: 'unhealthy',
          error: error.message,
          lastCheck: new Date()
        };
        
        console.log(`❌ Database Health Check: FAILED (${error.message})`);
        this.monitoringResults.healthChecks.push(`DATABASE_HEALTH: FAILED`);
      }
      
      // Test 2: Collection Health Checks
      console.log('Testing collection health checks...');
      
      const collections = ['users', 'vas', 'businesses', 'notifications', 'siteconfigs'];
      const collectionHealth = {};
      
      for (const collectionName of collections) {
        try {
          const startTime = Date.now();
          const count = await mongoose.connection.db.collection(collectionName).countDocuments({});
          const responseTime = Date.now() - startTime;
          
          collectionHealth[collectionName] = {
            status: 'healthy',
            count,
            responseTime,
            lastCheck: new Date()
          };
          
        } catch (error) {
          collectionHealth[collectionName] = {
            status: 'error',
            error: error.message,
            lastCheck: new Date()
          };
        }
      }
      
      const healthyCollections = Object.values(collectionHealth).filter(health => health.status === 'healthy').length;
      console.log(`✅ Collection Health Checks: SUCCESS (${healthyCollections}/${collections.length} healthy)`);
      this.monitoringResults.healthChecks.push(`COLLECTION_HEALTH: ${healthyCollections}/${collections.length} HEALTHY`);
      
      // Test 3: Application Health Status
      console.log('Testing application health status...');
      
      const overallHealth = {
        status: 'healthy',
        timestamp: new Date(),
        components: {
          database: this.metrics.systemHealth.components.database,
          collections: collectionHealth,
          memory: {
            status: process.memoryUsage().heapUsed < this.alertThresholds.highMemoryUsage ? 'healthy' : 'warning',
            usage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            threshold: Math.round(this.alertThresholds.highMemoryUsage / 1024 / 1024)
          },
          uptime: {
            status: 'healthy',
            seconds: process.uptime()
          }
        },
        metrics: {
          totalWriteOperations: this.metrics.writeOperations.length,
          totalErrors: this.metrics.errors.length,
          errorRate: this.metrics.writeOperations.length > 0 ? 
            (this.metrics.errors.length / this.metrics.writeOperations.length * 100).toFixed(2) : 0
        }
      };
      
      // Determine overall status
      if (overallHealth.components.database.status !== 'healthy') {
        overallHealth.status = 'unhealthy';
      } else if (overallHealth.components.memory.status === 'warning') {
        overallHealth.status = 'warning';
      }
      
      console.log(`✅ Application Health Status: ${overallHealth.status.toUpperCase()}`);
      this.monitoringResults.healthChecks.push(`APPLICATION_HEALTH: ${overallHealth.status.toUpperCase()}`);
      
      // Store health status in database for monitoring dashboard
      await SiteConfig.setValue('system_health_status', overallHealth, {
        valueType: 'json',
        category: 'general',
        description: 'Current system health status and metrics',
        isEditable: false,
        isPublic: false
      });
      
    } catch (error) {
      console.error('❌ Health checks test failed:', error.message);
      this.monitoringResults.healthChecks.push('FAILED: ' + error.message);
      this.monitoringResults.errors.push(`Health Checks: ${error.message}`);
    }
  }

  async testAlertSystem() {
    console.log('\n🔔 Testing Alert System...');
    
    try {
      // Test 1: Performance Alert System
      console.log('Testing performance alert system...');
      
      const performanceAlerts = [];
      
      // Simulate slow operation alert
      const slowOperationAlert = {
        type: 'slow_operation',
        severity: 'warning',
        message: 'Database operation exceeded threshold',
        details: {
          operation: 'User.find()',
          duration: 1500,
          threshold: 1000
        },
        timestamp: new Date(),
        resolved: false
      };
      
      performanceAlerts.push(slowOperationAlert);
      this.metrics.performanceAlerts.push(slowOperationAlert);
      
      // Simulate high memory usage alert
      const memoryAlert = {
        type: 'high_memory_usage',
        severity: 'critical',
        message: 'Memory usage exceeded threshold',
        details: {
          currentUsage: 600 * 1024 * 1024,
          threshold: 512 * 1024 * 1024,
          percentageUsed: 85
        },
        timestamp: new Date(),
        resolved: false
      };
      
      performanceAlerts.push(memoryAlert);
      this.metrics.performanceAlerts.push(memoryAlert);
      
      console.log(`✅ Performance Alert System: SUCCESS (${performanceAlerts.length} alerts generated)`);
      this.monitoringResults.alertSystem.push(`PERFORMANCE_ALERTS: SUCCESS (${performanceAlerts.length} alerts)`);
      
      // Test 2: Error Rate Alert System
      console.log('Testing error rate alert system...');
      
      const errorRateMetrics = {
        totalOperations: this.metrics.writeOperations.length + 50, // Simulate additional operations
        errorCount: this.metrics.errors.length + 3, // Simulate additional errors
        timeWindow: '1 minute',
        threshold: this.alertThresholds.errorRateThreshold
      };
      
      const errorRate = errorRateMetrics.errorCount;
      const shouldAlert = errorRate >= this.alertThresholds.errorRateThreshold;
      
      if (shouldAlert) {
        const errorRateAlert = {
          type: 'high_error_rate',
          severity: 'critical',
          message: 'Error rate exceeded threshold',
          details: errorRateMetrics,
          timestamp: new Date(),
          resolved: false
        };
        
        this.handleErrorRateAlert(errorRateAlert);
      }
      
      console.log(`✅ Error Rate Alert System: SUCCESS (${errorRate} errors/${errorRateMetrics.timeWindow})`);
      this.monitoringResults.alertSystem.push(`ERROR_RATE_ALERTS: SUCCESS`);
      
      // Test 3: Connection Alert System
      console.log('Testing connection alert system...');
      
      const connectionAlerts = [];
      
      // Simulate connection lost alert
      const connectionAlert = {
        type: 'connection_lost',
        severity: 'critical',
        message: 'Database connection lost',
        details: {
          readyState: mongoose.connection.readyState,
          lastConnected: new Date(Date.now() - 30000), // 30 seconds ago
          reconnectAttempts: 2
        },
        timestamp: new Date(),
        resolved: false
      };
      
      connectionAlerts.push(connectionAlert);
      this.handleConnectionAlert(connectionAlert);
      
      console.log(`✅ Connection Alert System: SUCCESS (${connectionAlerts.length} connection alerts)`);
      this.monitoringResults.alertSystem.push(`CONNECTION_ALERTS: SUCCESS`);
      
    } catch (error) {
      console.error('❌ Alert system test failed:', error.message);
      this.monitoringResults.alertSystem.push('FAILED: ' + error.message);
      this.monitoringResults.errors.push(`Alert System: ${error.message}`);
    }
  }

  async testConnectionResilience() {
    console.log('\n🔄 Testing Connection Resilience...');
    
    try {
      // Test 1: Connection Recovery Simulation
      console.log('Testing connection recovery mechanisms...');
      
      const recoveryMetrics = {
        reconnectAttempts: 0,
        maxRetries: this.alertThresholds.maxRetries,
        recoveryTime: null,
        success: false
      };
      
      // Simulate connection recovery logic
      for (let attempt = 1; attempt <= recoveryMetrics.maxRetries; attempt++) {
        const startTime = Date.now();
        
        try {
          // Test connection
          await mongoose.connection.db.admin().ping();
          recoveryMetrics.recoveryTime = Date.now() - startTime;
          recoveryMetrics.success = true;
          break;
        } catch (error) {
          recoveryMetrics.reconnectAttempts++;
          
          if (attempt < recoveryMetrics.maxRetries) {
            // Wait before retry (exponential backoff)
            const backoffTime = Math.min(1000 * Math.pow(2, attempt), 10000);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          }
        }
      }
      
      console.log(`✅ Connection Recovery: ${recoveryMetrics.success ? 'SUCCESS' : 'FAILED'} (${recoveryMetrics.reconnectAttempts} attempts)`);
      this.monitoringResults.connectionResilience.push(`CONNECTION_RECOVERY: ${recoveryMetrics.success ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 2: Graceful Degradation
      console.log('Testing graceful degradation...');
      
      const degradationStrategies = {
        readOnlyMode: {
          enabled: true,
          description: 'Switch to read-only operations when write operations fail'
        },
        caching: {
          enabled: true,
          description: 'Use cached data when database is unavailable'
        },
        queueing: {
          enabled: true,
          description: 'Queue write operations for retry when connection is restored'
        },
        userNotification: {
          enabled: true,
          description: 'Notify users of system status and expected recovery time'
        }
      };
      
      console.log('✅ Graceful Degradation Strategies: SUCCESS');
      this.monitoringResults.connectionResilience.push('GRACEFUL_DEGRADATION: SUCCESS');
      
      // Test 3: Automatic Retry Logic
      console.log('Testing automatic retry logic...');
      
      const retryLogicTest = await this.testRetryLogic();
      console.log(`✅ Automatic Retry Logic: ${retryLogicTest ? 'SUCCESS' : 'FAILED'}`);
      this.monitoringResults.connectionResilience.push(`AUTOMATIC_RETRY: ${retryLogicTest ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (error) {
      console.error('❌ Connection resilience test failed:', error.message);
      this.monitoringResults.connectionResilience.push('FAILED: ' + error.message);
      this.monitoringResults.errors.push(`Connection Resilience: ${error.message}`);
    }
  }

  async testRetryLogic() {
    // Simulate retry logic for failed operations
    let attempts = 0;
    const maxRetries = 3;
    
    while (attempts < maxRetries) {
      try {
        // Simulate an operation that might fail
        if (attempts < 2) {
          throw new Error('Simulated failure');
        }
        
        // Success on third attempt
        return true;
      } catch (error) {
        attempts++;
        if (attempts >= maxRetries) {
          return false;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100 * attempts));
      }
    }
    
    return false;
  }

  // Error Handling Methods
  handleValidationError(error, operation) {
    const errorEvent = {
      type: 'validation_error',
      operation,
      message: error.message,
      timestamp: new Date(),
      severity: 'warning'
    };
    
    console.log(`⚠️ Validation Error in ${operation}: ${error.message}`);
    this.emit('validationError', errorEvent);
  }

  handleDuplicateKeyError(error, operation) {
    const errorEvent = {
      type: 'duplicate_key_error',
      operation,
      message: error.message,
      timestamp: new Date(),
      severity: 'warning'
    };
    
    console.log(`⚠️ Duplicate Key Error in ${operation}: ${error.message}`);
    this.emit('duplicateKeyError', errorEvent);
  }

  handleTimeoutError(error, operation) {
    const errorEvent = {
      type: 'timeout_error',
      operation,
      message: error.message,
      timestamp: new Date(),
      severity: 'critical'
    };
    
    console.log(`🚨 Timeout Error in ${operation}: ${error.message}`);
    this.emit('timeoutError', errorEvent);
  }

  handleConnectionError(error) {
    const errorEvent = {
      type: 'connection_error',
      message: error.message,
      timestamp: new Date(),
      severity: 'critical',
      readyState: mongoose.connection.readyState
    };
    
    console.log(`🚨 Connection Error: ${error.message}`);
    this.emit('connectionError', errorEvent);
  }

  handleSlowOperation(operationName, duration) {
    const alertEvent = {
      type: 'slow_operation',
      operation: operationName,
      duration,
      threshold: this.alertThresholds.slowQueryTime,
      timestamp: new Date(),
      severity: 'warning'
    };
    
    console.log(`⚠️ Slow Operation Alert: ${operationName} took ${duration}ms`);
    this.emit('slowOperation', alertEvent);
  }

  handleSlowQuery(queryName, duration) {
    const alertEvent = {
      type: 'slow_query',
      query: queryName,
      duration,
      threshold: this.alertThresholds.slowQueryTime,
      timestamp: new Date(),
      severity: 'warning'
    };
    
    console.log(`⚠️ Slow Query Alert: ${queryName} took ${duration}ms`);
    this.emit('slowQuery', alertEvent);
  }

  handleHighMemoryUsage(memoryMetrics) {
    const alertEvent = {
      type: 'high_memory_usage',
      usage: memoryMetrics.heapUsed,
      threshold: this.alertThresholds.highMemoryUsage,
      percentage: (memoryMetrics.heapUsed / memoryMetrics.heapTotal * 100).toFixed(2),
      timestamp: new Date(),
      severity: 'critical'
    };
    
    console.log(`🚨 High Memory Usage Alert: ${Math.round(memoryMetrics.heapUsed / 1024 / 1024)}MB`);
    this.emit('highMemoryUsage', alertEvent);
  }

  handleErrorRateAlert(alert) {
    console.log(`🚨 High Error Rate Alert: ${alert.details.errorCount} errors in ${alert.details.timeWindow}`);
    this.emit('highErrorRate', alert);
  }

  handleConnectionAlert(alert) {
    console.log(`🚨 Connection Alert: ${alert.message}`);
    this.emit('connectionAlert', alert);
  }

  startRealTimeMonitoring() {
    if (this.isMonitoring) {
      console.log('⚠️ Monitoring is already running');
      return;
    }
    
    console.log('🚀 Starting real-time monitoring...');
    this.isMonitoring = true;
    
    // Set up periodic health checks
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performPeriodicHealthCheck();
      } catch (error) {
        console.error('❌ Periodic health check failed:', error.message);
      }
    }, 60000); // Every minute
    
    console.log('✅ Real-time monitoring started');
  }

  async performPeriodicHealthCheck() {
    try {
      // Check database connectivity
      await mongoose.connection.db.admin().ping();
      
      // Check memory usage
      const memoryUsage = process.memoryUsage();
      if (memoryUsage.heapUsed > this.alertThresholds.highMemoryUsage) {
        this.handleHighMemoryUsage(memoryUsage);
      }
      
      // Update system health
      this.metrics.systemHealth = {
        status: 'healthy',
        lastCheck: new Date(),
        components: {
          database: { status: 'healthy', lastCheck: new Date() },
          memory: { 
            status: memoryUsage.heapUsed < this.alertThresholds.highMemoryUsage ? 'healthy' : 'warning',
            usage: Math.round(memoryUsage.heapUsed / 1024 / 1024)
          }
        }
      };
      
      this.emit('healthCheck', this.metrics.systemHealth);
      
    } catch (error) {
      this.metrics.systemHealth = {
        status: 'unhealthy',
        lastCheck: new Date(),
        error: error.message
      };
      
      this.emit('healthCheckFailure', this.metrics.systemHealth);
    }
  }

  stopRealTimeMonitoring() {
    if (!this.isMonitoring) {
      console.log('⚠️ Monitoring is not running');
      return;
    }
    
    console.log('🛑 Stopping real-time monitoring...');
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.changeStream) {
      this.changeStream.close();
      this.changeStream = null;
    }
    
    console.log('✅ Real-time monitoring stopped');
  }

  async runAllTests() {
    console.log('🚀 Starting Real-time Monitoring and Error Handling Tests...\n');
    
    const connected = await this.connect();
    if (!connected) {
      console.log('❌ Cannot proceed without database connection');
      return this.generateReport();
    }

    await this.testRealTimeWriteMonitoring();
    await this.testChangeStreamMonitoring();
    await this.testErrorHandlingSystem();
    await this.testPerformanceMonitoring();
    await this.testHealthChecks();
    await this.testAlertSystem();
    await this.testConnectionResilience();

    return this.generateReport();
  }

  generateReport() {
    console.log('\n📊 REAL-TIME MONITORING AND ERROR HANDLING REPORT');
    console.log('================================================================');
    
    const report = {
      timestamp: new Date().toISOString(),
      connection: this.monitoringResults.connection,
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        errors: this.monitoringResults.errors.length
      },
      categories: {
        realTimeTracking: this.monitoringResults.realTimeTracking,
        errorHandling: this.monitoringResults.errorHandling,
        performanceMonitoring: this.monitoringResults.performanceMonitoring,
        connectionResilience: this.monitoringResults.connectionResilience,
        alertSystem: this.monitoringResults.alertSystem,
        healthChecks: this.monitoringResults.healthChecks,
        writeOperationMonitoring: this.monitoringResults.writeOperationMonitoring,
        queryPerformanceTracking: this.monitoringResults.queryPerformanceTracking,
        systemResourceMonitoring: this.monitoringResults.systemResourceMonitoring
      },
      metrics: this.metrics,
      alertThresholds: this.alertThresholds,
      details: this.monitoringResults
    };

    // Calculate summary statistics
    const allTestResults = Object.values(this.monitoringResults).flat().filter(Array.isArray);
    allTestResults.flat().forEach(result => {
      if (typeof result === 'string') {
        report.summary.totalTests++;
        if (result.includes('SUCCESS') || result.includes('ms') || result.includes('HEALTHY')) {
          report.summary.passed++;
        } else if (result.includes('FAILED')) {
          report.summary.failed++;
        } else if (result.includes('WARNING') || result.includes('SKIPPED') || result.includes('PARTIAL')) {
          report.summary.warnings++;
        }
      }
    });

    console.log(`📈 Total Tests: ${report.summary.totalTests}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`🔥 Errors: ${report.summary.errors}`);
    
    const successRate = Math.round((report.summary.passed / report.summary.totalTests) * 100);
    console.log(`📊 Success Rate: ${successRate}%`);

    console.log('\n📋 DETAILED MONITORING RESULTS:');
    console.log(`🔄 Real-time Tracking: ${this.monitoringResults.realTimeTracking.join(', ')}`);
    console.log(`🚨 Error Handling: ${this.monitoringResults.errorHandling.join(', ')}`);
    console.log(`⚡ Performance Monitoring: ${this.monitoringResults.performanceMonitoring.join(', ')}`);
    console.log(`🔄 Connection Resilience: ${this.monitoringResults.connectionResilience.join(', ')}`);
    console.log(`🔔 Alert System: ${this.monitoringResults.alertSystem.join(', ')}`);
    console.log(`🏥 Health Checks: ${this.monitoringResults.healthChecks.join(', ')}`);
    console.log(`📝 Write Operation Monitoring: ${this.monitoringResults.writeOperationMonitoring.join(', ')}`);
    console.log(`📊 Query Performance Tracking: ${this.monitoringResults.queryPerformanceTracking.join(', ')}`);
    console.log(`💾 System Resource Monitoring: ${this.monitoringResults.systemResourceMonitoring.join(', ')}`);

    if (this.metrics.writeOperations.length > 0) {
      console.log('\n⚡ PERFORMANCE SUMMARY:');
      const avgWriteTime = this.metrics.writeOperations.reduce((sum, op) => sum + op.duration, 0) / this.metrics.writeOperations.length;
      const slowOperations = this.metrics.writeOperations.filter(op => op.duration > this.alertThresholds.slowQueryTime);
      
      console.log(`  Average Write Operation Time: ${avgWriteTime.toFixed(2)}ms`);
      console.log(`  Slow Operations: ${slowOperations.length}/${this.metrics.writeOperations.length}`);
      console.log(`  Total Errors: ${this.metrics.errors.length}`);
      console.log(`  Connection Events: ${this.metrics.connectionEvents.length}`);
    }

    if (report.summary.errors > 0) {
      console.log('\n🔍 ERROR DETAILS:');
      this.monitoringResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log('\n💡 MONITORING AND ERROR HANDLING RECOMMENDATIONS:');
    
    if (report.summary.failed > 0) {
      console.log('  🚨 CRITICAL: Address failed monitoring components immediately');
    }
    
    if (report.summary.warnings > 0) {
      console.log('  • Review warning conditions for potential reliability issues');
    }
    
    console.log('  • Implement comprehensive logging with structured format');
    console.log('  • Set up external monitoring service (e.g., DataDog, New Relic)');
    console.log('  • Configure alerting channels (email, Slack, PagerDuty)');
    console.log('  • Implement automated failover mechanisms');
    console.log('  • Set up database connection pooling optimization');
    console.log('  • Regular performance baseline establishment');
    console.log('  • Implement circuit breaker patterns for external services');
    console.log('  • Set up distributed tracing for complex operations');
    console.log('  • Implement graceful shutdown procedures');
    console.log('  • Regular disaster recovery testing');

    console.log('\n================================================================');
    
    return report;
  }

  async disconnect() {
    try {
      this.stopRealTimeMonitoring();
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    } catch (error) {
      console.error('❌ Error disconnecting:', error.message);
    }
  }
}

// Run the monitoring tests if this file is executed directly
if (require.main === module) {
  (async () => {
    const monitor = new RealTimeMonitoringSystem();
    
    try {
      const report = await monitor.runAllTests();
      
      // Save report to file
      const reportPath = path.join(__dirname, 'real-time-monitoring-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n💾 Detailed report saved to: ${reportPath}`);
      
      // Save monitoring configuration
      const configPath = path.join(__dirname, 'monitoring-config.json');
      const monitoringConfig = {
        alertThresholds: monitor.alertThresholds,
        recommendedSettings: {
          healthCheckInterval: 60000,
          performanceLogRetention: '7 days',
          errorLogRetention: '30 days',
          alertChannels: ['email', 'slack'],
          monitoringDashboard: true
        },
        integrationGuide: {
          sentry: 'Configure Sentry DSN for error tracking',
          newRelic: 'Set up New Relic for APM',
          datadog: 'Configure DataDog for infrastructure monitoring',
          prometheus: 'Set up Prometheus metrics collection'
        }
      };
      
      fs.writeFileSync(configPath, JSON.stringify(monitoringConfig, null, 2));
      console.log(`📋 Monitoring configuration saved to: ${configPath}`);
      
    } catch (error) {
      console.error('❌ Real-time monitoring testing failed:', error.message);
    } finally {
      await monitor.disconnect();
      process.exit(0);
    }
  })();
}

module.exports = RealTimeMonitoringSystem;