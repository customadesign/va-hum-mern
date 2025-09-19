const { createClient } = require('@supabase/supabase-js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Load environment variables
require('dotenv').config();

// Import models
const User = require('./backend/models/User');
const VA = require('./backend/models/VA');
const Business = require('./backend/models/Business');

// Import Supabase utilities
const { 
  uploadToSupabaseEnhanced, 
  deleteFromSupabaseEnhanced,
  checkStorageHealth,
  BUCKET_CONFIG 
} = require('./backend/utils/supabaseStorage');

// Media Migration to Supabase Script
class MediaMigrationToSupabase {
  constructor() {
    this.supabaseClient = null;
    this.migrationResults = {
      connection: null,
      discovery: {
        totalFiles: 0,
        localFiles: 0,
        externalFiles: 0,
        alreadyMigrated: 0,
        brokenLinks: 0
      },
      migration: {
        attempted: 0,
        successful: 0,
        failed: 0,
        skipped: 0
      },
      validation: {
        preValidation: 0,
        postValidation: 0,
        consistencyChecks: 0
      },
      performance: {
        totalTime: 0,
        averageUploadTime: 0,
        largestFile: null,
        smallestFile: null
      },
      errors: []
    };
    
    this.migrationQueue = [];
    this.migrationLog = [];
    this.backupData = {};
  }

  async initialize() {
    try {
      console.log('🔗 Initializing Media Migration to Supabase...');
      
      // Initialize Supabase client
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials not configured');
      }
      
      this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      // Initialize MongoDB
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
      
      console.log('✅ Migration environment initialized successfully');
      this.migrationResults.connection = 'SUCCESS';
      
      return true;
    } catch (error) {
      console.error('❌ Migration initialization failed:', error.message);
      this.migrationResults.connection = 'FAILED: ' + error.message;
      this.migrationResults.errors.push(`Initialization: ${error.message}`);
      return false;
    }
  }

  async discoverMediaFiles() {
    console.log('\n🔍 Discovering Media Files for Migration...');
    
    try {
      const startTime = Date.now();
      
      // Discover VA media files
      console.log('📊 Analyzing VA media files...');
      const vaMedia = await this.discoverVAMedia();
      
      // Discover Business media files
      console.log('📊 Analyzing Business media files...');
      const businessMedia = await this.discoverBusinessMedia();
      
      // Discover User media files
      console.log('📊 Analyzing User media files...');
      const userMedia = await this.discoverUserMedia();
      
      // Combine all discovered media
      this.migrationQueue = [
        ...vaMedia,
        ...businessMedia,
        ...userMedia
      ];
      
      // Update discovery results
      this.migrationResults.discovery.totalFiles = this.migrationQueue.length;
      this.migrationResults.discovery.localFiles = this.migrationQueue.filter(item => item.type === 'local').length;
      this.migrationResults.discovery.externalFiles = this.migrationQueue.filter(item => item.type === 'external').length;
      this.migrationResults.discovery.alreadyMigrated = this.migrationQueue.filter(item => item.type === 'supabase').length;
      this.migrationResults.discovery.brokenLinks = this.migrationQueue.filter(item => item.type === 'broken').length;
      
      const discoveryTime = Date.now() - startTime;
      
      console.log('\n📋 Discovery Summary:');
      console.log(`  Total Files Found: ${this.migrationResults.discovery.totalFiles}`);
      console.log(`  Local Files: ${this.migrationResults.discovery.localFiles}`);
      console.log(`  External Files: ${this.migrationResults.discovery.externalFiles}`);
      console.log(`  Already Migrated: ${this.migrationResults.discovery.alreadyMigrated}`);
      console.log(`  Broken Links: ${this.migrationResults.discovery.brokenLinks}`);
      console.log(`  Discovery Time: ${discoveryTime}ms`);
      
      // Save discovery results for backup
      this.saveDiscoveryBackup();
      
      return this.migrationQueue;
      
    } catch (error) {
      console.error('❌ Media discovery failed:', error.message);
      this.migrationResults.errors.push(`Discovery: ${error.message}`);
      return [];
    }
  }

  async discoverVAMedia() {
    const vaMediaItems = [];
    
    const vas = await VA.find({
      $or: [
        { avatar: { $exists: true, $ne: null } },
        { coverImage: { $exists: true, $ne: null } },
        { videoIntroduction: { $exists: true, $ne: null } }
      ]
    }).select('_id name avatar coverImage videoIntroduction user');
    
    for (const va of vas) {
      if (va.avatar) {
        vaMediaItems.push({
          id: va._id,
          entityType: 'VA',
          entityName: va.name,
          userId: va.user,
          fieldName: 'avatar',
          currentUrl: va.avatar,
          type: this.categorizeUrl(va.avatar),
          targetBucket: 'profile-images',
          targetFolder: 'avatars',
          mediaType: 'image'
        });
      }
      
      if (va.coverImage) {
        vaMediaItems.push({
          id: va._id,
          entityType: 'VA',
          entityName: va.name,
          userId: va.user,
          fieldName: 'coverImage',
          currentUrl: va.coverImage,
          type: this.categorizeUrl(va.coverImage),
          targetBucket: 'profile-images',
          targetFolder: 'covers',
          mediaType: 'image'
        });
      }
      
      if (va.videoIntroduction) {
        vaMediaItems.push({
          id: va._id,
          entityType: 'VA',
          entityName: va.name,
          userId: va.user,
          fieldName: 'videoIntroduction',
          currentUrl: va.videoIntroduction,
          type: this.categorizeUrl(va.videoIntroduction),
          targetBucket: 'va-videos',
          targetFolder: 'introductions',
          mediaType: 'video'
        });
      }
    }
    
    console.log(`  📊 VA Media: ${vaMediaItems.length} items found`);
    return vaMediaItems;
  }

  async discoverBusinessMedia() {
    const businessMediaItems = [];
    
    const businesses = await Business.find({
      avatar: { $exists: true, $ne: null }
    }).select('_id company avatar user');
    
    for (const business of businesses) {
      if (business.avatar) {
        businessMediaItems.push({
          id: business._id,
          entityType: 'Business',
          entityName: business.company,
          userId: business.user,
          fieldName: 'avatar',
          currentUrl: business.avatar,
          type: this.categorizeUrl(business.avatar),
          targetBucket: 'business-assets',
          targetFolder: 'logos',
          mediaType: 'image'
        });
      }
    }
    
    console.log(`  📊 Business Media: ${businessMediaItems.length} items found`);
    return businessMediaItems;
  }

  async discoverUserMedia() {
    const userMediaItems = [];
    
    const users = await User.find({
      $or: [
        { avatar: { $exists: true, $ne: null } },
        { coverImage: { $exists: true, $ne: null } }
      ]
    }).select('_id email avatar coverImage admin');
    
    for (const user of users) {
      if (user.avatar) {
        userMediaItems.push({
          id: user._id,
          entityType: 'User',
          entityName: user.email,
          userId: user._id,
          fieldName: 'avatar',
          currentUrl: user.avatar,
          type: this.categorizeUrl(user.avatar),
          targetBucket: 'profile-images',
          targetFolder: user.admin ? 'admin-avatars' : 'avatars',
          mediaType: 'image'
        });
      }
      
      if (user.coverImage) {
        userMediaItems.push({
          id: user._id,
          entityType: 'User',
          entityName: user.email,
          userId: user._id,
          fieldName: 'coverImage',
          currentUrl: user.coverImage,
          type: this.categorizeUrl(user.coverImage),
          targetBucket: 'profile-images',
          targetFolder: 'covers',
          mediaType: 'image'
        });
      }
    }
    
    console.log(`  📊 User Media: ${userMediaItems.length} items found`);
    return userMediaItems;
  }

  categorizeUrl(url) {
    if (!url) return 'broken';
    
    if (url.includes('supabase')) {
      return 'supabase';
    } else if (url.includes('/uploads/') || url.startsWith('/')) {
      return 'local';
    } else if (url.startsWith('http')) {
      return 'external';
    } else {
      return 'broken';
    }
  }

  async migrateMediaFiles(dryRun = false) {
    console.log(`\n📦 ${dryRun ? 'DRY RUN: Simulating' : 'Starting'} Media Migration...`);
    
    try {
      const startTime = Date.now();
      
      // Filter files that need migration
      const filesToMigrate = this.migrationQueue.filter(item => 
        item.type === 'local' || item.type === 'external'
      );
      
      console.log(`📋 Migration Plan: ${filesToMigrate.length} files need migration`);
      
      if (dryRun) {
        console.log('\n🔍 DRY RUN ANALYSIS:');
        this.analyzeMigrationPlan(filesToMigrate);
        return { dryRun: true, plan: filesToMigrate };
      }
      
      // Perform actual migration
      let migrationProgress = 0;
      
      for (const item of filesToMigrate) {
        migrationProgress++;
        console.log(`\n📤 Migrating ${migrationProgress}/${filesToMigrate.length}: ${item.entityType} ${item.fieldName}`);
        
        try {
          const migrationResult = await this.migrateSingleFile(item);
          
          if (migrationResult.success) {
            // Update database with new URL
            await this.updateDatabaseRecord(item, migrationResult.newUrl);
            
            this.migrationResults.migration.successful++;
            this.migrationLog.push({
              ...item,
              newUrl: migrationResult.newUrl,
              status: 'SUCCESS',
              timestamp: new Date().toISOString()
            });
            
            console.log(`  ✅ Migration successful: ${item.currentUrl} → ${migrationResult.newUrl}`);
            
          } else {
            this.migrationResults.migration.failed++;
            this.migrationLog.push({
              ...item,
              status: 'FAILED',
              error: migrationResult.error,
              timestamp: new Date().toISOString()
            });
            
            console.log(`  ❌ Migration failed: ${migrationResult.error}`);
          }
          
        } catch (error) {
          this.migrationResults.migration.failed++;
          console.log(`  ❌ Migration error: ${error.message}`);
          
          this.migrationLog.push({
            ...item,
            status: 'ERROR',
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
        
        this.migrationResults.migration.attempted++;
        
        // Progress indicator
        const progressPercent = ((migrationProgress / filesToMigrate.length) * 100).toFixed(1);
        console.log(`📊 Progress: ${progressPercent}% (${migrationProgress}/${filesToMigrate.length})`);
      }
      
      const totalTime = Date.now() - startTime;
      this.migrationResults.performance.totalTime = totalTime;
      
      console.log('\n📋 Migration Summary:');
      console.log(`  Files Attempted: ${this.migrationResults.migration.attempted}`);
      console.log(`  Successful: ${this.migrationResults.migration.successful}`);
      console.log(`  Failed: ${this.migrationResults.migration.failed}`);
      console.log(`  Total Time: ${(totalTime / 1000).toFixed(2)} seconds`);
      
      // Save migration log
      this.saveMigrationLog();
      
      return {
        success: true,
        results: this.migrationResults,
        log: this.migrationLog
      };
      
    } catch (error) {
      console.error('❌ Media migration failed:', error.message);
      this.migrationResults.errors.push(`Migration: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  analyzeMigrationPlan(filesToMigrate) {
    const analysis = {
      byEntityType: {},
      byMediaType: {},
      byTargetBucket: {},
      estimatedSize: 0,
      estimatedTime: 0
    };
    
    filesToMigrate.forEach(item => {
      // Count by entity type
      analysis.byEntityType[item.entityType] = (analysis.byEntityType[item.entityType] || 0) + 1;
      
      // Count by media type
      analysis.byMediaType[item.mediaType] = (analysis.byMediaType[item.mediaType] || 0) + 1;
      
      // Count by target bucket
      analysis.byTargetBucket[item.targetBucket] = (analysis.byTargetBucket[item.targetBucket] || 0) + 1;
    });
    
    // Estimate migration time (rough estimate)
    analysis.estimatedTime = filesToMigrate.length * 2000; // 2 seconds per file average
    
    console.log('📊 Migration Analysis:');
    console.log(`  By Entity Type:`, analysis.byEntityType);
    console.log(`  By Media Type:`, analysis.byMediaType);
    console.log(`  By Target Bucket:`, analysis.byTargetBucket);
    console.log(`  Estimated Time: ${(analysis.estimatedTime / 1000 / 60).toFixed(1)} minutes`);
    
    return analysis;
  }

  async migrateSingleFile(item) {
    try {
      const startTime = Date.now();
      
      // Download file if external or copy if local
      let fileBuffer;
      let originalFilename;
      let mimeType;
      
      if (item.type === 'local') {
        // Handle local file
        const localPath = path.join(__dirname, 'backend', item.currentUrl);
        
        if (!fs.existsSync(localPath)) {
          throw new Error(`Local file not found: ${localPath}`);
        }
        
        fileBuffer = fs.readFileSync(localPath);
        originalFilename = path.basename(localPath);
        mimeType = this.getMimeTypeFromExtension(path.extname(localPath));
        
      } else if (item.type === 'external') {
        // Download external file
        const downloadResult = await this.downloadExternalFile(item.currentUrl);
        
        if (!downloadResult.success) {
          throw new Error(`Failed to download external file: ${downloadResult.error}`);
        }
        
        fileBuffer = downloadResult.buffer;
        originalFilename = downloadResult.filename;
        mimeType = downloadResult.mimeType;
        
      } else {
        throw new Error(`Cannot migrate file type: ${item.type}`);
      }
      
      // Validate file size
      const maxSize = BUCKET_CONFIG[item.targetBucket]?.maxSize || 500 * 1024 * 1024;
      if (fileBuffer.length > maxSize) {
        throw new Error(`File too large: ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB exceeds ${(maxSize / 1024 / 1024).toFixed(2)}MB limit`);
      }
      
      // Create file object for upload
      const fileObject = {
        originalname: originalFilename,
        buffer: fileBuffer,
        mimetype: mimeType,
        size: fileBuffer.length
      };
      
      // Upload to Supabase
      const uploadResult = await uploadToSupabaseEnhanced(
        fileObject,
        item.targetBucket,
        item.targetFolder,
        {
          metadata: {
            originalUrl: item.currentUrl,
            entityType: item.entityType,
            entityId: item.id.toString(),
            fieldName: item.fieldName,
            migratedAt: new Date().toISOString(),
            migrationSource: item.type
          }
        }
      );
      
      const migrationTime = Date.now() - startTime;
      
      console.log(`  ✅ Upload successful (${migrationTime}ms): ${uploadResult.url}`);
      
      return {
        success: true,
        newUrl: uploadResult.url,
        uploadResult,
        migrationTime,
        originalSize: fileBuffer.length
      };
      
    } catch (error) {
      console.log(`  ❌ Migration failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async downloadExternalFile(url) {
    try {
      console.log(`  📥 Downloading external file: ${url.substring(0, 50)}...`);
      
      return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        
        const request = client.get(url, (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
            return;
          }
          
          const chunks = [];
          
          response.on('data', chunk => {
            chunks.push(chunk);
          });
          
          response.on('end', () => {
            const buffer = Buffer.concat(chunks);
            const contentType = response.headers['content-type'] || 'application/octet-stream';
            const filename = this.extractFilenameFromUrl(url) || 'downloaded-file';
            
            resolve({
              success: true,
              buffer,
              filename,
              mimeType: contentType
            });
          });
          
        }).on('error', (error) => {
          reject(new Error(`Download failed: ${error.message}`));
        });
        
        // Set timeout
        request.setTimeout(30000, () => {
          request.destroy();
          reject(new Error('Download timeout'));
        });
      });
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  extractFilenameFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return path.basename(pathname) || 'file';
    } catch (error) {
      return 'file';
    }
  }

  getMimeTypeFromExtension(ext) {
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/avi',
      '.webm': 'video/webm',
      '.pdf': 'application/pdf'
    };
    
    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
  }

  async updateDatabaseRecord(item, newUrl) {
    try {
      let updateResult;
      
      if (item.entityType === 'VA') {
        updateResult = await VA.findByIdAndUpdate(
          item.id,
          { [item.fieldName]: newUrl },
          { new: true }
        );
      } else if (item.entityType === 'Business') {
        updateResult = await Business.findByIdAndUpdate(
          item.id,
          { [item.fieldName]: newUrl },
          { new: true }
        );
      } else if (item.entityType === 'User') {
        updateResult = await User.findByIdAndUpdate(
          item.id,
          { [item.fieldName]: newUrl },
          { new: true }
        );
      }
      
      if (!updateResult) {
        throw new Error(`Failed to update ${item.entityType} record`);
      }
      
      console.log(`  💾 Database updated: ${item.entityType} ${item.fieldName}`);
      return true;
      
    } catch (error) {
      console.log(`  ❌ Database update failed: ${error.message}`);
      throw error;
    }
  }

  async validateMigration() {
    console.log('\n✅ Validating Migration Results...');
    
    try {
      const successfulMigrations = this.migrationLog.filter(log => log.status === 'SUCCESS');
      let validationPassed = 0;
      let validationFailed = 0;
      
      for (const migration of successfulMigrations.slice(0, 10)) { // Validate first 10
        try {
          console.log(`🔍 Validating ${migration.entityType} ${migration.fieldName}...`);
          
          // Check if database record was updated
          let record;
          if (migration.entityType === 'VA') {
            record = await VA.findById(migration.id).select(migration.fieldName);
          } else if (migration.entityType === 'Business') {
            record = await Business.findById(migration.id).select(migration.fieldName);
          } else if (migration.entityType === 'User') {
            record = await User.findById(migration.id).select(migration.fieldName);
          }
          
          if (record && record[migration.fieldName] === migration.newUrl) {
            console.log(`  ✅ Database record validated`);
            
            // Check if file is accessible in Supabase
            const accessibility = await this.checkFileAccessibility(migration.newUrl);
            if (accessibility) {
              validationPassed++;
              console.log(`  ✅ File accessibility validated`);
            } else {
              validationFailed++;
              console.log(`  ❌ File not accessible in Supabase`);
            }
            
          } else {
            validationFailed++;
            console.log(`  ❌ Database record not updated correctly`);
          }
          
        } catch (error) {
          validationFailed++;
          console.log(`  ❌ Validation error: ${error.message}`);
        }
      }
      
      this.migrationResults.validation.preValidation = successfulMigrations.length;
      this.migrationResults.validation.postValidation = validationPassed;
      this.migrationResults.validation.consistencyChecks = validationPassed + validationFailed;
      
      const validationRate = validationPassed / (validationPassed + validationFailed) * 100;
      console.log(`📊 Validation Summary: ${validationPassed}/${validationPassed + validationFailed} passed (${validationRate.toFixed(1)}%)`);
      
      return {
        passed: validationPassed,
        failed: validationFailed,
        rate: validationRate
      };
      
    } catch (error) {
      console.error('❌ Migration validation failed:', error.message);
      this.migrationResults.errors.push(`Validation: ${error.message}`);
      return { passed: 0, failed: 1, rate: 0 };
    }
  }

  async checkFileAccessibility(url) {
    try {
      // Extract bucket and file path from Supabase URL
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const publicIndex = pathParts.indexOf('public');
      
      if (publicIndex === -1) return false;
      
      const bucket = pathParts[publicIndex + 1];
      const filePath = pathParts.slice(publicIndex + 2).join('/');
      
      // Try to get file info
      const { data, error } = await this.supabaseClient.storage
        .from(bucket)
        .list(path.dirname(filePath), {
          search: path.basename(filePath)
        });
      
      return !error && data && data.length > 0;
      
    } catch (error) {
      return false;
    }
  }

  saveDiscoveryBackup() {
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        discoveryResults: this.migrationResults.discovery,
        migrationQueue: this.migrationQueue.map(item => ({
          ...item,
          // Don't store the full object to save space
          id: item.id.toString()
        }))
      };
      
      const backupPath = path.join(__dirname, 'media-migration-discovery-backup.json');
      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
      
      console.log(`💾 Discovery backup saved: ${backupPath}`);
      
    } catch (error) {
      console.error('❌ Failed to save discovery backup:', error.message);
    }
  }

  saveMigrationLog() {
    try {
      const logData = {
        timestamp: new Date().toISOString(),
        migrationResults: this.migrationResults,
        migrationLog: this.migrationLog,
        summary: {
          totalAttempted: this.migrationResults.migration.attempted,
          successful: this.migrationResults.migration.successful,
          failed: this.migrationResults.migration.failed,
          successRate: this.migrationResults.migration.attempted > 0 ? 
            (this.migrationResults.migration.successful / this.migrationResults.migration.attempted * 100).toFixed(1) : 0
        }
      };
      
      const logPath = path.join(__dirname, 'media-migration-log.json');
      fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
      
      console.log(`📝 Migration log saved: ${logPath}`);
      
      // Also save a CSV report for easy analysis
      this.saveMigrationCSV();
      
    } catch (error) {
      console.error('❌ Failed to save migration log:', error.message);
    }
  }

  saveMigrationCSV() {
    try {
      const csvHeaders = 'Entity Type,Entity Name,Field Name,Original URL,New URL,Status,Error,Timestamp\n';
      const csvRows = this.migrationLog.map(log => 
        `"${log.entityType}","${log.entityName}","${log.fieldName}","${log.currentUrl}","${log.newUrl || ''}","${log.status}","${log.error || ''}","${log.timestamp}"`
      ).join('\n');
      
      const csvContent = csvHeaders + csvRows;
      const csvPath = path.join(__dirname, 'media-migration-report.csv');
      fs.writeFileSync(csvPath, csvContent);
      
      console.log(`📊 Migration CSV report saved: ${csvPath}`);
      
    } catch (error) {
      console.error('❌ Failed to save CSV report:', error.message);
    }
  }

  async rollbackMigration(migrationLogPath) {
    console.log('\n🔄 Rolling Back Migration...');
    
    try {
      if (!fs.existsSync(migrationLogPath)) {
        throw new Error(`Migration log file not found: ${migrationLogPath}`);
      }
      
      const logData = JSON.parse(fs.readFileSync(migrationLogPath, 'utf8'));
      const successfulMigrations = logData.migrationLog.filter(log => log.status === 'SUCCESS');
      
      console.log(`🔄 Rolling back ${successfulMigrations.length} successful migrations...`);
      
      let rollbackCount = 0;
      
      for (const migration of successfulMigrations) {
        try {
          // Restore original URL in database
          if (migration.entityType === 'VA') {
            await VA.findByIdAndUpdate(migration.id, { [migration.fieldName]: migration.currentUrl });
          } else if (migration.entityType === 'Business') {
            await Business.findByIdAndUpdate(migration.id, { [migration.fieldName]: migration.currentUrl });
          } else if (migration.entityType === 'User') {
            await User.findByIdAndUpdate(migration.id, { [migration.fieldName]: migration.currentUrl });
          }
          
          // Delete file from Supabase
          await deleteFromSupabaseEnhanced(migration.newUrl);
          
          rollbackCount++;
          console.log(`  ✅ Rolled back: ${migration.entityType} ${migration.fieldName}`);
          
        } catch (error) {
          console.log(`  ❌ Rollback failed for ${migration.entityType} ${migration.fieldName}: ${error.message}`);
        }
      }
      
      console.log(`📊 Rollback Summary: ${rollbackCount}/${successfulMigrations.length} items rolled back`);
      
      return {
        success: true,
        rolledBack: rollbackCount,
        total: successfulMigrations.length
      };
      
    } catch (error) {
      console.error('❌ Migration rollback failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async runMigration(options = {}) {
    console.log('🚀 Starting Media Migration to Supabase...\n');
    
    const { dryRun = false, validate = true } = options;
    
    const initialized = await this.initialize();
    if (!initialized) {
      console.log('❌ Cannot proceed without proper initialization');
      return this.generateReport();
    }

    // Step 1: Discover media files
    await this.discoverMediaFiles();
    
    // Step 2: Migrate files (or dry run)
    const migrationResult = await this.migrateMediaFiles(dryRun);
    
    // Step 3: Validate migration (if not dry run)
    if (!dryRun && validate && migrationResult.success) {
      await this.validateMigration();
    }

    return this.generateReport();
  }

  generateReport() {
    console.log('\n📊 MEDIA MIGRATION TO SUPABASE REPORT');
    console.log('==========================================');
    
    const report = {
      timestamp: new Date().toISOString(),
      connection: this.migrationResults.connection,
      discovery: this.migrationResults.discovery,
      migration: this.migrationResults.migration,
      validation: this.migrationResults.validation,
      performance: this.migrationResults.performance,
      errors: this.migrationResults.errors,
      summary: {
        migrationSuccessRate: this.migrationResults.migration.attempted > 0 ? 
          (this.migrationResults.migration.successful / this.migrationResults.migration.attempted * 100).toFixed(1) : 0,
        validationSuccessRate: this.migrationResults.validation.consistencyChecks > 0 ?
          (this.migrationResults.validation.postValidation / this.migrationResults.validation.consistencyChecks * 100).toFixed(1) : 0,
        overallStatus: this.migrationResults.migration.failed === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS'
      }
    };

    console.log('📋 MIGRATION SUMMARY:');
    console.log(`  Files Discovered: ${report.discovery.totalFiles}`);
    console.log(`  Files Migrated: ${report.migration.successful}/${report.migration.attempted}`);
    console.log(`  Migration Success Rate: ${report.summary.migrationSuccessRate}%`);
    console.log(`  Validation Success Rate: ${report.summary.validationSuccessRate}%`);
    console.log(`  Overall Status: ${report.summary.overallStatus}`);

    if (report.errors.length > 0) {
      console.log('\n🔍 ERROR DETAILS:');
      report.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log('\n💡 POST-MIGRATION RECOMMENDATIONS:');
    
    if (report.migration.failed > 0) {
      console.log('  • Review and retry failed migrations');
    }
    
    if (report.discovery.brokenLinks > 0) {
      console.log('  • Clean up broken media links in database');
    }
    
    console.log('  • Set up automated cleanup of old local files');
    console.log('  • Configure monitoring for Supabase storage usage');
    console.log('  • Implement automated backup of critical media files');
    console.log('  • Set up CDN for improved media delivery performance');

    console.log('\n==========================================');
    
    return report;
  }

  async disconnect() {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
      }
    } catch (error) {
      console.error('❌ Error disconnecting:', error.message);
    }
  }
}

// Run media migration if this file is executed directly
if (require.main === module) {
  (async () => {
    const migrator = new MediaMigrationToSupabase();
    
    try {
      // Check command line arguments
      const args = process.argv.slice(2);
      const dryRun = args.includes('--dry-run');
      const skipValidation = args.includes('--skip-validation');
      const rollback = args.includes('--rollback');
      
      if (rollback) {
        const logPath = path.join(__dirname, 'media-migration-log.json');
        const rollbackResult = await migrator.rollbackMigration(logPath);
        console.log('🔄 Rollback completed:', rollbackResult);
      } else {
        const report = await migrator.runMigration({
          dryRun,
          validate: !skipValidation
        });
        
        // Save report to file
        const reportPath = path.join(__dirname, 'media-migration-report.json');
        require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n💾 Migration report saved to: ${reportPath}`);
      }
      
    } catch (error) {
      console.error('❌ Media migration failed:', error.message);
    } finally {
      await migrator.disconnect();
      process.exit(0);
    }
  })();
}

module.exports = MediaMigrationToSupabase;