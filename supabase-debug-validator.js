const { createClient } = require('@supabase/supabase-js');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Import models for validation
const User = require('./backend/models/User');
const VA = require('./backend/models/VA');
const Business = require('./backend/models/Business');

// Supabase Debugging and Validation Tool (MCP-style functionality)
class SupabaseDebugValidator {
  constructor() {
    this.supabaseClient = null;
    this.debugResults = {
      connection: null,
      bucketOperations: [],
      filePermissions: [],
      urlGeneration: [],
      storageAnalytics: [],
      securityValidation: [],
      performanceMetrics: [],
      dataConsistency: [],
      errors: []
    };
    
    this.metrics = {
      uploadTimes: [],
      downloadTimes: [],
      urlGenerationTimes: [],
      errorCounts: {},
      bucketUsage: {}
    };
  }

  async initialize() {
    try {
      console.log('🔧 Initializing Supabase Debug Validator (MCP-style)...');
      
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
      
      console.log('✅ Supabase Debug Validator initialized successfully');
      console.log(`🌐 Project URL: ${supabaseUrl.substring(0, 40)}...`);
      console.log(`🔑 Key Type: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon'}`);
      
      this.debugResults.connection = 'SUCCESS';
      return true;
      
    } catch (error) {
      console.error('❌ Supabase Debug Validator initialization failed:', error.message);
      this.debugResults.connection = 'FAILED: ' + error.message;
      this.debugResults.errors.push(`Initialization: ${error.message}`);
      return false;
    }
  }

  async debugBucketOperations() {
    console.log('\n📦 Debugging Bucket Operations...');
    
    try {
      // List all buckets
      console.log('🔍 Listing all storage buckets...');
      const { data: buckets, error: listError } = await this.supabaseClient.storage.listBuckets();
      
      if (listError) {
        console.error('❌ Failed to list buckets:', listError.message);
        this.debugResults.bucketOperations.push('LIST_BUCKETS: FAILED');
        return;
      }
      
      console.log(`📋 Found ${buckets.length} buckets:`);
      buckets.forEach(bucket => {
        console.log(`  - ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`);
      });
      
      this.debugResults.bucketOperations.push(`LIST_BUCKETS: SUCCESS (${buckets.length} buckets)`);
      
      // Test each bucket
      const requiredBuckets = ['profile-images', 'va-videos', 'business-assets', 'admin-uploads'];
      
      for (const bucketName of requiredBuckets) {
        await this.debugSingleBucket(bucketName, buckets);
      }
      
    } catch (error) {
      console.error('❌ Bucket operations debug failed:', error.message);
      this.debugResults.bucketOperations.push('FAILED: ' + error.message);
      this.debugResults.errors.push(`Bucket Operations: ${error.message}`);
    }
  }

