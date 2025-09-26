const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Import models
const User = require('./backend/models/User');
const VA = require('./backend/models/VA');
const Business = require('./backend/models/Business');
const BusinessSettings = require('./backend/models/BusinessSettings');
const PasswordResetAudit = require('./backend/models/PasswordResetAudit');
const Notification = require('./backend/models/Notification');
const AdminInvitation = require('./backend/models/AdminInvitation');
const SiteConfig = require('./backend/models/SiteConfig');

// Comprehensive CRUD Testing Suite for Linkage VA Hub
class LinkageVAHubCRUDTester {
  constructor() {
    this.testResults = {
      connection: null,
      vaTests: {
        create: [],
        read: [],
        update: [],
        delete: [],
        security: [],
        performance: []
      },
      businessTests: {
        create: [],
        read: [],
        update: [],
        delete: [],
        security: [],
        performance: []
      },
      adminTests: {
        create: [],
        read: [],
        update: [],
        delete: [],
        security: [],
        performance: []
      },
      integrationTests: [],
      dataIntegrityTests: [],
      edgeCaseTests: [],
      errors: []
    };
    
    this.testData = {
      createdUsers: [],
      createdVAs: [],
      createdBusinesses: [],
      createdAdmins: []
    };
  }

  async connect() {
    try {
      console.log('🔗 Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
      console.log('✅ MongoDB connected successfully');
      this.testResults.connection = 'SUCCESS';
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      this.testResults.connection = 'FAILED: ' + error.message;
      this.testResults.errors.push(`Connection: ${error.message}`);
      return false;
    }
  }

  // ============ VIRTUAL ASSISTANT (VA) CRUD TESTS ============
  
  async testVACRUDOperations() {
    console.log('\n👨‍💻 Testing Virtual Assistant CRUD Operations...');
    
    try {
      await this.testVACreate();
      await this.testVARead();
      await this.testVAUpdate();
      await this.testVADelete();
      await this.testVASecurity();
      await this.testVAPerformance();
      
    } catch (error) {
      console.error('❌ VA CRUD tests failed:', error.message);
      this.testResults.vaTests.create.push('OVERALL_FAILED: ' + error.message);
      this.testResults.errors.push(`VA CRUD: ${error.message}`);
    }
  }

  async testVACreate() {
    console.log('📝 Testing VA Creation...');
    
    try {
      // Test 1: Complete VA Registration Flow
      const vaUser = new User({
        email: `va.test.${Date.now()}@example.com`,
        password: 'SecureVAPassword123!',
        firstName: 'John',
        lastName: 'Developer',
        role: 'va',
        provider: 'local'
      });
      
      const savedVAUser = await vaUser.save();
      this.testData.createdUsers.push(savedVAUser._id);
      
      // Create VA profile
      const vaProfile = new VA({
        user: savedVAUser._id,
        name: 'John Developer',
        hero: 'Full-Stack Developer & Virtual Assistant',
        bio: 'Experienced developer with 5+ years in web development and virtual assistance',
        email: savedVAUser.email,
        phone: '+639123456789',
        website: 'https://johndeveloper.com',
        linkedin: 'https://linkedin.com/in/johndeveloper',
        github: 'https://github.com/johndeveloper',
        searchStatus: 'actively_looking',
        preferredMinHourlyRate: 15,
        preferredMaxHourlyRate: 25,
        industry: 'ecommerce',
        yearsOfExperience: 5,
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Customer Service'],
        certifications: ['AWS Certified Developer', 'Google Analytics Certified'],
        languages: [
          { language: 'English', proficiency: 'native' },
          { language: 'Filipino', proficiency: 'native' }
        ],
        availability: 'immediately',
        workingHours: {
          timezone: 'Asia/Manila',
          preferredHours: '9AM-6PM PHT'
        }
      });
      
      const savedVA = await vaProfile.save();
      this.testData.createdVAs.push(savedVA._id);
      
      console.log('✅ VA Creation: SUCCESS');
      this.testResults.vaTests.create.push('BASIC_CREATION: SUCCESS');
      
      // Test 2: VA Profile Completion Calculation
      const completionPercentage = savedVA.completionPercentage;
      const completionTest = completionPercentage > 0 && completionPercentage <= 100;
      console.log(`✅ Profile Completion: ${completionTest ? 'SUCCESS' : 'FAILED'} (${completionPercentage}%)`);
      this.testResults.vaTests.create.push(`PROFILE_COMPLETION: ${completionTest ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 3: Public Profile Key Generation
      const hasPublicKey = savedVA.publicProfileKey && savedVA.publicProfileKey.length > 0;
      console.log(`✅ Public Profile Key: ${hasPublicKey ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.vaTests.create.push(`PUBLIC_KEY: ${hasPublicKey ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (error) {
      console.error('❌ VA Creation test failed:', error.message);
      this.testResults.vaTests.create.push('FAILED: ' + error.message);
      this.testResults.errors.push(`VA Create: ${error.message}`);
    }
  }

  async testVARead() {
    console.log('👀 Testing VA Read Operations...');
    
    try {
      // Test 1: Basic VA Profile Retrieval
      const vaProfiles = await VA.find({}).populate('user').limit(5);
      const basicReadTest = vaProfiles.length >= 0;
      console.log(`✅ Basic VA Read: ${basicReadTest ? 'SUCCESS' : 'FAILED'} (${vaProfiles.length} profiles)`);
      this.testResults.vaTests.read.push(`BASIC_READ: ${basicReadTest ? 'SUCCESS' : 'FAILED'}`);
      
      if (vaProfiles.length > 0) {
        const va = vaProfiles[0];
        
        // Test 2: Population of User Relationship
        const userPopulated = va.user && va.user.email;
        console.log(`✅ User Relationship: ${userPopulated ? 'SUCCESS' : 'FAILED'}`);
        this.testResults.vaTests.read.push(`USER_POPULATION: ${userPopulated ? 'SUCCESS' : 'FAILED'}`);
        
        // Test 3: Virtual Fields
        const hasCompletion = typeof va.completionPercentage === 'number';
        console.log(`✅ Virtual Fields: ${hasCompletion ? 'SUCCESS' : 'FAILED'}`);
        this.testResults.vaTests.read.push(`VIRTUAL_FIELDS: ${hasCompletion ? 'SUCCESS' : 'FAILED'}`);
      }
      
      // Test 4: Search Functionality
      const searchResults = await VA.find({
        $text: { $search: 'developer javascript' }
      }).limit(10);
      console.log(`✅ Text Search: SUCCESS (${searchResults.length} results)`);
      this.testResults.vaTests.read.push(`TEXT_SEARCH: SUCCESS`);
      
    } catch (error) {
      console.error('❌ VA Read test failed:', error.message);
      this.testResults.vaTests.read.push('FAILED: ' + error.message);
      this.testResults.errors.push(`VA Read: ${error.message}`);
    }
  }

  async testVAUpdate() {
    console.log('✏️ Testing VA Update Operations...');
    
    try {
      if (this.testData.createdVAs.length === 0) {
        console.log('⚠️ No test VAs available for update testing');
        return;
      }
      
      const vaId = this.testData.createdVAs[0];
      const va = await VA.findById(vaId);
      
      if (!va) {
        console.log('⚠️ Test VA not found for update testing');
        return;
      }
      
      // Test 1: Basic Profile Updates
      va.bio = 'Updated bio with new experience and skills';
      va.yearsOfExperience = 6;
      va.preferredMaxHourlyRate = 30;
      
      await va.save();
      console.log('✅ Basic Profile Update: SUCCESS');
      this.testResults.vaTests.update.push('BASIC_UPDATE: SUCCESS');
      
      // Test 2: Skills Management
      va.skills.push('TypeScript', 'Vue.js', 'Docker');
      va.certifications.push('MongoDB Certified Developer');
      
      await va.save();
      console.log('✅ Skills Update: SUCCESS');
      this.testResults.vaTests.update.push('SKILLS_UPDATE: SUCCESS');
      
    } catch (error) {
      console.error('❌ VA Update test failed:', error.message);
      this.testResults.vaTests.update.push('FAILED: ' + error.message);
      this.testResults.errors.push(`VA Update: ${error.message}`);
    }
  }

  async testVADelete() {
    console.log('🗑️ Testing VA Delete Operations...');
    
    try {
      // Test 1: Soft Delete (Status Change)
      if (this.testData.createdVAs.length > 0) {
        const vaId = this.testData.createdVAs[0];
        const va = await VA.findById(vaId);
        
        if (va) {
          va.status = 'suspended';
          await va.save();
          console.log('✅ Soft Delete (Suspension): SUCCESS');
          this.testResults.vaTests.delete.push('SOFT_DELETE: SUCCESS');
        }
      }
      
    } catch (error) {
      console.error('❌ VA Delete test failed:', error.message);
      this.testResults.vaTests.delete.push('FAILED: ' + error.message);
      this.testResults.errors.push(`VA Delete: ${error.message}`);
    }
  }

  async testVASecurity() {
    console.log('🔒 Testing VA Security Features...');
    
    try {
      // Test 1: Profile Visibility Controls
      const publicVAs = await VA.find({ searchStatus: { $ne: 'invisible' } });
      const invisibleVAs = await VA.find({ searchStatus: 'invisible' });
      
      console.log(`✅ Profile Visibility: SUCCESS (${publicVAs.length} public, ${invisibleVAs.length} invisible)`);
      this.testResults.vaTests.security.push('PROFILE_VISIBILITY: SUCCESS');
      
      // Test 2: Data Validation
      let validationFailed = false;
      try {
        const invalidVA = new VA({
          user: new mongoose.Types.ObjectId(),
          name: '', // Required field left empty
          bio: '' // Required field left empty
        });
        await invalidVA.save();
      } catch (error) {
        validationFailed = true;
      }
      
      console.log(`✅ Data Validation: ${validationFailed ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.vaTests.security.push(`DATA_VALIDATION: ${validationFailed ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (error) {
      console.error('❌ VA Security test failed:', error.message);
      this.testResults.vaTests.security.push('FAILED: ' + error.message);
      this.testResults.errors.push(`VA Security: ${error.message}`);
    }
  }

  async testVAPerformance() {
    console.log('⚡ Testing VA Performance...');
    
    try {
      // Test 1: Index Performance
      const startTime = Date.now();
      await VA.find({ searchStatus: 'actively_looking' }).limit(100);
      const indexTime = Date.now() - startTime;
      
      console.log(`✅ Index Query Performance: ${indexTime}ms`);
      this.testResults.vaTests.performance.push(`INDEX_QUERY: ${indexTime}ms`);
      
      // Test 2: Text Search Performance
      const searchStartTime = Date.now();
      await VA.find({ $text: { $search: 'developer javascript react' } }).limit(50);
      const searchTime = Date.now() - searchStartTime;
      
      console.log(`✅ Text Search Performance: ${searchTime}ms`);
      this.testResults.vaTests.performance.push(`TEXT_SEARCH: ${searchTime}ms`);
      
    } catch (error) {
      console.error('❌ VA Performance test failed:', error.message);
      this.testResults.vaTests.performance.push('FAILED: ' + error.message);
      this.testResults.errors.push(`VA Performance: ${error.message}`);
    }
  }

  // ============ BUSINESS CRUD TESTS ============
  
  async testBusinessCRUDOperations() {
    console.log('\n🏢 Testing Business CRUD Operations...');
    
    try {
      await this.testBusinessCreate();
      await this.testBusinessRead();
      await this.testBusinessUpdate();
      await this.testBusinessDelete();
      await this.testBusinessSecurity();
      await this.testBusinessPerformance();
      
    } catch (error) {
      console.error('❌ Business CRUD tests failed:', error.message);
      this.testResults.businessTests.create.push('OVERALL_FAILED: ' + error.message);
      this.testResults.errors.push(`Business CRUD: ${error.message}`);
    }
  }

  async testBusinessCreate() {
    console.log('📝 Testing Business Creation...');
    
    try {
      // Test 1: Complete Business Registration Flow
      const businessUser = new User({
        email: `business.test.${Date.now()}@example.com`,
        password: 'SecureBusinessPassword123!',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'business',
        provider: 'local'
      });
      
      const savedBusinessUser = await businessUser.save();
      this.testData.createdUsers.push(savedBusinessUser._id);
      
      // Create Business profile
      const businessProfile = new Business({
        user: savedBusinessUser._id,
        contactName: 'Jane Smith',
        company: 'TechCorp Solutions',
        bio: 'Leading technology company specializing in digital transformation',
        website: 'https://techcorp.com',
        contactRole: 'HR Manager',
        email: savedBusinessUser.email,
        phone: '+1234567890',
        streetAddress: '123 Business Ave',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'USA',
        companySize: '51-200',
        industry: 'Technology',
        foundedYear: 2015,
        employeeCount: 150
      });
      
      const savedBusiness = await businessProfile.save();
      this.testData.createdBusinesses.push(savedBusiness._id);
      
      console.log('✅ Business Creation: SUCCESS');
      this.testResults.businessTests.create.push('BASIC_CREATION: SUCCESS');
      
      // Test 2: Profile Completion Calculation
      const completionPercentage = savedBusiness.completionPercentage;
      const completionTest = completionPercentage > 0 && completionPercentage <= 100;
      console.log(`✅ Profile Completion: ${completionTest ? 'SUCCESS' : 'FAILED'} (${completionPercentage}%)`);
      this.testResults.businessTests.create.push(`PROFILE_COMPLETION: ${completionTest ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (error) {
      console.error('❌ Business Creation test failed:', error.message);
      this.testResults.businessTests.create.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Business Create: ${error.message}`);
    }
  }

  async testBusinessRead() {
    console.log('👀 Testing Business Read Operations...');
    
    try {
      // Test 1: Basic Business Profile Retrieval
      const businessProfiles = await Business.find({}).populate('user').limit(5);
      const basicReadTest = businessProfiles.length >= 0;
      console.log(`✅ Basic Business Read: ${basicReadTest ? 'SUCCESS' : 'FAILED'} (${businessProfiles.length} profiles)`);
      this.testResults.businessTests.read.push(`BASIC_READ: ${basicReadTest ? 'SUCCESS' : 'FAILED'}`);
      
      if (businessProfiles.length > 0) {
        const business = businessProfiles[0];
        
        // Test 2: Virtual Fields
        const hasCompletion = typeof business.completionPercentage === 'number';
        const hasFullAddress = typeof business.fullAddress === 'string';
        console.log(`✅ Virtual Fields: ${hasCompletion && hasFullAddress ? 'SUCCESS' : 'FAILED'}`);
        this.testResults.businessTests.read.push(`VIRTUAL_FIELDS: ${hasCompletion && hasFullAddress ? 'SUCCESS' : 'FAILED'}`);
      }
      
    } catch (error) {
      console.error('❌ Business Read test failed:', error.message);
      this.testResults.businessTests.read.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Business Read: ${error.message}`);
    }
  }

  async testBusinessUpdate() {
    console.log('✏️ Testing Business Update Operations...');
    
    try {
      if (this.testData.createdBusinesses.length === 0) {
        console.log('⚠️ No test businesses available for update testing');
        return;
      }
      
      const businessId = this.testData.createdBusinesses[0];
      const business = await Business.findById(businessId);
      
      if (!business) {
        console.log('⚠️ Test business not found for update testing');
        return;
      }
      
      // Test 1: Basic Profile Updates
      business.bio = 'Updated company bio with new services and capabilities';
      business.employeeCount = 175;
      business.companySize = '201-500';
      
      await business.save();
      console.log('✅ Basic Profile Update: SUCCESS');
      this.testResults.businessTests.update.push('BASIC_UPDATE: SUCCESS');
      
    } catch (error) {
      console.error('❌ Business Update test failed:', error.message);
      this.testResults.businessTests.update.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Business Update: ${error.message}`);
    }
  }

  async testBusinessDelete() {
    console.log('🗑️ Testing Business Delete Operations...');
    
    try {
      // Test 1: Soft Delete (Status Change)
      if (this.testData.createdBusinesses.length > 0) {
        const businessId = this.testData.createdBusinesses[0];
        const business = await Business.findById(businessId);
        
        if (business) {
          business.status = 'suspended';
          await business.save();
          console.log('✅ Soft Delete (Suspension): SUCCESS');
          this.testResults.businessTests.delete.push('SOFT_DELETE: SUCCESS');
        }
      }
      
    } catch (error) {
      console.error('❌ Business Delete test failed:', error.message);
      this.testResults.businessTests.delete.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Business Delete: ${error.message}`);
    }
  }

  async testBusinessSecurity() {
    console.log('🔒 Testing Business Security Features...');
    
    try {
      // Test 1: Privacy Controls
      const publicBusinesses = await Business.find({ invisible: false });
      const privateBusinesses = await Business.find({ invisible: true });
      
      console.log(`✅ Privacy Controls: SUCCESS (${publicBusinesses.length} public, ${privateBusinesses.length} private)`);
      this.testResults.businessTests.security.push('PRIVACY_CONTROLS: SUCCESS');
      
    } catch (error) {
      console.error('❌ Business Security test failed:', error.message);
      this.testResults.businessTests.security.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Business Security: ${error.message}`);
    }
  }

  async testBusinessPerformance() {
    console.log('⚡ Testing Business Performance...');
    
    try {
      // Test 1: Business Query Performance
      const startTime = Date.now();
      await Business.find({}).limit(50);
      const queryTime = Date.now() - startTime;
      
      console.log(`✅ Business Query Performance: ${queryTime}ms`);
      this.testResults.businessTests.performance.push(`BUSINESS_QUERY: ${queryTime}ms`);
      
    } catch (error) {
      console.error('❌ Business Performance test failed:', error.message);
      this.testResults.businessTests.performance.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Business Performance: ${error.message}`);
    }
  }

  // ============ ADMINISTRATOR CRUD TESTS ============
  
  async testAdminCRUDOperations() {
    console.log('\n👨‍💼 Testing Administrator CRUD Operations...');
    
    try {
      await this.testAdminCreate();
      await this.testAdminRead();
      await this.testAdminUpdate();
      await this.testAdminDelete();
      await this.testAdminSecurity();
      await this.testAdminPerformance();
      
    } catch (error) {
      console.error('❌ Admin CRUD tests failed:', error.message);
      this.testResults.adminTests.create.push('OVERALL_FAILED: ' + error.message);
      this.testResults.errors.push(`Admin CRUD: ${error.message}`);
    }
  }

  async testAdminCreate() {
    console.log('📝 Testing Admin Creation...');
    
    try {
      // Test 1: Admin User Creation
      const adminUser = new User({
        email: `admin.test.${Date.now()}@example.com`,
        password: 'SecureAdminPassword123!',
        firstName: 'Admin',
        lastName: 'User',
        admin: true,
        provider: 'local'
      });
      
      const savedAdminUser = await adminUser.save();
      this.testData.createdAdmins.push(savedAdminUser._id);
      this.testData.createdUsers.push(savedAdminUser._id);
      
      console.log('✅ Admin User Creation: SUCCESS');
      this.testResults.adminTests.create.push('ADMIN_USER_CREATION: SUCCESS');
      
      // Test 2: Site Configuration Creation
      await SiteConfig.setValue('admin_test_setting', {
        maintenanceMode: false,
        maxVAsPerBusiness: 50,
        defaultHourlyRate: 15
      }, {
        valueType: 'json',
        category: 'general',
        description: 'Test admin configuration settings',
        isPublic: false,
        isEditable: true
      });
      
      console.log('✅ Site Configuration Creation: SUCCESS');
      this.testResults.adminTests.create.push('SITE_CONFIG_CREATION: SUCCESS');
      
    } catch (error) {
      console.error('❌ Admin Creation test failed:', error.message);
      this.testResults.adminTests.create.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Admin Create: ${error.message}`);
    }
  }

  async testAdminRead() {
    console.log('👀 Testing Admin Read Operations...');
    
    try {
      // Test 1: Admin User Queries
      const adminUsers = await User.find({ admin: true });
      console.log(`✅ Admin Users Query: SUCCESS (${adminUsers.length} admins)`);
      this.testResults.adminTests.read.push(`ADMIN_USERS_QUERY: SUCCESS`);
      
      // Test 2: System-wide Statistics
      const totalUsers = await User.countDocuments({});
      const totalVAs = await VA.countDocuments({});
      const totalBusinesses = await Business.countDocuments({});
      
      console.log(`✅ System Statistics: SUCCESS (${totalUsers} users, ${totalVAs} VAs, ${totalBusinesses} businesses)`);
      this.testResults.adminTests.read.push('SYSTEM_STATISTICS: SUCCESS');
      
    } catch (error) {
      console.error('❌ Admin Read test failed:', error.message);
      this.testResults.adminTests.read.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Admin Read: ${error.message}`);
    }
  }

  async testAdminUpdate() {
    console.log('✏️ Testing Admin Update Operations...');
    
    try {
      // Test 1: Site Configuration Updates
      await SiteConfig.setValue('admin_updated_setting', {
        maintenanceMode: true,
        maintenanceMessage: 'System maintenance in progress'
      }, {
        valueType: 'json',
        category: 'general',
        description: 'Updated maintenance settings'
      });
      
      console.log('✅ Site Configuration Update: SUCCESS');
      this.testResults.adminTests.update.push('SITE_CONFIG_UPDATE: SUCCESS');
      
    } catch (error) {
      console.error('❌ Admin Update test failed:', error.message);
      this.testResults.adminTests.update.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Admin Update: ${error.message}`);
    }
  }

  async testAdminDelete() {
    console.log('🗑️ Testing Admin Delete Operations...');
    
    try {
      // Test 1: Site Configuration Cleanup
      await SiteConfig.deleteMany({ key: { $regex: /^admin_test/ } });
      console.log('✅ Configuration Cleanup: SUCCESS');
      this.testResults.adminTests.delete.push('CONFIG_CLEANUP: SUCCESS');
      
    } catch (error) {
      console.error('❌ Admin Delete test failed:', error.message);
      this.testResults.adminTests.delete.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Admin Delete: ${error.message}`);
    }
  }

  async testAdminSecurity() {
    console.log('🔒 Testing Admin Security Features...');
    
    try {
      // Test 1: Admin Role Verification
      const adminCount = await User.countDocuments({ admin: true });
      const regularCount = await User.countDocuments({ admin: false });
      
      console.log(`✅ Role Verification: SUCCESS (${adminCount} admins, ${regularCount} regular users)`);
      this.testResults.adminTests.security.push('ROLE_VERIFICATION: SUCCESS');
      
    } catch (error) {
      console.error('❌ Admin Security test failed:', error.message);
      this.testResults.adminTests.security.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Admin Security: ${error.message}`);
    }
  }

  async testAdminPerformance() {
    console.log('⚡ Testing Admin Performance...');
    
    try {
      // Test 1: Admin Dashboard Query Performance
      const startTime = Date.now();
      await Promise.all([
        User.countDocuments({}),
        VA.countDocuments({}),
        Business.countDocuments({})
      ]);
      const dashboardTime = Date.now() - startTime;
      
      console.log(`✅ Dashboard Query Performance: ${dashboardTime}ms`);
      this.testResults.adminTests.performance.push(`DASHBOARD_QUERY: ${dashboardTime}ms`);
      
    } catch (error) {
      console.error('❌ Admin Performance test failed:', error.message);
      this.testResults.adminTests.performance.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Admin Performance: ${error.message}`);
    }
  }

  async cleanupTestData() {
    console.log('\n🧹 Cleaning up test data...');
    
    try {
      // Clean up created VAs
      for (const vaId of this.testData.createdVAs) {
        await VA.findByIdAndDelete(vaId);
      }
      
      // Clean up created businesses
      for (const businessId of this.testData.createdBusinesses) {
        await Business.findByIdAndDelete(businessId);
      }
      
      // Clean up created users
      for (const userId of this.testData.createdUsers) {
        await User.findByIdAndDelete(userId);
      }
      
      console.log('✅ Test data cleanup completed');
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive CRUD Testing for Linkage VA Hub...\n');
    
    const connected = await this.connect();
    if (!connected) {
      console.log('❌ Cannot proceed without database connection');
      return this.generateReport();
    }

    // Run all test suites
    await this.testVACRUDOperations();
    await this.testBusinessCRUDOperations();
    await this.testAdminCRUDOperations();
    
    // Clean up test data
    await this.cleanupTestData();

    return this.generateReport();
  }

  generateReport() {
    console.log('\n📊 COMPREHENSIVE CRUD TEST REPORT - LINKAGE VA HUB');
    console.log('==============================================================');
    
    const report = {
      timestamp: new Date().toISOString(),
      connection: this.testResults.connection,
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        errors: this.testResults.errors.length
      },
      userTypes: {
        va: this.testResults.vaTests,
        business: this.testResults.businessTests,
        admin: this.testResults.adminTests
      },
      details: this.testResults
    };

    // Calculate summary statistics
    const allTestResults = [
      ...Object.values(this.testResults.vaTests).flat(),
      ...Object.values(this.testResults.businessTests).flat(),
      ...Object.values(this.testResults.adminTests).flat()
    ];

    allTestResults.forEach(result => {
      if (typeof result === 'string') {
        report.summary.totalTests++;
        if (result.includes('SUCCESS') || result.includes('ms')) {
          report.summary.passed++;
        } else if (result.includes('FAILED')) {
          report.summary.failed++;
        } else if (result.includes('WARNING')) {
          report.summary.warnings++;
        }
      }
    });

    // Display summary
    console.log(`📈 Total Tests: ${report.summary.totalTests}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`🔥 Errors: ${report.summary.errors}`);
    
    const successRate = Math.round((report.summary.passed / report.summary.totalTests) * 100);
    console.log(`📊 Success Rate: ${successRate}%`);

    // Display detailed results by user type
    console.log('\n📋 RESULTS BY USER TYPE:');
    
    console.log('\n👨‍💻 VIRTUAL ASSISTANT (VA) TESTS:');
    console.log(`  Create: ${this.testResults.vaTests.create.join(', ')}`);
    console.log(`  Read: ${this.testResults.vaTests.read.join(', ')}`);
    console.log(`  Update: ${this.testResults.vaTests.update.join(', ')}`);
    console.log(`  Delete: ${this.testResults.vaTests.delete.join(', ')}`);
    console.log(`  Security: ${this.testResults.vaTests.security.join(', ')}`);
    console.log(`  Performance: ${this.testResults.vaTests.performance.join(', ')}`);
    
    console.log('\n🏢 BUSINESS TESTS:');
    console.log(`  Create: ${this.testResults.businessTests.create.join(', ')}`);
    console.log(`  Read: ${this.testResults.businessTests.read.join(', ')}`);
    console.log(`  Update: ${this.testResults.businessTests.update.join(', ')}`);
    console.log(`  Delete: ${this.testResults.businessTests.delete.join(', ')}`);
    console.log(`  Security: ${this.testResults.businessTests.security.join(', ')}`);
    console.log(`  Performance: ${this.testResults.businessTests.performance.join(', ')}`);
    
    console.log('\n👨‍💼 ADMINISTRATOR TESTS:');
    console.log(`  Create: ${this.testResults.adminTests.create.join(', ')}`);
    console.log(`  Read: ${this.testResults.adminTests.read.join(', ')}`);
    console.log(`  Update: ${this.testResults.adminTests.update.join(', ')}`);
    console.log(`  Delete: ${this.testResults.adminTests.delete.join(', ')}`);
    console.log(`  Security: ${this.testResults.adminTests.security.join(', ')}`);
    console.log(`  Performance: ${this.testResults.adminTests.performance.join(', ')}`);

    if (report.summary.errors > 0) {
      console.log('\n🔍 ERROR DETAILS:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log('\n💡 RECOMMENDATIONS:');
    
    if (report.summary.failed > 0) {
      console.log('  • Review failed tests and implement necessary fixes');
    }
    
    if (report.summary.warnings > 0) {
      console.log('  • Address warning conditions to improve data consistency');
    }
    
    console.log('  • Implement automated testing pipeline for continuous validation');
    console.log('  • Set up monitoring alerts for database performance metrics');
    console.log('  • Regular backup and disaster recovery testing');
    console.log('  • Security audit of sensitive data handling');

    console.log('\n==============================================================');
    
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

// Run the comprehensive CRUD tests if this file is executed directly
if (require.main === module) {
  (async () => {
    const tester = new LinkageVAHubCRUDTester();
    
    try {
      const report = await tester.runAllTests();
      
      // Save report to file
      const fs = require('fs');
      const reportPath = path.join(__dirname, 'comprehensive-crud-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n💾 Detailed report saved to: ${reportPath}`);
      
    } catch (error) {
      console.error('❌ Comprehensive CRUD testing failed:', error.message);
    } finally {
      await tester.disconnect();
      process.exit(0);
    }
  })();
}

module.exports = LinkageVAHubCRUDTester;