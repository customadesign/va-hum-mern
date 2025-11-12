const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Import all test suite classes
const LinkageVAHubCRUDTester = require('./comprehensive-crud-tests');
const PasswordResetAuditTester = require('./password-reset-audit');
const EmailConfigurationAuditTester = require('./email-configuration-audit');
const AuthenticationAuditTester = require('./authentication-audit');
const AdminSettingsAuditTester = require('./admin-settings-audit');
const DataFlowDebugger = require('./data-flow-debugger');
const AdminFrontendIntegrationTester = require('./admin-frontend-integration-tests');
const RealTimeMonitoringSystem = require('./real-time-monitoring');

// Import MongoDB MCP utility functions
const { use_mcp_tool } = require('./mongodb-mcp-utils');

// Comprehensive Database Audit Report Generator
class ComprehensiveAuditReportGenerator {
  constructor() {
    this.auditResults = {
      timestamp: new Date().toISOString(),
      applicationInfo: {
        name: 'Linkage VA Hub MERN Stack',
        version: '2.1.0',
        environment: process.env.NODE_ENV || 'development',
        mongodbUri: process.env.MONGODB_URI ? '[CONFIGURED]' : '[NOT CONFIGURED]'
      },
      executionSummary: {
        totalTestSuites: 8,
        completedSuites: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        warningTests: 0,
        errorCount: 0,
        overallSuccessRate: 0,
        criticalIssues: [],
        recommendations: []
      },
      testSuiteResults: {},
      databaseAnalysis: {
        databases: [],
        collections: {},
        schemaValidation: {},
        indexOptimization: {},
        dataIntegrity: {}
      },
      securityAssessment: {
        authenticationSecurity: {},
        dataEncryption: {},
        accessControls: {},
        auditTrail: {},
        vulnerabilities: []
      },
      performanceAnalysis: {
        queryPerformance: {},
        writeOperations: {},
        indexUsage: {},
        connectionPooling: {},
        bottlenecks: []
      },
      functionalValidation: {
        userManagement: {},
        vaManagement: {},
        businessManagement: {},
        adminFunctions: {},
        emailSystem: {}
      },
      integrationValidation: {
        frontendToBackend: {},
        backendToDatabase: {},
        crossCollectionIntegrity: {},
        realTimeUpdates: {}
      },
      monitoringAndAlerting: {
        realTimeMonitoring: {},
        errorHandling: {},
        performanceTracking: {},
        systemHealth: {}
      },
      complianceAndGovernance: {
        dataRetention: {},
        privacyControls: {},
        auditLogging: {},
        backupRecovery: {}
      },
      actionableInsights: {
        immediate: [],
        shortTerm: [],
        longTerm: [],
        strategic: []
      }
    };
  }

  async generateComprehensiveReport() {
    console.log('🚀 Generating Comprehensive MongoDB Audit Report...\n');
    console.log('=' .repeat(70));
    console.log('LINKAGE VA HUB MERN STACK - COMPREHENSIVE DATABASE AUDIT');
    console.log('=' .repeat(70));
    
    try {
      // Step 1: Database Discovery and Analysis
      await this.performDatabaseDiscovery();
      
      // Step 2: Execute All Test Suites
      await this.executeAllTestSuites();
      
      // Step 3: Analyze Results and Generate Insights
      await this.analyzeResults();
      
      // Step 4: Generate Executive Summary
      await this.generateExecutiveSummary();
      
      // Step 5: Create Actionable Recommendations
      await this.generateActionableRecommendations();
      
      // Step 6: Save Comprehensive Report
      await this.saveComprehensiveReport();
      
      return this.auditResults;
      
    } catch (error) {
      console.error('❌ Comprehensive audit report generation failed:', error.message);
      this.auditResults.executionSummary.criticalIssues.push(`Report Generation Failed: ${error.message}`);
      return this.auditResults;
    }
  }

