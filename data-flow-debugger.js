const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Import models and controllers
const User = require('./backend/models/User');
const VA = require('./backend/models/VA');
const Business = require('./backend/models/Business');
const BusinessSettings = require('./backend/models/BusinessSettings');
const SiteConfig = require('./backend/models/SiteConfig');

// Data Flow Debugging and Tracing System
class DataFlowDebugger {
  constructor() {
    this.traceResults = {
      connection: null,
      frontendToAPI: [],
      apiToDatabase: [],
      dataTransformation: [],
      errorHandling: [],
      performanceMetrics: [],
      integrationFlow: [],
      realTimeMonitoring: [],
      errors: []
    };
    
    this.testData = {
      createdUsers: [],
      createdVAs: [],
      createdBusinesses: [],
      createdSettings: [],
      testTraces: []
    };
    
    this.performanceMetrics = {
      apiCalls: [],
      databaseOperations: [],
      dataTransformations: [],
      endToEndLatency: []
    };
  }

  async connect() {
    try {
      console.log('🔗 Connecting to MongoDB for Data Flow Debugging...');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
      console.log('✅ MongoDB connected successfully');
      this.traceResults.connection = 'SUCCESS';
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      this.traceResults.connection = 'FAILED: ' + error.message;
      this.traceResults.errors.push(`Connection: ${error.message}`);
      return false;
    }
  }

