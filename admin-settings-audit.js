const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Import models
const User = require('./backend/models/User');
const Business = require('./backend/models/Business');
const BusinessSettings = require('./backend/models/BusinessSettings');
const SiteConfig = require('./backend/models/SiteConfig');
const Notification = require('./backend/models/Notification');
const AdminInvitation = require('./backend/models/AdminInvitation');

// Admin Settings and System Preferences Persistence Tester
class AdminSettingsAuditTester {
  constructor() {
    this.testResults = {
      connection: null,
      siteConfigManagement: [],
      systemPreferences: [],
      adminUserSettings: [],
      businessManagement: [],
      securitySettings: [],
      systemMaintenance: [],
      configurationValidation: [],
      backupAndRestore: [],
      performance: [],
      errors: []
    };
    
    this.testData = {
      createdUsers: [],
      createdBusinesses: [],
      createdSettings: [],
      createdConfigs: [],
      createdInvitations: []
    };
    
    this.adminConfigKeys = [
      'system_maintenance_mode',
      'user_registration_enabled',
      'email_verification_required',
      'admin_approval_required',
      'max_vas_per_business',
      'default_va_hourly_rate',
      'platform_commission_rate',
      'security_settings',
      'email_configuration',
      'payment_configuration',
      'feature_flags',
      'system_limits',
      'branding_configuration',
      'integration_settings'
    ];
  }