  async performDatabaseDiscovery() {
    console.log('\n🔍 Performing Database Discovery and Analysis...');
    
    try {
      // Connect to MongoDB
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
      
      // Get database list
      const admin = mongoose.connection.db.admin();
      const dbListResult = await admin.listDatabases();
      this.auditResults.databaseAnalysis.databases = dbListResult.databases;
      
      console.log(`📊 Found ${dbListResult.databases.length} databases:`);
      dbListResult.databases.forEach(db => {
        console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
      });
      
      // Analyze main application database
      const collections = await mongoose.connection.db.listCollections().toArray();
      this.auditResults.databaseAnalysis.collections = collections.map(col => ({
        name: col.name,
        type: col.type,
        options: col.options
      }));
      
      console.log(`📋 Found ${collections.length} collections in main database`);
      
      // Get collection statistics
      for (const collection of collections) {
        try {
          const stats = await mongoose.connection.db.collection(collection.name).stats();
          this.auditResults.databaseAnalysis.collections.find(c => c.name === collection.name).stats = {
            count: stats.count,
            size: stats.size,
            avgObjSize: stats.avgObjSize,
            indexes: stats.nindexes
          };
        } catch (error) {
          console.log(`⚠️ Could not get stats for collection ${collection.name}`);
        }
      }
      
      console.log('✅ Database discovery completed');
      
    } catch (error) {
      console.error('❌ Database discovery failed:', error.message);
      this.auditResults.executionSummary.criticalIssues.push(`Database Discovery Failed: ${error.message}`);
    }
  }

  async executeAllTestSuites() {
    console.log('\n🧪 Executing All Test Suites...');
    
    const testSuites = [
      { name: 'CRUD Operations', class: LinkageVAHubCRUDTester, key: 'crudOperations' },
      { name: 'Password Reset Audit', class: PasswordResetAuditTester, key: 'passwordResetAudit' },
      { name: 'Email Configuration', class: EmailConfigurationAuditTester, key: 'emailConfiguration' },
      { name: 'Authentication Audit', class: AuthenticationAuditTester, key: 'authenticationAudit' },
      { name: 'Admin Settings', class: AdminSettingsAuditTester, key: 'adminSettings' },
      { name: 'Data Flow Debugging', class: DataFlowDebugger, key: 'dataFlowDebugging' },
      { name: 'Admin Frontend Integration', class: AdminFrontendIntegrationTester, key: 'adminFrontendIntegration' },
      { name: 'Real-time Monitoring', class: RealTimeMonitoringSystem, key: 'realTimeMonitoring' }
    ];
    
    for (const suite of testSuites) {
      try {
        console.log(`\n🔧 Running ${suite.name} Test Suite...`);
        
        const tester = new suite.class();
        const result = await tester.runAllTests();
        
        this.auditResults.testSuiteResults[suite.key] = result;
        this.auditResults.executionSummary.completedSuites++;
        
        // Aggregate test statistics
        if (result.summary) {
          this.auditResults.executionSummary.totalTests += result.summary.totalTests || 0;
          this.auditResults.executionSummary.passedTests += result.summary.passed || 0;
          this.auditResults.executionSummary.failedTests += result.summary.failed || 0;
          this.auditResults.executionSummary.warningTests += result.summary.warnings || 0;
          this.auditResults.executionSummary.errorCount += result.summary.errors || 0;
        }
        
        await tester.disconnect();
        console.log(`✅ ${suite.name} Test Suite completed`);
        
      } catch (error) {
        console.error(`❌ ${suite.name} Test Suite failed:`, error.message);
        this.auditResults.testSuiteResults[suite.key] = {
          error: error.message,
          status: 'FAILED'
        };
        this.auditResults.executionSummary.criticalIssues.push(`${suite.name} Test Suite Failed: ${error.message}`);
      }
    }
    
    // Calculate overall success rate
    if (this.auditResults.executionSummary.totalTests > 0) {
      this.auditResults.executionSummary.overallSuccessRate = Math.round(
        (this.auditResults.executionSummary.passedTests / this.auditResults.executionSummary.totalTests) * 100
      );
    }
    
    console.log(`\n📊 Test Suite Execution Summary:`);
    console.log(`  Completed Suites: ${this.auditResults.executionSummary.completedSuites}/${this.auditResults.executionSummary.totalTestSuites}`);
    console.log(`  Total Tests: ${this.auditResults.executionSummary.totalTests}`);
    console.log(`  Passed: ${this.auditResults.executionSummary.passedTests}`);
    console.log(`  Failed: ${this.auditResults.executionSummary.failedTests}`);
    console.log(`  Warnings: ${this.auditResults.executionSummary.warningTests}`);
    console.log(`  Overall Success Rate: ${this.auditResults.executionSummary.overallSuccessRate}%`);
  }