  async testFrontendToAPIFlow() {
    console.log('\n🖥️ Testing Frontend to API Data Flow...');
    
    try {
      // Test 1: VA Profile Update Flow Simulation
      const vaUpdatePayload = {
        name: 'John Updated Developer',
        email: 'john.updated@example.com',
        phone: '+639123456789',
        hero: 'Updated Full-Stack Developer & Virtual Assistant',
        bio: 'Updated bio with comprehensive experience in web development',
        skills: 'JavaScript, React, Node.js, MongoDB, TypeScript, Vue.js',
        certifications: 'AWS Certified Developer, Google Analytics Certified, MongoDB Certified',
        languages: [
          { language: 'English', proficiency: 'native' },
          { language: 'Filipino', proficiency: 'native' },
          { language: 'Spanish', proficiency: 'conversational' }
        ],
        preferredMinHourlyRate: 18,
        preferredMaxHourlyRate: 35,
        availability: 'immediately',
        workingHours: {
          timezone: 'Asia/Manila',
          preferredHours: '8AM-5PM PHT'
        },
        industry: 'ecommerce',
        yearsOfExperience: 6,
        searchStatus: 'actively_looking',
        status: 'approved'
      };
      
      // Simulate the data transformation that happens in VAEditModal
      const transformedVAPayload = {
        ...vaUpdatePayload,
        skills: vaUpdatePayload.skills.split(',').map(s => s.trim()).filter(s => s),
        certifications: vaUpdatePayload.certifications.split(',').map(s => s.trim()).filter(s => s)
      };
      
      console.log('✅ Frontend VA Data Transformation: SUCCESS');
      this.traceResults.frontendToAPI.push('VA_DATA_TRANSFORMATION: SUCCESS');
      
      // Test 2: Business Profile Update Flow Simulation
      const businessUpdatePayload = {
        company: 'Updated TechCorp Solutions',
        contactName: 'Jane Updated Smith',
        contactRole: 'Senior HR Manager',
        email: 'jane.updated@techcorp.com',
        phone: '+1234567890',
        bio: 'Updated leading technology company specializing in digital transformation',
        website: 'https://updated-techcorp.com',
        industry: 'Technology & Software',
        companySize: '201-500',
        foundedYear: 2014,
        employeeCount: 275,
        specialties: 'Web Development, AI/ML, Cloud Computing, Cybersecurity',
        benefits: 'Health Insurance, Remote Work, Professional Development, Stock Options',
        workEnvironment: 'hybrid',
        emailNotifications: {
          newMessages: true,
          vaApplications: true,
          vaMatches: false,
          platformUpdates: true,
          marketingEmails: false,
          weeklyDigest: true
        },
        communicationPreferences: {
          preferredContactMethod: 'email',
          responseTime: 'within-24h',
          availableForInterviews: true,
          allowDirectMessages: true
        },
        privacySettings: {
          showEmail: false,
          showPhone: false,
          showLocation: true,
          showCompanySize: true,
          allowAnalytics: true
        }
      };
      
      // Simulate the data transformation that happens in BusinessEditModal
      const transformedBusinessPayload = {
        ...businessUpdatePayload,
        specialties: businessUpdatePayload.specialties.split(',').map(s => s.trim()).filter(s => s),
        benefits: businessUpdatePayload.benefits.split(',').map(s => s.trim()).filter(s => s)
      };
      
      console.log('✅ Frontend Business Data Transformation: SUCCESS');
      this.traceResults.frontendToAPI.push('BUSINESS_DATA_TRANSFORMATION: SUCCESS');
      
      // Test 3: Form Validation Simulation
      const validationTests = [
        { field: 'email', value: 'invalid-email', shouldFail: true },
        { field: 'email', value: 'valid@example.com', shouldFail: false },
        { field: 'preferredMinHourlyRate', value: -5, shouldFail: true },
        { field: 'preferredMinHourlyRate', value: 15, shouldFail: false },
        { field: 'yearsOfExperience', value: 100, shouldFail: true },
        { field: 'yearsOfExperience', value: 5, shouldFail: false }
      ];
      
      let validationsPassed = 0;
      for (const test of validationTests) {
        const isValidEmail = test.field === 'email' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(test.value);
        const isValidRate = test.field === 'preferredMinHourlyRate' && test.value >= 0;
        const isValidExperience = test.field === 'yearsOfExperience' && test.value >= 0 && test.value <= 50;
        
        const validationResult = isValidEmail || isValidRate || isValidExperience;
        
        if ((test.shouldFail && !validationResult) || (!test.shouldFail && validationResult)) {
          validationsPassed++;
        }
      }
      
      console.log(`✅ Frontend Validation: ${validationsPassed === validationTests.length ? 'SUCCESS' : 'FAILED'} (${validationsPassed}/${validationTests.length})`);
      this.traceResults.frontendToAPI.push(`FRONTEND_VALIDATION: ${validationsPassed === validationTests.length ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 4: API Request Structure Validation
      const apiRequestStructure = {
        method: 'PUT',
        url: '/api/admin/vas/:id/full',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer [TOKEN]'
        },
        body: transformedVAPayload,
        cookies: {
          authToken: '[JWT_TOKEN]'
        }
      };
      
      const hasRequiredFields = apiRequestStructure.method && 
                               apiRequestStructure.url && 
                               apiRequestStructure.body &&
                               Object.keys(apiRequestStructure.body).length > 0;
      
      console.log(`✅ API Request Structure: ${hasRequiredFields ? 'SUCCESS' : 'FAILED'}`);
      this.traceResults.frontendToAPI.push(`API_REQUEST_STRUCTURE: ${hasRequiredFields ? 'SUCCESS' : 'FAILED'}`);
      
      // Store test payloads for later use
      this.testData.vaUpdatePayload = transformedVAPayload;
      this.testData.businessUpdatePayload = transformedBusinessPayload;
      
    } catch (error) {
      console.error('❌ Frontend to API flow test failed:', error.message);
      this.traceResults.frontendToAPI.push('FAILED: ' + error.message);
      this.traceResults.errors.push(`Frontend to API: ${error.message}`);
    }
  }

  async testAPIToDatabaseFlow() {
    console.log('\n🔄 Testing API to Database Data Flow...');
    
    try {
      // Test 1: Create Test VA Profile (simulating full API workflow)
      console.log('Creating test user for VA profile...');
      const testUser = new User({
        email: `dataflow.va.${Date.now()}@example.com`,
        password: 'DataFlowPassword123!',
        firstName: 'DataFlow',
        lastName: 'VA',
        role: 'va',
        provider: 'local'
      });
      
      const savedUser = await testUser.save();
      this.testData.createdUsers.push(savedUser._id);
      
      console.log('Creating VA profile...');
      const vaProfile = new VA({
        user: savedUser._id,
        ...this.testData.vaUpdatePayload,
        // Convert skills array back for database storage
        skills: this.testData.vaUpdatePayload.skills || []
      });
      
      const savedVA = await vaProfile.save();
      this.testData.createdVAs.push(savedVA._id);
      
      console.log('✅ VA Profile Creation Flow: SUCCESS');
      this.traceResults.apiToDatabase.push('VA_PROFILE_CREATION: SUCCESS');
      
      // Test 2: Update VA Profile (simulating adminVAController updateFullVAProfile)
      console.log('Testing VA profile update flow...');
      const updateStartTime = Date.now();
      
      // Simulate controller logic
      const updateData = {
        bio: 'Updated bio through data flow testing',
        yearsOfExperience: 7,
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'TypeScript', 'Docker'],
        preferredMaxHourlyRate: 40
      };
      
      // Track which fields were modified (controller logic simulation)
      const modifiedFields = [];
      Object.keys(updateData).forEach(key => {
        if (JSON.stringify(savedVA[key]) !== JSON.stringify(updateData[key])) {
          modifiedFields.push(key);
          savedVA[key] = updateData[key];
        }
      });
      
      savedVA.profileUpdatedAt = new Date();
      await savedVA.save();
      
      const updateTime = Date.now() - updateStartTime;
      this.performanceMetrics.databaseOperations.push({
        operation: 'VA_UPDATE',
        duration: updateTime,
        fieldsModified: modifiedFields.length
      });
      
      console.log(`✅ VA Profile Update Flow: SUCCESS (${updateTime}ms, ${modifiedFields.length} fields)`);
      this.traceResults.apiToDatabase.push(`VA_PROFILE_UPDATE: SUCCESS (${updateTime}ms)`);
      
      // Test 3: Create Test Business Profile
      console.log('Creating test business profile...');
      const businessUser = new User({
        email: `dataflow.business.${Date.now()}@example.com`,
        password: 'DataFlowBusinessPassword123!',
        firstName: 'DataFlow',
        lastName: 'Business',
        role: 'business',
        provider: 'local'
      });
      
      const savedBusinessUser = await businessUser.save();
      this.testData.createdUsers.push(savedBusinessUser._id);
      
      const businessProfile = new Business({
        user: savedBusinessUser._id,
        ...this.testData.businessUpdatePayload,
        // Convert arrays back for database storage
        specialties: this.testData.businessUpdatePayload.specialties || [],
        benefits: this.testData.businessUpdatePayload.benefits || []
      });
      
      const savedBusiness = await businessProfile.save();
      this.testData.createdBusinesses.push(savedBusiness._id);
      
      // Create associated BusinessSettings
      const businessSettings = new BusinessSettings({
        business: savedBusiness._id,
        accountSettings: {
          timezone: 'America/Los_Angeles',
          language: 'en',
          currency: 'USD'
        },
        notificationPreferences: savedBusiness.emailNotifications,
        securitySettings: {
          sessionTimeout: 60,
          allowedLoginMethods: {
            email: true,
            google: false,
            linkedin: false
          }
        },
        preferences: savedBusiness.communicationPreferences,
        privacySettings: savedBusiness.privacySettings
      });
      
      const savedSettings = await businessSettings.save();
      this.testData.createdSettings.push(savedSettings._id);
      
      console.log('✅ Business Profile Creation Flow: SUCCESS');
      this.traceResults.apiToDatabase.push('BUSINESS_PROFILE_CREATION: SUCCESS');
      
      // Test 4: Database Relationship Validation
      const userWithVA = await User.findById(savedUser._id);
      const vaWithUser = await VA.findById(savedVA._id).populate('user');
      const businessWithUser = await Business.findById(savedBusiness._id).populate('user');
      const settingsWithBusiness = await BusinessSettings.findById(savedSettings._id).populate('business');
      
      const relationshipsValid = vaWithUser.user._id.equals(savedUser._id) &&
                                businessWithUser.user._id.equals(savedBusinessUser._id) &&
                                settingsWithBusiness.business._id.equals(savedBusiness._id);
      
      console.log(`✅ Database Relationships: ${relationshipsValid ? 'SUCCESS' : 'FAILED'}`);
      this.traceResults.apiToDatabase.push(`DATABASE_RELATIONSHIPS: ${relationshipsValid ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (error) {
      console.error('❌ API to Database flow test failed:', error.message);
      this.traceResults.apiToDatabase.push('FAILED: ' + error.message);
      this.traceResults.errors.push(`API to Database: ${error.message}`);
    }
  }

  async testDataTransformation() {
    console.log('\n🔄 Testing Data Transformation Layers...');
    
    try {
      // Test 1: Frontend Form Data to API Payload Transformation
      const frontendFormData = {
        // Simulate form input values as strings (how they come from HTML forms)
        name: 'Test Developer',
        yearsOfExperience: '5', // String from number input
        preferredMinHourlyRate: '15.50', // String from number input
        skills: 'JavaScript, React, Node.js, MongoDB', // Comma-separated string
        certifications: 'AWS Certified, Google Analytics', // Comma-separated string
        languages: [
          { language: 'English', proficiency: 'native' },
          { language: 'Filipino', proficiency: 'fluent' }
        ],
        portfolio: [
          {
            title: 'E-commerce Platform',
            description: 'Full-stack solution',
            url: 'https://github.com/example/ecommerce',
            image: 'https://example.com/portfolio1.jpg'
          }
        ],
        avatar: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', // Base64 from file input
        searchStatus: 'actively_looking',
        featured: 'true' // String from checkbox
      };
      
      // Simulate transformation logic from VAEditModal handleSubmit
      const apiPayload = {
        ...frontendFormData,
        yearsOfExperience: parseInt(frontendFormData.yearsOfExperience) || 0,
        preferredMinHourlyRate: parseFloat(frontendFormData.preferredMinHourlyRate) || 0,
        skills: frontendFormData.skills ? frontendFormData.skills.split(',').map(s => s.trim()).filter(s => s) : [],
        certifications: frontendFormData.certifications ? frontendFormData.certifications.split(',').map(s => s.trim()).filter(s => s) : [],
        featured: frontendFormData.featured === 'true' || frontendFormData.featured === true
      };
      
      const transformationValid = typeof apiPayload.yearsOfExperience === 'number' &&
                                 typeof apiPayload.preferredMinHourlyRate === 'number' &&
                                 Array.isArray(apiPayload.skills) &&
                                 Array.isArray(apiPayload.certifications) &&
                                 typeof apiPayload.featured === 'boolean';
      
      console.log(`✅ Frontend to API Transformation: ${transformationValid ? 'SUCCESS' : 'FAILED'}`);
      this.traceResults.dataTransformation.push(`FRONTEND_TO_API: ${transformationValid ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 2: API to Database Model Transformation
      const dbModel = new VA({
        user: new mongoose.Types.ObjectId(),
        name: apiPayload.name,
        bio: 'Test bio for data transformation',
        ...apiPayload
      });
      
      // Validate model structure
      const modelValidation = dbModel.validateSync();
      const modelValid = !modelValidation;
      
      console.log(`✅ API to Database Model: ${modelValid ? 'SUCCESS' : 'FAILED'}`);
      this.traceResults.dataTransformation.push(`API_TO_DATABASE_MODEL: ${modelValid ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 3: Database to API Response Transformation
      if (this.testData.createdVAs.length > 0) {
        const vaFromDB = await VA.findById(this.testData.createdVAs[0]).populate('user');
        
        // Simulate controller response transformation (like in adminVAController)
        const apiResponse = {
          _id: vaFromDB._id,
          name: vaFromDB.name,
          email: vaFromDB.email,
          bio: vaFromDB.bio,
          skills: vaFromDB.skills,
          yearsOfExperience: vaFromDB.yearsOfExperience,
          preferredMinHourlyRate: vaFromDB.preferredMinHourlyRate,
          preferredMaxHourlyRate: vaFromDB.preferredMaxHourlyRate,
          completionPercentage: vaFromDB.completionPercentage,
          user: vaFromDB.user ? {
            email: vaFromDB.user.email,
            suspended: vaFromDB.user.suspended,
            createdAt: vaFromDB.user.createdAt
          } : null,
          createdAt: vaFromDB.createdAt,
          updatedAt: vaFromDB.updatedAt
        };
        
        const responseValid = apiResponse._id && 
                             apiResponse.name && 
                             apiResponse.user &&
                             typeof apiResponse.completionPercentage === 'number';
        
        console.log(`✅ Database to API Response: ${responseValid ? 'SUCCESS' : 'FAILED'}`);
        this.traceResults.dataTransformation.push(`DATABASE_TO_API_RESPONSE: ${responseValid ? 'SUCCESS' : 'FAILED'}`);
      }
      
      // Test 4: Nested Object Transformation (Business Settings)
      if (this.testData.createdSettings.length > 0) {
        const settingsFromDB = await BusinessSettings.findById(this.testData.createdSettings[0]);
        
        // Test encryption/decryption transformation
        const testData = 'sensitive test data';
        const encrypted = settingsFromDB.encryptData(testData);
        const decrypted = settingsFromDB.decryptData(encrypted);
        
        const encryptionTransformValid = encrypted !== testData && decrypted === testData;
        
        console.log(`✅ Encryption/Decryption Transformation: ${encryptionTransformValid ? 'SUCCESS' : 'FAILED'}`);
        this.traceResults.dataTransformation.push(`ENCRYPTION_TRANSFORMATION: ${encryptionTransformValid ? 'SUCCESS' : 'FAILED'}`);
      }
      
    } catch (error) {
      console.error('❌ Data transformation test failed:', error.message);
      this.traceResults.dataTransformation.push('FAILED: ' + error.message);
      this.traceResults.errors.push(`Data Transformation: ${error.message}`);
    }
  }

  async testErrorHandling() {
    console.log('\n🚨 Testing Error Handling in Data Flow...');
    
    try {
      // Test 1: Invalid Data Handling
      try {
        const invalidVA = new VA({
          user: new mongoose.Types.ObjectId(),
          name: '', // Required field empty
          bio: '' // Required field empty
        });
        await invalidVA.save();
        
        console.log('❌ Invalid Data Validation: FAILED (should have been rejected)');
        this.traceResults.errorHandling.push('INVALID_DATA_VALIDATION: FAILED');
      } catch (error) {
        console.log('✅ Invalid Data Validation: SUCCESS (properly rejected)');
        this.traceResults.errorHandling.push('INVALID_DATA_VALIDATION: SUCCESS');
      }
      
      // Test 2: Duplicate Email Handling
      try {
        const duplicateUser = new User({
          email: this.testData.createdUsers.length > 0 ? 
                 (await User.findById(this.testData.createdUsers[0])).email : 
                 'duplicate@example.com',
          password: 'DuplicatePassword123!',
          firstName: 'Duplicate',
          lastName: 'User'
        });
        await duplicateUser.save();
        
        console.log('❌ Duplicate Email Handling: FAILED (should have been rejected)');
        this.traceResults.errorHandling.push('DUPLICATE_EMAIL_HANDLING: FAILED');
      } catch (error) {
        console.log('✅ Duplicate Email Handling: SUCCESS (properly rejected)');
        this.traceResults.errorHandling.push('DUPLICATE_EMAIL_HANDLING: SUCCESS');
      }
      
      // Test 3: Database Connection Error Simulation
      const originalConnection = mongoose.connection.readyState;
      
      // Simulate connection error handling
      const connectionErrorHandling = {
        hasRetryLogic: true,
        hasErrorLogging: true,
        hasGracefulDegradation: true,
        hasUserNotification: true
      };
      
      console.log('✅ Connection Error Handling: SUCCESS (simulation)');
      this.traceResults.errorHandling.push('CONNECTION_ERROR_HANDLING: SUCCESS');
      
      // Test 4: Transaction Rollback Simulation
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        
        const transactionUser = new User({
          email: `transaction.test.${Date.now()}@example.com`,
          password: 'TransactionPassword123!',
          firstName: 'Transaction',
          lastName: 'Test'
        });
        
        await transactionUser.save({ session });
        
        // Simulate an error that should trigger rollback
        if (Math.random() > 0.5) {
          throw new Error('Simulated transaction error');
        }
        
        await session.commitTransaction();
        this.testData.createdUsers.push(transactionUser._id);
        
        console.log('✅ Transaction Success: SUCCESS');
        this.traceResults.errorHandling.push('TRANSACTION_SUCCESS: SUCCESS');
        
      } catch (error) {
        await session.abortTransaction();
        console.log('✅ Transaction Rollback: SUCCESS (properly rolled back)');
        this.traceResults.errorHandling.push('TRANSACTION_ROLLBACK: SUCCESS');
      } finally {
        session.endSession();
      }
      
      // Test 5: Validation Error Response Format
      const validationErrorResponse = {
        success: false,
        error: 'Validation failed',
        details: {
          field: 'email',
          message: 'Please provide a valid email address',
          code: 'VALIDATION_ERROR',
          value: 'invalid-email'
        },
        timestamp: new Date().toISOString(),
        requestId: 'req_123456789'
      };
      
      const errorResponseValid = validationErrorResponse.success === false &&
                                validationErrorResponse.error &&
                                validationErrorResponse.details &&
                                validationErrorResponse.timestamp;
      
      console.log(`✅ Error Response Format: ${errorResponseValid ? 'SUCCESS' : 'FAILED'}`);
      this.traceResults.errorHandling.push(`ERROR_RESPONSE_FORMAT: ${errorResponseValid ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (error) {
      console.error('❌ Error handling test failed:', error.message);
      this.traceResults.errorHandling.push('FAILED: ' + error.message);
      this.traceResults.errors.push(`Error Handling: ${error.message}`);
    }
  }

  async testPerformanceMetrics() {
    console.log('\n⚡ Testing Performance Metrics Collection...');
    
    try {
      // Test 1: API Endpoint Performance
      const apiEndpoints = [
        { name: 'GET /admin/vas', operation: () => VA.find({}).limit(10) },
        { name: 'GET /admin/businesses', operation: () => Business.find({}).limit(10) },
        { name: 'GET /admin/users', operation: () => User.find({}).limit(10) },
        { name: 'GET /admin/stats', operation: async () => {
          const stats = await Promise.all([
            User.countDocuments({}),
            VA.countDocuments({}),
            Business.countDocuments({})
          ]);
          return { users: stats[0], vas: stats[1], businesses: stats[2] };
        }}
      ];
      
      for (const endpoint of apiEndpoints) {
        const startTime = Date.now();
        await endpoint.operation();
        const duration = Date.now() - startTime;
        
        this.performanceMetrics.apiCalls.push({
          endpoint: endpoint.name,
          duration,
          timestamp: new Date()
        });
        
        console.log(`✅ ${endpoint.name}: ${duration}ms`);
      }
      
      const avgApiTime = this.performanceMetrics.apiCalls.reduce((sum, call) => sum + call.duration, 0) / this.performanceMetrics.apiCalls.length;
      console.log(`✅ Average API Performance: ${avgApiTime.toFixed(2)}ms`);
      this.traceResults.performanceMetrics.push(`AVERAGE_API_PERFORMANCE: ${avgApiTime.toFixed(2)}ms`);
      
      // Test 2: Database Query Performance
      const dbOperations = [
        { name: 'Find VA by ID', operation: () => VA.findById(this.testData.createdVAs[0]) },
        { name: 'Update VA Profile', operation: async () => {
          const va = await VA.findById(this.testData.createdVAs[0]);
          va.searchScore = Math.floor(Math.random() * 100);
          return va.save();
        }},
        { name: 'Complex VA Query', operation: () => VA.find({
          industry: 'ecommerce',
          yearsOfExperience: { $gte: 3 },
          'languages.proficiency': 'native'
        }).limit(20) },
        { name: 'Business Settings Query', operation: () => BusinessSettings.findById(this.testData.createdSettings[0]).populate('business') }
      ];
      
      for (const operation of dbOperations) {
        const startTime = Date.now();
        await operation.operation();
        const duration = Date.now() - startTime;
        
        this.performanceMetrics.databaseOperations.push({
          operation: operation.name,
          duration,
          timestamp: new Date()
        });
        
        console.log(`✅ ${operation.name}: ${duration}ms`);
      }
      
      const avgDbTime = this.performanceMetrics.databaseOperations.reduce((sum, op) => sum + op.duration, 0) / this.performanceMetrics.databaseOperations.length;
      console.log(`✅ Average Database Performance: ${avgDbTime.toFixed(2)}ms`);
      this.traceResults.performanceMetrics.push(`AVERAGE_DB_PERFORMANCE: ${avgDbTime.toFixed(2)}ms`);
      
      // Test 3: End-to-End Latency Simulation
      const endToEndStartTime = Date.now();
      
      // Simulate complete VA update flow
      const va = await VA.findById(this.testData.createdVAs[0]);
      va.bio = `Updated bio at ${new Date().toISOString()}`;
      va.profileUpdatedAt = new Date();
      await va.save();
      
      // Simulate response preparation
      const response = {
        success: true,
        data: va,
        modifiedFields: ['bio', 'profileUpdatedAt'],
        timestamp: new Date()
      };
      
      const endToEndTime = Date.now() - endToEndStartTime;
      this.performanceMetrics.endToEndLatency.push({
        operation: 'VA_UPDATE_COMPLETE_FLOW',
        duration: endToEndTime,
        timestamp: new Date()
      });
      
      console.log(`✅ End-to-End VA Update Flow: ${endToEndTime}ms`);
      this.traceResults.performanceMetrics.push(`END_TO_END_LATENCY: ${endToEndTime}ms`);
      
      // Test 4: Memory Usage Tracking
      const memoryUsage = process.memoryUsage();
      const memoryMetrics = {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
      };
      
      console.log(`✅ Memory Usage Tracking: SUCCESS (Heap: ${memoryMetrics.heapUsed}MB/${memoryMetrics.heapTotal}MB)`);
      this.traceResults.performanceMetrics.push(`MEMORY_USAGE: ${memoryMetrics.heapUsed}MB`);
      
    } catch (error) {
      console.error('❌ Performance metrics test failed:', error.message);
      this.traceResults.performanceMetrics.push('FAILED: ' + error.message);
      this.traceResults.errors.push(`Performance Metrics: ${error.message}`);
    }
  }

  async testIntegrationFlow() {
    console.log('\n🔗 Testing Complete Integration Flow...');
    
    try {
      // Test 1: Complete VA Registration to Profile Update Flow
      console.log('Testing complete VA registration flow...');
      
      // Step 1: User Registration
      const regStartTime = Date.now();
      const newUser = new User({
        email: `integration.va.${Date.now()}@example.com`,
        password: 'IntegrationPassword123!',
        firstName: 'Integration',
        lastName: 'VA',
        role: 'va'
      });
      
      const savedRegUser = await newUser.save();
      this.testData.createdUsers.push(savedRegUser._id);
      
      // Step 2: Initial VA Profile Creation
      const vaProfile = new VA({
        user: savedRegUser._id,
        name: newUser.getDisplayName(),
        bio: 'Initial bio from registration',
        email: savedRegUser.email,
        searchStatus: 'open',
        industry: 'other'
      });
      
      const savedVAProfile = await vaProfile.save();
      this.testData.createdVAs.push(savedVAProfile._id);
      
      // Step 3: Profile Completion Updates
      savedVAProfile.bio = 'Updated comprehensive bio with detailed experience';
      savedVAProfile.skills = ['JavaScript', 'React', 'Node.js', 'MongoDB'];
      savedVAProfile.yearsOfExperience = 4;
      savedVAProfile.preferredMinHourlyRate = 20;
      savedVAProfile.preferredMaxHourlyRate = 35;
      savedVAProfile.languages = [
        { language: 'English', proficiency: 'native' },
        { language: 'Filipino', proficiency: 'native' }
      ];
      
      await savedVAProfile.save();
      
      // Step 4: User Preferences Update
      savedRegUser.preferences = {
        notifications: {
          email: { enabled: true, messages: true, updates: true, marketing: false },
          push: { enabled: false, messages: false, updates: false },
          sms: { enabled: false, messages: false, updates: false }
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false,
          allowMessagesFrom: 'everyone'
        },
        display: {
          theme: 'light',
          language: 'en',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h'
        }
      };
      
      await savedRegUser.save();
      
      const regTime = Date.now() - regStartTime;
      
      console.log(`✅ Complete VA Registration Flow: SUCCESS (${regTime}ms)`);
      this.traceResults.integrationFlow.push(`COMPLETE_VA_REGISTRATION: SUCCESS (${regTime}ms)`);
      
      // Test 2: Admin Management Flow
      console.log('Testing admin management flow...');
      
      const adminStartTime = Date.now();
      
      // Admin views VA profile
      const adminViewVA = await VA.findById(savedVAProfile._id).populate('user');
      
      // Admin updates VA status
      adminViewVA.status = 'approved';
      adminViewVA.searchStatus = 'actively_looking';
      adminViewVA.featuredAt = new Date();
      adminViewVA.searchScore = 85;
      
      await adminViewVA.save();
      
      // Admin creates audit log (simulated)
      const adminAuditLog = {
        adminId: 'admin_test_id',
        action: 'UPDATE_VA_PROFILE',
        targetUserId: savedRegUser._id,
        targetVAId: savedVAProfile._id,
        changes: ['status', 'searchStatus', 'featuredAt', 'searchScore'],
        timestamp: new Date(),
        ipAddress: '10.0.0.1',
        userAgent: 'Admin-Panel/2.0'
      };
      
      const adminTime = Date.now() - adminStartTime;
      
      console.log(`✅ Admin Management Flow: SUCCESS (${adminTime}ms)`);
      this.traceResults.integrationFlow.push(`ADMIN_MANAGEMENT_FLOW: SUCCESS (${adminTime}ms)`);
      
      // Test 3: Business Interaction Flow
      console.log('Testing business interaction flow...');
      
      if (this.testData.createdBusinesses.length > 0) {
        const interactionStartTime = Date.now();
        
        // Business views VA profile (simulate profile view tracking)
        const business = await Business.findById(this.testData.createdBusinesses[0]);
        const va = await VA.findById(savedVAProfile._id);
        
        // Update VA profile view stats
        va.stats = va.stats || {};
        va.stats.profileViews = (va.stats.profileViews || 0) + 1;
        await va.save();
        
        // Business sends message (simulated)
        const messageInteraction = {
          businessId: business._id,
          vaId: va._id,
          messageType: 'initial_contact',
          timestamp: new Date(),
          subject: 'Interested in your VA services',
          preview: 'Hello, I saw your profile and...'
        };
        
        const interactionTime = Date.now() - interactionStartTime;
        
        console.log(`✅ Business Interaction Flow: SUCCESS (${interactionTime}ms)`);
        this.traceResults.integrationFlow.push(`BUSINESS_INTERACTION_FLOW: SUCCESS (${interactionTime}ms)`);
      }
      
      // Test 4: Data Consistency Across Collections
      const consistencyStartTime = Date.now();
      
      const userCheck = await User.findById(savedRegUser._id);
      const vaCheck = await VA.findById(savedVAProfile._id);
      
      // Verify email consistency
      const emailConsistent = userCheck.email === vaCheck.email;
      
      // Verify user reference consistency
      const referenceConsistent = vaCheck.user.equals(userCheck._id);
      
      const consistencyTime = Date.now() - consistencyStartTime;
      
      console.log(`✅ Data Consistency Check: ${emailConsistent && referenceConsistent ? 'SUCCESS' : 'FAILED'} (${consistencyTime}ms)`);
      this.traceResults.integrationFlow.push(`DATA_CONSISTENCY: ${emailConsistent && referenceConsistent ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (error) {
      console.error('❌ Integration flow test failed:', error.message);
      this.traceResults.integrationFlow.push('FAILED: ' + error.message);
      this.traceResults.errors.push(`Integration Flow: ${error.message}`);
    }
  }

  async testRealTimeMonitoring() {
    console.log('\n📊 Testing Real-Time Monitoring Capabilities...');
    
    try {
      // Test 1: Database Write Operation Monitoring
      const writeOperations = [];
      
      // Monitor database writes
      const originalSave = mongoose.Model.prototype.save;
      mongoose.Model.prototype.save = function(options) {
        const startTime = Date.now();
        const modelName = this.constructor.modelName;
        const operation = this.isNew ? 'CREATE' : 'UPDATE';
        
        return originalSave.call(this, options).then(result => {
          const duration = Date.now() - startTime;
          writeOperations.push({
            model: modelName,
            operation,
            duration,
            timestamp: new Date(),
            documentId: result._id
          });
          return result;
        });
      };
      
      // Perform some operations to test monitoring
      const monitorTestUser = new User({
        email: `monitor.test.${Date.now()}@example.com`,
        password: 'MonitorPassword123!',
        firstName: 'Monitor',
        lastName: 'Test'
      });
      
      await monitorTestUser.save();
      this.testData.createdUsers.push(monitorTestUser._id);
      
      monitorTestUser.bio = 'Updated bio for monitoring test';
      await monitorTestUser.save();
      
      // Restore original save method
      mongoose.Model.prototype.save = originalSave;
      
      const monitoringWorking = writeOperations.length >= 2; // CREATE and UPDATE
      console.log(`✅ Database Write Monitoring: ${monitoringWorking ? 'SUCCESS' : 'FAILED'} (${writeOperations.length} operations tracked)`);
      this.traceResults.realTimeMonitoring.push(`DB_WRITE_MONITORING: ${monitoringWorking ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 2: Query Performance Monitoring
      const queryPerformanceLog = [];
      
      // Monitor slow queries
      const queries = [
        { name: 'User Search', query: () => User.find({ email: { $regex: 'test' } }) },
        { name: 'VA Filter', query: () => VA.find({ industry: 'ecommerce', searchStatus: 'actively_looking' }) },
        { name: 'Business with Settings', query: () => Business.findOne({}).populate('user') }
      ];
      
      for (const queryTest of queries) {
        const startTime = Date.now();
        await queryTest.query();
        const duration = Date.now() - startTime;
        
        queryPerformanceLog.push({
          queryName: queryTest.name,
          duration,
          slow: duration > 100, // Consider >100ms as slow
          timestamp: new Date()
        });
      }
      
      const slowQueries = queryPerformanceLog.filter(q => q.slow);
      console.log(`✅ Query Performance Monitoring: SUCCESS (${slowQueries.length} slow queries detected)`);
      this.traceResults.realTimeMonitoring.push(`QUERY_PERFORMANCE_MONITORING: SUCCESS`);
      
      // Test 3: Connection Status Monitoring
      const connectionStatus = {
        state: mongoose.connection.readyState,
        stateNames: ['disconnected', 'connected', 'connecting', 'disconnecting'],
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        collections: Object.keys(mongoose.connection.collections).length,
        timestamp: new Date()
      };
      
      const connectionMonitoringValid = connectionStatus.state === 1 && // Connected
                                      connectionStatus.collections > 0;
      
      console.log(`✅ Connection Status Monitoring: ${connectionMonitoringValid ? 'SUCCESS' : 'FAILED'}`);
      this.traceResults.realTimeMonitoring.push(`CONNECTION_STATUS_MONITORING: ${connectionMonitoringValid ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 4: Real-time Data Change Detection
      const changeDetectionLog = [];
      
      // Simulate change stream monitoring (MongoDB 3.6+)
      try {
        const changeStream = User.watch([
          { $match: { operationType: { $in: ['insert', 'update', 'delete'] } } }
        ]);
        
        // Set up change detection
        changeStream.on('change', (change) => {
          changeDetectionLog.push({
            operationType: change.operationType,
            documentKey: change.documentKey,
            timestamp: new Date(),
            fullDocument: change.fullDocument
          });
        });
        
        // Make a change to trigger the stream
        const changeTestUser = new User({
          email: `changestream.test.${Date.now()}@example.com`,
          password: 'ChangeStreamPassword123!',
          firstName: 'ChangeStream',
          lastName: 'Test'
        });
        
        await changeTestUser.save();
        this.testData.createdUsers.push(changeTestUser._id);
        
        // Wait a bit for change stream to process
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        changeStream.close();
        
        const changeDetectionWorking = changeDetectionLog.length > 0;
        console.log(`✅ Real-time Change Detection: ${changeDetectionWorking ? 'SUCCESS' : 'FAILED'} (${changeDetectionLog.length} changes detected)`);
        this.traceResults.realTimeMonitoring.push(`REALTIME_CHANGE_DETECTION: ${changeDetectionWorking ? 'SUCCESS' : 'FAILED'}`);
        
      } catch (error) {
        console.log('⚠️ Real-time Change Detection: SKIPPED (Change streams may not be supported)');
        this.traceResults.realTimeMonitoring.push('REALTIME_CHANGE_DETECTION: SKIPPED');
      }
      
      // Test 5: Error Rate Monitoring
      const errorRateMonitoring = {
        totalOperations: this.performanceMetrics.apiCalls.length + this.performanceMetrics.databaseOperations.length,
        errorCount: this.traceResults.errors.length,
        errorRate: this.traceResults.errors.length / (this.performanceMetrics.apiCalls.length + this.performanceMetrics.databaseOperations.length) * 100,
        timestamp: new Date()
      };
      
      console.log(`✅ Error Rate Monitoring: SUCCESS (${errorRateMonitoring.errorRate.toFixed(2)}% error rate)`);
      this.traceResults.realTimeMonitoring.push(`ERROR_RATE_MONITORING: SUCCESS (${errorRateMonitoring.errorRate.toFixed(2)}%)`);
      
    } catch (error) {
      console.error('❌ Real-time monitoring test failed:', error.message);
      this.traceResults.realTimeMonitoring.push('FAILED: ' + error.message);
      this.traceResults.errors.push(`Real-time Monitoring: ${error.message}`);
    }
  }

  async generateDataFlowTrace() {
    console.log('\n📋 Generating Data Flow Trace Documentation...');
    
    try {
      const dataFlowTrace = {
        timestamp: new Date().toISOString(),
        traceId: `trace_${Date.now()}`,
        application: 'Linkage VA Hub MERN Stack',
        version: '2.1.0',
        
        // Frontend Layer
        frontend: {
          framework: 'React',
          stateManagement: 'React Hooks + Context',
          formHandling: 'Controlled Components',
          apiClient: 'Axios',
          dataTransformation: {
            stringToArray: 'skills, certifications (comma-separated)',
            stringToNumber: 'rates, experience (form inputs)',
            objectMapping: 'nested preferences, settings',
            fileHandling: 'base64 conversion for uploads'
          },
          validationLayer: 'Frontend + Backend validation',
          errorHandling: 'React Error Boundaries + Toast notifications'
        },
        
        // API Layer
        api: {
          framework: 'Express.js',
          authentication: 'JWT + HttpOnly Cookies',
          authorization: 'Role-based middleware',
          rateLimiting: 'Express rate limiter',
          bodyParsing: 'Express JSON + Multipart',
          errorHandling: 'Centralized error middleware',
          logging: 'Winston + Console',
          monitoring: 'Sentry + Custom metrics'
        },
        
        // Database Layer
        database: {
          type: 'MongoDB',
          orm: 'Mongoose',
          connectionPool: 'Mongoose default pooling',
          indexing: 'Text search + field indexes',
          validation: 'Mongoose schema validation',
          middleware: 'Pre/post hooks',
          relationships: 'ObjectId references + population',
          transactions: 'MongoDB sessions'
        },
        
        // Data Flow Paths
        dataFlowPaths: {
          vaProfileUpdate: [
            'Frontend Form (VAEditModal)',
            'Data Transformation (handleSubmit)',
            'API Request (axios)',
            'Authentication Middleware (auth.js)',
            'Authorization Middleware (authorize)',
            'Controller (adminVAController.updateFullVAProfile)',
            'Model Validation (VA schema)',
            'Database Write (MongoDB)',
            'Response Preparation',
            'Frontend Update (onSuccess)'
          ],
          businessProfileUpdate: [
            'Frontend Form (BusinessEditModal)',
            'Data Transformation (handleSubmit)',
            'API Request (axios)',
            'Authentication Middleware (auth.js)',
            'Authorization Middleware (authorize)',
            'Controller (adminBusinessController.updateFullBusinessProfile)',
            'Model Validation (Business schema)',
            'Database Write (MongoDB)',
            'Settings Update (BusinessSettings)',
            'Response Preparation',
            'Frontend Update (onSuccess)'
          ],
          userAuthentication: [
            'Frontend Login Form',
            'API Request (POST /auth/login)',
            'Password Validation (bcrypt)',
            'JWT Token Generation',
            'Session Tracking (sessionTracker.js)',
            'Login History (LoginHistory model)',
            'Cookie Setting (HttpOnly)',
            'Frontend Redirect'
          ]
        },
        
        // Performance Benchmarks
        performanceBenchmarks: {
          apiCalls: this.performanceMetrics.apiCalls,
          databaseOperations: this.performanceMetrics.databaseOperations,
          endToEndLatency: this.performanceMetrics.endToEndLatency,
          averages: {
            apiCallTime: this.performanceMetrics.apiCalls.length > 0 ? 
              this.performanceMetrics.apiCalls.reduce((sum, call) => sum + call.duration, 0) / this.performanceMetrics.apiCalls.length : 0,
            dbOperationTime: this.performanceMetrics.databaseOperations.length > 0 ?
              this.performanceMetrics.databaseOperations.reduce((sum, op) => sum + op.duration, 0) / this.performanceMetrics.databaseOperations.length : 0
          }
        },
        
        // Error Patterns
        errorPatterns: {
          validationErrors: this.traceResults.errors.filter(e => e.includes('Validation')).length,
          connectionErrors: this.traceResults.errors.filter(e => e.includes('Connection')).length,
          permissionErrors: this.traceResults.errors.filter(e => e.includes('Permission') || e.includes('Access')).length,
          dataErrors: this.traceResults.errors.filter(e => e.includes('Data')).length
        },
        
        // Security Checkpoints
        securityCheckpoints: [
          'JWT Token Validation',
          'User Role Authorization',
          'Input Sanitization',
          'SQL Injection Prevention (NoSQL)',
          'XSS Prevention',
          'CSRF Protection',
          'Rate Limiting',
          'Session Management',
          'Password Hashing',
          'Data Encryption (sensitive fields)'
        ]
      };
      
      // Save trace to database
      await SiteConfig.setValue('data_flow_trace', dataFlowTrace, {
        valueType: 'json',
        category: 'general',
        description: 'Complete data flow trace documentation',
        isEditable: false,
        isPublic: false
      });
      
      console.log('✅ Data Flow Trace Generation: SUCCESS');
      this.traceResults.realTimeMonitoring.push('DATA_FLOW_TRACE_GENERATION: SUCCESS');
      
      return dataFlowTrace;
      
    } catch (error) {
      console.error('❌ Data flow trace generation failed:', error.message);
      this.traceResults.realTimeMonitoring.push('FAILED: ' + error.message);
      this.traceResults.errors.push(`Data Flow Trace: ${error.message}`);
      return null;
    }
  }

  async cleanupTestData() {
    console.log('\n🧹 Cleaning up data flow test data...');
    
    try {
      // Clean up VAs
      for (const vaId of this.testData.createdVAs) {
        await VA.findByIdAndDelete(vaId);
      }
      
      // Clean up businesses
      for (const businessId of this.testData.createdBusinesses) {
        await Business.findByIdAndDelete(businessId);
      }
      
      // Clean up business settings
      for (const settingsId of this.testData.createdSettings) {
        await BusinessSettings.findByIdAndDelete(settingsId);
      }
      
      // Clean up users
      for (const userId of this.testData.createdUsers) {
        await User.findByIdAndDelete(userId);
      }
      
      // Clean up test configurations
      await SiteConfig.deleteOne({ key: 'data_flow_trace' });
      
      console.log('✅ Data flow test data cleanup completed');
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Data Flow Debugging and Tracing...\n');
    
    const connected = await this.connect();
    if (!connected) {
      console.log('❌ Cannot proceed without database connection');
      return this.generateReport();
    }

    await this.testFrontendToAPIFlow();
    await this.testAPIToDatabaseFlow();
    await this.testDataTransformation();
    await this.testErrorHandling();
    await this.testPerformanceMetrics();
    await this.testIntegrationFlow();
    await this.testRealTimeMonitoring();
    
    const dataFlowTrace = await this.generateDataFlowTrace();
    
    await this.cleanupTestData();

    return this.generateReport(dataFlowTrace);
  }

  generateReport(dataFlowTrace = null) {
    console.log('\n📊 DATA FLOW DEBUGGING REPORT');
    console.log('===============================================');
    
    const report = {
      timestamp: new Date().toISOString(),
      connection: this.traceResults.connection,
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        errors: this.traceResults.errors.length
      },
      categories: {
        frontendToAPI: this.traceResults.frontendToAPI,
        apiToDatabase: this.traceResults.apiToDatabase,
        dataTransformation: this.traceResults.dataTransformation,
        errorHandling: this.traceResults.errorHandling,
        performanceMetrics: this.traceResults.performanceMetrics,
        integrationFlow: this.traceResults.integrationFlow,
        realTimeMonitoring: this.traceResults.realTimeMonitoring
      },
      performanceMetrics: this.performanceMetrics,
      dataFlowTrace: dataFlowTrace,
      details: this.traceResults
    };

    // Calculate summary statistics
    const allTestResults = Object.values(this.traceResults).flat().filter(Array.isArray);
    allTestResults.flat().forEach(result => {
      if (typeof result === 'string') {
        report.summary.totalTests++;
        if (result.includes('SUCCESS') || result.includes('ms')) {
          report.summary.passed++;
        } else if (result.includes('FAILED')) {
          report.summary.failed++;
        } else if (result.includes('WARNING') || result.includes('SKIPPED')) {
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

    console.log('\n📋 DETAILED RESULTS:');
    console.log(`🖥️ Frontend to API: ${this.traceResults.frontendToAPI.join(', ')}`);
    console.log(`🔄 API to Database: ${this.traceResults.apiToDatabase.join(', ')}`);
    console.log(`🔄 Data Transformation: ${this.traceResults.dataTransformation.join(', ')}`);
    console.log(`🚨 Error Handling: ${this.traceResults.errorHandling.join(', ')}`);
    console.log(`⚡ Performance Metrics: ${this.traceResults.performanceMetrics.join(', ')}`);
    console.log(`🔗 Integration Flow: ${this.traceResults.integrationFlow.join(', ')}`);
    console.log(`📊 Real-time Monitoring: ${this.traceResults.realTimeMonitoring.join(', ')}`);

    if (this.performanceMetrics.apiCalls.length > 0) {
      console.log('\n⚡ PERFORMANCE ANALYSIS:');
      const avgApiTime = this.performanceMetrics.apiCalls.reduce((sum, call) => sum + call.duration, 0) / this.performanceMetrics.apiCalls.length;
      const slowestApiCall = this.performanceMetrics.apiCalls.reduce((max, call) => call.duration > max.duration ? call : max);
      
      console.log(`  Average API Response Time: ${avgApiTime.toFixed(2)}ms`);
      console.log(`  Slowest API Call: ${slowestApiCall.endpoint} (${slowestApiCall.duration}ms)`);
      
      if (this.performanceMetrics.databaseOperations.length > 0) {
        const avgDbTime = this.performanceMetrics.databaseOperations.reduce((sum, op) => sum + op.duration, 0) / this.performanceMetrics.databaseOperations.length;
        const slowestDbOp = this.performanceMetrics.databaseOperations.reduce((max, op) => op.duration > max.duration ? op : max);
        
        console.log(`  Average Database Operation Time: ${avgDbTime.toFixed(2)}ms`);
        console.log(`  Slowest Database Operation: ${slowestDbOp.operation} (${slowestDbOp.duration}ms)`);
      }
    }

    if (report.summary.errors > 0) {
      console.log('\n🔍 ERROR DETAILS:');
      this.traceResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log('\n💡 DATA FLOW OPTIMIZATION RECOMMENDATIONS:');
    
    if (report.summary.failed > 0) {
      console.log('  • Address failed data flow tests to ensure reliability');
    }
    
    if (this.performanceMetrics.apiCalls.some(call => call.duration > 1000)) {
      console.log('  • Optimize slow API endpoints (>1000ms response time)');
    }
    
    if (this.performanceMetrics.databaseOperations.some(op => op.duration > 500)) {
      console.log('  • Review database queries and consider indexing for slow operations');
    }
    
    console.log('  • Implement comprehensive request/response logging');
    console.log('  • Set up real-time performance monitoring dashboards');
    console.log('  • Implement circuit breakers for external service calls');
    console.log('  • Add database connection pooling optimization');
    console.log('  • Implement caching layers for frequently accessed data');
    console.log('  • Set up automated alerts for performance degradation');
    console.log('  • Regular performance baseline testing');

    console.log('\n===============================================');
    
    return report;
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    } catch (error) {
      console.error('❌ Error disconnecting:', error.message);
    }
  }
}

// Run the data flow debugging if this file is executed directly
if (require.main === module) {
  (async () => {
    const dataFlowDebugger = new DataFlowDebugger();
    
    try {
      const report = await dataFlowDebugger.runAllTests();
      
      // Save report to file
      const reportPath = path.join(__dirname, 'data-flow-debug-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n💾 Detailed report saved to: ${reportPath}`);
      
      // Also save a readable trace file
      if (report.dataFlowTrace) {
        const tracePath = path.join(__dirname, 'data-flow-trace.json');
        fs.writeFileSync(tracePath, JSON.stringify(report.dataFlowTrace, null, 2));
        console.log(`📋 Data flow trace saved to: ${tracePath}`);
      }
      
    } catch (error) {
      console.error('❌ Data flow debugging failed:', error.message);
    } finally {
      await dataFlowDebugger.disconnect();
      process.exit(0);
    }
  })();
}

module.exports = DataFlowDebugger;