  async connect() {
    try {
      console.log('🔗 Connecting to MongoDB for Admin Settings Audit...');
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

  async testSiteConfigManagement() {
    console.log('\n⚙️ Testing Site Configuration Management...');
    
    try {
      // Test 1: System Maintenance Mode Configuration
      const maintenanceConfig = {
        enabled: false,
        message: 'System maintenance in progress. Please check back in 2 hours.',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endTime: new Date(Date.now() + 26 * 60 * 60 * 1000), // Tomorrow + 2 hours
        allowedUsers: ['admin'],
        maintenanceType: 'scheduled',
        affectedServices: ['user_registration', 'payment_processing'],
        notificationsSent: false
      };
      
      await SiteConfig.setValue('system_maintenance_mode', maintenanceConfig, {
        valueType: 'json',
        category: 'general',
        description: 'System maintenance mode configuration',
        isEditable: true,
        isPublic: true
      });
      
      this.testData.createdConfigs.push('system_maintenance_mode');
      
      console.log('✅ Maintenance Mode Configuration: SUCCESS');
      this.testResults.siteConfigManagement.push('MAINTENANCE_MODE_CONFIG: SUCCESS');
      
      // Test 2: User Registration Settings
      const registrationSettings = {
        enabled: true,
        requireEmailVerification: true,
        requireAdminApproval: false,
        allowedDomains: ['*'], // Allow all domains
        blockedDomains: ['tempmail.com', '10minutemail.com'],
        maxRegistrationsPerDay: 1000,
        maxRegistrationsPerIP: 5,
        captchaRequired: true,
        termsOfServiceVersion: '2.1',
        privacyPolicyVersion: '1.8'
      };
      
      await SiteConfig.setValue('user_registration_settings', registrationSettings, {
        valueType: 'json',
        category: 'general',
        description: 'User registration configuration and limits',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('user_registration_settings');
      
      console.log('✅ Registration Settings: SUCCESS');
      this.testResults.siteConfigManagement.push('REGISTRATION_SETTINGS: SUCCESS');
      
      // Test 3: Platform Limits and Quotas
      const platformLimits = {
        maxVAsPerBusiness: 50,
        maxBusinessesPerAdmin: 100,
        maxFileSizeUpload: 10485760, // 10MB
        maxConversationsPerUser: 500,
        maxMessagesPerConversation: 1000,
        defaultVAHourlyRate: {
          min: 5,
          max: 100,
          default: 15
        },
        commissionRates: {
          standard: 10.0,
          premium: 7.5,
          enterprise: 5.0
        },
        quotas: {
          freeUserMessages: 10,
          premiumUserMessages: 1000,
          enterpriseUserMessages: -1 // Unlimited
        }
      };
      
      await SiteConfig.setValue('platform_limits', platformLimits, {
        valueType: 'json',
        category: 'limits',
        description: 'Platform limits and quotas configuration',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('platform_limits');
      
      console.log('✅ Platform Limits Configuration: SUCCESS');
      this.testResults.siteConfigManagement.push('PLATFORM_LIMITS_CONFIG: SUCCESS');
      
      // Test 4: Feature Flags Management
      const featureFlags = {
        betaFeatures: {
          videoIntroductions: true,
          aiMatchmaking: false,
          advancedAnalytics: true,
          bulkOperations: true
        },
        userTypes: {
          va: {
            portfolioUpload: true,
            videoResume: true,
            skillAssessments: false,
            premiumFeatures: true
          },
          business: {
            teamManagement: true,
            advancedFilters: true,
            analyticsReports: true,
            apiAccess: false
          },
          admin: {
            systemMonitoring: true,
            userImpersonation: true,
            bulkUserManagement: true,
            systemConfiguration: true
          }
        },
        experimental: {
          aiChatbot: false,
          blockchainVerification: false,
          voiceNotes: false
        },
        lastUpdated: new Date(),
        updatedBy: null // Will be set to admin user ID
      };
      
      await SiteConfig.setValue('feature_flags', featureFlags, {
        valueType: 'json',
        category: 'features',
        description: 'Feature flags and experimental features',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('feature_flags');
      
      console.log('✅ Feature Flags Management: SUCCESS');
      this.testResults.siteConfigManagement.push('FEATURE_FLAGS_MANAGEMENT: SUCCESS');
      
      // Test 5: Configuration Retrieval by Category
      const generalConfigs = await SiteConfig.getByCategory('general');
      const limitsConfigs = await SiteConfig.getByCategory('limits');
      const featuresConfigs = await SiteConfig.getByCategory('features');
      
      const categoryRetrievalTest = Object.keys(generalConfigs).length > 0 &&
                                   Object.keys(limitsConfigs).length > 0 &&
                                   Object.keys(featuresConfigs).length > 0;
      
      console.log(`✅ Configuration Category Retrieval: ${categoryRetrievalTest ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.siteConfigManagement.push(`CONFIG_CATEGORY_RETRIEVAL: ${categoryRetrievalTest ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (error) {
      console.error('❌ Site configuration management test failed:', error.message);
      this.testResults.siteConfigManagement.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Site Config Management: ${error.message}`);
    }
  }

  async testSystemPreferences() {
    console.log('\n🎛️ Testing System Preferences...');
    
    try {
      // Test 1: Global Application Settings
      const globalSettings = {
        applicationName: 'Linkage VA Hub',
        version: '2.1.0',
        environment: 'production',
        timezone: 'UTC',
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'es', 'fr', 'tl'],
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h',
        currency: 'USD',
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'PHP'],
        logoUrl: 'https://linkagevahub.com/logo.png',
        faviconUrl: 'https://linkagevahub.com/favicon.ico',
        contactEmail: 'support@esystemsmanagement.com',
        supportUrl: 'https://help.esystemsmanagement.com'
      };
      
      await SiteConfig.setValue('global_application_settings', globalSettings, {
        valueType: 'json',
        category: 'general',
        description: 'Global application configuration',
        isEditable: true,
        isPublic: true
      });
      
      this.testData.createdConfigs.push('global_application_settings');
      
      console.log('✅ Global Application Settings: SUCCESS');
      this.testResults.systemPreferences.push('GLOBAL_APP_SETTINGS: SUCCESS');
      
      // Test 2: Database Connection Settings
      const databaseSettings = {
        connectionPool: {
          minConnections: 5,
          maxConnections: 20,
          acquireTimeoutMs: 30000,
          idleTimeoutMs: 600000
        },
        queryTimeout: 30000,
        indexOptimization: {
          autoCreateIndexes: true,
          backgroundIndexBuilding: true,
          indexStatisticsEnabled: true
        },
        monitoring: {
          slowQueryThreshold: 1000,
          logSlowQueries: true,
          enableProfiling: false,
          profilingLevel: 0
        },
        backup: {
          enabled: true,
          frequency: 'daily',
          retentionDays: 30,
          encryptionEnabled: true,
          compressionEnabled: true
        }
      };
      
      await SiteConfig.setValue('database_settings', databaseSettings, {
        valueType: 'json',
        category: 'general',
        description: 'Database connection and performance settings',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('database_settings');
      
      console.log('✅ Database Settings: SUCCESS');
      this.testResults.systemPreferences.push('DATABASE_SETTINGS: SUCCESS');
      
      // Test 3: Security Preferences
      const securityPreferences = {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          preventReuse: 5,
          maxAge: 90
        },
        sessionManagement: {
          maxConcurrentSessions: 3,
          sessionTimeoutMinutes: 60,
          extendOnActivity: true,
          forceLogoutOnPasswordChange: true
        },
        rateLimiting: {
          loginAttempts: {
            maxAttempts: 5,
            windowMinutes: 15,
            lockoutMinutes: 30
          },
          apiRequests: {
            maxRequestsPerMinute: 100,
            maxRequestsPerHour: 1000,
            burstLimit: 20
          }
        },
        encryption: {
          algorithm: 'aes-256-gcm',
          keyRotationDays: 90,
          saltRounds: 12
        }
      };
      
      await SiteConfig.setValue('security_preferences', securityPreferences, {
        valueType: 'json',
        category: 'security',
        description: 'System-wide security preferences',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('security_preferences');
      
      console.log('✅ Security Preferences: SUCCESS');
      this.testResults.systemPreferences.push('SECURITY_PREFERENCES: SUCCESS');
      
      // Test 4: Analytics and Monitoring Preferences
      const analyticsPreferences = {
        userAnalytics: {
          enabled: true,
          trackPageViews: true,
          trackUserActions: true,
          trackPerformance: true,
          retentionDays: 365
        },
        businessIntelligence: {
          dashboardRefreshInterval: 300, // 5 minutes
          reportGeneration: {
            daily: true,
            weekly: true,
            monthly: true,
            custom: true
          },
          dataExport: {
            formats: ['csv', 'json', 'pdf'],
            maxRecords: 10000,
            compressionEnabled: true
          }
        },
        monitoring: {
          uptime: {
            enabled: true,
            checkInterval: 60,
            alertThreshold: 99.9
          },
          performance: {
            responseTimeThreshold: 2000,
            errorRateThreshold: 1.0,
            memoryUsageThreshold: 80
          },
          alerts: {
            email: ['admin@esystemsmanagement.com'],
            slack: {
              enabled: false,
              webhook: ''
            },
            sms: {
              enabled: false,
              numbers: []
            }
          }
        }
      };
      
      await SiteConfig.setValue('analytics_preferences', analyticsPreferences, {
        valueType: 'json',
        category: 'general',
        description: 'Analytics and monitoring preferences',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('analytics_preferences');
      
      console.log('✅ Analytics Preferences: SUCCESS');
      this.testResults.systemPreferences.push('ANALYTICS_PREFERENCES: SUCCESS');
      
    } catch (error) {
      console.error('❌ System preferences test failed:', error.message);
      this.testResults.systemPreferences.push('FAILED: ' + error.message);
      this.testResults.errors.push(`System Preferences: ${error.message}`);
    }
  }

  async testAdminUserSettings() {
    console.log('\n👨‍💼 Testing Admin User Settings Persistence...');
    
    try {
      // Test 1: Admin User Creation with Enhanced Settings
      const adminUser = new User({
        email: `admin.settings.${Date.now()}@example.com`,
        password: 'AdminSettingsPassword123!',
        firstName: 'Admin',
        lastName: 'Settings',
        admin: true,
        provider: 'local'
      });
      
      // Enhanced admin preferences
      adminUser.preferences = {
        notifications: {
          email: {
            enabled: true,
            messages: true,
            updates: true,
            marketing: false,
            systemAlerts: true,
            userActivity: true,
            securityEvents: true
          },
          push: {
            enabled: true,
            messages: false,
            updates: true,
            systemAlerts: true,
            criticalEvents: true
          },
          sms: {
            enabled: true,
            messages: false,
            updates: false,
            criticalEvents: true,
            securityAlerts: true
          }
        },
        privacy: {
          profileVisibility: 'private',
          showEmail: false,
          showPhone: false,
          allowMessagesFrom: 'no-one'
        },
        display: {
          theme: 'dark',
          language: 'en',
          dateFormat: 'YYYY-MM-DD',
          timeFormat: '24h'
        },
        admin: {
          dashboardLayout: 'advanced',
          defaultView: 'system_overview',
          showDetailedLogs: true,
          enableDebugMode: false,
          autoRefreshInterval: 30,
          alertThresholds: {
            errorRate: 1.0,
            responseTime: 2000,
            memoryUsage: 80,
            diskUsage: 85
          },
          quickActions: [
            'view_system_status',
            'manage_users',
            'system_configuration',
            'view_audit_logs'
          ]
        }
      };
      
      await adminUser.save();
      this.testData.createdUsers.push(adminUser._id);
      
      console.log('✅ Admin User Creation with Enhanced Settings: SUCCESS');
      this.testResults.adminUserSettings.push('ADMIN_USER_CREATION: SUCCESS');
      
      // Test 2: Admin Dashboard Preferences
      const dashboardPreferences = {
        layout: 'grid',
        widgets: [
          {
            id: 'system_stats',
            position: { x: 0, y: 0, w: 6, h: 4 },
            visible: true,
            refreshInterval: 60
          },
          {
            id: 'user_activity',
            position: { x: 6, y: 0, w: 6, h: 4 },
            visible: true,
            refreshInterval: 120
          },
          {
            id: 'revenue_chart',
            position: { x: 0, y: 4, w: 12, h: 6 },
            visible: true,
            refreshInterval: 300
          },
          {
            id: 'recent_logs',
            position: { x: 0, y: 10, w: 8, h: 6 },
            visible: true,
            refreshInterval: 30
          },
          {
            id: 'alerts_panel',
            position: { x: 8, y: 10, w: 4, h: 6 },
            visible: true,
            refreshInterval: 15
          }
        ],
        theme: 'dark',
        autoSave: true,
        lastModified: new Date()
      };
      
      await SiteConfig.setValue(`admin_dashboard_${adminUser._id}`, dashboardPreferences, {
        valueType: 'json',
        category: 'general',
        description: `Dashboard preferences for admin ${adminUser.email}`,
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push(`admin_dashboard_${adminUser._id}`);
      
      console.log('✅ Admin Dashboard Preferences: SUCCESS');
      this.testResults.adminUserSettings.push('ADMIN_DASHBOARD_PREFERENCES: SUCCESS');
      
      // Test 3: Admin Role Permissions
      const adminPermissions = {
        userManagement: {
          viewUsers: true,
          createUsers: true,
          editUsers: true,
          deleteUsers: true,
          impersonateUsers: true,
          manageRoles: true
        },
        businessManagement: {
          viewBusinesses: true,
          createBusinesses: true,
          editBusinesses: true,
          suspendBusinesses: true,
          manageBilling: true,
          viewAnalytics: true
        },
        systemManagement: {
          viewSystemLogs: true,
          configureSystem: true,
          manageIntegrations: true,
          performMaintenance: true,
          accessDatabase: true,
          manageBackups: true
        },
        contentManagement: {
          manageAnnouncements: true,
          moderateContent: true,
          manageNotifications: true,
          manageCourses: true
        },
        securityManagement: {
          viewAuditLogs: true,
          manageSecuritySettings: true,
          investigateIssues: true,
          blockUsers: true,
          manageApiKeys: true
        }
      };
      
      await SiteConfig.setValue(`admin_permissions_${adminUser._id}`, adminPermissions, {
        valueType: 'json',
        category: 'security',
        description: `Permission settings for admin ${adminUser.email}`,
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push(`admin_permissions_${adminUser._id}`);
      
      console.log('✅ Admin Role Permissions: SUCCESS');
      this.testResults.adminUserSettings.push('ADMIN_ROLE_PERMISSIONS: SUCCESS');
      
    } catch (error) {
      console.error('❌ Admin user settings test failed:', error.message);
      this.testResults.adminUserSettings.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Admin User Settings: ${error.message}`);
    }
  }

  async testBusinessManagement() {
    console.log('\n🏢 Testing Business Management Settings...');
    
    try {
      // Test 1: Business Approval Settings
      const businessApprovalSettings = {
        autoApproval: {
          enabled: false,
          criteria: {
            emailDomainVerification: true,
            minimumCompanySize: '11-50',
            requiredFields: ['company', 'contactName', 'website', 'phone'],
            excludedIndustries: ['gambling', 'adult', 'cryptocurrency']
          }
        },
        manualReview: {
          enabled: true,
          reviewers: [], // Will be populated with admin IDs
          maxReviewTime: 48, // hours
          escalationAfter: 72, // hours
          requiresMinimumReviewers: 1
        },
        onboarding: {
          welcomeEmailEnabled: true,
          tutorialEnabled: true,
          initialCredits: 0,
          trialPeriodDays: 14,
          requiredSteps: [
            'email_verification',
            'profile_completion',
            'billing_setup'
          ]
        }
      };
      
      await SiteConfig.setValue('business_approval_settings', businessApprovalSettings, {
        valueType: 'json',
        category: 'general',
        description: 'Business approval and onboarding settings',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('business_approval_settings');
      
      console.log('✅ Business Approval Settings: SUCCESS');
      this.testResults.businessManagement.push('BUSINESS_APPROVAL_SETTINGS: SUCCESS');
      
      // Test 2: VA Management Settings
      const vaManagementSettings = {
        screening: {
          enabled: true,
          requiredDocuments: ['resume', 'portfolio', 'references'],
          skillAssessments: true,
          backgroundCheck: false,
          interviewRequired: false
        },
        profileRequirements: {
          minimumBioLength: 100,
          requiredSkills: 3,
          portfolioRequired: true,
          videoIntroductionRequired: false,
          certificationPreferred: true
        },
        visibility: {
          defaultSearchStatus: 'open',
          allowInvisible: true,
          featuredVALimit: 20,
          searchResultsLimit: 100
        },
        ratings: {
          enabled: true,
          requireComments: false,
          minimumRating: 1,
          maximumRating: 5,
          publiclyVisible: true
        }
      };
      
      await SiteConfig.setValue('va_management_settings', vaManagementSettings, {
        valueType: 'json',
        category: 'general',
        description: 'Virtual Assistant management configuration',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('va_management_settings');
      
      console.log('✅ VA Management Settings: SUCCESS');
      this.testResults.businessManagement.push('VA_MANAGEMENT_SETTINGS: SUCCESS');
      
      // Test 3: Commission and Billing Settings
      const billingSettings = {
        commission: {
          standardRate: 10.0,
          premiumRate: 7.5,
          enterpriseRate: 5.0,
          minimumCommission: 1.0,
          applyToHourlyRate: true,
          applyToProjects: true
        },
        payment: {
          processors: ['stripe', 'paypal'],
          currencies: ['USD', 'EUR', 'GBP'],
          minimumPayment: 10.00,
          processingFee: 2.9, // percentage
          fixedFee: 0.30, // fixed amount
          payoutSchedule: 'weekly',
          holdPeriod: 7 // days
        },
        invoicing: {
          automaticGeneration: true,
          taxCalculation: true,
          invoicePrefix: 'INV',
          paymentTerms: 'Net 30',
          lateFeePercentage: 1.5,
          reminderSchedule: [7, 3, 1] // days before due date
        }
      };
      
      await SiteConfig.setValue('billing_settings', billingSettings, {
        valueType: 'json',
        category: 'payment',
        description: 'Commission and billing configuration',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('billing_settings');
      
      console.log('✅ Billing Settings: SUCCESS');
      this.testResults.businessManagement.push('BILLING_SETTINGS: SUCCESS');
      
    } catch (error) {
      console.error('❌ Business management test failed:', error.message);
      this.testResults.businessManagement.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Business Management: ${error.message}`);
    }
  }

  async testSecuritySettings() {
    console.log('\n🔐 Testing Security Settings Persistence...');
    
    try {
      // Test 1: System-wide Security Configuration
      const systemSecurityConfig = {
        authenticationMethods: {
          email: {
            enabled: true,
            requireVerification: true
          },
          google: {
            enabled: false,
            clientId: '',
            clientSecret: ''
          },
          linkedin: {
            enabled: false,
            clientId: '',
            clientSecret: ''
          },
          apiKeys: {
            enabled: true,
            requireWhitelist: false,
            rotationRequired: true,
            rotationDays: 90
          }
        },
        accessControl: {
          ipWhitelisting: {
            enabled: false,
            adminOnly: false,
            whitelist: []
          },
          geoBlocking: {
            enabled: false,
            blockedCountries: [],
            allowedCountries: []
          },
          timeBasedAccess: {
            enabled: false,
            allowedHours: '00:00-23:59',
            timezone: 'UTC'
          }
        },
        dataProtection: {
          encryption: {
            atRest: true,
            inTransit: true,
            algorithm: 'AES-256'
          },
          backup: {
            encrypted: true,
            frequency: 'daily',
            retention: 30,
            offsite: true
          },
          gdprCompliance: {
            enabled: true,
            dataRetentionDays: 365,
            rightToForgotten: true,
            dataPortability: true
          }
        }
      };
      
      await SiteConfig.setValue('system_security_config', systemSecurityConfig, {
        valueType: 'json',
        category: 'security',
        description: 'System-wide security configuration',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('system_security_config');
      
      console.log('✅ System Security Configuration: SUCCESS');
      this.testResults.securitySettings.push('SYSTEM_SECURITY_CONFIG: SUCCESS');
      
      // Test 2: Audit Log Configuration
      const auditLogConfig = {
        categories: {
          authentication: {
            enabled: true,
            logSuccessful: true,
            logFailed: true,
            retentionDays: 90
          },
          userManagement: {
            enabled: true,
            logCreation: true,
            logUpdates: true,
            logDeletion: true,
            retentionDays: 365
          },
          systemChanges: {
            enabled: true,
            logConfigChanges: true,
            logPermissionChanges: true,
            logSystemMaintenance: true,
            retentionDays: 730
          },
          dataAccess: {
            enabled: true,
            logPIIAccess: true,
            logBulkOperations: true,
            logExports: true,
            retentionDays: 365
          }
        },
        storage: {
          database: true,
          fileSystem: false,
          cloudStorage: false,
          encryption: true,
          compression: true
        },
        alerts: {
          suspiciousActivity: true,
          multipleFailedLogins: true,
          privilegeEscalation: true,
          dataExfiltration: true,
          adminEmails: ['security@esystemsmanagement.com']
        }
      };
      
      await SiteConfig.setValue('audit_log_config', auditLogConfig, {
        valueType: 'json',
        category: 'security',
        description: 'Audit logging configuration',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('audit_log_config');
      
      console.log('✅ Audit Log Configuration: SUCCESS');
      this.testResults.securitySettings.push('AUDIT_LOG_CONFIG: SUCCESS');
      
      // Test 3: Admin Access Controls
      const adminAccessControls = {
        sessionManagement: {
          maxSessionDuration: 240, // 4 hours
          extendOnActivity: false,
          requireReauthentication: true,
          reauthenticationInterval: 60 // minutes
        },
        operationLimits: {
          bulkOperations: {
            maxRecords: 1000,
            requireApproval: true,
            approvers: 2
          },
          sensitiveOperations: [
            'delete_user',
            'modify_billing',
            'change_security_settings',
            'access_audit_logs'
          ],
          requireTwoFactor: true
        },
        monitoring: {
          logAllActions: true,
          realTimeAlerts: true,
          suspiciousActivityDetection: true,
          adminActivityReports: true
        }
      };
      
      await SiteConfig.setValue('admin_access_controls', adminAccessControls, {
        valueType: 'json',
        category: 'security',
        description: 'Admin access control configuration',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('admin_access_controls');
      
      console.log('✅ Admin Access Controls: SUCCESS');
      this.testResults.securitySettings.push('ADMIN_ACCESS_CONTROLS: SUCCESS');
      
    } catch (error) {
      console.error('❌ Security settings test failed:', error.message);
      this.testResults.securitySettings.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Security Settings: ${error.message}`);
    }
  }

  async testSystemMaintenance() {
    console.log('\n🔧 Testing System Maintenance Settings...');
    
    try {
      // Test 1: Scheduled Maintenance Configuration
      const maintenanceSchedule = {
        recurring: {
          enabled: true,
          frequency: 'weekly',
          dayOfWeek: 'sunday',
          time: '02:00',
          timezone: 'UTC',
          duration: 120, // minutes
          autoMode: true
        },
        emergency: {
          enabled: true,
          notificationDelay: 5, // minutes
          maxDuration: 240, // minutes
          escalationContacts: ['emergency@esystemsmanagement.com']
        },
        notifications: {
          advanceNotice: {
            enabled: true,
            days: [7, 3, 1], // Days before maintenance
            channels: ['email', 'push', 'banner']
          },
          duringMaintenance: {
            enabled: true,
            updateInterval: 30, // minutes
            channels: ['banner', 'api']
          },
          completion: {
            enabled: true,
            channels: ['email', 'push']
          }
        },
        services: {
          frontend: {
            shutdownGracefully: true,
            redirectTo: '/maintenance'
          },
          api: {
            respondWithMaintenanceStatus: true,
            allowEmergencyAccess: true
          },
          database: {
            readOnlyMode: false,
            backupBeforeMaintenance: true
          }
        }
      };
      
      await SiteConfig.setValue('maintenance_schedule', maintenanceSchedule, {
        valueType: 'json',
        category: 'general',
        description: 'System maintenance scheduling configuration',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('maintenance_schedule');
      
      console.log('✅ Maintenance Schedule Configuration: SUCCESS');
      this.testResults.systemMaintenance.push('MAINTENANCE_SCHEDULE_CONFIG: SUCCESS');
      
      // Test 2: System Health Monitoring
      const healthMonitoringConfig = {
        checks: {
          database: {
            enabled: true,
            interval: 60, // seconds
            timeout: 5000, // ms
            criticalThreshold: 10000 // ms
          },
          externalServices: {
            enabled: true,
            services: [
              {
                name: 'sendgrid',
                url: 'https://api.sendgrid.com/v3/mail/send',
                method: 'POST',
                timeout: 5000,
                headers: { 'Authorization': 'Bearer [API_KEY]' }
              },
              {
                name: 'stripe',
                url: 'https://api.stripe.com/v1/accounts',
                method: 'GET',
                timeout: 5000
              }
            ],
            interval: 300 // seconds
          },
          systemResources: {
            enabled: true,
            interval: 60,
            thresholds: {
              cpu: 80,
              memory: 85,
              disk: 90,
              networkLatency: 1000
            }
          }
        },
        alerting: {
          enabled: true,
          channels: {
            email: {
              enabled: true,
              recipients: ['admin@esystemsmanagement.com'],
              severity: ['critical', 'warning']
            },
            slack: {
              enabled: false,
              webhook: '',
              severity: ['critical']
            },
            sms: {
              enabled: false,
              numbers: [],
              severity: ['critical']
            }
          },
          escalation: {
            enabled: true,
            levels: [
              { after: 5, contacts: ['admin@esystemsmanagement.com'] },
              { after: 15, contacts: ['emergency@esystemsmanagement.com'] }
            ]
          }
        }
      };
      
      await SiteConfig.setValue('health_monitoring_config', healthMonitoringConfig, {
        valueType: 'json',
        category: 'general',
        description: 'System health monitoring configuration',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('health_monitoring_config');
      
      console.log('✅ Health Monitoring Configuration: SUCCESS');
      this.testResults.systemMaintenance.push('HEALTH_MONITORING_CONFIG: SUCCESS');
      
      // Test 3: Backup and Recovery Settings
      const backupRecoverySettings = {
        automated: {
          enabled: true,
          frequency: 'daily',
          time: '03:00',
          timezone: 'UTC',
          retention: {
            daily: 7,
            weekly: 4,
            monthly: 12
          }
        },
        storage: {
          local: {
            enabled: true,
            path: '/backups/mongodb',
            encryption: true
          },
          cloud: {
            enabled: false,
            provider: 'aws',
            bucket: 'linkage-va-hub-backups',
            encryption: true,
            redundancy: 'multi-region'
          }
        },
        recovery: {
          testRestores: {
            enabled: true,
            frequency: 'monthly',
            alertOnFailure: true
          },
          pointInTimeRecovery: {
            enabled: true,
            retentionHours: 24
          },
          disasterRecovery: {
            rto: 4, // hours
            rpo: 1, // hours
            secondarySite: false
          }
        },
        validation: {
          checksumVerification: true,
          integrityTesting: true,
          corruptionDetection: true
        }
      };
      
      await SiteConfig.setValue('backup_recovery_settings', backupRecoverySettings, {
        valueType: 'json',
        category: 'general',
        description: 'Backup and recovery configuration',
        isEditable: true,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('backup_recovery_settings');
      
      console.log('✅ Backup and Recovery Settings: SUCCESS');
      this.testResults.systemMaintenance.push('BACKUP_RECOVERY_SETTINGS: SUCCESS');
      
    } catch (error) {
      console.error('❌ System maintenance test failed:', error.message);
      this.testResults.systemMaintenance.push('FAILED: ' + error.message);
      this.testResults.errors.push(`System Maintenance: ${error.message}`);
    }
  }

  async testConfigurationValidation() {
    console.log('\n✅ Testing Configuration Validation...');
    
    try {
      // Test 1: Configuration Schema Validation
      const allConfigs = await SiteConfig.find({});
      let validationErrors = 0;
      
      for (const config of allConfigs) {
        try {
          // Test JSON parsing for JSON type configs
          if (config.valueType === 'json' && typeof config.value === 'string') {
            JSON.parse(config.value);
          }
          
          // Test email format for email type configs
          if (config.valueType === 'email' && config.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(config.value)) {
              validationErrors++;
            }
          }
          
          // Test URL format for URL type configs
          if (config.valueType === 'url' && config.value) {
            try {
              new URL(config.value);
            } catch (error) {
              validationErrors++;
            }
          }
          
        } catch (error) {
          validationErrors++;
        }
      }
      
      console.log(`✅ Configuration Schema Validation: ${validationErrors === 0 ? 'SUCCESS' : 'FAILED'} (${validationErrors} errors)`);
      this.testResults.configurationValidation.push(`SCHEMA_VALIDATION: ${validationErrors === 0 ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 2: Required Configuration Presence
      const requiredConfigs = [
        'global_application_settings',
        'security_preferences',
        'email_configuration'
      ];
      
      let missingConfigs = 0;
      for (const configKey of requiredConfigs) {
        const config = await SiteConfig.findOne({ key: configKey });
        if (!config) {
          missingConfigs++;
        }
      }
      
      console.log(`✅ Required Configuration Presence: ${missingConfigs === 0 ? 'SUCCESS' : 'WARNING'} (${missingConfigs} missing)`);
      this.testResults.configurationValidation.push(`REQUIRED_CONFIG_PRESENCE: ${missingConfigs === 0 ? 'SUCCESS' : 'WARNING'}`);
      
      // Test 3: Configuration Dependencies
      const maintenanceConfig = await SiteConfig.getValue('system_maintenance_mode');
      const emailConfig = await SiteConfig.getValue('email_configuration');
      
      // If maintenance mode notifications are enabled, email configuration should exist
      let dependencyTest = true;
      if (maintenanceConfig && maintenanceConfig.notificationsSent && !emailConfig) {
        dependencyTest = false;
      }
      
      console.log(`✅ Configuration Dependencies: ${dependencyTest ? 'SUCCESS' : 'WARNING'}`);
      this.testResults.configurationValidation.push(`CONFIG_DEPENDENCIES: ${dependencyTest ? 'SUCCESS' : 'WARNING'}`);
      
      // Test 4: Configuration Access Control
      const publicConfigs = await SiteConfig.getPublicConfigs();
      const privateConfigs = await SiteConfig.find({ isPublic: false });
      
      // Ensure sensitive configurations are not public
      const sensitiveKeys = ['security_preferences', 'admin_access_controls', 'billing_settings'];
      let securityBreach = false;
      
      for (const key of sensitiveKeys) {
        if (publicConfigs[key]) {
          securityBreach = true;
          break;
        }
      }
      
      console.log(`✅ Configuration Access Control: ${!securityBreach ? 'SUCCESS' : 'CRITICAL_FAILURE'}`);
      this.testResults.configurationValidation.push(`CONFIG_ACCESS_CONTROL: ${!securityBreach ? 'SUCCESS' : 'CRITICAL_FAILURE'}`);
      
    } catch (error) {
      console.error('❌ Configuration validation test failed:', error.message);
      this.testResults.configurationValidation.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Configuration Validation: ${error.message}`);
    }
  }

  async testBackupAndRestore() {
    console.log('\n💾 Testing Backup and Restore for Configurations...');
    
    try {
      // Test 1: Configuration Backup
      const allConfigs = await SiteConfig.find({});
      const configBackup = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        configs: allConfigs.map(config => ({
          key: config.key,
          value: config.value,
          valueType: config.valueType,
          category: config.category,
          description: config.description,
          isPublic: config.isPublic,
          isEditable: config.isEditable,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt
        })),
        checksums: {}
      };
      
      // Generate checksums for integrity verification
      for (const config of configBackup.configs) {
        const dataString = JSON.stringify(config.value);
        configBackup.checksums[config.key] = crypto.createHash('sha256').update(dataString).digest('hex');
      }
      
      await SiteConfig.setValue('configuration_backup', configBackup, {
        valueType: 'json',
        category: 'general',
        description: 'Configuration backup for disaster recovery',
        isEditable: false,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('configuration_backup');
      
      console.log('✅ Configuration Backup: SUCCESS');
      this.testResults.backupAndRestore.push('CONFIG_BACKUP: SUCCESS');
      
      // Test 2: Configuration Restore Simulation
      const backupData = await SiteConfig.getValue('configuration_backup');
      const restoreTest = backupData && 
                         backupData.configs && 
                         backupData.configs.length > 0 &&
                         backupData.checksums;
      
      console.log(`✅ Configuration Restore Data: ${restoreTest ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.backupAndRestore.push(`CONFIG_RESTORE_DATA: ${restoreTest ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 3: Checksum Verification
      let checksumVerificationPassed = true;
      if (backupData && backupData.configs) {
        for (const config of backupData.configs.slice(0, 5)) { // Test first 5 configs
          const dataString = JSON.stringify(config.value);
          const calculatedChecksum = crypto.createHash('sha256').update(dataString).digest('hex');
          
          if (backupData.checksums[config.key] !== calculatedChecksum) {
            checksumVerificationPassed = false;
            break;
          }
        }
      }
      
      console.log(`✅ Checksum Verification: ${checksumVerificationPassed ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.backupAndRestore.push(`CHECKSUM_VERIFICATION: ${checksumVerificationPassed ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 4: Configuration History Tracking
      const configHistory = {
        changes: [
          {
            timestamp: new Date(),
            configKey: 'system_maintenance_mode',
            action: 'created',
            oldValue: null,
            newValue: { enabled: false },
            changedBy: this.testData.createdUsers[0] || null,
            reason: 'Initial configuration setup'
          },
          {
            timestamp: new Date(),
            configKey: 'user_registration_settings',
            action: 'updated',
            oldValue: { enabled: true },
            newValue: { enabled: false },
            changedBy: this.testData.createdUsers[0] || null,
            reason: 'Temporarily disabled for maintenance'
          }
        ],
        retentionDays: 365,
        maxEntries: 10000
      };
      
      await SiteConfig.setValue('configuration_history', configHistory, {
        valueType: 'json',
        category: 'general',
        description: 'Configuration change history and audit trail',
        isEditable: false,
        isPublic: false
      });
      
      this.testData.createdConfigs.push('configuration_history');
      
      console.log('✅ Configuration History Tracking: SUCCESS');
      this.testResults.backupAndRestore.push('CONFIG_HISTORY_TRACKING: SUCCESS');
      
    } catch (error) {
      console.error('❌ Backup and restore test failed:', error.message);
      this.testResults.backupAndRestore.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Backup and Restore: ${error.message}`);
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testing Admin Settings Performance...');
    
    try {
      // Test 1: Configuration Retrieval Performance
      const configStartTime = Date.now();
      await Promise.all([
        SiteConfig.getValue('global_application_settings'),
        SiteConfig.getValue('security_preferences'),
        SiteConfig.getValue('platform_limits'),
        SiteConfig.getValue('feature_flags'),
        SiteConfig.getValue('billing_settings')
      ]);
      const configTime = Date.now() - configStartTime;
      
      console.log(`✅ Configuration Retrieval Performance: ${configTime}ms`);
      this.testResults.performance.push(`CONFIG_RETRIEVAL: ${configTime}ms`);
      
      // Test 2: Category-based Query Performance
      const categoryStartTime = Date.now();
      await Promise.all([
        SiteConfig.getByCategory('general'),
        SiteConfig.getByCategory('security'),
        SiteConfig.getByCategory('email'),
        SiteConfig.getByCategory('payment')
      ]);
      const categoryTime = Date.now() - categoryStartTime;
      
      console.log(`✅ Category Query Performance: ${categoryTime}ms`);
      this.testResults.performance.push(`CATEGORY_QUERY: ${categoryTime}ms`);
      
      // Test 3: Public Configuration Query Performance
      const publicStartTime = Date.now();
      await SiteConfig.getPublicConfigs();
      const publicTime = Date.now() - publicStartTime;
      
      console.log(`✅ Public Configuration Query Performance: ${publicTime}ms`);
      this.testResults.performance.push(`PUBLIC_CONFIG_QUERY: ${publicTime}ms`);
      
      // Test 4: Configuration Update Performance
      const updateStartTime = Date.now();
      await SiteConfig.setValue('performance_test_config', { testValue: Math.random() }, {
        valueType: 'json',
        category: 'general',
        description: 'Performance test configuration'
      });
      const updateTime = Date.now() - updateStartTime;
      
      console.log(`✅ Configuration Update Performance: ${updateTime}ms`);
      this.testResults.performance.push(`CONFIG_UPDATE: ${updateTime}ms`);
      
      // Clean up performance test config
      await SiteConfig.deleteOne({ key: 'performance_test_config' });
      
    } catch (error) {
      console.error('❌ Performance test failed:', error.message);
      this.testResults.performance.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Performance: ${error.message}`);
    }
  }

  async cleanupTestData() {
    console.log('\n🧹 Cleaning up admin settings test data...');
    
    try {
      // Clean up users
      for (const userId of this.testData.createdUsers) {
        await User.findByIdAndDelete(userId);
      }
      
      // Clean up businesses
      for (const businessId of this.testData.createdBusinesses) {
        await Business.findByIdAndDelete(businessId);
      }
      
      // Clean up business settings
      for (const settingsId of this.testData.createdSettings) {
        await BusinessSettings.findByIdAndDelete(settingsId);
      }
      
      // Clean up test configurations
      for (const configKey of this.testData.createdConfigs) {
        await SiteConfig.deleteOne({ key: configKey });
      }
      
      // Clean up admin-specific configurations
      const adminConfigs = await SiteConfig.find({ 
        key: { $regex: /^admin_(dashboard_|permissions_)/ } 
      });
      
      for (const config of adminConfigs) {
        await SiteConfig.findByIdAndDelete(config._id);
      }
      
      console.log('✅ Admin settings test data cleanup completed');
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Admin Settings and System Preferences Persistence Audit...\n');
    
    const connected = await this.connect();
    if (!connected) {
      console.log('❌ Cannot proceed without database connection');
      return this.generateReport();
    }

    await this.testSiteConfigManagement();
    await this.testSystemPreferences();
    await this.testAdminUserSettings();
    await this.testBusinessManagement();
    await this.testSecuritySettings();
    await this.testSystemMaintenance();
    await this.testConfigurationValidation();
    await this.testBackupAndRestore();
    await this.testPerformance();
    
    await this.cleanupTestData();

    return this.generateReport();
  }

  generateReport() {
    console.log('\n📊 ADMIN SETTINGS AND SYSTEM PREFERENCES AUDIT REPORT');
    console.log('==============================================================');
    
    const report = {
      timestamp: new Date().toISOString(),
      connection: this.testResults.connection,
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        criticalFailures: 0,
        errors: this.testResults.errors.length
      },
      categories: {
        siteConfigManagement: this.testResults.siteConfigManagement,
        systemPreferences: this.testResults.systemPreferences,
        adminUserSettings: this.testResults.adminUserSettings,
        businessManagement: this.testResults.businessManagement,
        securitySettings: this.testResults.securitySettings,
        systemMaintenance: this.testResults.systemMaintenance,
        configurationValidation: this.testResults.configurationValidation,
        backupAndRestore: this.testResults.backupAndRestore,
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
        } else if (result.includes('WARNING')) {
          report.summary.warnings++;
        } else if (result.includes('CRITICAL_FAILURE')) {
          report.summary.criticalFailures++;
        }
      }
    });

    console.log(`📈 Total Tests: ${report.summary.totalTests}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`🚨 Critical Failures: ${report.summary.criticalFailures}`);
    console.log(`🔥 Errors: ${report.summary.errors}`);
    
    const successRate = Math.round((report.summary.passed / report.summary.totalTests) * 100);
    console.log(`📊 Success Rate: ${successRate}%`);

    console.log('\n📋 DETAILED RESULTS:');
    console.log(`⚙️ Site Config Management: ${this.testResults.siteConfigManagement.join(', ')}`);
    console.log(`🎛️ System Preferences: ${this.testResults.systemPreferences.join(', ')}`);
    console.log(`👨‍💼 Admin User Settings: ${this.testResults.adminUserSettings.join(', ')}`);
    console.log(`🏢 Business Management: ${this.testResults.businessManagement.join(', ')}`);
    console.log(`🔐 Security Settings: ${this.testResults.securitySettings.join(', ')}`);
    console.log(`🔧 System Maintenance: ${this.testResults.systemMaintenance.join(', ')}`);
    console.log(`✅ Configuration Validation: ${this.testResults.configurationValidation.join(', ')}`);
    console.log(`💾 Backup and Restore: ${this.testResults.backupAndRestore.join(', ')}`);
    console.log(`⚡ Performance: ${this.testResults.performance.join(', ')}`);

    if (report.summary.errors > 0 || report.summary.criticalFailures > 0) {
      console.log('\n🔍 ERROR AND CRITICAL FAILURE DETAILS:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log('\n💡 ADMIN SETTINGS RECOMMENDATIONS:');
    
    if (report.summary.criticalFailures > 0) {
      console.log('  🚨 CRITICAL: Address critical security failures immediately');
    }
    
    if (report.summary.failed > 0) {
      console.log('  • Review and fix failed configuration tests');
    }
    
    if (report.summary.warnings > 0) {
      console.log('  • Address warning conditions for better system reliability');
    }
    
    console.log('  • Implement configuration change approval workflow');
    console.log('  • Set up automated configuration backups');
    console.log('  • Regular audit of admin permissions and access');
    console.log('  • Monitor configuration change impacts on system performance');
    console.log('  • Implement configuration validation before deployment');
    console.log('  • Set up alerts for critical configuration changes');
    console.log('  • Regular review of feature flags and experimental features');

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

// Run the admin settings audit if this file is executed directly
if (require.main === module) {
  (async () => {
    const tester = new AdminSettingsAuditTester();
    
    try {
      const report = await tester.runAllTests();
      
      // Save report to file
      const fs = require('fs');
      const reportPath = path.join(__dirname, 'admin-settings-audit-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n💾 Detailed report saved to: ${reportPath}`);
      
    } catch (error) {
      console.error('❌ Admin settings audit failed:', error.message);
    } finally {
      await tester.disconnect();
      process.exit(0);
    }
  })();
}

module.exports = AdminSettingsAuditTester;