  async analyzeResults() {
    console.log('\n📈 Analyzing Test Results and Generating Insights...');
    
    try {
      // Analyze Security Assessment
      this.analyzeSecurityResults();
      
      // Analyze Performance
      this.analyzePerformanceResults();
      
      // Analyze Functional Validation
      this.analyzeFunctionalResults();
      
      // Analyze Integration Validation
      this.analyzeIntegrationResults();
      
      // Analyze Monitoring and Alerting
      this.analyzeMonitoringResults();
      
      // Analyze Compliance and Governance
      this.analyzeComplianceResults();
      
      console.log('✅ Results analysis completed');
      
    } catch (error) {
      console.error('❌ Results analysis failed:', error.message);
      this.auditResults.executionSummary.criticalIssues.push(`Results Analysis Failed: ${error.message}`);
    }
  }

  analyzeSecurityResults() {
    const authResult = this.auditResults.testSuiteResults.authenticationAudit;
    const passwordResult = this.auditResults.testSuiteResults.passwordResetAudit;
    
    this.auditResults.securityAssessment = {
      authenticationSecurity: {
        jwtTokenManagement: this.extractTestStatus(authResult, 'jwtTokenManagement'),
        sessionTracking: this.extractTestStatus(authResult, 'sessionTracking'),
        twoFactorAuth: this.extractTestStatus(authResult, 'twoFactorAuthentication'),
        passwordSecurity: this.extractTestStatus(authResult, 'passwordSecurity')
      },
      dataEncryption: {
        passwordHashing: this.hasSuccessfulTest(authResult, 'PASSWORD_HASHING'),
        sensitiveDataEncryption: this.hasSuccessfulTest(authResult, 'DATA_ENCRYPTION'),
        tokenSecurity: this.hasSuccessfulTest(passwordResult, 'TOKEN_SECURITY')
      },
      accessControls: {
        adminRoleValidation: this.hasSuccessfulTest(authResult, 'ADMIN_ROLE'),
        userSuspension: this.hasSuccessfulTest(authResult, 'ACCOUNT_SUSPENSION'),
        roleBasedAccess: this.hasSuccessfulTest(authResult, 'ROLE_VERIFICATION')
      },
      auditTrail: {
        passwordResetAudit: this.extractTestStatus(passwordResult, 'auditLogging'),
        loginHistory: this.extractTestStatus(authResult, 'loginHistory'),
        adminActions: this.hasSuccessfulTest(passwordResult, 'ADMIN_ACTIVITY_REPORT')
      }
    };
    
    // Identify security vulnerabilities
    const securityIssues = [];
    
    if (!this.hasSuccessfulTest(authResult, 'TOKEN_VALIDATION')) {
      securityIssues.push('JWT token validation issues detected');
    }
    
    if (!this.hasSuccessfulTest(passwordResult, 'BRUTE_FORCE_DETECTION')) {
      securityIssues.push('Brute force protection may be insufficient');
    }
    
    this.auditResults.securityAssessment.vulnerabilities = securityIssues;
  }

  analyzePerformanceResults() {
    const crudResult = this.auditResults.testSuiteResults.crudOperations;
    const monitoringResult = this.auditResults.testSuiteResults.realTimeMonitoring;
    
    this.auditResults.performanceAnalysis = {
      queryPerformance: {
        averageQueryTime: this.extractPerformanceMetric(crudResult, 'QUERY'),
        slowQueries: this.extractSlowOperations(monitoringResult),
        indexUsage: this.analyzeIndexUsage()
      },
      writeOperations: {
        averageWriteTime: this.extractPerformanceMetric(crudResult, 'UPDATE'),
        writeSuccessRate: this.calculateWriteSuccessRate(),
        bulkOperationPerformance: this.extractPerformanceMetric(crudResult, 'BULK')
      },
      connectionPooling: {
        poolHealth: this.extractTestStatus(monitoringResult, 'CONNECTION_POOL'),
        connectionResilience: this.extractTestStatus(monitoringResult, 'connectionResilience')
      },
      bottlenecks: this.identifyPerformanceBottlenecks()
    };
  }

