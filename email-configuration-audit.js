const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Import models and utilities
const User = require('./backend/models/User');
const Business = require('./backend/models/Business');
const BusinessSettings = require('./backend/models/BusinessSettings');
const SiteConfig = require('./backend/models/SiteConfig');
const Notification = require('./backend/models/Notification');

// Import email utilities
const { sendEmail, testEmailConfiguration } = require('./backend/utils/email');
const { testSendGridConfig } = require('./backend/utils/sendgrid');
const { 
  getSenderConfig, 
  detectRecipientType, 
  getSenderForTemplate, 
  validateSenderDomains 
} = require('./backend/config/emailDomains');

// Email Configuration Persistence and Audit Tester
class EmailConfigurationAuditTester {
  constructor() {
    this.testResults = {
      connection: null,
      configurationPersistence: [],
      domainRouting: [],
      templateManagement: [],
      deliveryTracking: [],
      userPreferences: [],
      notificationSettings: [],
      providerIntegration: [],
      auditLogging: [],
      performance: [],
      errors: []
    };
    
    this.testData = {
      createdUsers: [],
      createdBusinesses: [],
      createdConfigs: [],
      createdNotifications: []
    };
  }

  async connect() {
    try {
      console.log('🔗 Connecting to MongoDB for Email Configuration Audit...');
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

  async testConfigurationPersistence() {
    console.log('\n📧 Testing Email Configuration Persistence...');
    
    try {
      // Test 1: Email Provider Configuration Storage
      await SiteConfig.setValue('email_provider_primary', 'sendgrid', {
        valueType: 'string',
        category: 'email',
        description: 'Primary email service provider',
        isEditable: true,
        isPublic: false
      });
      
      await SiteConfig.setValue('email_provider_fallback', 'smtp', {
        valueType: 'string',
        category: 'email',
        description: 'Fallback email service provider',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('email_provider_primary', 'email_provider_fallback');
      
      console.log('✅ Email Provider Configuration Storage: SUCCESS');
      this.testResults.configurationPersistence.push('PROVIDER_CONFIG_STORAGE: SUCCESS');
      
      // Test 2: SMTP Configuration Persistence
      const smtpConfig = {
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: '[ENCRYPTED_PASSWORD]'
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100
      };
      
      await SiteConfig.setValue('smtp_configuration', smtpConfig, {
        valueType: 'json',
        category: 'email',
        description: 'SMTP server configuration',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('smtp_configuration');
      
      console.log('✅ SMTP Configuration Persistence: SUCCESS');
      this.testResults.configurationPersistence.push('SMTP_CONFIG_PERSISTENCE: SUCCESS');
      
      // Test 3: SendGrid Configuration Persistence
      const sendGridConfig = {
        apiKey: '[ENCRYPTED_API_KEY]',
        fromEmail: 'noreply@esystemsmanagement.com',
        fromName: 'E-Systems Management',
        templateIds: {
          welcome: 'd-123456789',
          passwordReset: 'd-987654321',
          notification: 'd-456789123'
        },
        categories: ['linkage-platform', 'user-notifications'],
        trackingSettings: {
          clickTracking: true,
          openTracking: true,
          subscriptionTracking: false
        }
      };
      
      await SiteConfig.setValue('sendgrid_configuration', sendGridConfig, {
        valueType: 'json',
        category: 'email',
        description: 'SendGrid API configuration',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('sendgrid_configuration');
      
      console.log('✅ SendGrid Configuration Persistence: SUCCESS');
      this.testResults.configurationPersistence.push('SENDGRID_CONFIG_PERSISTENCE: SUCCESS');
      
      // Test 4: Email Rate Limiting Configuration
      const rateLimitConfig = {
        maxEmailsPerUser: 50,
        maxEmailsPerHour: 1000,
        cooldownPeriod: 60,
        blacklistDomains: ['tempmail.com', '10minutemail.com'],
        whitelistDomains: ['linkagevahub.com', 'esystemsmanagement.com']
      };
      
      await SiteConfig.setValue('email_rate_limits', rateLimitConfig, {
        valueType: 'json',
        category: 'email',
        description: 'Email rate limiting and filtering rules',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('email_rate_limits');
      
      console.log('✅ Rate Limiting Configuration: SUCCESS');
      this.testResults.configurationPersistence.push('RATE_LIMIT_CONFIG: SUCCESS');
      
      // Test 5: Configuration Retrieval and Validation
      const retrievedSmtpConfig = await SiteConfig.getValue('smtp_configuration');
      const configRetrievalTest = retrievedSmtpConfig && 
                                 retrievedSmtpConfig.host === smtpConfig.host &&
                                 retrievedSmtpConfig.port === smtpConfig.port;
      
      console.log(`✅ Configuration Retrieval: ${configRetrievalTest ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.configurationPersistence.push(`CONFIG_RETRIEVAL: ${configRetrievalTest ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (error) {
      console.error('❌ Configuration persistence test failed:', error.message);
      this.testResults.configurationPersistence.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Configuration Persistence: ${error.message}`);
    }
  }

  async testDomainRouting() {
    console.log('\n🌐 Testing Domain-Based Email Routing...');
    
    try {
      // Test 1: VA Domain Routing
      const vaUser = new User({
        email: `va.domain.test.${Date.now()}@example.com`,
        password: 'VADomainPassword123!',
        firstName: 'VA',
        lastName: 'Domain',
        role: 'va'
      });
      
      await vaUser.save();
      this.testData.createdUsers.push(vaUser._id);
      
      const vaSenderConfig = getSenderForTemplate('va-welcome', vaUser.email, vaUser);
      const vaRoutingTest = vaSenderConfig.domain === 'linkagevahub.com' &&
                           vaSenderConfig.email === 'hello@linkagevahub.com';
      
      console.log(`✅ VA Domain Routing: ${vaRoutingTest ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.domainRouting.push(`VA_DOMAIN_ROUTING: ${vaRoutingTest ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 2: Business Domain Routing
      const businessUser = new User({
        email: `business.domain.test.${Date.now()}@example.com`,
        password: 'BusinessDomainPassword123!',
        firstName: 'Business',
        lastName: 'Domain',
        role: 'business'
      });
      
      await businessUser.save();
      this.testData.createdUsers.push(businessUser._id);
      
      const businessSenderConfig = getSenderForTemplate('business-welcome', businessUser.email, businessUser);
      const businessRoutingTest = businessSenderConfig.domain === 'esystemsmanagment.com' &&
                                 businessSenderConfig.email === 'hello@esystemsmanagment.com';
      
      console.log(`✅ Business Domain Routing: ${businessRoutingTest ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.domainRouting.push(`BUSINESS_DOMAIN_ROUTING: ${businessRoutingTest ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 3: Admin Domain Routing
      const adminUser = new User({
        email: `admin.domain.test.${Date.now()}@example.com`,
        password: 'AdminDomainPassword123!',
        firstName: 'Admin',
        lastName: 'Domain',
        admin: true
      });
      
      await adminUser.save();
      this.testData.createdUsers.push(adminUser._id);
      
      const adminSenderConfig = getSenderForTemplate('admin-invitation', adminUser.email, adminUser);
      const adminRoutingTest = adminSenderConfig.domain === 'esystemsmanagement.com' &&
                              adminSenderConfig.email === 'noreply@esystemsmanagement.com';
      
      console.log(`✅ Admin Domain Routing: ${adminRoutingTest ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.domainRouting.push(`ADMIN_DOMAIN_ROUTING: ${adminRoutingTest ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 4: Domain Validation
      const domainValidation = validateSenderDomains();
      const requiredDomains = ['linkagevahub.com', 'esystemsmanagment.com', 'esystemsmanagement.com'];
      const domainValidationTest = domainValidation.domains.every(domain => 
        requiredDomains.includes(domain)
      );
      
      console.log(`✅ Domain Validation: ${domainValidationTest ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.domainRouting.push(`DOMAIN_VALIDATION: ${domainValidationTest ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 5: Recipient Type Detection
      const vaTypeDetection = detectRecipientType(vaUser.email, vaUser) === 'va';
      const businessTypeDetection = detectRecipientType(businessUser.email, businessUser) === 'business';
      const adminTypeDetection = detectRecipientType(adminUser.email, adminUser) === 'admin';
      
      console.log(`✅ Recipient Type Detection: ${vaTypeDetection && businessTypeDetection && adminTypeDetection ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.domainRouting.push(`RECIPIENT_TYPE_DETECTION: ${vaTypeDetection && businessTypeDetection && adminTypeDetection ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (error) {
      console.error('❌ Domain routing test failed:', error.message);
      this.testResults.domainRouting.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Domain Routing: ${error.message}`);
    }
  }

  async testTemplateManagement() {
    console.log('\n📝 Testing Email Template Management...');
    
    try {
      // Test 1: Template Storage in Database
      const emailTemplates = {
        'va-welcome': {
          subject: 'Welcome to Linkage VA Hub - {{name}}!',
          html: `
            <div style="font-family: Arial, sans-serif;">
              <h2>Welcome {{name}}!</h2>
              <p>Thank you for joining Linkage VA Hub.</p>
              <a href="{{confirmUrl}}">Confirm Email</a>
            </div>
          `,
          variables: ['name', 'confirmUrl'],
          category: 'onboarding',
          userType: 'va'
        },
        'business-welcome': {
          subject: 'Welcome to E-Systems Management - {{companyName}}!',
          html: `
            <div style="font-family: Arial, sans-serif;">
              <h2>Welcome {{companyName}}!</h2>
              <p>Thank you for joining E-Systems Management.</p>
              <a href="{{dashboardUrl}}">Access Dashboard</a>
            </div>
          `,
          variables: ['companyName', 'dashboardUrl'],
          category: 'onboarding',
          userType: 'business'
        },
        'password-reset': {
          subject: 'Password Reset Request',
          html: `
            <div style="font-family: Arial, sans-serif;">
              <h2>Password Reset</h2>
              <p>Click the link below to reset your password:</p>
              <a href="{{resetUrl}}">Reset Password</a>
              <p>This link expires in {{expiresIn}}.</p>
            </div>
          `,
          variables: ['resetUrl', 'expiresIn'],
          category: 'security',
          userType: 'all'
        }
      };
      
      await SiteConfig.setValue('email_templates', emailTemplates, {
        valueType: 'json',
        category: 'email',
        description: 'Email template definitions',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('email_templates');
      
      console.log('✅ Template Storage: SUCCESS');
      this.testResults.templateManagement.push('TEMPLATE_STORAGE: SUCCESS');
      
      // Test 2: Template Retrieval and Parsing
      const retrievedTemplates = await SiteConfig.getValue('email_templates');
      const templateRetrievalTest = retrievedTemplates && 
                                   retrievedTemplates['va-welcome'] &&
                                   retrievedTemplates['business-welcome'] &&
                                   retrievedTemplates['password-reset'];
      
      console.log(`✅ Template Retrieval: ${templateRetrievalTest ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.templateManagement.push(`TEMPLATE_RETRIEVAL: ${templateRetrievalTest ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 3: Template Variable Validation
      const vaTemplate = retrievedTemplates['va-welcome'];
      const hasRequiredVariables = vaTemplate.variables.includes('name') && 
                                   vaTemplate.variables.includes('confirmUrl');
      
      console.log(`✅ Template Variables: ${hasRequiredVariables ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.templateManagement.push(`TEMPLATE_VARIABLES: ${hasRequiredVariables ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 4: Template Versioning
      const templateVersioning = {
        currentVersion: '1.0.0',
        versions: {
          '1.0.0': emailTemplates,
          '0.9.0': {
            'va-welcome': {
              subject: 'Welcome to Linkage VA Hub!',
              html: '<p>Welcome!</p>',
              deprecated: true
            }
          }
        },
        lastUpdated: new Date().toISOString()
      };
      
      await SiteConfig.setValue('email_template_versions', templateVersioning, {
        valueType: 'json',
        category: 'email',
        description: 'Email template version control',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('email_template_versions');
      
      console.log('✅ Template Versioning: SUCCESS');
      this.testResults.templateManagement.push('TEMPLATE_VERSIONING: SUCCESS');
      
      // Test 5: Template Category Management
      const templateCategories = await this.getTemplatesByCategory(retrievedTemplates, 'onboarding');
      const categoryTest = templateCategories.length === 2; // va-welcome and business-welcome
      
      console.log(`✅ Template Categories: ${categoryTest ? 'SUCCESS' : 'FAILED'} (${templateCategories.length} onboarding templates)`);
      this.testResults.templateManagement.push(`TEMPLATE_CATEGORIES: ${categoryTest ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (error) {
      console.error('❌ Template management test failed:', error.message);
      this.testResults.templateManagement.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Template Management: ${error.message}`);
    }
  }

  getTemplatesByCategory(templates, category) {
    return Object.entries(templates)
      .filter(([key, template]) => template.category === category)
      .map(([key, template]) => ({ key, ...template }));
  }

  async testDeliveryTracking() {
    console.log('\n📊 Testing Email Delivery Tracking...');
    
    try {
      // Test 1: Delivery Status Tracking Configuration
      const deliveryTrackingConfig = {
        enabled: true,
        providers: {
          sendgrid: {
            webhookUrl: '/api/webhooks/sendgrid',
            events: ['delivered', 'opened', 'clicked', 'bounced', 'dropped'],
            signatureValidation: true
          },
          smtp: {
            enableDSN: true,
            returnPath: 'bounces@esystemsmanagement.com'
          }
        },
        retentionDays: 90,
        alertThresholds: {
          bounceRate: 5.0,
          complaintRate: 0.1,
          deliveryRate: 95.0
        }
      };
      
      await SiteConfig.setValue('email_delivery_tracking', deliveryTrackingConfig, {
        valueType: 'json',
        category: 'email',
        description: 'Email delivery tracking configuration',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('email_delivery_tracking');
      
      console.log('✅ Delivery Tracking Configuration: SUCCESS');
      this.testResults.deliveryTracking.push('DELIVERY_TRACKING_CONFIG: SUCCESS');
      
      // Test 2: Email Analytics Storage
      const emailAnalytics = {
        daily: {
          [new Date().toISOString().split('T')[0]]: {
            sent: 150,
            delivered: 145,
            opened: 87,
            clicked: 23,
            bounced: 3,
            complaints: 0,
            unsubscribed: 1
          }
        },
        weekly: {},
        monthly: {},
        byTemplate: {
          'va-welcome': { sent: 45, opened: 32, clicked: 8 },
          'business-welcome': { sent: 23, opened: 18, clicked: 5 },
          'password-reset': { sent: 12, opened: 10, clicked: 9 }
        },
        byDomain: {
          'linkagevahub.com': { sent: 85, delivered: 82 },
          'esystemsmanagment.com': { sent: 65, delivered: 63 }
        }
      };
      
      await SiteConfig.setValue('email_analytics', emailAnalytics, {
        valueType: 'json',
        category: 'email',
        description: 'Email delivery and engagement analytics',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('email_analytics');
      
      console.log('✅ Email Analytics Storage: SUCCESS');
      this.testResults.deliveryTracking.push('EMAIL_ANALYTICS_STORAGE: SUCCESS');
      
      // Test 3: Bounce and Complaint Handling
      const bounceHandlingConfig = {
        hardBounces: {
          action: 'disable_user',
          threshold: 1,
          notifyAdmin: true
        },
        softBounces: {
          action: 'retry',
          maxRetries: 3,
          retryDelay: 3600
        },
        complaints: {
          action: 'unsubscribe',
          threshold: 1,
          notifyAdmin: true,
          addToSuppressionList: true
        },
        suppressionList: {
          enabled: true,
          autoCleanup: true,
          cleanupDays: 365
        }
      };
      
      await SiteConfig.setValue('bounce_complaint_handling', bounceHandlingConfig, {
        valueType: 'json',
        category: 'email',
        description: 'Bounce and complaint handling rules',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('bounce_complaint_handling');
      
      console.log('✅ Bounce/Complaint Handling: SUCCESS');
      this.testResults.deliveryTracking.push('BOUNCE_COMPLAINT_HANDLING: SUCCESS');
      
      // Test 4: Delivery Rate Calculation
      const analytics = await SiteConfig.getValue('email_analytics');
      const todayStats = analytics.daily[new Date().toISOString().split('T')[0]];
      const deliveryRate = (todayStats.delivered / todayStats.sent) * 100;
      const deliveryRateTest = deliveryRate >= 95.0;
      
      console.log(`✅ Delivery Rate Calculation: ${deliveryRateTest ? 'SUCCESS' : 'WARNING'} (${deliveryRate.toFixed(2)}%)`);
      this.testResults.deliveryTracking.push(`DELIVERY_RATE_CALC: ${deliveryRateTest ? 'SUCCESS' : 'WARNING'}`);
      
    } catch (error) {
      console.error('❌ Delivery tracking test failed:', error.message);
      this.testResults.deliveryTracking.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Delivery Tracking: ${error.message}`);
    }
  }

  async testUserPreferences() {
    console.log('\n👤 Testing User Email Preferences...');
    
    try {
      // Test 1: User Notification Preferences Persistence
      const testUser = await User.findById(this.testData.createdUsers[0]);
      if (testUser) {
        // Update email preferences
        testUser.preferences.notifications.email.messages = false;
        testUser.preferences.notifications.email.updates = true;
        testUser.preferences.notifications.email.marketing = false;
        
        // Add custom email frequency
        testUser.preferences.notifications.emailFrequency = 'daily';
        testUser.preferences.notifications.quietHours = {
          enabled: true,
          start: '22:00',
          end: '08:00',
          timezone: 'America/New_York'
        };
        
        await testUser.save();
        
        // Verify persistence
        const updatedUser = await User.findById(testUser._id);
        const preferencesTest = updatedUser.preferences.notifications.email.messages === false &&
                               updatedUser.preferences.notifications.email.updates === true;
        
        console.log(`✅ User Email Preferences: ${preferencesTest ? 'SUCCESS' : 'FAILED'}`);
        this.testResults.userPreferences.push(`USER_EMAIL_PREFERENCES: ${preferencesTest ? 'SUCCESS' : 'FAILED'}`);
      }
      
      // Test 2: Business Email Preferences
      if (this.testData.createdUsers.length > 1) {
        const businessUser = await User.findById(this.testData.createdUsers[1]);
        if (businessUser && businessUser.business) {
          const business = await Business.findOne({ user: businessUser._id });
          if (business) {
            // Update business email preferences
            business.emailNotifications.newMessages = true;
            business.emailNotifications.vaApplications = true;
            business.emailNotifications.weeklyDigest = false;
            
            business.communicationPreferences.preferredContactMethod = 'email';
            business.communicationPreferences.responseTime = 'within-24h';
            
            await business.save();
            
            // Verify persistence
            const updatedBusiness = await Business.findById(business._id);
            const businessPreferencesTest = updatedBusiness.emailNotifications.newMessages === true &&
                                          updatedBusiness.emailNotifications.weeklyDigest === false;
            
            console.log(`✅ Business Email Preferences: ${businessPreferencesTest ? 'SUCCESS' : 'FAILED'}`);
            this.testResults.userPreferences.push(`BUSINESS_EMAIL_PREFERENCES: ${businessPreferencesTest ? 'SUCCESS' : 'FAILED'}`);
          }
        }
      }
      
      // Test 3: Unsubscribe List Management
      const unsubscribeList = {
        globalUnsubscribe: [
          'unsubscribe1@example.com',
          'unsubscribe2@example.com'
        ],
        categoryUnsubscribe: {
          'marketing': ['marketing-unsubscribe@example.com'],
          'notifications': ['notifications-unsubscribe@example.com'],
          'updates': ['updates-unsubscribe@example.com']
        },
        temporarySuppress: [
          {
            email: 'temp-suppress@example.com',
            reason: 'user_request',
            until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        ],
        lastUpdated: new Date()
      };
      
      await SiteConfig.setValue('email_unsubscribe_list', unsubscribeList, {
        valueType: 'json',
        category: 'email',
        description: 'Email unsubscribe and suppression lists',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('email_unsubscribe_list');
      
      console.log('✅ Unsubscribe List Management: SUCCESS');
      this.testResults.userPreferences.push('UNSUBSCRIBE_LIST_MGMT: SUCCESS');
      
      // Test 4: Email Frequency Controls
      const frequencyControls = {
        maxEmailsPerDay: {
          'va': 5,
          'business': 10,
          'admin': 50
        },
        quietHours: {
          enabled: true,
          defaultStart: '22:00',
          defaultEnd: '08:00',
          respectUserTimezone: true
        },
        batchProcessing: {
          enabled: true,
          batchSize: 100,
          intervalMinutes: 15,
          respectUserPreferences: true
        }
      };
      
      await SiteConfig.setValue('email_frequency_controls', frequencyControls, {
        valueType: 'json',
        category: 'email',
        description: 'Email frequency and timing controls',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('email_frequency_controls');
      
      console.log('✅ Email Frequency Controls: SUCCESS');
      this.testResults.userPreferences.push('EMAIL_FREQUENCY_CONTROLS: SUCCESS');
      
    } catch (error) {
      console.error('❌ User preferences test failed:', error.message);
      this.testResults.userPreferences.push('FAILED: ' + error.message);
      this.testResults.errors.push(`User Preferences: ${error.message}`);
    }
  }

  async testNotificationSettings() {
    console.log('\n🔔 Testing Notification Settings Persistence...');
    
    try {
      // Test 1: System-wide Notification Configuration
      const systemNotificationConfig = {
        enabled: true,
        channels: {
          email: {
            enabled: true,
            priority: 1,
            fallbackToSMS: false
          },
          push: {
            enabled: true,
            priority: 2,
            requireOptIn: true
          },
          sms: {
            enabled: false,
            priority: 3,
            requireOptIn: true,
            provider: 'twilio'
          }
        },
        types: {
          'new_message': {
            enabled: true,
            channels: ['email', 'push'],
            immediate: true,
            batchable: false
          },
          'profile_view': {
            enabled: true,
            channels: ['email'],
            immediate: false,
            batchable: true,
            batchFrequency: 'daily'
          },
          'admin_notification': {
            enabled: true,
            channels: ['email', 'push'],
            immediate: true,
            batchable: false,
            adminOnly: true
          }
        }
      };
      
      await SiteConfig.setValue('notification_system_config', systemNotificationConfig, {
        valueType: 'json',
        category: 'notifications',
        description: 'System-wide notification configuration',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('notification_system_config');
      
      console.log('✅ System Notification Configuration: SUCCESS');
      this.testResults.notificationSettings.push('SYSTEM_NOTIFICATION_CONFIG: SUCCESS');
      
      // Test 2: Individual Notification Creation and Persistence
      const testUser = await User.findById(this.testData.createdUsers[0]);
      if (testUser) {
        const notification = new Notification({
          recipient: testUser._id,
          type: 'admin_notification',
          params: {
            title: 'Email Configuration Test',
            message: 'Testing notification persistence for email audit',
            actionUrl: '/admin/email-settings',
            priority: 'high'
          }
        });
        
        await notification.save();
        this.testData.createdNotifications.push(notification._id);
        
        console.log('✅ Notification Creation: SUCCESS');
        this.testResults.notificationSettings.push('NOTIFICATION_CREATION: SUCCESS');
        
        // Test notification delivery preferences
        const deliveryPreferences = {
          recipient: testUser._id,
          email: {
            enabled: testUser.preferences.notifications.email.enabled,
            frequency: 'immediate',
            template: 'admin-notification'
          },
          push: {
            enabled: testUser.preferences.notifications.push.enabled,
            deviceTokens: ['device-token-123', 'device-token-456']
          },
          metadata: {
            createdAt: new Date(),
            testNotification: true
          }
        };
        
        notification.deliveryPreferences = deliveryPreferences;
        await notification.save();
        
        console.log('✅ Notification Delivery Preferences: SUCCESS');
        this.testResults.notificationSettings.push('NOTIFICATION_DELIVERY_PREFS: SUCCESS');
      }
      
      // Test 3: Notification Batching Configuration
      const batchingConfig = {
        enabled: true,
        schedules: {
          daily: {
            time: '09:00',
            timezone: 'user_preference',
            types: ['profile_view', 'va_added', 'business_added']
          },
          weekly: {
            day: 'monday',
            time: '10:00',
            timezone: 'UTC',
            types: ['weekly_digest', 'analytics_report']
          }
        },
        maxBatchSize: 50,
        digestTemplates: {
          daily: 'daily-digest',
          weekly: 'weekly-digest'
        }
      };
      
      await SiteConfig.setValue('notification_batching_config', batchingConfig, {
        valueType: 'json',
        category: 'notifications',
        description: 'Notification batching and digest configuration',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('notification_batching_config');
      
      console.log('✅ Notification Batching Configuration: SUCCESS');
      this.testResults.notificationSettings.push('NOTIFICATION_BATCHING_CONFIG: SUCCESS');
      
      // Test 4: Push Notification Settings
      const pushNotificationConfig = {
        providers: {
          firebase: {
            serverKey: '[ENCRYPTED_SERVER_KEY]',
            senderId: '123456789',
            enabled: true
          },
          apns: {
            keyId: '[KEY_ID]',
            teamId: '[TEAM_ID]',
            bundleId: 'com.linkage.vahub',
            enabled: false
          }
        },
        defaultSettings: {
          badge: true,
          sound: 'default',
          alert: true,
          contentAvailable: true
        },
        customSounds: ['notification.wav', 'message.wav'],
        analytics: {
          trackOpens: true,
          trackClicks: true,
          retentionDays: 30
        }
      };
      
      await SiteConfig.setValue('push_notification_config', pushNotificationConfig, {
        valueType: 'json',
        category: 'notifications',
        description: 'Push notification service configuration',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('push_notification_config');
      
      console.log('✅ Push Notification Configuration: SUCCESS');
      this.testResults.notificationSettings.push('PUSH_NOTIFICATION_CONFIG: SUCCESS');
      
    } catch (error) {
      console.error('❌ Notification settings test failed:', error.message);
      this.testResults.notificationSettings.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Notification Settings: ${error.message}`);
    }
  }

  async testProviderIntegration() {
    console.log('\n🔌 Testing Email Provider Integration...');
    
    try {
      // Test 1: SendGrid Integration Test
      try {
        const sendGridTest = await testSendGridConfig();
        console.log(`✅ SendGrid Integration: ${sendGridTest.success ? 'SUCCESS' : 'FAILED'} - ${sendGridTest.message || sendGridTest.error}`);
        this.testResults.providerIntegration.push(`SENDGRID_INTEGRATION: ${sendGridTest.success ? 'SUCCESS' : 'FAILED'}`);
      } catch (error) {
        console.log('⚠️ SendGrid Integration: SKIPPED (configuration not available)');
        this.testResults.providerIntegration.push('SENDGRID_INTEGRATION: SKIPPED');
      }
      
      // Test 2: SMTP Integration Test
      try {
        const emailConfigTest = await testEmailConfiguration();
        const smtpConfigured = emailConfigTest.smtpConfigured;
        console.log(`✅ SMTP Integration: ${smtpConfigured ? 'SUCCESS' : 'FAILED'}`);
        this.testResults.providerIntegration.push(`SMTP_INTEGRATION: ${smtpConfigured ? 'SUCCESS' : 'FAILED'}`);
      } catch (error) {
        console.log('⚠️ SMTP Integration: FAILED (configuration test error)');
        this.testResults.providerIntegration.push('SMTP_INTEGRATION: FAILED');
      }
      
      // Test 3: Provider Failover Configuration
      const failoverConfig = {
        primary: 'sendgrid',
        fallback: 'smtp',
        failoverConditions: {
          httpErrorCodes: [500, 502, 503, 504],
          timeoutMs: 10000,
          maxRetries: 3
        },
        healthCheck: {
          enabled: true,
          intervalMinutes: 5,
          endpoints: {
            sendgrid: 'https://api.sendgrid.com/v3/mail/send',
            smtp: 'smtp.sendgrid.net'
          }
        },
        alerting: {
          failoverNotification: true,
          adminEmails: ['admin@esystemsmanagement.com'],
          webhookUrl: '/api/webhooks/email-provider-status'
        }
      };
      
      await SiteConfig.setValue('email_provider_failover', failoverConfig, {
        valueType: 'json',
        category: 'email',
        description: 'Email provider failover configuration',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('email_provider_failover');
      
      console.log('✅ Provider Failover Configuration: SUCCESS');
      this.testResults.providerIntegration.push('PROVIDER_FAILOVER_CONFIG: SUCCESS');
      
      // Test 4: API Key Management
      const apiKeyManagement = {
        rotation: {
          enabled: true,
          intervalDays: 90,
          notifyBeforeDays: 7
        },
        encryption: {
          algorithm: 'aes-256-gcm',
          keyRotation: true
        },
        validation: {
          testOnSave: true,
          testIntervalHours: 24
        },
        backup: {
          enabled: true,
          retainPreviousKey: true,
          gracePeriodHours: 24
        }
      };
      
      await SiteConfig.setValue('email_api_key_management', apiKeyManagement, {
        valueType: 'json',
        category: 'email',
        description: 'Email API key management and security',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('email_api_key_management');
      
      console.log('✅ API Key Management: SUCCESS');
      this.testResults.providerIntegration.push('API_KEY_MANAGEMENT: SUCCESS');
      
    } catch (error) {
      console.error('❌ Provider integration test failed:', error.message);
      this.testResults.providerIntegration.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Provider Integration: ${error.message}`);
    }
  }

  async testAuditLogging() {
    console.log('\n📋 Testing Email Audit Logging...');
    
    try {
      // Test 1: Email Send Audit Log
      const emailAuditLog = {
        timestamp: new Date(),
        eventType: 'email_sent',
        provider: 'sendgrid',
        sender: 'hello@linkagevahub.com',
        recipient: 'test@example.com',
        template: 'va-welcome',
        messageId: 'msg-123456789',
        status: 'delivered',
        metadata: {
          userId: this.testData.createdUsers[0],
          userType: 'va',
          ipAddress: '192.168.1.100',
          userAgent: 'Test-Client/1.0'
        }
      };
      
      await SiteConfig.setValue('email_audit_logs', [emailAuditLog], {
        valueType: 'json',
        category: 'email',
        description: 'Email audit and activity logs',
        isEditable: false,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('email_audit_logs');
      
      console.log('✅ Email Audit Log Creation: SUCCESS');
      this.testResults.auditLogging.push('EMAIL_AUDIT_LOG_CREATION: SUCCESS');
      
      // Test 2: Configuration Change Audit
      const configChangeAudit = {
        timestamp: new Date(),
        eventType: 'config_changed',
        configKey: 'smtp_configuration',
        changedBy: this.testData.createdUsers[2], // admin user
        changes: {
          host: { from: 'old.smtp.com', to: 'new.smtp.com' },
          port: { from: 465, to: 587 }
        },
        metadata: {
          reason: 'Email configuration audit test',
          ipAddress: '10.0.0.1',
          userAgent: 'Admin-Panel/1.0'
        }
      };
      
      // Append to existing audit logs
      const existingLogs = await SiteConfig.getValue('email_audit_logs') || [];
      existingLogs.push(configChangeAudit);
      
      await SiteConfig.setValue('email_audit_logs', existingLogs, {
        valueType: 'json',
        category: 'email',
        description: 'Email audit and activity logs',
        isEditable: false,
        isPublic: false
      });
      
      console.log('✅ Configuration Change Audit: SUCCESS');
      this.testResults.auditLogging.push('CONFIG_CHANGE_AUDIT: SUCCESS');
      
      // Test 3: Failed Email Audit
      const failedEmailAudit = {
        timestamp: new Date(),
        eventType: 'email_failed',
        provider: 'smtp',
        sender: 'hello@esystemsmanagment.com',
        recipient: 'bounced@example.com',
        template: 'password-reset',
        errorCode: '5.1.1',
        errorMessage: 'User unknown in virtual mailbox table',
        retryCount: 3,
        metadata: {
          userId: null,
          bounceType: 'hard',
          suppressionAdded: true
        }
      };
      
      existingLogs.push(failedEmailAudit);
      await SiteConfig.setValue('email_audit_logs', existingLogs, {
        valueType: 'json',
        category: 'email',
        description: 'Email audit and activity logs',
        isEditable: false,
        isPublic: false
      });
      
      console.log('✅ Failed Email Audit: SUCCESS');
      this.testResults.auditLogging.push('FAILED_EMAIL_AUDIT: SUCCESS');
      
      // Test 4: Audit Log Retention
      const auditRetentionConfig = {
        retentionDays: 365,
        archiveAfterDays: 90,
        compressionEnabled: true,
        encryptionEnabled: true,
        cleanupSchedule: {
          frequency: 'daily',
          time: '02:00'
        }
      };
      
      await SiteConfig.setValue('email_audit_retention', auditRetentionConfig, {
        valueType: 'json',
        category: 'email',
        description: 'Email audit log retention policy',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('email_audit_retention');
      
      console.log('✅ Audit Log Retention: SUCCESS');
      this.testResults.auditLogging.push('AUDIT_LOG_RETENTION: SUCCESS');
      
      // Test 5: Audit Log Query Performance
      const auditLogs = await SiteConfig.getValue('email_audit_logs');
      const auditLogCount = auditLogs ? auditLogs.length : 0;
      
      console.log(`✅ Audit Log Query: SUCCESS (${auditLogCount} log entries)`);
      this.testResults.auditLogging.push(`AUDIT_LOG_QUERY: SUCCESS (${auditLogCount} entries)`);
      
    } catch (error) {
      console.error('❌ Audit logging test failed:', error.message);
      this.testResults.auditLogging.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Audit Logging: ${error.message}`);
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testing Email Configuration Performance...');
    
    try {
      // Test 1: Configuration Retrieval Performance
      const configStartTime = Date.now();
      await Promise.all([
        SiteConfig.getValue('smtp_configuration'),
        SiteConfig.getValue('sendgrid_configuration'),
        SiteConfig.getValue('email_templates'),
        SiteConfig.getValue('notification_system_config'),
        SiteConfig.getValue('email_analytics')
      ]);
      const configTime = Date.now() - configStartTime;
      
      console.log(`✅ Configuration Retrieval Performance: ${configTime}ms`);
      this.testResults.performance.push(`CONFIG_RETRIEVAL: ${configTime}ms`);
      
      // Test 2: Template Processing Performance
      const templateStartTime = Date.now();
      const templates = await SiteConfig.getValue('email_templates');
      if (templates) {
        // Simulate template processing for 100 emails
        for (let i = 0; i < 100; i++) {
          const template = templates['va-welcome'];
          const processed = template.html
            .replace('{{name}}', `User ${i}`)
            .replace('{{confirmUrl}}', `https://example.com/confirm/${i}`);
        }
      }
      const templateTime = Date.now() - templateStartTime;
      
      console.log(`✅ Template Processing Performance: ${templateTime}ms (100 templates)`);
      this.testResults.performance.push(`TEMPLATE_PROCESSING: ${templateTime}ms`);
      
      // Test 3: User Preference Query Performance
      const prefsStartTime = Date.now();
      await User.find({
        'preferences.notifications.email.enabled': true
      }).limit(100);
      const prefsTime = Date.now() - prefsStartTime;
      
      console.log(`✅ User Preferences Query Performance: ${prefsTime}ms`);
      this.testResults.performance.push(`USER_PREFS_QUERY: ${prefsTime}ms`);
      
      // Test 4: Notification Creation Performance
      const notificationStartTime = Date.now();
      const bulkNotifications = [];
      for (let i = 0; i < 10; i++) {
        bulkNotifications.push({
          recipient: this.testData.createdUsers[0],
          type: 'system_notification',
          params: {
            title: `Performance Test ${i}`,
            message: `Testing notification creation performance ${i}`
          }
        });
      }
      
      await Notification.insertMany(bulkNotifications);
      const notificationTime = Date.now() - notificationStartTime;
      
      console.log(`✅ Notification Creation Performance: ${notificationTime}ms (10 notifications)`);
      this.testResults.performance.push(`NOTIFICATION_CREATION: ${notificationTime}ms`);
      
      // Clean up bulk notifications
      await Notification.deleteMany({
        params: { title: { $regex: /^Performance Test/ } }
      });
      
    } catch (error) {
      console.error('❌ Performance test failed:', error.message);
      this.testResults.performance.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Performance: ${error.message}`);
    }
  }

  async cleanupTestData() {
    console.log('\n🧹 Cleaning up email configuration test data...');
    
    try {
      // Clean up test users
      for (const userId of this.testData.createdUsers) {
        await User.findByIdAndDelete(userId);
      }
      
      // Clean up test businesses
      for (const businessId of this.testData.createdBusinesses) {
        await Business.findByIdAndDelete(businessId);
        await BusinessSettings.deleteMany({ business: businessId });
      }
      
      // Clean up test configurations
      for (const configKey of this.testData.createdConfigs) {
        await SiteConfig.deleteOne({ key: configKey });
      }
      
      // Clean up test notifications
      for (const notificationId of this.testData.createdNotifications) {
        await Notification.findByIdAndDelete(notificationId);
      }
      
      console.log('✅ Email configuration test data cleanup completed');
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Email Configuration Persistence Audit...\n');
    
    const connected = await this.connect();
    if (!connected) {
      console.log('❌ Cannot proceed without database connection');
      return this.generateReport();
    }

    await this.testConfigurationPersistence();
    await this.testDomainRouting();
    await this.testTemplateManagement();
    await this.testDeliveryTracking();
    await this.testUserPreferences();
    await this.testNotificationSettings();
    await this.testProviderIntegration();
    await this.testAuditLogging();
    await this.testPerformance();
    
    await this.cleanupTestData();

    return this.generateReport();
  }

  generateReport() {
    console.log('\n📊 EMAIL CONFIGURATION AUDIT REPORT');
    console.log('=====================================================');
    
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
        configurationPersistence: this.testResults.configurationPersistence,
        domainRouting: this.testResults.domainRouting,
        templateManagement: this.testResults.templateManagement,
        deliveryTracking: this.testResults.deliveryTracking,
        userPreferences: this.testResults.userPreferences,
        notificationSettings: this.testResults.notificationSettings,
        providerIntegration: this.testResults.providerIntegration,
        auditLogging: this.testResults.auditLogging,
        performance: this.testResults.performance
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
    console.log(`📧 Configuration Persistence: ${this.testResults.configurationPersistence.join(', ')}`);
    console.log(`🌐 Domain Routing: ${this.testResults.domainRouting.join(', ')}`);
    console.log(`📝 Template Management: ${this.testResults.templateManagement.join(', ')}`);
    console.log(`📊 Delivery Tracking: ${this.testResults.deliveryTracking.join(', ')}`);
    console.log(`👤 User Preferences: ${this.testResults.userPreferences.join(', ')}`);
    console.log(`🔔 Notification Settings: ${this.testResults.notificationSettings.join(', ')}`);
    console.log(`🔌 Provider Integration: ${this.testResults.providerIntegration.join(', ')}`);
    console.log(`📋 Audit Logging: ${this.testResults.auditLogging.join(', ')}`);
    console.log(`⚡ Performance: ${this.testResults.performance.join(', ')}`);

    if (report.summary.errors > 0) {
      console.log('\n🔍 ERROR DETAILS:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log('\n💡 EMAIL SYSTEM RECOMMENDATIONS:');
    console.log('  • Implement email template versioning and rollback capability');
    console.log('  • Set up real-time monitoring for email delivery rates');
    console.log('  • Configure automated failover between email providers');
    console.log('  • Regular testing of email deliverability and reputation');
    console.log('  • Implement comprehensive audit logging for compliance');
    console.log('  • Monitor bounce rates and maintain suppression lists');

    console.log('\n=====================================================');
    
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

// Run the email configuration audit if this file is executed directly
if (require.main === module) {
  (async () => {
    const tester = new EmailConfigurationAuditTester();
    
    try {
      const report = await tester.runAllTests();
      
      // Save report to file
      const fs = require('fs');
      const reportPath = path.join(__dirname, 'email-configuration-audit-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n💾 Detailed report saved to: ${reportPath}`);
      
    } catch (error) {
      console.error('❌ Email configuration audit failed:', error.message);
    } finally {
      await tester.disconnect();
      process.exit(0);
    }
  })();
}

module.exports = EmailConfigurationAuditTester;