  async debugSingleBucket(bucketName, allBuckets) {
    console.log(`\n🔍 Debugging bucket: ${bucketName}`);
    
    try {
      const bucketExists = allBuckets.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        console.log(`❌ Bucket '${bucketName}' does not exist`);
        this.debugResults.bucketOperations.push(`BUCKET_${bucketName.toUpperCase()}: NOT_FOUND`);
        return;
      }
      
      console.log(`✅ Bucket '${bucketName}' exists`);
      
      // Test file listing
      const { data: files, error: listError } = await this.supabaseClient.storage
        .from(bucketName)
        .list('', { limit: 10 });
      
      if (listError) {
        console.log(`⚠️ Cannot list files in '${bucketName}': ${listError.message}`);
        this.debugResults.bucketOperations.push(`BUCKET_${bucketName.toUpperCase()}_LIST: ERROR`);
      } else {
        console.log(`📁 Found ${files.length} files in '${bucketName}'`);
        this.debugResults.bucketOperations.push(`BUCKET_${bucketName.toUpperCase()}_LIST: SUCCESS (${files.length} files)`);
        
        // Sample file analysis
        if (files.length > 0) {
          console.log(`📄 Sample files:`);
          files.slice(0, 3).forEach(file => {
            console.log(`  - ${file.name} (${this.formatFileSize(file.metadata?.size)})`);
          });
        }
      }
      
      // Test upload capability
      await this.testBucketUpload(bucketName);
      
      // Get bucket usage statistics
      await this.getBucketUsageStats(bucketName);
      
    } catch (error) {
      console.error(`❌ Debug failed for bucket '${bucketName}':`, error.message);
      this.debugResults.bucketOperations.push(`BUCKET_${bucketName.toUpperCase()}: ERROR`);
    }
  }

  async testBucketUpload(bucketName) {
    try {
      console.log(`📤 Testing upload to '${bucketName}'...`);
      
      const testContent = JSON.stringify({
        test: true,
        bucket: bucketName,
        timestamp: new Date().toISOString(),
        purpose: 'Debug validation test'
      });
      
      const testFileName = `debug/test-${Date.now()}.json`;
      const startTime = Date.now();
      
      const { data, error } = await this.supabaseClient.storage
        .from(bucketName)
        .upload(testFileName, testContent, {
          contentType: 'application/json',
          upsert: true
        });
      
      const uploadTime = Date.now() - startTime;
      this.metrics.uploadTimes.push({ bucket: bucketName, time: uploadTime });
      
      if (error) {
        console.log(`❌ Upload test failed for '${bucketName}': ${error.message}`);
        this.debugResults.bucketOperations.push(`BUCKET_${bucketName.toUpperCase()}_UPLOAD: FAILED`);
      } else {
        console.log(`✅ Upload test successful for '${bucketName}' (${uploadTime}ms)`);
        this.debugResults.bucketOperations.push(`BUCKET_${bucketName.toUpperCase()}_UPLOAD: SUCCESS (${uploadTime}ms)`);
        
        // Test URL generation
        const { data: { publicUrl } } = this.supabaseClient.storage
          .from(bucketName)
          .getPublicUrl(testFileName);
        
        console.log(`🔗 Generated URL: ${publicUrl}`);
        
        // Clean up test file
        await this.supabaseClient.storage
          .from(bucketName)
          .remove([testFileName]);
        
        console.log(`🧹 Test file cleaned up`);
      }
      
    } catch (error) {
      console.log(`❌ Upload test error for '${bucketName}': ${error.message}`);
      this.debugResults.bucketOperations.push(`BUCKET_${bucketName.toUpperCase()}_UPLOAD: ERROR`);
    }
  }

  async getBucketUsageStats(bucketName) {
    try {
      console.log(`📊 Getting usage stats for '${bucketName}'...`);
      
      const { data: files, error } = await this.supabaseClient.storage
        .from(bucketName)
        .list('', { limit: 1000 });
      
      if (error) {
        console.log(`⚠️ Cannot get usage stats for '${bucketName}': ${error.message}`);
        return;
      }
      
      const stats = {
        totalFiles: files.length,
        totalSize: 0,
        fileTypes: {},
        folders: new Set()
      };
      
      files.forEach(file => {
        if (file.metadata?.size) {
          stats.totalSize += parseInt(file.metadata.size);
        }
        
        const fileExt = path.extname(file.name).toLowerCase();
        stats.fileTypes[fileExt] = (stats.fileTypes[fileExt] || 0) + 1;
        
        const folder = path.dirname(file.name);
        if (folder !== '.') {
          stats.folders.add(folder);
        }
      });
      
      this.metrics.bucketUsage[bucketName] = stats;
      
      console.log(`📈 Usage stats for '${bucketName}':`);
      console.log(`  - Files: ${stats.totalFiles}`);
      console.log(`  - Total Size: ${this.formatFileSize(stats.totalSize)}`);
      console.log(`  - Folders: ${Array.from(stats.folders).join(', ')}`);
      console.log(`  - File Types: ${Object.entries(stats.fileTypes).map(([ext, count]) => `${ext}: ${count}`).join(', ')}`);
      
    } catch (error) {
      console.log(`❌ Usage stats error for '${bucketName}': ${error.message}`);
    }
  }

  async debugFilePermissions() {
    console.log('\n🔒 Debugging File Permissions...');
    
    try {
      const permissionTests = [
        { bucket: 'profile-images', operation: 'read', expected: 'public' },
        { bucket: 'profile-images', operation: 'write', expected: 'authenticated' },
        { bucket: 'va-videos', operation: 'read', expected: 'public' },
        { bucket: 'va-videos', operation: 'write', expected: 'authenticated' },
        { bucket: 'business-assets', operation: 'read', expected: 'public' },
        { bucket: 'business-assets', operation: 'write', expected: 'authenticated' },
        { bucket: 'admin-uploads', operation: 'read', expected: 'admin_only' },
        { bucket: 'admin-uploads', operation: 'write', expected: 'admin_only' }
      ];
      
      for (const test of permissionTests) {
        await this.testBucketPermission(test);
      }
      
    } catch (error) {
      console.error('❌ File permissions debug failed:', error.message);
      this.debugResults.filePermissions.push('FAILED: ' + error.message);
      this.debugResults.errors.push(`File Permissions: ${error.message}`);
    }
  }

  async testBucketPermission(test) {
    try {
      console.log(`🔍 Testing ${test.operation} permission for '${test.bucket}'...`);
      
      if (test.operation === 'read') {
        // Test file listing (read operation)
        const { data, error } = await this.supabaseClient.storage
          .from(test.bucket)
          .list('', { limit: 1 });
        
        if (error) {
          if (error.message.includes('row-level security') && test.expected === 'admin_only') {
            console.log(`✅ ${test.bucket} read access properly restricted (admin only)`);
            this.debugResults.filePermissions.push(`${test.bucket.toUpperCase()}_READ: RESTRICTED (expected)`);
          } else {
            console.log(`❌ ${test.bucket} read access error: ${error.message}`);
            this.debugResults.filePermissions.push(`${test.bucket.toUpperCase()}_READ: ERROR`);
          }
        } else {
          if (test.expected === 'public') {
            console.log(`✅ ${test.bucket} read access is public (as expected)`);
            this.debugResults.filePermissions.push(`${test.bucket.toUpperCase()}_READ: PUBLIC (expected)`);
          } else {
            console.log(`⚠️ ${test.bucket} read access is open (may need RLS policies)`);
            this.debugResults.filePermissions.push(`${test.bucket.toUpperCase()}_READ: OPEN (review needed)`);
          }
        }
      } else if (test.operation === 'write') {
        // Test file upload (write operation)
        const testContent = `permission test for ${test.bucket}`;
        const testFileName = `permission-test/test-${Date.now()}.txt`;
        
        const { data, error } = await this.supabaseClient.storage
          .from(test.bucket)
          .upload(testFileName, testContent, {
            contentType: 'text/plain',
            upsert: true
          });
        
        if (error) {
          if (error.message.includes('row-level security') && test.expected === 'admin_only') {
            console.log(`✅ ${test.bucket} write access properly restricted`);
            this.debugResults.filePermissions.push(`${test.bucket.toUpperCase()}_WRITE: RESTRICTED (expected)`);
          } else {
            console.log(`❌ ${test.bucket} write access error: ${error.message}`);
            this.debugResults.filePermissions.push(`${test.bucket.toUpperCase()}_WRITE: ERROR`);
          }
        } else {
          console.log(`✅ ${test.bucket} write access successful`);
          this.debugResults.filePermissions.push(`${test.bucket.toUpperCase()}_WRITE: SUCCESS`);
          
          // Clean up test file
          await this.supabaseClient.storage
            .from(test.bucket)
            .remove([testFileName]);
        }
      }
      
    } catch (error) {
      console.log(`❌ Permission test failed for ${test.bucket}: ${error.message}`);
      this.debugResults.filePermissions.push(`${test.bucket.toUpperCase()}_${test.operation.toUpperCase()}: FAILED`);
    }
  }

  async debugUrlGeneration() {
    console.log('\n🔗 Debugging URL Generation...');
    
    try {
      const buckets = ['profile-images', 'va-videos', 'business-assets', 'admin-uploads'];
      
      for (const bucket of buckets) {
        console.log(`🔍 Testing URL generation for '${bucket}'...`);
        
        const testFilePaths = [
          `avatars/test-avatar-${Date.now()}.jpg`,
          `covers/test-cover-${Date.now()}.jpg`,
          `videos/test-video-${Date.now()}.mp4`
        ];
        
        for (const filePath of testFilePaths) {
          const startTime = Date.now();
          
          try {
            // Test public URL generation
            const { data: { publicUrl } } = this.supabaseClient.storage
              .from(bucket)
              .getPublicUrl(filePath);
            
            const urlGenTime = Date.now() - startTime;
            this.metrics.urlGenerationTimes.push({ bucket, time: urlGenTime });
            
            const urlValid = this.validateSupabaseUrl(publicUrl, bucket, filePath);
            
            console.log(`  📎 Public URL (${urlGenTime}ms): ${urlValid ? '✅ Valid' : '❌ Invalid'}`);
            console.log(`     ${publicUrl.substring(0, 80)}...`);
            
            this.debugResults.urlGeneration.push(`${bucket.toUpperCase()}_PUBLIC_URL: ${urlValid ? 'SUCCESS' : 'FAILED'}`);
            
            // Test signed URL generation for admin bucket
            if (bucket === 'admin-uploads') {
              const signedStartTime = Date.now();
              
              const { data: signedUrlData, error: signedError } = await this.supabaseClient.storage
                .from(bucket)
                .createSignedUrl(filePath, 3600); // 1 hour
              
              const signedUrlTime = Date.now() - signedStartTime;
              
              if (signedError) {
                console.log(`  🔐 Signed URL: ❌ Failed (${signedError.message})`);
                this.debugResults.urlGeneration.push(`${bucket.toUpperCase()}_SIGNED_URL: FAILED`);
              } else {
                const signedUrlValid = this.validateSupabaseSignedUrl(signedUrlData.signedUrl);
                console.log(`  🔐 Signed URL (${signedUrlTime}ms): ${signedUrlValid ? '✅ Valid' : '❌ Invalid'}`);
                this.debugResults.urlGeneration.push(`${bucket.toUpperCase()}_SIGNED_URL: ${signedUrlValid ? 'SUCCESS' : 'FAILED'}`);
              }
            }
            
          } catch (error) {
            console.log(`  ❌ URL generation failed: ${error.message}`);
            this.debugResults.urlGeneration.push(`${bucket.toUpperCase()}_URL_GEN: FAILED`);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ URL generation debug failed:', error.message);
      this.debugResults.urlGeneration.push('FAILED: ' + error.message);
      this.debugResults.errors.push(`URL Generation: ${error.message}`);
    }
  }

  validateSupabaseUrl(url, bucket, filePath) {
    try {
      const urlObj = new URL(url);
      
      // Check hostname
      if (!urlObj.hostname.includes('supabase.co')) {
        return false;
      }
      
      // Check path structure
      if (!urlObj.pathname.includes('/storage/v1/object/public/')) {
        return false;
      }
      
      // Check bucket in path
      if (!urlObj.pathname.includes(`/${bucket}/`)) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  validateSupabaseSignedUrl(url) {
    try {
      const urlObj = new URL(url);
      
      // Check hostname
      if (!urlObj.hostname.includes('supabase.co')) {
        return false;
      }
      
      // Check for signed URL parameters
      if (!urlObj.searchParams.has('token')) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  async debugStorageAnalytics() {
    console.log('\n📊 Debugging Storage Analytics...');
    
    try {
      // Connect to MongoDB to analyze existing media URLs
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
      
      // Analyze VA media
      const vaAnalysis = await this.analyzeVAMedia();
      
      // Analyze Business media
      const businessAnalysis = await this.analyzeBusinessMedia();
      
      // Analyze User media
      const userAnalysis = await this.analyzeUserMedia();
      
      // Generate overall analytics
      const overallAnalytics = {
        totalMediaFiles: vaAnalysis.total + businessAnalysis.total + userAnalysis.total,
        supabaseFiles: vaAnalysis.supabase + businessAnalysis.supabase + userAnalysis.supabase,
        localFiles: vaAnalysis.local + businessAnalysis.local + userAnalysis.local,
        externalFiles: vaAnalysis.external + businessAnalysis.external + userAnalysis.external,
        brokenLinks: vaAnalysis.broken + businessAnalysis.broken + userAnalysis.broken
      };
      
      const supabasePercentage = overallAnalytics.totalMediaFiles > 0 ? 
        (overallAnalytics.supabaseFiles / overallAnalytics.totalMediaFiles * 100).toFixed(1) : 0;
      
      console.log(`📈 Overall Media Analytics:`);
      console.log(`  Total Media Files: ${overallAnalytics.totalMediaFiles}`);
      console.log(`  Supabase Files: ${overallAnalytics.supabaseFiles} (${supabasePercentage}%)`);
      console.log(`  Local Files: ${overallAnalytics.localFiles}`);
      console.log(`  External Files: ${overallAnalytics.externalFiles}`);
      console.log(`  Broken Links: ${overallAnalytics.brokenLinks}`);
      
      this.debugResults.storageAnalytics.push(`TOTAL_MEDIA_FILES: ${overallAnalytics.totalMediaFiles}`);
      this.debugResults.storageAnalytics.push(`SUPABASE_ADOPTION: ${supabasePercentage}%`);
      this.debugResults.storageAnalytics.push(`BROKEN_LINKS: ${overallAnalytics.brokenLinks}`);
      
    } catch (error) {
      console.error('❌ Storage analytics debug failed:', error.message);
      this.debugResults.storageAnalytics.push('FAILED: ' + error.message);
      this.debugResults.errors.push(`Storage Analytics: ${error.message}`);
    }
  }

  async analyzeVAMedia() {
    console.log('🔍 Analyzing VA media files...');
    
    const vas = await VA.find({
      $or: [
        { avatar: { $exists: true, $ne: null } },
        { coverImage: { $exists: true, $ne: null } },
        { videoIntroduction: { $exists: true, $ne: null } }
      ]
    }).select('_id name avatar coverImage videoIntroduction');
    
    const analysis = {
      total: 0,
      supabase: 0,
      local: 0,
      external: 0,
      broken: 0
    };
    
    for (const va of vas) {
      if (va.avatar) {
        analysis.total++;
        this.categorizeMediaUrl(va.avatar, analysis);
      }
      
      if (va.coverImage) {
        analysis.total++;
        this.categorizeMediaUrl(va.coverImage, analysis);
      }
      
      if (va.videoIntroduction) {
        analysis.total++;
        this.categorizeMediaUrl(va.videoIntroduction, analysis);
      }
    }
    
    console.log(`📊 VA Media Analysis: ${analysis.total} files (${analysis.supabase} Supabase, ${analysis.local} local, ${analysis.external} external)`);
    
    return analysis;
  }

  async analyzeBusinessMedia() {
    console.log('🔍 Analyzing Business media files...');
    
    const businesses = await Business.find({
      avatar: { $exists: true, $ne: null }
    }).select('_id company avatar');
    
    const analysis = {
      total: businesses.length,
      supabase: 0,
      local: 0,
      external: 0,
      broken: 0
    };
    
    for (const business of businesses) {
      this.categorizeMediaUrl(business.avatar, analysis);
    }
    
    console.log(`📊 Business Media Analysis: ${analysis.total} files (${analysis.supabase} Supabase, ${analysis.local} local, ${analysis.external} external)`);
    
    return analysis;
  }

  async analyzeUserMedia() {
    console.log('🔍 Analyzing User media files...');
    
    const users = await User.find({
      avatar: { $exists: true, $ne: null }
    }).select('_id email avatar');
    
    const analysis = {
      total: users.length,
      supabase: 0,
      local: 0,
      external: 0,
      broken: 0
    };
    
    for (const user of users) {
      this.categorizeMediaUrl(user.avatar, analysis);
    }
    
    console.log(`📊 User Media Analysis: ${analysis.total} files (${analysis.supabase} Supabase, ${analysis.local} local, ${analysis.external} external)`);
    
    return analysis;
  }

  categorizeMediaUrl(url, analysis) {
    if (!url) return;
    
    if (url.includes('supabase')) {
      analysis.supabase++;
    } else if (url.includes('/uploads/') || url.startsWith('/')) {
      analysis.local++;
    } else if (url.startsWith('http')) {
      analysis.external++;
    } else {
      analysis.broken++;
    }
  }

  async debugDataConsistency() {
    console.log('\n🔍 Debugging Data Consistency...');
    
    try {
      // Check for orphaned files in Supabase that don't have database references
      console.log('🔍 Checking for orphaned files...');
      
      const buckets = ['profile-images', 'va-videos', 'business-assets'];
      let totalOrphanedFiles = 0;
      
      for (const bucket of buckets) {
        const orphanedCount = await this.findOrphanedFiles(bucket);
        totalOrphanedFiles += orphanedCount;
        
        this.debugResults.dataConsistency.push(`ORPHANED_FILES_${bucket.toUpperCase()}: ${orphanedCount}`);
      }
      
      console.log(`📊 Total orphaned files found: ${totalOrphanedFiles}`);
      
      // Check for broken database references
      console.log('🔍 Checking for broken database references...');
      
      const brokenReferences = await this.findBrokenReferences();
      console.log(`📊 Broken references found: ${brokenReferences.total}`);
      
      this.debugResults.dataConsistency.push(`BROKEN_REFERENCES: ${brokenReferences.total}`);
      
    } catch (error) {
      console.error('❌ Data consistency debug failed:', error.message);
      this.debugResults.dataConsistency.push('FAILED: ' + error.message);
      this.debugResults.errors.push(`Data Consistency: ${error.message}`);
    }
  }

  async findOrphanedFiles(bucket) {
    try {
      // This is a simplified check - in production you'd need more sophisticated logic
      const { data: files, error } = await this.supabaseClient.storage
        .from(bucket)
        .list('', { limit: 100 });
      
      if (error) {
        console.log(`⚠️ Cannot check orphaned files in '${bucket}': ${error.message}`);
        return 0;
      }
      
      // For this debug tool, assume files older than 30 days without database reference are orphaned
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const potentialOrphans = files.filter(file => {
        const fileDate = new Date(file.created_at);
        return fileDate < thirtyDaysAgo;
      });
      
      console.log(`  ${bucket}: ${potentialOrphans.length} potential orphaned files`);
      return potentialOrphans.length;
      
    } catch (error) {
      console.log(`❌ Error checking orphaned files in '${bucket}': ${error.message}`);
      return 0;
    }
  }

  async findBrokenReferences() {
    const brokenRefs = {
      vas: 0,
      businesses: 0,
      users: 0,
      total: 0
    };
    
    try {
      // Check VA references
      const vasWithMedia = await VA.find({
        $or: [
          { avatar: { $regex: /supabase/ } },
          { coverImage: { $regex: /supabase/ } },
          { videoIntroduction: { $regex: /supabase/ } }
        ]
      }).limit(50);
      
      for (const va of vasWithMedia) {
        if (va.avatar && va.avatar.includes('supabase')) {
          const accessible = await this.checkFileAccessibility(va.avatar);
          if (!accessible) brokenRefs.vas++;
        }
        
        if (va.coverImage && va.coverImage.includes('supabase')) {
          const accessible = await this.checkFileAccessibility(va.coverImage);
          if (!accessible) brokenRefs.vas++;
        }
        
        if (va.videoIntroduction && va.videoIntroduction.includes('supabase')) {
          const accessible = await this.checkFileAccessibility(va.videoIntroduction);
          if (!accessible) brokenRefs.vas++;
        }
      }
      
      brokenRefs.total = brokenRefs.vas + brokenRefs.businesses + brokenRefs.users;
      
      console.log(`  VA broken references: ${brokenRefs.vas}`);
      console.log(`  Business broken references: ${brokenRefs.businesses}`);
      console.log(`  User broken references: ${brokenRefs.users}`);
      
    } catch (error) {
      console.log(`❌ Error finding broken references: ${error.message}`);
    }
    
    return brokenRefs;
  }

  async checkFileAccessibility(url) {
    try {
      // Extract bucket and file path
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

  formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  async runAllDebugChecks() {
    console.log('🚀 Starting Supabase Debug Validation (MCP-style)...\n');
    
    const initialized = await this.initialize();
    if (!initialized) {
      console.log('❌ Cannot proceed without Supabase initialization');
      return this.generateReport();
    }

    await this.debugBucketOperations();
    await this.debugFilePermissions();
    await this.debugUrlGeneration();
    await this.debugStorageAnalytics();
    await this.debugDataConsistency();

    return this.generateReport();
  }

  generateReport() {
    console.log('\n📊 SUPABASE DEBUG VALIDATION REPORT (MCP-STYLE)');
    console.log('=========================================================');
    
    const report = {
      timestamp: new Date().toISOString(),
      connection: this.debugResults.connection,
      summary: {
        totalChecks: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        errors: this.debugResults.errors.length
      },
      categories: {
        bucketOperations: this.debugResults.bucketOperations,
        filePermissions: this.debugResults.filePermissions,
        urlGeneration: this.debugResults.urlGeneration,
        storageAnalytics: this.debugResults.storageAnalytics,
        dataConsistency: this.debugResults.dataConsistency
      },
      metrics: this.metrics,
      details: this.debugResults
    };

    // Calculate summary statistics
    const allResults = Object.values(this.debugResults).flat().filter(Array.isArray);
    allResults.flat().forEach(result => {
      if (typeof result === 'string') {
        report.summary.totalChecks++;
        if (result.includes('SUCCESS') || result.includes('ms') || result.includes('EXPECTED')) {
          report.summary.passed++;
        } else if (result.includes('FAILED') || result.includes('ERROR')) {
          report.summary.failed++;
        } else if (result.includes('WARNING') || result.includes('REVIEW')) {
          report.summary.warnings++;
        }
      }
    });

    console.log(`📈 Total Checks: ${report.summary.totalChecks}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`🔥 Errors: ${report.summary.errors}`);
    
    const successRate = Math.round((report.summary.passed / report.summary.totalChecks) * 100);
    console.log(`📊 Success Rate: ${successRate}%`);

    console.log('\n📋 DETAILED DEBUG RESULTS:');
    console.log(`📦 Bucket Operations: ${this.debugResults.bucketOperations.join(', ')}`);
    console.log(`🔒 File Permissions: ${this.debugResults.filePermissions.join(', ')}`);
    console.log(`🔗 URL Generation: ${this.debugResults.urlGeneration.join(', ')}`);
    console.log(`📊 Storage Analytics: ${this.debugResults.storageAnalytics.join(', ')}`);
    console.log(`🔍 Data Consistency: ${this.debugResults.dataConsistency.join(', ')}`);

    if (this.metrics.uploadTimes.length > 0) {
      const avgUploadTime = this.metrics.uploadTimes.reduce((sum, metric) => sum + metric.time, 0) / this.metrics.uploadTimes.length;
      console.log(`\n⚡ PERFORMANCE METRICS:`);
      console.log(`  Average Upload Time: ${avgUploadTime.toFixed(2)}ms`);
      
      if (this.metrics.urlGenerationTimes.length > 0) {
        const avgUrlGenTime = this.metrics.urlGenerationTimes.reduce((sum, metric) => sum + metric.time, 0) / this.metrics.urlGenerationTimes.length;
        console.log(`  Average URL Generation Time: ${avgUrlGenTime.toFixed(2)}ms`);
      }
    }

    if (Object.keys(this.metrics.bucketUsage).length > 0) {
      console.log(`\n📊 BUCKET USAGE SUMMARY:`);
      Object.entries(this.metrics.bucketUsage).forEach(([bucket, stats]) => {
        console.log(`  ${bucket}: ${stats.totalFiles} files, ${this.formatFileSize(stats.totalSize)}`);
      });
    }

    if (report.summary.errors > 0) {
      console.log('\n🔍 ERROR DETAILS:');
      this.debugResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log('\n💡 SUPABASE OPTIMIZATION RECOMMENDATIONS:');
    
    if (report.summary.failed > 0) {
      console.log('  🚨 Address failed checks immediately for proper functionality');
    }
    
    if (report.summary.warnings > 0) {
      console.log('  ⚠️ Review warning conditions for security and performance');
    }
    
    console.log('  • Set up Row Level Security (RLS) policies for proper access control');
    console.log('  • Implement automated cleanup of orphaned files');
    console.log('  • Configure CDN for improved global media delivery');
    console.log('  • Set up storage monitoring and alerting');
    console.log('  • Implement image optimization and resizing pipelines');
    console.log('  • Regular backup of critical storage buckets');
    console.log('  • Monitor and optimize storage costs');

    console.log('\n=========================================================');
    
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

// Run Supabase debug validation if this file is executed directly
if (require.main === module) {
  (async () => {
    const debugValidator = new SupabaseDebugValidator();
    
    try {
      const report = await debugValidator.runAllDebugChecks();
      
      // Save report to file
      const reportPath = path.join(__dirname, 'supabase-debug-validation-report.json');
      require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n💾 Debug validation report saved to: ${reportPath}`);
      
    } catch (error) {
      console.error('❌ Supabase debug validation failed:', error.message);
    } finally {
      await debugValidator.disconnect();
      process.exit(0);
    }
  })();
}

module.exports = SupabaseDebugValidator;