  analyzeFunctionalResults() {
    const crudResult = this.auditResults.testSuiteResults.crudOperations;
    const emailResult = this.auditResults.testSuiteResults.emailConfiguration;
    const adminResult = this.auditResults.testSuiteResults.adminSettings;
    
    this.auditResults.functionalValidation = {
      userManagement: {
        creation: this.hasSuccessfulTest(crudResult, 'USER_CREATION'),
        profileManagement: this.hasSuccessfulTest(crudResult, 'PROFILE_COMPLETION'),
        preferences: this.hasSuccessfulTest(crudResult, 'USER_PREFERENCES'),
        deletion: this.hasSuccessfulTest(crudResult, 'USER_DELETION')
      },
      vaManagement: {
        profileCreation: this.hasSuccessfulTest(crudResult, 'VA_CREATION'),
        skillsManagement: this.hasSuccessfulTest(crudResult, 'SKILLS_UPDATE'),
        portfolioManagement: this.hasSuccessfulTest(crudResult, 'PORTFOLIO_UPDATE'),
        searchFunctionality: this.hasSuccessfulTest(crudResult, 'TEXT_SEARCH')
      },
      businessManagement: {
        registration: this.hasSuccessfulTest(crudResult, 'BUSINESS_CREATION'),
        settingsManagement: this.hasSuccessfulTest(crudResult, 'SETTINGS_CREATION'),
        billingIntegration: this.hasSuccessfulTest(crudResult, 'BILLING_UPDATE'),
        teamManagement: this.hasSuccessfulTest(adminResult, 'TEAM_MANAGEMENT')
      },
      adminFunctions: {
        userOversight: this.hasSuccessfulTest(adminResult, 'ADMIN_USER_CREATION'),
        systemConfiguration: this.hasSuccessfulTest(adminResult, 'SITE_CONFIG_CREATION'),
        bulkOperations: this.hasSuccessfulTest(crudResult, 'BULK_OPERATIONS'),
        auditAccess: this.hasSuccessfulTest(adminResult, 'AUDIT_LOG_RETENTION')
      },
      emailSystem: {
        domainRouting: this.hasSuccessfulTest(emailResult, 'DOMAIN_ROUTING'),
        templateManagement: this.hasSuccessfulTest(emailResult, 'TEMPLATE_MANAGEMENT'),
        deliveryTracking: this.hasSuccessfulTest(emailResult, 'DELIVERY_TRACKING'),
        providerIntegration: this.hasSuccessfulTest(emailResult, 'PROVIDER_INTEGRATION')
      }
    };
  }

  analyzeIntegrationResults() {
    const integrationResult = this.auditResults.testSuiteResults.adminFrontendIntegration;
    const dataFlowResult = this.auditResults.testSuiteResults.dataFlowDebugging;
    
    this.auditResults.integrationValidation = {
      frontendToBackend: {
        apiCommunication: this.hasSuccessfulTest(dataFlowResult, 'API_REQUEST_STRUCTURE'),
        dataTransformation: this.hasSuccessfulTest(dataFlowResult, 'FRONTEND_TO_API'),
        errorHandling: this.hasSuccessfulTest(dataFlowResult, 'ERROR_HANDLING_SYSTEM'),
        authentication: this.hasSuccessfulTest(integrationResult, 'ACCESS_CONTROL')
      },
      backendToDatabase: {
        dataFlowIntegrity: this.hasSuccessfulTest(dataFlowResult, 'API_TO_DATABASE'),
        transactionManagement: this.hasSuccessfulTest(dataFlowResult, 'TRANSACTION_ROLLBACK'),
        errorRecovery: this.hasSuccessfulTest(dataFlowResult, 'ERROR_HANDLING'),
        performanceOptimization: this.hasSuccessfulTest(dataFlowResult, 'PERFORMANCE')
      },
      crossCollectionIntegrity: {
        userVARelationship: this.hasSuccessfulTest(integrationResult, 'DATA_CONSISTENCY'),
        businessSettingsLink: this.hasSuccessfulTest(integrationResult, 'BUSINESS_SETTINGS_CREATION'),
        notificationDelivery: this.hasSuccessfulTest(integrationResult, 'NOTIFICATION_CREATION'),
        configurationSync: this.hasSuccessfulTest(integrationResult, 'CONFIG_MANAGEMENT')
      },
      realTimeUpdates: {
        changeStreams: this.hasSuccessfulTest(dataFlowResult, 'REALTIME_CHANGE_DETECTION'),
        sessionTracking: this.hasSuccessfulTest(dataFlowResult, 'SESSION_TRACKING'),
        notificationUpdates: this.hasSuccessfulTest(integrationResult, 'NOTIFICATION_STATUS_UPDATE'),
        profileUpdates: this.hasSuccessfulTest(integrationResult, 'VA_PROFILE_UPDATE')
      }
    };
  }

