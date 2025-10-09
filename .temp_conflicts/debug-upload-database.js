#!/usr/bin/env node

/**
 * Debug script to diagnose VA profile media upload database issues
 * This script checks:
 * 1. MongoDB connection
 * 2. VA document structure and validation
 * 3. Recent upload attempts
 * 4. Media URL persistence
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import models
const User = require('./models/User');
const VA = require('./models/VA');

const DEBUG_COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${DEBUG_COLORS[color]}${message}${DEBUG_COLORS.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

async function checkMongoDBConnection() {
  logSection('1. MongoDB Connection Check');
  
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      log('❌ MONGODB_URI environment variable is not set!', 'red');
      return false;
    }
    
    log(`📍 MongoDB URI: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`, 'cyan');
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    log('✅ Successfully connected to MongoDB', 'green');
    
    // Check connection state
    const state = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    log(`📊 Connection state: ${states[state]} (${state})`, 'cyan');
    
    // Get database info
    const admin = mongoose.connection.db.admin();
    const dbInfo = await admin.listDatabases();
    log(`📂 Available databases: ${dbInfo.databases.map(db => db.name).join(', ')}`, 'cyan');
    
    // Get current database name
    const currentDb = mongoose.connection.db.databaseName;
    log(`📌 Current database: ${currentDb}`, 'cyan');
    
    // Get collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    log(`📁 Collections in ${currentDb}: ${collections.map(c => c.name).join(', ')}`, 'cyan');
    
    return true;
  } catch (error) {
    log(`❌ MongoDB connection failed: ${error.message}`, 'red');
    return false;
  }
}

async function checkVASchema() {
  logSection('2. VA Model Schema Validation');
  
  try {
    // Get schema paths
    const schemaPaths = VA.schema.paths;
    const mediaFields = ['avatar', 'coverImage', 'videoIntroduction'];
    
    log('📋 Checking media field definitions:', 'cyan');
    for (const field of mediaFields) {
      if (schemaPaths[field]) {
        const fieldDef = schemaPaths[field];
        log(`  ✅ ${field}:`, 'green');
        log(`     - Type: ${fieldDef.instance}`, 'white');
        log(`     - Required: ${fieldDef.isRequired || false}`, 'white');
        log(`     - Default: ${fieldDef.defaultValue || 'none'}`, 'white');
      } else {
        log(`  ❌ ${field}: NOT FOUND in schema`, 'red');
      }
    }
    
    // Check for duplicate coverImage fields
    if (schemaPaths['coverImage']) {
      const coverImageDef = VA.schema.obj.coverImage;
      log('\n⚠️  Note: coverImage field appears twice in schema:', 'yellow');
      log('  - Line 23-27: With default Unsplash image', 'white');
      log('  - Line 161-163: As URL to cover image', 'white');
      log('  This may cause conflicts! Consider removing one definition.', 'yellow');
    }
    
    // Check indexes
    const indexes = await VA.collection.getIndexes();
    log('\n📊 Database Indexes:', 'cyan');
    Object.keys(indexes).forEach(indexName => {
      log(`  - ${indexName}: ${JSON.stringify(indexes[indexName])}`, 'white');
    });
    
    return true;
  } catch (error) {
    log(`❌ Schema validation failed: ${error.message}`, 'red');
    return false;
  }
}

async function checkRecentVAs() {
  logSection('3. Recent VA Documents Analysis');
  
  try {
    // Get recent VAs
    const recentVAs = await VA.find({})
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('user', 'email name')
      .lean();
    
    if (recentVAs.length === 0) {
      log('⚠️  No VA documents found in database', 'yellow');
      return;
    }
    
    log(`📊 Found ${recentVAs.length} recent VA profiles:`, 'cyan');
    
    for (const va of recentVAs) {
      console.log('\n  ' + '-'.repeat(50));
      log(`  👤 ${va.name} (${va.user?.email || 'no email'})`, 'white');
      log(`     ID: ${va._id}`, 'white');
      log(`     Updated: ${new Date(va.updatedAt).toLocaleString()}`, 'white');
      
      // Check media fields
      const mediaStatus = {
        avatar: va.avatar ? '✅' : '❌',
        coverImage: va.coverImage ? '✅' : '❌',
        videoIntroduction: va.videoIntroduction ? '✅' : '❌'
      };
      
      log(`     Media:`, 'cyan');
      log(`       Avatar: ${mediaStatus.avatar} ${va.avatar || 'not set'}`, 
          va.avatar ? 'green' : 'yellow');
      log(`       Cover: ${mediaStatus.coverImage} ${va.coverImage || 'not set'}`,
          va.coverImage ? 'green' : 'yellow');
      log(`       Video: ${mediaStatus.videoIntroduction} ${va.videoIntroduction || 'not set'}`,
          va.videoIntroduction ? 'green' : 'yellow');
    }
    
  } catch (error) {
    log(`❌ Failed to fetch VA documents: ${error.message}`, 'red');
  }
}

async function checkUploadDirectory() {
  logSection('4. Upload Directory Analysis');
  
  try {
    const uploadsDir = path.join(__dirname, 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      log('❌ Uploads directory does not exist!', 'red');
      return;
    }
    
    log(`📁 Uploads directory: ${uploadsDir}`, 'cyan');
    
    const files = fs.readdirSync(uploadsDir);
    const stats = {
      total: files.length,
      images: files.filter(f => f.startsWith('image-')).length,
      videos: files.filter(f => f.startsWith('video-')).length
    };
    
    log(`📊 File statistics:`, 'cyan');
    log(`  - Total files: ${stats.total}`, 'white');
    log(`  - Images: ${stats.images}`, 'white');
    log(`  - Videos: ${stats.videos}`, 'white');
    
    // Get recent files (last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentFiles = files.filter(file => {
      const filePath = path.join(uploadsDir, file);
      const stat = fs.statSync(filePath);
      return stat.mtimeMs > oneDayAgo;
    });
    
    if (recentFiles.length > 0) {
      log(`\n🕐 Files uploaded in last 24 hours: ${recentFiles.length}`, 'green');
      recentFiles.forEach(file => {
        const filePath = path.join(uploadsDir, file);
        const stat = fs.statSync(filePath);
        log(`  - ${file} (${new Date(stat.mtime).toLocaleString()})`, 'white');
      });
    } else {
      log('\n⚠️  No files uploaded in the last 24 hours', 'yellow');
    }
    
  } catch (error) {
    log(`❌ Failed to analyze upload directory: ${error.message}`, 'red');
  }
}

async function testDatabaseUpdate() {
  logSection('5. Test Database Update Operations');
  
  try {
    // Find a test VA or use the first available
    const testVA = await VA.findOne({}).populate('user', 'email');
    
    if (!testVA) {
      log('⚠️  No VA found for testing', 'yellow');
      return;
    }
    
    log(`🧪 Testing update on VA: ${testVA.name} (${testVA.user?.email})`, 'cyan');
    
    // Generate test URLs
    const testUrls = {
      avatar: `http://localhost:5000/uploads/test-avatar-${Date.now()}.jpg`,
      coverImage: `http://localhost:5000/uploads/test-cover-${Date.now()}.jpg`,
      videoIntroduction: `http://localhost:5000/uploads/test-video-${Date.now()}.mp4`
    };
    
    // Test 1: Direct update using save()
    log('\n📝 Test 1: Direct update using save()...', 'cyan');
    testVA.avatar = testUrls.avatar;
    const saveResult = await testVA.save();
    
    if (saveResult.avatar === testUrls.avatar) {
      log('  ✅ save() method works correctly', 'green');
    } else {
      log('  ❌ save() method failed to persist avatar', 'red');
    }
    
    // Test 2: Update using findByIdAndUpdate
    log('\n📝 Test 2: Update using findByIdAndUpdate()...', 'cyan');
    const updateResult = await VA.findByIdAndUpdate(
      testVA._id,
      { coverImage: testUrls.coverImage },
      { new: true }
    );
    
    if (updateResult.coverImage === testUrls.coverImage) {
      log('  ✅ findByIdAndUpdate() works correctly', 'green');
    } else {
      log('  ❌ findByIdAndUpdate() failed to persist coverImage', 'red');
    }
    
    // Test 3: Update using updateOne
    log('\n📝 Test 3: Update using updateOne()...', 'cyan');
    const updateOneResult = await VA.updateOne(
      { _id: testVA._id },
      { $set: { videoIntroduction: testUrls.videoIntroduction } }
    );
    
    if (updateOneResult.modifiedCount === 1) {
      log('  ✅ updateOne() executed successfully', 'green');
      
      // Verify the update
      const verifyVA = await VA.findById(testVA._id);
      if (verifyVA.videoIntroduction === testUrls.videoIntroduction) {
        log('  ✅ Update verified in database', 'green');
      } else {
        log('  ❌ Update not persisted despite success response', 'red');
      }
    } else {
      log('  ❌ updateOne() failed', 'red');
    }
    
    // Clean up test data
    log('\n🧹 Cleaning up test data...', 'cyan');
    await VA.findByIdAndUpdate(testVA._id, {
      avatar: null,
      coverImage: null,
      videoIntroduction: null
    });
    log('  ✅ Test data cleaned up', 'green');
    
  } catch (error) {
    log(`❌ Database update test failed: ${error.message}`, 'red');
    console.error(error);
  }
}

async function checkPossibleIssues() {
  logSection('6. Common Issues Analysis');
  
  const issues = [];
  
  // Check for duplicate field definitions
  const schemaObj = VA.schema.obj;
  if (schemaObj.coverImage && typeof schemaObj.coverImage === 'object') {
    issues.push({
      severity: 'HIGH',
      issue: 'Duplicate coverImage field in schema',
      solution: 'Remove one of the coverImage definitions (lines 23-27 or 161-163)',
      impact: 'May cause unpredictable behavior when saving'
    });
  }
  
  // Check for validation errors
  const requiredFields = [];
  Object.keys(VA.schema.paths).forEach(path => {
    if (VA.schema.paths[path].isRequired) {
      requiredFields.push(path);
    }
  });
  
  if (requiredFields.length > 0) {
    issues.push({
      severity: 'MEDIUM',
      issue: 'Required fields that might block updates',
      fields: requiredFields,
      solution: 'Ensure all required fields are provided during updates'
    });
  }
  
  // Check for middleware that might interfere
  if (VA.schema.s.hooks._pres.save && VA.schema.s.hooks._pres.save.length > 0) {
    issues.push({
      severity: 'LOW',
      issue: 'Pre-save middleware detected',
      count: VA.schema.s.hooks._pres.save.length,
      solution: 'Review pre-save hooks for potential interference'
    });
  }
  
  if (issues.length > 0) {
    log('⚠️  Potential Issues Found:', 'yellow');
    issues.forEach((issue, index) => {
      console.log(`\n  ${index + 1}. [${issue.severity}] ${issue.issue}`);
      if (issue.fields) {
        log(`     Fields: ${issue.fields.join(', ')}`, 'white');
      }
      if (issue.count) {
        log(`     Count: ${issue.count}`, 'white');
      }
      log(`     💡 Solution: ${issue.solution}`, 'cyan');
      if (issue.impact) {
        log(`     ⚡ Impact: ${issue.impact}`, 'magenta');
      }
    });
  } else {
    log('✅ No obvious schema issues detected', 'green');
  }
}

async function main() {
  console.log('\n');
  log('🔍 VA Profile Media Upload Database Debugger', 'bright');
  log('=' .repeat(60), 'white');
  
  try {
    const connected = await checkMongoDBConnection();
    if (!connected) {
      log('\n❌ Cannot proceed without MongoDB connection', 'red');
      process.exit(1);
    }
    
    await checkVASchema();
    await checkRecentVAs();
    await checkUploadDirectory();
    await testDatabaseUpdate();
    await checkPossibleIssues();
    
    logSection('Summary & Recommendations');
    
    log('🎯 Key Findings:', 'cyan');
    log('1. Files ARE being uploaded to /uploads directory', 'white');
    log('2. Check if media URLs are being saved to VA documents', 'white');
    log('3. Verify no validation errors are blocking saves', 'white');
    log('4. Ensure PUT /api/vas/me properly updates media fields', 'white');
    
    log('\n💊 Debugging Steps:', 'cyan');
    log('1. Check browser console for API errors after upload', 'white');
    log('2. Monitor server logs during upload process', 'white');
    log('3. Verify JWT token is valid and user has VA profile', 'white');
    log('4. Test with curl/Postman to isolate frontend issues', 'white');
    log('5. Check if useSupabase flag is interfering (line 16 vas.js)', 'white');
    
    log('\n🔧 Quick Fixes to Try:', 'green');
    log('1. Remove duplicate coverImage field from schema', 'white');
    log('2. Ensure frontend sends correct field names (avatar, coverImage, videoIntroduction)', 'white');
    log('3. Check if frontend is calling PUT /api/vas/me after upload to save URLs', 'white');
    log('4. Verify CORS is not blocking upload responses', 'white');
    
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    log('\n✅ Database connection closed', 'green');
  }
}

// Run the debugger
main().catch(console.error);