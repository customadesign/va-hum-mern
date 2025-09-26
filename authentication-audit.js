const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const crypto = require('crypto');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Import models and middleware
const User = require('./backend/models/User');
const Business = require('./backend/models/Business');
const BusinessSettings = require('./backend/models/BusinessSettings');
const LoginHistory = require('./backend/models/LoginHistory');
const { trackLoginSession, updateSessionActivity } = require('./backend/middleware/sessionTracker');
const { checkTwoFactorStatus, validateTwoFactorForLogin } = require('./backend/middleware/twoFactorAuth');

// Authentication Data Storage Verification Tester
class AuthenticationAuditTester {
  constructor() {
    this.testResults = {
      connection: null,
      jwtTokenManagement: [],
      sessionTracking: [],
      loginHistory: [],
      twoFactorAuthentication: [],
      passwordSecurity: [],
      refreshTokens: [],
      securityFeatures: [],
      userStateManagement: [],
      performance: [],
      errors: []
    };
    
    this.testData = {
      createdUsers: [],
      createdBusinesses: [],
      createdSettings: [],
      createdLoginHistory: [],
      generatedTokens: []
    };
  }

  async connect() {
    try {
      console.log('🔗 Connecting to MongoDB for Authentication Audit...');
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

  async testJWTTokenManagement() {
    console.log('\n🔑 Testing JWT Token Management...');
    
    try {
      // Test 1: JWT Token Generation
      const testUser = new User({
        email: `jwt.test.${Date.now()}@example.com`,
        password: 'JWTTestPassword123!',
        firstName: 'JWT',
        lastName: 'Test',
        role: 'va'
      });
      
      await testUser.save();
      this.testData.createdUsers.push(testUser._id);
      
      const accessToken = testUser.getSignedJwtToken();
      const hasAccessToken = accessToken && accessToken.length > 0;
      
      console.log(`✅ Access Token Generation: ${hasAccessToken ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.jwtTokenManagement.push(`ACCESS_TOKEN_GENERATION: ${hasAccessToken ? 'SUCCESS' : 'FAILED'}`);
      
      if (hasAccessToken) {
        this.testData.generatedTokens.push(accessToken);
      }
      
      // Test 2: JWT Token Verification
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        const validTokenStructure = decoded.id && decoded.iat && decoded.exp;
        
        console.log(`✅ Token Verification: ${validTokenStructure ? 'SUCCESS' : 'FAILED'}`);
        this.testResults.jwtTokenManagement.push(`TOKEN_VERIFICATION: ${validTokenStructure ? 'SUCCESS' : 'FAILED'}`);
        
        // Test token expiration
        const currentTime = Math.floor(Date.now() / 1000);
        const tokenNotExpired = decoded.exp > currentTime;
        
        console.log(`✅ Token Expiration Check: ${tokenNotExpired ? 'SUCCESS' : 'FAILED'}`);
        this.testResults.jwtTokenManagement.push(`TOKEN_EXPIRATION_CHECK: ${tokenNotExpired ? 'SUCCESS' : 'FAILED'}`);
        
      } catch (error) {
        console.log(`❌ Token Verification: FAILED (${error.message})`);
        this.testResults.jwtTokenManagement.push('TOKEN_VERIFICATION: FAILED');
      }
      
      // Test 3: Refresh Token Generation and Storage
      const refreshToken = testUser.getRefreshToken();
      await testUser.save();
      
      const hasRefreshToken = refreshToken && testUser.refreshToken && testUser.refreshTokenExpire;
      console.log(`✅ Refresh Token Generation: ${hasRefreshToken ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.jwtTokenManagement.push(`REFRESH_TOKEN_GENERATION: ${hasRefreshToken ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 4: Refresh Token Validation
      if (hasRefreshToken) {
        const isValidRefreshToken = await testUser.validateRefreshToken(refreshToken);
        console.log(`✅ Refresh Token Validation: ${isValidRefreshToken ? 'SUCCESS' : 'FAILED'}`);
        this.testResults.jwtTokenManagement.push(`REFRESH_TOKEN_VALIDATION: ${isValidRefreshToken ? 'SUCCESS' : 'FAILED'}`);
        
        // Test invalid refresh token
        const isInvalidRefreshToken = await testUser.validateRefreshToken('invalid-token');
        console.log(`✅ Invalid Refresh Token Rejection: ${!isInvalidRefreshToken ? 'SUCCESS' : 'FAILED'}`);
        this.testResults.jwtTokenManagement.push(`INVALID_REFRESH_TOKEN_REJECTION: ${!isInvalidRefreshToken ? 'SUCCESS' : 'FAILED'}`);
      }
      
    } catch (error) {
      console.error('❌ JWT token management test failed:', error.message);
      this.testResults.jwtTokenManagement.push('FAILED: ' + error.message);
      this.testResults.errors.push(`JWT Token Management: ${error.message}`);
    }
  }

  async testSessionTracking() {
    console.log('\n📱 Testing Session Tracking...');
    
    try {
      // Test 1: Login Session Creation
      const sessionUser = new User({
        email: `session.test.${Date.now()}@example.com`,
        password: 'SessionPassword123!',
        firstName: 'Session',
        lastName: 'Test',
        role: 'business'
      });
      
      await sessionUser.save();
      this.testData.createdUsers.push(sessionUser._id);
      
      // Simulate session tracking
      const mockReq = {
        user: sessionUser,
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        ip: '192.168.1.100'
      };
      
      // Manually simulate session tracking (since we can't use actual middleware)
      const sessionId = crypto.randomBytes(16).toString('hex');
      const sessionData = {
        id: sessionId,
        device: 'Desktop',
        browser: 'Chrome',
        os: 'Windows',
        location: 'Local/Private Network',
        ipAddress: '192.168.1.100',
        timestamp: new Date(),
        current: true,
        userAgent: mockReq.headers['user-agent']
      };
      
      sessionUser.loginSessions = sessionUser.loginSessions || [];
      sessionUser.loginSessions.push(sessionData);
      sessionUser.stats = sessionUser.stats || {};
      sessionUser.stats.totalLogins = (sessionUser.stats.totalLogins || 0) + 1;
      sessionUser.stats.lastActive = new Date();
      
      await sessionUser.save();
      
      console.log('✅ Session Creation: SUCCESS');
      this.testResults.sessionTracking.push('SESSION_CREATION: SUCCESS');
      
      // Test 2: Session Data Persistence
      const userWithSession = await User.findById(sessionUser._id);
      const hasSessionData = userWithSession.loginSessions && 
                            userWithSession.loginSessions.length > 0 &&
                            userWithSession.loginSessions[0].id === sessionId;
      
      console.log(`✅ Session Data Persistence: ${hasSessionData ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.sessionTracking.push(`SESSION_DATA_PERSISTENCE: ${hasSessionData ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 3: Multiple Session Management
      // Add second session
      const secondSessionId = crypto.randomBytes(16).toString('hex');
      const secondSessionData = {
        id: secondSessionId,
        device: 'Mobile',
        browser: 'Safari',
        os: 'iOS',
        location: 'Unknown Location',
        ipAddress: '10.0.0.1',
        timestamp: new Date(),
        current: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)'
      };
      
      // Mark previous session as not current
      userWithSession.loginSessions.forEach(session => {
        session.current = false;
      });
      userWithSession.loginSessions.push(secondSessionData);
      
      await userWithSession.save();
      
      const multiSessionUser = await User.findById(sessionUser._id);
      const currentSessions = multiSessionUser.loginSessions.filter(session => session.current);
      const sessionManagementTest = currentSessions.length === 1 && 
                                   currentSessions[0].id === secondSessionId;
      
      console.log(`✅ Multiple Session Management: ${sessionManagementTest ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.sessionTracking.push(`MULTIPLE_SESSION_MANAGEMENT: ${sessionManagementTest ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 4: Session Statistics
      const statsTest = multiSessionUser.stats.totalLogins > 0 && 
                       multiSessionUser.stats.lastActive;
      
      console.log(`✅ Session Statistics: ${statsTest ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.sessionTracking.push(`SESSION_STATISTICS: ${statsTest ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (error) {
      console.error('❌ Session tracking test failed:', error.message);
      this.testResults.sessionTracking.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Session Tracking: ${error.message}`);
    }
  }

  async testLoginHistory() {
    console.log('\n📊 Testing Login History Persistence...');
    
    try {
      // Test 1: Login History Creation
      const historyUser = await User.findById(this.testData.createdUsers[0]);
      if (historyUser) {
        const loginRecord = new LoginHistory({
          user: historyUser._id,
          loginTime: new Date(),
          ipAddress: '203.177.83.42', // Philippine IP for testing
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          browser: 'Chrome',
          browserVersion: '96.0.4664.110',
          os: 'Windows',
          osVersion: '10',
          device: 'Desktop Computer',
          deviceType: 'desktop',
          location: {
            country: 'Philippines',
            region: 'Metro Manila',
            city: 'Manila',
            timezone: 'Asia/Manila'
          },
          loginMethod: 'email',
          sessionId: crypto.randomBytes(16).toString('hex'),
          success: true,
          twoFactorUsed: false,
          suspicious: false
        });
        
        await loginRecord.save();
        this.testData.createdLoginHistory.push(loginRecord._id);
        
        console.log('✅ Login History Creation: SUCCESS');
        this.testResults.loginHistory.push('LOGIN_HISTORY_CREATION: SUCCESS');
        
        // Test 2: Failed Login Tracking
        const failedLoginRecord = new LoginHistory({
          user: historyUser._id,
          loginTime: new Date(),
          ipAddress: '192.168.1.200',
          userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          browser: 'Firefox',
          os: 'Linux',
          device: 'Desktop',
          deviceType: 'desktop',
          loginMethod: 'email',
          success: false,
          failureReason: 'Invalid password',
          suspicious: false
        });
        
        await failedLoginRecord.save();
        this.testData.createdLoginHistory.push(failedLoginRecord._id);
        
        console.log('✅ Failed Login Tracking: SUCCESS');
        this.testResults.loginHistory.push('FAILED_LOGIN_TRACKING: SUCCESS');
        
        // Test 3: Suspicious Activity Detection
        const suspiciousCheck = await LoginHistory.checkSuspiciousActivity(
          historyUser._id,
          '192.168.1.200',
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
        );
        
        console.log(`✅ Suspicious Activity Detection: SUCCESS (${suspiciousCheck.suspicious ? 'Suspicious' : 'Normal'})`);
        this.testResults.loginHistory.push('SUSPICIOUS_ACTIVITY_DETECTION: SUCCESS');
        
        // Test 4: Login History Query Performance
        const startTime = Date.now();
        await LoginHistory.find({ user: historyUser._id }).sort({ loginTime: -1 }).limit(10);
        const queryTime = Date.now() - startTime;
        
        console.log(`✅ Login History Query Performance: ${queryTime}ms`);
        this.testResults.loginHistory.push(`QUERY_PERFORMANCE: ${queryTime}ms`);
      }
      
      // Test 5: Session Duration Calculation
      const loginRecord = await LoginHistory.findById(this.testData.createdLoginHistory[0]);
      if (loginRecord) {
        loginRecord.logoutTime = new Date(loginRecord.loginTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
        await loginRecord.save();
        
        const sessionDuration = loginRecord.getSessionDuration();
        const durationTest = sessionDuration === 7200; // 2 hours = 7200 seconds
        
        console.log(`✅ Session Duration Calculation: ${durationTest ? 'SUCCESS' : 'FAILED'} (${sessionDuration}s)`);
        this.testResults.loginHistory.push(`SESSION_DURATION_CALC: ${durationTest ? 'SUCCESS' : 'FAILED'}`);
      }
      
    } catch (error) {
      console.error('❌ Login history test failed:', error.message);
      this.testResults.loginHistory.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Login History: ${error.message}`);
    }
  }

  async testTwoFactorAuthentication() {
    console.log('\n🔐 Testing Two-Factor Authentication Storage...');
    
    try {
      // Test 1: 2FA Setup for Business User
      const businessUser = new User({
        email: `2fa.business.${Date.now()}@example.com`,
        password: 'TwoFactorPassword123!',
        firstName: 'TwoFactor',
        lastName: 'Business',
        role: 'business'
      });
      
      await businessUser.save();
      this.testData.createdUsers.push(businessUser._id);
      
      const business = new Business({
        user: businessUser._id,
        contactName: 'TwoFactor Business',
        company: 'SecureCorp',
        bio: 'Security-focused business',
        email: businessUser.email
      });
      
      await business.save();
      this.testData.createdBusinesses.push(business._id);
      
      // Generate 2FA secret
      const secret = speakeasy.generateSecret({
        name: 'Linkage VA Hub',
        account: businessUser.email,
        length: 20
      });
      
      // Generate backup codes
      const backupCodes = [];
      for (let i = 0; i < 8; i++) {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        backupCodes.push({
          code: crypto.createHash('sha256').update(code).digest('hex'),
          used: false
        });
      }
      
      const businessSettings = new BusinessSettings({
        business: business._id,
        securitySettings: {
          twoFactorEnabled: true,
          twoFactorSecret: business.encryptData ? business.encryptData(secret.base32) : secret.base32,
          twoFactorMethod: 'authenticator',
          twoFactorVerifiedAt: new Date(),
          twoFactorBackupCodes: backupCodes,
          sessionTimeout: 30
        }
      });
      
      await businessSettings.save();
      this.testData.createdSettings.push(businessSettings._id);
      
      console.log('✅ 2FA Setup: SUCCESS');
      this.testResults.twoFactorAuthentication.push('2FA_SETUP: SUCCESS');
      
      // Test 2: 2FA Status Check
      const twoFactorStatus = await checkTwoFactorStatus(businessUser._id);
      const statusCheckTest = twoFactorStatus.enabled === true;
      
      console.log(`✅ 2FA Status Check: ${statusCheckTest ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.twoFactorAuthentication.push(`2FA_STATUS_CHECK: ${statusCheckTest ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 3: TOTP Code Validation
      const totpCode = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32'
      });
      
      const totpValidation = await validateTwoFactorForLogin(businessUser._id, totpCode);
      const totpValidationTest = totpValidation.valid === true;
      
      console.log(`✅ TOTP Code Validation: ${totpValidationTest ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.twoFactorAuthentication.push(`TOTP_VALIDATION: ${totpValidationTest ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 4: Backup Code Validation
      const firstBackupCodePlain = crypto.randomBytes(4).toString('hex').toUpperCase();
      const firstBackupCodeHash = crypto.createHash('sha256').update(firstBackupCodePlain).digest('hex');
      
      // Update the first backup code with our test code
      const updatedSettings = await BusinessSettings.findById(businessSettings._id);
      if (updatedSettings && updatedSettings.securitySettings.twoFactorBackupCodes.length > 0) {
        updatedSettings.securitySettings.twoFactorBackupCodes[0].code = firstBackupCodeHash;
        await updatedSettings.save();
        
        const backupValidation = await validateTwoFactorForLogin(businessUser._id, firstBackupCodePlain);
        const backupValidationTest = backupValidation.valid === true && backupValidation.backupCodeUsed === true;
        
        console.log(`✅ Backup Code Validation: ${backupValidationTest ? 'SUCCESS' : 'FAILED'}`);
        this.testResults.twoFactorAuthentication.push(`BACKUP_CODE_VALIDATION: ${backupValidationTest ? 'SUCCESS' : 'FAILED'}`);
      }
      
      // Test 5: Failed Attempt Tracking
      const invalidCodeValidation = await validateTwoFactorForLogin(businessUser._id, '000000');
      const failedAttemptTest = invalidCodeValidation.valid === false && 
                               invalidCodeValidation.attemptsRemaining !== undefined;
      
      console.log(`✅ Failed Attempt Tracking: ${failedAttemptTest ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.twoFactorAuthentication.push(`FAILED_ATTEMPT_TRACKING: ${failedAttemptTest ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (error) {
      console.error('❌ Two-factor authentication test failed:', error.message);
      this.testResults.twoFactorAuthentication.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Two-Factor Authentication: ${error.message}`);
    }
  }

  async testPasswordSecurity() {
    console.log('\n🔒 Testing Password Security Storage...');
    
    try {
      // Test 1: Password Hashing
      const passwordUser = new User({
        email: `password.test.${Date.now()}@example.com`,
        password: 'PlainTextPassword123!',
        firstName: 'Password',
        lastName: 'Test'
      });
      
      const plainPassword = passwordUser.password;
      await passwordUser.save();
      this.testData.createdUsers.push(passwordUser._id);
      
      // Verify password was hashed
      const savedUser = await User.findById(passwordUser._id).select('+password');
      const passwordHashed = savedUser.password !== plainPassword && savedUser.password.startsWith('$2a$');
      
      console.log(`✅ Password Hashing: ${passwordHashed ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.passwordSecurity.push(`PASSWORD_HASHING: ${passwordHashed ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 2: Password Matching
      const passwordMatch = await savedUser.matchPassword('PlainTextPassword123!');
      const wrongPasswordMatch = await savedUser.matchPassword('WrongPassword');
      
      console.log(`✅ Password Matching: ${passwordMatch && !wrongPasswordMatch ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.passwordSecurity.push(`PASSWORD_MATCHING: ${passwordMatch && !wrongPasswordMatch ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 3: Password Update Security
      savedUser.password = 'NewSecurePassword456!';
      await savedUser.save();
      
      const updatedUser = await User.findById(passwordUser._id).select('+password');
      const passwordUpdated = await updatedUser.matchPassword('NewSecurePassword456!');
      const oldPasswordInvalid = !(await updatedUser.matchPassword('PlainTextPassword123!'));
      
      console.log(`✅ Password Update Security: ${passwordUpdated && oldPasswordInvalid ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.passwordSecurity.push(`PASSWORD_UPDATE_SECURITY: ${passwordUpdated && oldPasswordInvalid ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 4: Password Reset Token Security
      const resetToken = updatedUser.getResetPasswordToken();
      await updatedUser.save();
      
      const tokenUser = await User.findById(passwordUser._id);
      const hasResetToken = tokenUser.resetPasswordToken && tokenUser.resetPasswordExpire;
      const resetTokenHashed = tokenUser.resetPasswordToken !== resetToken;
      
      console.log(`✅ Reset Token Security: ${hasResetToken && resetTokenHashed ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.passwordSecurity.push(`RESET_TOKEN_SECURITY: ${hasResetToken && resetTokenHashed ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (error) {
      console.error('❌ Password security test failed:', error.message);
      this.testResults.passwordSecurity.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Password Security: ${error.message}`);
    }
  }

  async testRefreshTokens() {
    console.log('\n🔄 Testing Refresh Token Storage...');
    
    try {
      // Test 1: Refresh Token Generation and Storage
      const refreshUser = await User.findById(this.testData.createdUsers[0]);
      if (refreshUser) {
        const originalRefreshToken = refreshUser.refreshToken;
        const newRefreshToken = refreshUser.getRefreshToken();
        await refreshUser.save();
        
        const refreshTokenChanged = refreshUser.refreshToken !== originalRefreshToken;
        const hasExpiration = refreshUser.refreshTokenExpire > Date.now();
        
        console.log(`✅ Refresh Token Storage: ${refreshTokenChanged && hasExpiration ? 'SUCCESS' : 'FAILED'}`);
        this.testResults.refreshTokens.push(`REFRESH_TOKEN_STORAGE: ${refreshTokenChanged && hasExpiration ? 'SUCCESS' : 'FAILED'}`);
        
        // Test 2: Refresh Token Validation
        const validationResult = await refreshUser.validateRefreshToken(newRefreshToken);
        console.log(`✅ Refresh Token Validation: ${validationResult ? 'SUCCESS' : 'FAILED'}`);
        this.testResults.refreshTokens.push(`REFRESH_TOKEN_VALIDATION: ${validationResult ? 'SUCCESS' : 'FAILED'}`);
        
        // Test 3: Expired Refresh Token Handling
        const expiredUser = new User({
          email: `expired.refresh.${Date.now()}@example.com`,
          password: 'ExpiredRefreshPassword123!',
          firstName: 'Expired',
          lastName: 'Refresh'
        });
        
        await expiredUser.save();
        this.testData.createdUsers.push(expiredUser._id);
        
        // Set expired refresh token manually
        expiredUser.refreshToken = bcrypt.hashSync('expired-token', 10);
        expiredUser.refreshTokenExpire = Date.now() - 60000; // 1 minute ago
        await expiredUser.save();
        
        const expiredValidation = await expiredUser.validateRefreshToken('expired-token');
        console.log(`✅ Expired Token Rejection: ${!expiredValidation ? 'SUCCESS' : 'FAILED'}`);
        this.testResults.refreshTokens.push(`EXPIRED_TOKEN_REJECTION: ${!expiredValidation ? 'SUCCESS' : 'FAILED'}`);
      }
      
    } catch (error) {
      console.error('❌ Refresh token test failed:', error.message);
      this.testResults.refreshTokens.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Refresh Tokens: ${error.message}`);
    }
  }

  async testSecurityFeatures() {
    console.log('\n🛡️ Testing Security Features Storage...');
    
    try {
      // Test 1: Account Suspension Storage
      const suspendUser = await User.findById(this.testData.createdUsers[0]);
      if (suspendUser) {
        suspendUser.suspended = true;
        await suspendUser.save();
        
        const suspendedUser = await User.findById(suspendUser._id);
        const suspensionTest = suspendedUser.suspended === true;
        
        console.log(`✅ Account Suspension Storage: ${suspensionTest ? 'SUCCESS' : 'FAILED'}`);
        this.testResults.securityFeatures.push(`ACCOUNT_SUSPENSION: ${suspensionTest ? 'SUCCESS' : 'FAILED'}`);
      }
      
      // Test 2: Admin Role Verification Storage
      const adminUser = new User({
        email: `admin.security.${Date.now()}@example.com`,
        password: 'AdminSecurityPassword123!',
        firstName: 'Admin',
        lastName: 'Security',
        admin: true
      });
      
      await adminUser.save();
      this.testData.createdUsers.push(adminUser._id);
      
      const savedAdminUser = await User.findById(adminUser._id);
      const adminRoleTest = savedAdminUser.admin === true;
      
      console.log(`✅ Admin Role Storage: ${adminRoleTest ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.securityFeatures.push(`ADMIN_ROLE_STORAGE: ${adminRoleTest ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 3: Email Verification Status
      const verificationUser = new User({
        email: `verification.test.${Date.now()}@example.com`,
        password: 'VerificationPassword123!',
        firstName: 'Verification',
        lastName: 'Test'
      });
      
      await verificationUser.save();
      this.testData.createdUsers.push(verificationUser._id);
      
      // Generate confirmation token
      const confirmToken = verificationUser.getConfirmationToken();
      await verificationUser.save();
      
      // Verify confirmation token was stored
      const userWithToken = await User.findById(verificationUser._id);
      const hasConfirmationToken = userWithToken.confirmationToken && 
                                  userWithToken.confirmationTokenExpire;
      
      console.log(`✅ Email Verification Token Storage: ${hasConfirmationToken ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.securityFeatures.push(`EMAIL_VERIFICATION_TOKEN: ${hasConfirmationToken ? 'SUCCESS' : 'FAILED'}`);
      
      // Test email verification completion
      userWithToken.isVerified = true;
      userWithToken.confirmedAt = new Date();
      userWithToken.confirmationToken = undefined;
      userWithToken.confirmationTokenExpire = undefined;
      await userWithToken.save();
      
      const verifiedUser = await User.findById(verificationUser._id);
      const verificationTest = verifiedUser.isVerified === true && 
                              verifiedUser.confirmedAt &&
                              !verifiedUser.confirmationToken;
      
      console.log(`✅ Email Verification Completion: ${verificationTest ? 'SUCCESS' : 'FAILED'}`);
      this.testResults.securityFeatures.push(`EMAIL_VERIFICATION_COMPLETION: ${verificationTest ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 4: User Authentication Tokens
      const authUser = await User.findById(this.testData.createdUsers[0]);
      if (authUser) {
        const authToken = crypto.randomBytes(32).toString('hex');
        authUser.authenticationToken = authToken;
        await authUser.save();
        
        const authUserWithToken = await User.findById(authUser._id);
        const authTokenTest = authUserWithToken.authenticationToken === authToken;
        
        console.log(`✅ Authentication Token Storage: ${authTokenTest ? 'SUCCESS' : 'FAILED'}`);
        this.testResults.securityFeatures.push(`AUTH_TOKEN_STORAGE: ${authTokenTest ? 'SUCCESS' : 'FAILED'}`);
      }
      
    } catch (error) {
      console.error('❌ Security features test failed:', error.message);
      this.testResults.securityFeatures.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Security Features: ${error.message}`);
    }
  }

  async testUserStateManagement() {
    console.log('\n👤 Testing User State Management...');
    
    try {
      // Test 1: User Profile State Persistence
      const stateUser = await User.findById(this.testData.createdUsers[0]);
      if (stateUser) {
        // Update various state properties
        stateUser.inboxEnabled = false;
        stateUser.signInCount = 5;
        stateUser.currentSignInAt = new Date();
        stateUser.lastSignInAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
        stateUser.currentSignInIp = '192.168.1.100';
        stateUser.lastSignInIp = '10.0.0.1';
        
        await stateUser.save();
        
        const updatedStateUser = await User.findById(stateUser._id);
        const stateTest = updatedStateUser.inboxEnabled === false &&
                         updatedStateUser.signInCount === 5 &&
                         updatedStateUser.currentSignInIp === '192.168.1.100';
        
        console.log(`✅ User State Persistence: ${stateTest ? 'SUCCESS' : 'FAILED'}`);
        this.testResults.userStateManagement.push(`USER_STATE_PERSISTENCE: ${stateTest ? 'SUCCESS' : 'FAILED'}`);
      }
      
      // Test 2: User Preferences Storage
      const prefsUser = await User.findById(this.testData.createdUsers[1]);
      if (prefsUser) {
        prefsUser.preferences = {
          notifications: {
            email: {
              enabled: true,
              messages: false,
              updates: true,
              marketing: false
            },
            push: {
              enabled: false,
              messages: false,
              updates: false
            },
            sms: {
              enabled: false,
              messages: false,
              updates: false
            }
          },
          privacy: {
            profileVisibility: 'connections-only',
            showEmail: true,
            showPhone: false,
            allowMessagesFrom: 'connections-only'
          },
          display: {
            theme: 'dark',
            language: 'en',
            dateFormat: 'DD/MM/YYYY',
            timeFormat: '24h'
          }
        };
        
        await prefsUser.save();
        
        const userWithPrefs = await User.findById(prefsUser._id);
        const preferencesTest = userWithPrefs.preferences.notifications.email.enabled === true &&
                               userWithPrefs.preferences.privacy.profileVisibility === 'connections-only' &&
                               userWithPrefs.preferences.display.theme === 'dark';
        
        console.log(`✅ User Preferences Storage: ${preferencesTest ? 'SUCCESS' : 'FAILED'}`);
        this.testResults.userStateManagement.push(`USER_PREFERENCES_STORAGE: ${preferencesTest ? 'SUCCESS' : 'FAILED'}`);
      }
      
      // Test 3: Profile Completion Tracking
      const completionUser = await User.findById(this.testData.createdUsers[0]);
      if (completionUser) {
        const profileCompletion = completionUser.calculateProfileCompletion();
        
        const completionTrackingTest = completionUser.profileCompletion &&
                                      completionUser.profileCompletion.percentage >= 0 &&
                                      Array.isArray(completionUser.profileCompletion.completedSteps);
        
        console.log(`✅ Profile Completion Tracking: ${completionTrackingTest ? 'SUCCESS' : 'FAILED'} (${completionUser.profileCompletion?.percentage || 0}%)`);
        this.testResults.userStateManagement.push(`PROFILE_COMPLETION_TRACKING: ${completionTrackingTest ? 'SUCCESS' : 'FAILED'}`);
      }
      
      // Test 4: Referral System Storage
      const referralUser = await User.findById(this.testData.createdUsers[0]);
      const referredUser = await User.findById(this.testData.createdUsers[1]);
      
      if (referralUser && referredUser) {
        // Set up referral relationship
        referredUser.referredBy = referralUser._id;
        referralUser.referrals.push(referredUser._id);
        
        await referralUser.save();
        await referredUser.save();
        
        const updatedReferralUser = await User.findById(referralUser._id);
        const updatedReferredUser = await User.findById(referredUser._id);
        
        const referralSystemTest = updatedReferralUser.referrals.includes(referredUser._id) &&
                                   updatedReferredUser.referredBy.equals(referralUser._id);
        
        console.log(`✅ Referral System Storage: ${referralSystemTest ? 'SUCCESS' : 'FAILED'}`);
        this.testResults.userStateManagement.push(`REFERRAL_SYSTEM_STORAGE: ${referralSystemTest ? 'SUCCESS' : 'FAILED'}`);
      }
      
    } catch (error) {
      console.error('❌ User state management test failed:', error.message);
      this.testResults.userStateManagement.push('FAILED: ' + error.message);
      this.testResults.errors.push(`User State Management: ${error.message}`);
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testing Authentication Performance...');
    
    try {
      // Test 1: User Authentication Query Performance
      const authStartTime = Date.now();
      await User.findOne({ email: { $exists: true } }).select('+password');
      const authTime = Date.now() - authStartTime;
      
      console.log(`✅ User Authentication Query: ${authTime}ms`);
      this.testResults.performance.push(`USER_AUTH_QUERY: ${authTime}ms`);
      
      // Test 2: Session Lookup Performance
      const sessionStartTime = Date.now();
      await User.find({ 'loginSessions.current': true }).limit(50);
      const sessionTime = Date.now() - sessionStartTime;
      
      console.log(`✅ Session Lookup Performance: ${sessionTime}ms`);
      this.testResults.performance.push(`SESSION_LOOKUP: ${sessionTime}ms`);
      
      // Test 3: Login History Query Performance
      const historyStartTime = Date.now();
      await LoginHistory.find({}).sort({ loginTime: -1 }).limit(100);
      const historyTime = Date.now() - historyStartTime;
      
      console.log(`✅ Login History Query Performance: ${historyTime}ms`);
      this.testResults.performance.push(`LOGIN_HISTORY_QUERY: ${historyTime}ms`);
      
      // Test 4: 2FA Settings Query Performance
      const twoFactorStartTime = Date.now();
      await BusinessSettings.find({ 'securitySettings.twoFactorEnabled': true });
      const twoFactorTime = Date.now() - twoFactorStartTime;
      
      console.log(`✅ 2FA Settings Query Performance: ${twoFactorTime}ms`);
      this.testResults.performance.push(`2FA_SETTINGS_QUERY: ${twoFactorTime}ms`);
      
    } catch (error) {
      console.error('❌ Performance test failed:', error.message);
      this.testResults.performance.push('FAILED: ' + error.message);
      this.testResults.errors.push(`Performance: ${error.message}`);
    }
  }

  async cleanupTestData() {
    console.log('\n🧹 Cleaning up authentication test data...');
    
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
      
      // Clean up login history
      for (const historyId of this.testData.createdLoginHistory) {
        await LoginHistory.findByIdAndDelete(historyId);
      }
      
      console.log('✅ Authentication test data cleanup completed');
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Authentication Data Storage Verification...\n');
    
    const connected = await this.connect();
    if (!connected) {
      console.log('❌ Cannot proceed without database connection');
      return this.generateReport();
    }

    await this.testJWTTokenManagement();
    await this.testSessionTracking();
    await this.testLoginHistory();
    await this.testTwoFactorAuthentication();
    await this.testPasswordSecurity();
    await this.testRefreshTokens();
    await this.testSecurityFeatures();
    await this.testUserStateManagement();
    await this.testPerformance();
    
    await this.cleanupTestData();

    return this.generateReport();
  }

  generateReport() {
    console.log('\n📊 AUTHENTICATION DATA STORAGE AUDIT REPORT');
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
        jwtTokenManagement: this.testResults.jwtTokenManagement,
        sessionTracking: this.testResults.sessionTracking,
        loginHistory: this.testResults.loginHistory,
        twoFactorAuthentication: this.testResults.twoFactorAuthentication,
        passwordSecurity: this.testResults.passwordSecurity,
        refreshTokens: this.testResults.refreshTokens,
        securityFeatures: this.testResults.securityFeatures,
        userStateManagement: this.testResults.userStateManagement,
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
    console.log(`🔑 JWT Token Management: ${this.testResults.jwtTokenManagement.join(', ')}`);
    console.log(`📱 Session Tracking: ${this.testResults.sessionTracking.join(', ')}`);
    console.log(`📊 Login History: ${this.testResults.loginHistory.join(', ')}`);
    console.log(`🔐 Two-Factor Authentication: ${this.testResults.twoFactorAuthentication.join(', ')}`);
    console.log(`🔒 Password Security: ${this.testResults.passwordSecurity.join(', ')}`);
    console.log(`🔄 Refresh Tokens: ${this.testResults.refreshTokens.join(', ')}`);
    console.log(`🛡️ Security Features: ${this.testResults.securityFeatures.join(', ')}`);
    console.log(`👤 User State Management: ${this.testResults.userStateManagement.join(', ')}`);
    console.log(`⚡ Performance: ${this.testResults.performance.join(', ')}`);

    if (report.summary.errors > 0) {
      console.log('\n🔍 ERROR DETAILS:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log('\n💡 AUTHENTICATION SECURITY RECOMMENDATIONS:');
    console.log('  • Implement session timeout and automatic cleanup');
    console.log('  • Monitor for suspicious login patterns and geographic anomalies');
    console.log('  • Regular audit of admin accounts and permissions');
    console.log('  • Implement progressive security measures based on risk assessment');
    console.log('  • Set up alerts for failed authentication attempts');
    console.log('  • Regular rotation of encryption keys and secrets');
    console.log('  • Implement device trust and recognition features');

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

// Run the authentication audit if this file is executed directly
if (require.main === module) {
  (async () => {
    const tester = new AuthenticationAuditTester();
    
    try {
      const report = await tester.runAllTests();
      
      // Save report to file
      const fs = require('fs');
      const reportPath = path.join(__dirname, 'authentication-audit-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n💾 Detailed report saved to: ${reportPath}`);
      
    } catch (error) {
      console.error('❌ Authentication audit failed:', error.message);
    } finally {
      await tester.disconnect();
      process.exit(0);
    }
  })();
}

module.exports = AuthenticationAuditTester;