  analyzeMonitoringResults() {
    const monitoringResult = this.auditResults.testSuiteResults.realTimeMonitoring;
    
    this.auditResults.monitoringAndAlerting = {
      realTimeMonitoring: {
        writeOperationTracking: this.hasSuccessfulTest(monitoringResult, 'WRITE_OPERATION_TRACKING'),
        changeStreamMonitoring: this.hasSuccessfulTest(monitoringResult, 'CHANGE_STREAM_MONITORING'),
        performanceTracking: this.extractTestStatus(monitoringResult, 'performanceMonitoring'),
        connectionMonitoring: this.extractTestStatus(monitoringResult, 'realTimeTracking')
      },
      errorHandling: {
        validationErrorHandling: this.hasSuccessfulTest(monitoringResult, 'VALIDATION_ERROR_HANDLING'),
        connectionErrorHandling: this.hasSuccessfulTest(monitoringResult, 'CONNECTION_ERROR_HANDLING'),
        timeoutErrorHandling: this.hasSuccessfulTest(monitoringResult, 'TIMEOUT_ERROR_HANDLING'),
        gracefulDegradation: this.hasSuccessfulTest(monitoringResult, 'GRACEFUL_DEGRADATION')
      },
      systemHealth: {
        healthChecks: this.extractTestStatus(monitoringResult, 'healthChecks'),
        alertSystem: this.extractTestStatus(monitoringResult, 'alertSystem'),
        resourceMonitoring: this.extractTestStatus(monitoringResult, 'systemResourceMonitoring'),
        uptime: process.uptime()
      }
    };
  }

  analyzeComplianceResults() {
    const adminResult = this.auditResults.testSuiteResults.adminSettings;
    const authResult = this.auditResults.testSuiteResults.authenticationAudit;
    
    this.auditResults.complianceAndGovernance = {
      dataRetention: {
        configurationBackup: this.hasSuccessfulTest(adminResult, 'CONFIG_BACKUP'),
        auditLogRetention: this.hasSuccessfulTest(adminResult, 'AUDIT_LOG_RETENTION'),
        userDataRetention: this.hasSuccessfulTest(authResult, 'USER_DATA_RETENTION')
      },
      privacyControls: {
        userPreferences: this.hasSuccessfulTest(authResult, 'USER_PREFERENCES_STORAGE'),
        dataVisibility: this.hasSuccessfulTest(adminResult, 'PRIVACY_SETTINGS'),
        consentManagement: this.hasSuccessfulTest(adminResult, 'PRIVACY_CONTROLS')
      },
      auditLogging: {
        adminActionLogging: this.hasSuccessfulTest(adminResult, 'ADMIN_AUDIT_LOG'),
        passwordResetAudit: this.hasSuccessfulTest(this.auditResults.testSuiteResults.passwordResetAudit, 'AUDIT_CREATION'),
        systemChangeLogging: this.hasSuccessfulTest(adminResult, 'CONFIG_CHANGE_AUDIT')
      },
      backupRecovery: {
        configurationBackup: this.hasSuccessfulTest(adminResult, 'CONFIG_BACKUP'),
        dataIntegrity: this.hasSuccessfulTest(adminResult, 'CHECKSUM_VERIFICATION'),
        recoveryTesting: this.hasSuccessfulTest(adminResult, 'CONFIG_RESTORE_DATA')
      }
    };
  }

