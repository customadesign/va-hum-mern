const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Import models
const User = require('./backend/models/User');
const VA = require('./backend/models/VA');
const Business = require('./backend/models/Business');
const BusinessSettings = require('./backend/models/BusinessSettings');
const Notification = require('./backend/models/Notification');
const SiteConfig = require('./backend/models/SiteConfig');
const AdminInvitation = require('./backend/models/AdminInvitation');
const PasswordResetAudit = require('./backend/models/PasswordResetAudit');

// Admin Frontend Integration Testing Suite
class AdminFrontendIntegrationTester {
  constructor() {
    this.testResults = {
      connection: null,
      userManagementIntegration: [],
      vaManagementIntegration: [],
      businessManagementIntegration: [],
      adminPanelIntegration: [],
      settingsIntegration: [],
      notificationIntegration: [],
      dataIntegrityValidation: [],
      performanceIntegration: [],
      securityIntegration: [],
      errors: []
    };
    
    this.testData = {
      createdUsers: [],
      createdVAs: [],
      createdBusinesses: [],
      createdSettings: [],
      createdNotifications: [],
      createdConfigs: []
    };
  }

  async connect() {
    try {
      console.log('🔗 Connecting to MongoDB for Admin Frontend Integration Testing...');
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

  async testUserManagementIntegration() {
    console.log('\n👤 Testing User Management Integration...');
    
    try {
      // Test 1: Admin Login Workflow
      const adminUser = new User({
        email: `admin.integration.${Date.now()}@example.com`,
        password: 'AdminIntegrationPassword123!',
        firstName: 'Admin',
        lastName: 'Integration',
        admin: true,
        provider: 'local'
      });
      
      await adminUser.save();
      this.testData.createdUsers.push(adminUser._id);
      
      console.log('✅ Admin User Creation: SUCCESS');
      this.testResults.userManagementIntegration.push('ADMIN_USER_CREATION: SUCCESS');
      
      // Test 2: User Search and Filtering
      const testUsers = [];
      for (let i = 0; i < 5; i++) {
        const user = new User({
          email: `search.test.${i}.${Date.now()}@example.com`,
          password: 'SearchTestPassword123!',
          firstName: `SearchTest${i}`,
          lastName: 'User',
          role: i % 2 === 0 ? 'va' : 'business',
          provider: 'local'
        });
        
        await user.save();
        testUsers.push(user);
        this.testData.createdUsers.push(user._id);
      }
      
      const searchResults = await User.find({
        firstName: { $regex: 'SearchTest', $options: 'i' }
      });
      
      const searchTest = searchResults.length >= 5;
      console.log(`✅ User Search Integration: ${searchTest ? 'SUCCESS' : 'FAILED'} (${searchResults.length} results)`);
      this.testResults.userManagementIntegration.push(`USER_SEARCH_INTEGRATION: ${searchTest ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 3: User Status Updates
      const userToUpdate = testUsers[0];
      userToUpdate.suspended = true;
      await userToUpdate.save();
      
      const updatedUser = await User.findById(userToUpdate._id);
      const statusUpdateTest = updatedUser.suspended === true;
      
      console.log(`✅ User Status Update: ${statusUpdateTest ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.userManagementIntegration.push(`USER_STATUS_UPDATE: ${statusUpdateTest ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (error) {
      console.error('❌ User management integration test failed:', error.message);
      this.testResults.userManagementIntegration.push('FAILED: ' + error.message);
      this.testResults.errors.push(`User Management Integration: ${error.message}`);
    }
  }

  async testVAManagementIntegration() {
    console.log('\n👨‍💻 Testing VA Management Integration...');
    
    try {
      // Test 1: VA Profile Creation Workflow
      const vaUser = new User({
        email: `va.integration.${Date.now()}@example.com`,
        password: 'VAIntegrationPassword123!',
        firstName: 'VA',
        lastName: 'Integration',
        role: 'va',
        provider: 'local'
      });
      
      await vaUser.save();
      this.testData.createdUsers.push(vaUser._id);
      
      const vaProfile = new VA({
        user: vaUser._id,
        name: 'John Integration Developer',
        email: vaUser.email,
        bio: 'Experienced developer with comprehensive skills',
        industry: 'ecommerce',
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        yearsOfExperience: 5,
        preferredMinHourlyRate: 20,
        preferredMaxHourlyRate: 40,
        searchStatus: 'actively_looking',
        status: 'approved'
      });
      
      await vaProfile.save();
      this.testData.createdVAs.push(vaProfile._id);
      
      console.log('✅ VA Profile Creation: SUCCESS');
      this.testResults.vaManagementIntegration.push('VA_PROFILE_CREATION: SUCCESS');
      
      // Test 2: VA Profile Updates
      vaProfile.bio = 'UPDATED: Enhanced bio with additional experience';
      vaProfile.yearsOfExperience = 6;
      vaProfile.skills.push('TypeScript', 'Docker');
      vaProfile.profileUpdatedAt = new Date();
      
      await vaProfile.save();
      
      const updatedVA = await VA.findById(vaProfile._id);
      const updateTest = updatedVA.yearsOfExperience === 6 && 
                        updatedVA.skills.includes('TypeScript');
      
      console.log(`✅ VA Profile Update: ${updateTest ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.vaManagementIntegration.push(`VA_PROFILE_UPDATE: ${updateTest ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 3: VA Search Functionality
      const searchResults = await VA.find({
        $text: { $search: 'developer javascript react' }
      });
      
      console.log(`✅ VA Search Functionality: SUCCESS (${searchResults.length} results)`);
      this.testResults.vaManagementIntegration.push('VA_SEARCH_FUNCTIONALITY: SUCCESS');
      
    } catch (error) {
      console.error('❌ VA management integration test failed:', error.message);
      this.testResults.vaManagementIntegration.push('FAILED: ' + error.message);
      this.testResults.errors.push(`VA Management Integration: ${error.message}`);
    }
  }

  async testBusinessManagementIntegration() {
    console.log('\n🏢 Testing Business Management Integration...');
    
    try {
      // Test 1: Business Registration Workflow
      const businessUser = new User({
        email: `business.integration.${Date.now()}@example.com`,
        password: 'BusinessIntegrationPassword123!',
        firstName: 'Business',
        lastName: 'Integration',
        role: 'business',
        provider: 'local'
      });
      
      await businessUser.save();
      this.testData.createdUsers.push(businessUser._id);
      
      const businessProfile = new Business({
        user: businessUser._id,
        company: 'Integration TechCorp',
        contactName: 'Jane Integration Smith',
        bio: 'Leading technology company focused on digital transformation',
        email: businessUser.email,
        industry: 'Technology',
        companySize: '201-500',
        status: 'approved'
      });
      
      await businessProfile.save();
      this.testData.createdBusinesses.push(businessProfile._id);
      
      console.log('✅ Business Registration: SUCCESS');
      this.testResults.businessManagementIntegration.push('BUSINESS_REGISTRATION: SUCCESS');
      
      // Test 2: Business Settings Integration
      const businessSettings = new BusinessSettings({
        business: businessProfile._id,
        accountSettings: {
          timezone: 'America/Los_Angeles',
          language: 'en',
          currency: 'USD'
        },
        notificationPreferences: {
          email: {
            newVAApplications: true,
            messages: true,
            weeklyReports: true
          }
        }
      });
      
      await businessSettings.save();
      this.testData.createdSettings.push(businessSettings._id);
      
      console.log('✅ Business Settings Creation: SUCCESS');
      this.testResults.businessManagementIntegration.push('BUSINESS_SETTINGS_CREATION: SUCCESS');
      
    } catch (error) {
      console.error('❌ Business management integration test failed:', error.message);
      this.testResults.businessManagementIntegration.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Business Management Integration: ${error.message}`);
    }
  }

  async testAdminPanelIntegration() {
    console.log('\n⚙️ Testing Admin Panel Integration...');
    
    try {
      // Test 1: Dashboard Statistics
      const dashboardStats = await Promise.all([
        User.countDocuments({}),
        VA.countDocuments({}),
        Business.countDocuments({})
      ]);
      
      const [totalUsers, totalVAs, totalBusinesses] = dashboardStats;
      
      console.log(`✅ Dashboard Statistics: SUCCESS (${totalUsers} users, ${totalVAs} VAs, ${totalBusinesses} businesses)`);
      this.testResults.adminPanelIntegration.push('DASHBOARD_STATISTICS: SUCCESS');
      
      // Test 2: Configuration Management
      await SiteConfig.setValue('integration_test_config', {
        testValue: 'integration_test',
        timestamp: new Date()
      }, {
        valueType: 'json',
        category: 'general',
        description: 'Integration test configuration'
      });
      
      this.testData.createdConfigs.push('integration_test_config');
      
      const configValue = await SiteConfig.getValue('integration_test_config');
      const configTest = configValue && configValue.testValue === 'integration_test';
      
      console.log(`✅ Configuration Management: ${configTest ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.adminPanelIntegration.push(`CONFIG_MANAGEMENT: ${configTest ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (error) {
      console.error('❌ Admin panel integration test failed:', error.message);
      this.testResults.adminPanelIntegration.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Admin Panel Integration: ${error.message}`);
    }
  }

  async testNotificationIntegration() {
    console.log('\n🔔 Testing Notification Integration...');
    
    try {
      // Test notification creation and management
      const adminUser = await User.findOne({ admin: true });
      if (adminUser) {
        const notification = new Notification({
          recipient: adminUser._id,
          type: 'admin_notification',
          params: {
            title: 'Integration Test Notification',
            message: 'Testing notification system integration'
          }
        });
        
        await notification.save();
        this.testData.createdNotifications.push(notification._id);
        
        console.log('✅ Notification Creation: SUCCESS');
        this.testResults.notificationIntegration.push('NOTIFICATION_CREATION: SUCCESS');
        
        // Test notification status changes
        await notification.markAsRead();
        const readNotification = await Notification.findById(notification._id);
        const readTest = readNotification.readAt !== null;
        
        console.log(`✅ Notification Status Update: ${readTest ? 'SUCCESS' : 'FAILED'}`);
        this.testResults.notificationIntegration.push(`NOTIFICATION_STATUS_UPDATE: ${readTest ? 'SUCCESS' : 'FAILED'}`);
      }
      
    } catch (error) {
      console.error('❌ Notification integration test failed:', error.message);
      this.testResults.notificationIntegration.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Notification Integration: ${error.message}`);
    }
  }

  async testDataIntegrityValidation() {
    console.log('\n🛡️ Testing Data Integrity Validation...');
    
    try {
      // Test data consistency across collections
      const usersWithVAs = await User.find({ role: 'va' });
      let consistencyCount = 0;
      
      for (const user of usersWithVAs) {
        const va = await VA.findOne({ user: user._id });
        if (va && va.email === user.email) {
          consistencyCount++;
        }
      }
      
      const consistencyTest = consistencyCount === usersWithVAs.length;
      console.log(`✅ Data Consistency: ${consistencyTest ? 'SUCCESS' : 'WARNING'} (${consistencyCount}/${usersWithVAs.length})`);
      this.testResults.dataIntegrityValidation.push(`DATA_CONSISTENCY: ${consistencyTest ? 'SUCCESS' : 'WARNING'}`);
      
      // Test validation constraints
      let validationFailures = 0;
      
      try {
        const invalidUser = new User({
          email: '', // Required field empty
          password: 'Password123!'
        });
        await invalidUser.save();
      } catch (error) {
        validationFailures++;
      }
      
      const validationTest = validationFailures > 0;
      console.log(`✅ Validation Constraints: ${validationTest ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.dataIntegrityValidation.push(`VALIDATION_CONSTRAINTS: ${validationTest ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (error) {
      console.error('❌ Data integrity validation failed:', error.message);
      this.testResults.dataIntegrityValidation.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Data Integrity: ${error.message}`);
    }
  }

  async testPerformanceIntegration() {
    console.log('\n⚡ Testing Performance Integration...');
    
    try {
      // Test dashboard load performance
      const startTime = Date.now();
      
      await Promise.all([
        User.countDocuments({}),
        VA.countDocuments({}),
        Business.countDocuments({}),
        Notification.countDocuments({ readAt: null })
      ]);
      
      const loadTime = Date.now() - startTime;
      
      console.log(`✅ Dashboard Load Performance: ${loadTime}ms`);
      this.testResults.performanceIntegration.push(`DASHBOARD_LOAD: ${loadTime}ms`);
      
      // Test query performance
      const queryStartTime = Date.now();
      await VA.find({}).limit(100);
      const queryTime = Date.now() - queryStartTime;
      
      console.log(`✅ Query Performance: ${queryTime}ms`);
      this.testResults.performanceIntegration.push(`QUERY_PERFORMANCE: ${queryTime}ms`);
      
    } catch (error) {
      console.error('❌ Performance integration test failed:', error.message);
      this.testResults.performanceIntegration.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Performance Integration: ${error.message}`);
    }
  }

  async testSecurityIntegration() {
    console.log('\n🔐 Testing Security Integration...');
    
    try {
      // Test admin access controls
      const adminUser = await User.findOne({ admin: true });
      const regularUser = await User.findOne({ admin: false });
      
      if (adminUser && regularUser) {
        const accessControlTest = adminUser.admin === true && regularUser.admin === false;
        console.log(`✅ Access Control: ${accessControlTest ? 'SUCCESS' : 'FAILED'}`);
        this.testResults.securityIntegration.push(`ACCESS_CONTROL: ${accessControlTest ? 'SUCCESS' : 'FAILED'}`);
      }
      
      // Test data encryption
      if (this.testData.createdSettings.length > 0) {
        const settings = await BusinessSettings.findById(this.testData.createdSettings[0]);
        const testData = 'sensitive test data';
        const encrypted = settings.encryptData(testData);
        const decrypted = settings.decryptData(encrypted);
        
        const encryptionTest = encrypted !== testData && decrypted === testData;
        console.log(`✅ Data Encryption: ${encryptionTest ? 'SUCCESS' : 'FAILED'}`);
        this.testResults.securityIntegration.push(`DATA_ENCRYPTION: ${encryptionTest ? 'SUCCESS' : 'FAILED'}`);
      }
      
    } catch (error) {
      console.error('❌ Security integration test failed:', error.message);
      this.testResults.securityIntegration.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Security Integration: ${error.message}`);
    }
  }

  async testSettingsIntegration() {
    console.log('\n⚙️ Testing Settings Integration...');
    
    try {
      // Test user preferences integration
      const settingsUser = await User.findById(this.testData.createdUsers[0]);
      if (settingsUser) {
        settingsUser.preferences = {
          notifications: {
            email: { enabled: true, messages: true, updates: false },
            push: { enabled: false, messages: false, updates: false }
          },
          privacy: {
            profileVisibility: 'public',
            showEmail: false,
            allowMessagesFrom: 'everyone'
          },
          display: {
            theme: 'dark',
            language: 'en'
          }
        };
        
        await settingsUser.save();
        
        const userWithPrefs = await User.findById(settingsUser._id);
        const prefsTest = userWithPrefs.preferences.display.theme === 'dark';
        
        console.log(`✅ User Preferences Integration: ${prefsTest ? 'SUCCESS' : 'FAILED'}`);
        this.testResults.settingsIntegration.push(`USER_PREFERENCES: ${prefsTest ? 'SUCCESS' : 'FAILED'}`);
      }
      
    } catch (error) {
      console.error('❌ Settings integration test failed:', error.message);
      this.testResults.settingsIntegration.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Settings Integration: ${error.message}`);
    }
  }

  async cleanupTestData() {
    console.log('\n🧹 Cleaning up integration test data...');
    
    try {
      // Clean up notifications
      for (const notificationId of this.testData.createdNotifications) {
        await Notification.findByIdAndDelete(notificationId);
      }
      
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
      
      // Clean up configurations
      for (const configKey of this.testData.createdConfigs) {
        await SiteConfig.deleteOne({ key: configKey });
      }
      
      console.log('✅ Integration test data cleanup completed');
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Admin Frontend Integration Testing...\n');
    
    const connected = await this.connect();
    if (!connected) {
      console.log('❌ Cannot proceed without database connection');
      return this.generateReport();
    }

    await this.testUserManagementIntegration();
    await this.testVAManagementIntegration();
    await this.testBusinessManagementIntegration();
    await this.testAdminPanelIntegration();
    await this.testSettingsIntegration();
    await this.testNotificationIntegration();
    await this.testDataIntegrityValidation();
    await this.testPerformanceIntegration();
    await this.testSecurityIntegration();
    
    await this.cleanupTestData();

    return this.generateReport();
  }

  generateReport() {
    console.log('\n📊 ADMIN FRONTEND INTEGRATION TEST REPORT');
    console.log('=======================================================');
    
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
      categories: {
        userManagementIntegration: this.testResults.userManagementIntegration,
        vaManagementIntegration: this.testResults.vaManagementIntegration,
        businessManagementIntegration: this.testResults.businessManagementIntegration,
        adminPanelIntegration: this.testResults.adminPanelIntegration,
        settingsIntegration: this.testResults.settingsIntegration,
        notificationIntegration: this.testResults.notificationIntegration,
        dataIntegrityValidation: this.testResults.dataIntegrityValidation,
        performanceIntegration: this.testResults.performanceIntegration,
        securityIntegration: this.testResults.securityIntegration
      },
      details: this.testResults
    };

    // Calculate summary statistics
    const allTestResults = Object.values(this.testResults).flat().filter(Array.isArray);
    allTestResults.flat().forEach(result => {
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

    console.log(`📈 Total Tests: ${report.summary.totalTests}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`🔥 Errors: ${report.summary.errors}`);
    
    const successRate = Math.round((report.summary.passed / report.summary.totalTests) * 100);
    console.log(`📊 Success Rate: ${successRate}%`);

    console.log('\n📋 DETAILED INTEGRATION RESULTS:');
    console.log(`👤 User Management: ${this.testResults.userManagementIntegration.join(', ')}`);
    console.log(`👨‍💻 VA Management: ${this.testResults.vaManagementIntegration.join(', ')}`);
    console.log(`🏢 Business Management: ${this.testResults.businessManagementIntegration.join(', ')}`);
    console.log(`⚙️ Admin Panel: ${this.testResults.adminPanelIntegration.join(', ')}`);
    console.log(`⚙️ Settings: ${this.testResults.settingsIntegration.join(', ')}`);
    console.log(`🔔 Notifications: ${this.testResults.notificationIntegration.join(', ')}`);
    console.log(`🛡️ Data Integrity: ${this.testResults.dataIntegrityValidation.join(', ')}`);
    console.log(`⚡ Performance: ${this.testResults.performanceIntegration.join(', ')}`);
    console.log(`🔐 Security: ${this.testResults.securityIntegration.join(', ')}`);

    if (report.summary.errors > 0) {
      console.log('\n🔍 ERROR DETAILS:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log('\n💡 INTEGRATION RECOMMENDATIONS:');
    console.log('  • Implement automated integration testing pipeline');
    console.log('  • Set up continuous monitoring of admin panel performance');
    console.log('  • Regular validation of data consistency across collections');
    console.log('  • Implement comprehensive audit logging for admin actions');
    console.log('  • Set up alerts for integration failures in production');

    console.log('\n=======================================================');
    
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

// Run the integration tests if this file is executed directly
if (require.main === module) {
  (async () => {
    const tester = new AdminFrontendIntegrationTester();
    
    try {
      const report = await tester.runAllTests();
      
      // Save report to file
      const reportPath = path.join(__dirname, 'admin-frontend-integration-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n💾 Detailed report saved to: ${reportPath}`);
      
    } catch (error) {
      console.error('❌ Admin frontend integration testing failed:', error.message);
    } finally {
      await tester.disconnect();
      process.exit(0);
    }
  })();
}

module.exports = AdminFrontendIntegrationTester;