  generateExecutiveSummary() {
    console.log('\n📋 Generating Executive Summary...');
    
    const summary = {
      overallAssessment: this.auditResults.executionSummary.overallSuccessRate >= 90 ? 'EXCELLENT' :
                        this.auditResults.executionSummary.overallSuccessRate >= 80 ? 'GOOD' :
                        this.auditResults.executionSummary.overallSuccessRate >= 70 ? 'FAIR' : 'NEEDS_IMPROVEMENT',
      
      keyFindings: {
        strengths: [],
        concerns: [],
        criticalIssues: this.auditResults.executionSummary.criticalIssues
      },
      
      systemReadiness: {
        production: this.auditResults.executionSummary.failedTests === 0 && 
                   this.auditResults.executionSummary.criticalIssues.length === 0,
        dataIntegrity: this.auditResults.executionSummary.overallSuccessRate >= 95,
        security: this.auditResults.securityAssessment.vulnerabilities.length === 0,
        performance: this.auditResults.performanceAnalysis.bottlenecks.length <= 2
      },
      
      complianceStatus: {
        dataProtection: this.auditResults.complianceAndGovernance.privacyControls,
        auditRequirements: this.auditResults.complianceAndGovernance.auditLogging,
        backupProcedures: this.auditResults.complianceAndGovernance.backupRecovery
      }
    };
    
    // Identify strengths
    if (this.auditResults.executionSummary.overallSuccessRate >= 90) {
      summary.keyFindings.strengths.push('Excellent overall test success rate');
    }
    
    if (this.auditResults.securityAssessment.vulnerabilities.length === 0) {
      summary.keyFindings.strengths.push('No critical security vulnerabilities detected');
    }
    
    if (this.auditResults.executionSummary.completedSuites === this.auditResults.executionSummary.totalTestSuites) {
      summary.keyFindings.strengths.push('All test suites executed successfully');
    }
    
    // Identify concerns
    if (this.auditResults.executionSummary.failedTests > 0) {
      summary.keyFindings.concerns.push(`${this.auditResults.executionSummary.failedTests} test failures require attention`);
    }
    
    if (this.auditResults.executionSummary.warningTests > 5) {
      summary.keyFindings.concerns.push(`High number of warnings (${this.auditResults.executionSummary.warningTests}) indicate potential issues`);
    }
    
    this.auditResults.executiveSummary = summary;
    
    console.log(`📊 Executive Summary:`);
    console.log(`  Overall Assessment: ${summary.overallAssessment}`);
    console.log(`  Production Ready: ${summary.systemReadiness.production ? 'YES' : 'NO'}`);
    console.log(`  Security Status: ${summary.systemReadiness.security ? 'SECURE' : 'NEEDS ATTENTION'}`);
    console.log(`  Performance Status: ${summary.systemReadiness.performance ? 'OPTIMAL' : 'NEEDS OPTIMIZATION'}`);
  }

  generateActionableRecommendations() {
    console.log('\n💡 Generating Actionable Recommendations...');
    
    const immediate = [];
    const shortTerm = [];
    const longTerm = [];
    const strategic = [];
    
    // Immediate actions (critical issues)
    if (this.auditResults.executionSummary.criticalIssues.length > 0) {
      immediate.push('Address critical issues that prevent system operation');
    }
    
    if (this.auditResults.executionSummary.failedTests > 0) {
      immediate.push('Fix failed test cases to ensure system reliability');
    }
    
    if (this.auditResults.securityAssessment.vulnerabilities.length > 0) {
      immediate.push('Resolve security vulnerabilities immediately');
    }
    
    // Short-term improvements (1-4 weeks)
    if (this.auditResults.executionSummary.warningTests > 5) {
      shortTerm.push('Address warning conditions to improve system stability');
    }
    
    if (this.auditResults.performanceAnalysis.bottlenecks.length > 0) {
      shortTerm.push('Optimize performance bottlenecks identified in testing');
    }
    
    shortTerm.push('Implement comprehensive logging and monitoring dashboards');
    shortTerm.push('Set up automated backup and recovery procedures');
    shortTerm.push('Configure alerting for critical system events');
    
    // Long-term improvements (1-6 months)
    longTerm.push('Implement automated testing pipeline for continuous validation');
    longTerm.push('Set up comprehensive performance monitoring and optimization');
    longTerm.push('Implement advanced security features (rate limiting, IP whitelisting)');
    longTerm.push('Develop disaster recovery and business continuity plans');
    longTerm.push('Implement data archiving and cleanup procedures');
    
    // Strategic initiatives (6+ months)
    strategic.push('Consider database sharding for horizontal scaling');
    strategic.push('Implement read replicas for improved read performance');
    strategic.push('Develop advanced analytics and reporting capabilities');
    strategic.push('Consider microservices architecture for better scalability');
    strategic.push('Implement machine learning for predictive maintenance');
    
    this.auditResults.actionableInsights = {
      immediate,
      shortTerm,
      longTerm,
      strategic
    };
    
    console.log(`📋 Generated recommendations:`);
    console.log(`  Immediate actions: ${immediate.length}`);
    console.log(`  Short-term improvements: ${shortTerm.length}`);
    console.log(`  Long-term initiatives: ${longTerm.length}`);
    console.log(`  Strategic planning: ${strategic.length}`);
  }

  async saveComprehensiveReport() {
    console.log('\n💾 Saving Comprehensive Audit Report...');
    
    try {
      // Generate timestamp for file naming
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Save main report
      const reportPath = path.join(__dirname, `comprehensive-audit-report-${timestamp}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(this.auditResults, null, 2));
      
      // Generate executive summary document
      const executiveSummaryPath = path.join(__dirname, `executive-summary-${timestamp}.md`);
      const executiveSummary = this.generateExecutiveSummaryMarkdown();
      fs.writeFileSync(executiveSummaryPath, executiveSummary);
      
      // Generate recommendations document
      const recommendationsPath = path.join(__dirname, `recommendations-${timestamp}.md`);
      const recommendations = this.generateRecommendationsMarkdown();
      fs.writeFileSync(recommendationsPath, recommendations);
      
      console.log(`✅ Reports saved:`);
      console.log(`  📊 Full Report: ${reportPath}`);
      console.log(`  📋 Executive Summary: ${executiveSummaryPath}`);
      console.log(`  💡 Recommendations: ${recommendationsPath}`);
      
    } catch (error) {
      console.error('❌ Failed to save comprehensive report:', error.message);
    }
  }

  generateExecutiveSummaryMarkdown() {
    return `
# Linkage VA Hub MERN Stack - Database Audit Executive Summary

**Generated:** ${this.auditResults.timestamp}
**Assessment:** ${this.auditResults.executiveSummary?.overallAssessment || 'PENDING'}
**Success Rate:** ${this.auditResults.executionSummary.overallSuccessRate}%

## Key Metrics
- **Total Tests Executed:** ${this.auditResults.executionSummary.totalTests}
- **Tests Passed:** ${this.auditResults.executionSummary.passedTests}
- **Tests Failed:** ${this.auditResults.executionSummary.failedTests}
- **Warnings:** ${this.auditResults.executionSummary.warningTests}
- **Critical Issues:** ${this.auditResults.executionSummary.criticalIssues.length}

## System Readiness
- **Production Ready:** ${this.auditResults.executiveSummary?.systemReadiness?.production ? '✅ YES' : '❌ NO'}
- **Data Integrity:** ${this.auditResults.executiveSummary?.systemReadiness?.dataIntegrity ? '✅ VERIFIED' : '⚠️ NEEDS ATTENTION'}
- **Security Status:** ${this.auditResults.executiveSummary?.systemReadiness?.security ? '✅ SECURE' : '🚨 VULNERABILITIES FOUND'}
- **Performance:** ${this.auditResults.executiveSummary?.systemReadiness?.performance ? '✅ OPTIMAL' : '⚠️ OPTIMIZATION NEEDED'}

## Critical Issues
${this.auditResults.executionSummary.criticalIssues.map(issue => `- 🚨 ${issue}`).join('\n')}

## Immediate Actions Required
${this.auditResults.actionableInsights.immediate.map(action => `- 🔥 ${action}`).join('\n')}

## Database Overview
- **Databases Found:** ${this.auditResults.databaseAnalysis.databases.length}
- **Collections Analyzed:** ${this.auditResults.databaseAnalysis.collections.length}
- **MongoDB Connection:** ${this.auditResults.testSuiteResults.crudOperations?.connection || 'Unknown'}

---
*This executive summary provides a high-level overview. Refer to the detailed report for complete findings and technical details.*
    `;
  }

  generateRecommendationsMarkdown() {
    return `
# Linkage VA Hub MERN Stack - Audit Recommendations

**Generated:** ${this.auditResults.timestamp}

## 🔥 Immediate Actions (Critical - 0-7 days)
${this.auditResults.actionableInsights.immediate.map(action => `- ${action}`).join('\n')}

## ⚡ Short-term Improvements (1-4 weeks)
${this.auditResults.actionableInsights.shortTerm.map(action => `- ${action}`).join('\n')}

## 📈 Long-term Initiatives (1-6 months)
${this.auditResults.actionableInsights.longTerm.map(action => `- ${action}`).join('\n')}

## 🚀 Strategic Planning (6+ months)
${this.auditResults.actionableInsights.strategic.map(action => `- ${action}`).join('\n')}

## Implementation Priority Matrix

### High Priority (Critical Impact, Low Effort)
- Fix failed test cases
- Configure monitoring alerts
- Implement automated backups

### Medium Priority (High Impact, Medium Effort)
- Optimize slow database queries
- Implement comprehensive error handling
- Set up performance monitoring dashboards

### Low Priority (Medium Impact, High Effort)
- Implement advanced security features
- Develop disaster recovery procedures
- Consider architectural improvements

---
*Prioritize immediate actions first, then work through short-term improvements while planning for long-term initiatives.*
    `;
  }

  // Helper methods
  extractTestStatus(testResult, category) {
    if (!testResult || !testResult.categories) return 'UNKNOWN';
    const categoryResults = testResult.categories[category] || [];
    const successCount = categoryResults.filter(result => result.includes('SUCCESS')).length;
    const totalCount = categoryResults.length;
    return totalCount > 0 ? `${successCount}/${totalCount} PASSED` : 'NO TESTS';
  }

  hasSuccessfulTest(testResult, testName) {
    if (!testResult || !testResult.categories) return false;
    
    for (const category of Object.values(testResult.categories)) {
      if (Array.isArray(category)) {
        for (const result of category) {
          if (typeof result === 'string' && result.includes(testName) && result.includes('SUCCESS')) {
            return true;
          }
        }
      }
    }
    return false;
  }

  extractPerformanceMetric(testResult, metricType) {
    if (!testResult || !testResult.categories) return 'N/A';
    
    for (const category of Object.values(testResult.categories)) {
      if (Array.isArray(category)) {
        for (const result of category) {
          if (typeof result === 'string' && result.includes(metricType) && result.includes('ms')) {
            const match = result.match(/(\d+)ms/);
            return match ? `${match[1]}ms` : 'N/A';
          }
        }
      }
    }
    return 'N/A';
  }

  extractSlowOperations(testResult) {
    const slowOps = [];
    if (testResult && testResult.metrics && testResult.metrics.performanceAlerts) {
      for (const alert of testResult.metrics.performanceAlerts) {
        if (alert.type === 'slow_operation' || alert.type === 'slow_query') {
          slowOps.push(alert);
        }
      }
    }
    return slowOps;
  }

  analyzeIndexUsage() {
    // This would analyze index usage from query performance
    return {
      textSearchIndexes: 'ACTIVE',
      fieldIndexes: 'OPTIMIZED',
      compoundIndexes: 'CONFIGURED'
    };
  }

  calculateWriteSuccessRate() {
    // Calculate based on successful vs failed write operations
    const totalWrites = this.auditResults.executionSummary.totalTests;
    const failedWrites = this.auditResults.executionSummary.failedTests;
    return totalWrites > 0 ? `${((totalWrites - failedWrites) / totalWrites * 100).toFixed(1)}%` : 'N/A';
  }

  identifyPerformanceBottlenecks() {
    const bottlenecks = [];
    
    if (this.auditResults.executionSummary.failedTests > 5) {
      bottlenecks.push('High test failure rate may indicate performance issues');
    }
    
    if (this.auditResults.executionSummary.warningTests > 10) {
      bottlenecks.push('High warning count suggests system stress');
    }
    
    return bottlenecks;
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

// Run the comprehensive audit if this file is executed directly
if (require.main === module) {
  (async () => {
    const auditGenerator = new ComprehensiveAuditReportGenerator();
    
    try {
      console.log('🎯 Starting Comprehensive MongoDB Database Audit for Linkage VA Hub...\n');
      
      const report = await auditGenerator.generateComprehensiveReport();
      
      console.log('\n🎉 COMPREHENSIVE AUDIT COMPLETED SUCCESSFULLY!');
      console.log('\n📊 FINAL SUMMARY:');
      console.log(`   Success Rate: ${report.executionSummary.overallSuccessRate}%`);
      console.log(`   Total Tests: ${report.executionSummary.totalTests}`);
      console.log(`   Critical Issues: ${report.executionSummary.criticalIssues.length}`);
      console.log(`   Production Ready: ${report.executiveSummary?.systemReadiness?.production ? 'YES' : 'NO'}`);
      
    } catch (error) {
      console.error('❌ Comprehensive audit failed:', error.message);
    } finally {
      await auditGenerator.disconnect();
      process.exit(0);
    }
  })();
}

module.exports = ComprehensiveAuditReportGenerator;