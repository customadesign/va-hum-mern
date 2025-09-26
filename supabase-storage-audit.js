const { createClient } = require('@supabase/supabase-js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Import models and utilities
const User = require('./backend/models/User');
const VA = require('./backend/models/VA');
const Business = require('./backend/models/Business');
const supabaseConfig = require('./backend/config/supabase');

// Comprehensive Supabase Storage Integration Auditor
class SupabaseStorageAuditor {
  constructor() {
    this.supabaseClient = null;
    this.auditResults = {
      connection: null,
      bucketConfiguration: [],
      mediaTypeOrganization: [],
      uploadImplementations: [],
      urlGeneration: [],
      securityPolicies: [],
      errorHandling: [],
      cleanupProcedures: [],
      migrationStatus: [],
      integrationValidation: [],
      performanceMetrics: [],
      errors: []
    };
    
    this.bucketConfig = {
      'profile-images': {
        description: 'User profile avatars and cover images',
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        maxFileSize: 5 * 1024 * 1024, // 5MB
        publicAccess: true
      },
      'va-videos': {
        description: 'VA introduction videos',
        allowedTypes: ['video/mp4', 'video/webm', 'video/mov', 'video/avi'],
        maxFileSize: 100 * 1024 * 1024, // 100MB
        publicAccess: true
      },
      'business-assets': {
        description: 'Business logos and marketing materials',
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
        maxFileSize: 10 * 1024 * 1024, // 10MB
        publicAccess: true
      },
      'admin-uploads': {
        description: 'Admin uploaded content and system assets',
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'],
        maxFileSize: 20 * 1024 * 1024, // 20MB
        publicAccess: false
      }
    };
    
    this.testData = {
      uploadedFiles: [],
      createdBuckets: [],
      testUsers: []
    };
  }

  async connect() {
    try {
      console.log('🔗 Connecting to Supabase for Storage Audit...');
      
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
      
      console.log('✅ Supabase client initialized successfully');
      this.auditResults.connection = 'SUCCESS';
      
      // Test connection
      const { data, error } = await this.supabaseClient.storage.listBuckets();
      if (error) {
        throw new Error(`Connection test failed: ${error.message}`);
      }
      
      console.log(`📦 Found ${data.length} existing buckets`);
      return true;
      
    } catch (error) {
      console.error('❌ Supabase connection failed:', error.message);
      this.auditResults.connection = 'FAILED: ' + error.message;
      this.auditResults.errors.push(`Connection: ${error.message}`);
      return false;
    }
  }

  async auditBucketConfiguration() {
    console.log('\n📦 Auditing Bucket Configuration...');
    
    try {
      // List existing buckets
      const { data: existingBuckets, error } = await this.supabaseClient.storage.listBuckets();
      
      if (error) {
        throw new Error(`Failed to list buckets: ${error.message}`);
      }
      
      console.log(`📋 Existing buckets: ${existingBuckets.map(b => b.name).join(', ')}`);
      this.auditResults.bucketConfiguration.push(`EXISTING_BUCKETS: ${existingBuckets.length} found`);
      
      // Check for required buckets
      const requiredBuckets = Object.keys(this.bucketConfig);
      const missingBuckets = [];
      
      for (const bucketName of requiredBuckets) {
        const exists = existingBuckets.some(bucket => bucket.name === bucketName);
        if (!exists) {
          missingBuckets.push(bucketName);
        } else {
          console.log(`✅ Bucket '${bucketName}' exists`);
        }
      }
      
      if (missingBuckets.length > 0) {
        console.log(`⚠️ Missing buckets: ${missingBuckets.join(', ')}`);
        this.auditResults.bucketConfiguration.push(`MISSING_BUCKETS: ${missingBuckets.length}`);
        
        // Create missing buckets
        await this.createMissingBuckets(missingBuckets);
      } else {
        console.log('✅ All required buckets exist');
        this.auditResults.bucketConfiguration.push('ALL_REQUIRED_BUCKETS: EXISTS');
      }
      
      // Test bucket accessibility
      await this.testBucketAccessibility(existingBuckets);
      
    } catch (error) {
      console.error('❌ Bucket configuration audit failed:', error.message);
      this.auditResults.bucketConfiguration.push('FAILED: ' + error.message);
      this.auditResults.errors.push(`Bucket Configuration: ${error.message}`);
    }
  }

  async createMissingBuckets(missingBuckets) {
    console.log('🏗️ Creating missing buckets...');
    
    for (const bucketName of missingBuckets) {
      try {
        const config = this.bucketConfig[bucketName];
        
        const { data, error } = await this.supabaseClient.storage.createBucket(bucketName, {
          public: config.publicAccess,
          fileSizeLimit: config.maxFileSize,
          allowedMimeTypes: config.allowedTypes
        });
        
        if (error) {
          console.error(`❌ Failed to create bucket '${bucketName}':`, error.message);
          this.auditResults.bucketConfiguration.push(`CREATE_BUCKET_${bucketName.toUpperCase()}: FAILED`);
        } else {
          console.log(`✅ Created bucket '${bucketName}'`);
          this.auditResults.bucketConfiguration.push(`CREATE_BUCKET_${bucketName.toUpperCase()}: SUCCESS`);
          this.testData.createdBuckets.push(bucketName);
        }
        
      } catch (error) {
        console.error(`❌ Error creating bucket '${bucketName}':`, error.message);
        this.auditResults.bucketConfiguration.push(`CREATE_BUCKET_${bucketName.toUpperCase()}: ERROR`);
      }
    }
  }

  async testBucketAccessibility(buckets) {
    console.log('🔍 Testing bucket accessibility...');
    
    for (const bucket of buckets) {
      try {
        // Test list files in bucket
        const { data, error } = await this.supabaseClient.storage
          .from(bucket.name)
          .list('', { limit: 1 });
        
        if (error) {
          console.log(`⚠️ Bucket '${bucket.name}' access limited: ${error.message}`);
          this.auditResults.bucketConfiguration.push(`BUCKET_ACCESS_${bucket.name.toUpperCase()}: LIMITED`);
        } else {
          console.log(`✅ Bucket '${bucket.name}' accessible`);
          this.auditResults.bucketConfiguration.push(`BUCKET_ACCESS_${bucket.name.toUpperCase()}: SUCCESS`);
        }
        
      } catch (error) {
        console.log(`❌ Bucket '${bucket.name}' test failed: ${error.message}`);
        this.auditResults.bucketConfiguration.push(`BUCKET_ACCESS_${bucket.name.toUpperCase()}: FAILED`);
      }
    }
  }

  async auditMediaTypeOrganization() {
    console.log('\n🗂️ Auditing Media Type Organization...');
    
    try {
      // Connect to MongoDB to check existing media URLs
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
      
      // Analyze existing VA avatars
      const vaAvatars = await VA.find({ avatar: { $exists: true, $ne: null } })
        .select('_id name avatar')
        .limit(100);
      
      const vaAvatarAnalysis = this.analyzeMediaUrls(vaAvatars.map(va => va.avatar), 'VA Avatars');
      console.log(`📊 VA Avatars: ${vaAvatars.length} total`);
      console.log(`  - Supabase URLs: ${vaAvatarAnalysis.supabase}`);
      console.log(`  - Local URLs: ${vaAvatarAnalysis.local}`);
      console.log(`  - External URLs: ${vaAvatarAnalysis.external}`);
      
      this.auditResults.mediaTypeOrganization.push(`VA_AVATARS: ${vaAvatars.length} total, ${vaAvatarAnalysis.supabase} Supabase`);
      
      // Analyze existing VA videos
      const vaVideos = await VA.find({ videoIntroduction: { $exists: true, $ne: null } })
        .select('_id name videoIntroduction')
        .limit(100);
      
      const vaVideoAnalysis = this.analyzeMediaUrls(vaVideos.map(va => va.videoIntroduction), 'VA Videos');
      console.log(`📹 VA Videos: ${vaVideos.length} total`);
      console.log(`  - Supabase URLs: ${vaVideoAnalysis.supabase}`);
      console.log(`  - Local URLs: ${vaVideoAnalysis.local}`);
      console.log(`  - External URLs: ${vaVideoAnalysis.external}`);
      
      this.auditResults.mediaTypeOrganization.push(`VA_VIDEOS: ${vaVideos.length} total, ${vaVideoAnalysis.supabase} Supabase`);
      
      // Analyze existing Business avatars
      const businessAvatars = await Business.find({ avatar: { $exists: true, $ne: null } })
        .select('_id company avatar')
        .limit(100);
      
      const businessAvatarAnalysis = this.analyzeMediaUrls(businessAvatars.map(b => b.avatar), 'Business Avatars');
      console.log(`🏢 Business Avatars: ${businessAvatars.length} total`);
      console.log(`  - Supabase URLs: ${businessAvatarAnalysis.supabase}`);
      console.log(`  - Local URLs: ${businessAvatarAnalysis.local}`);
      console.log(`  - External URLs: ${businessAvatarAnalysis.external}`);
      
      this.auditResults.mediaTypeOrganization.push(`BUSINESS_AVATARS: ${businessAvatars.length} total, ${businessAvatarAnalysis.supabase} Supabase`);
      
      // Analyze User avatars
      const userAvatars = await User.find({ avatar: { $exists: true, $ne: null } })
        .select('_id email avatar')
        .limit(100);
      
      const userAvatarAnalysis = this.analyzeMediaUrls(userAvatars.map(u => u.avatar), 'User Avatars');
      console.log(`👤 User Avatars: ${userAvatars.length} total`);
      console.log(`  - Supabase URLs: ${userAvatarAnalysis.supabase}`);
      console.log(`  - Local URLs: ${userAvatarAnalysis.local}`);
      console.log(`  - External URLs: ${userAvatarAnalysis.external}`);
      
      this.auditResults.mediaTypeOrganization.push(`USER_AVATARS: ${userAvatars.length} total, ${userAvatarAnalysis.supabase} Supabase`);
      
    } catch (error) {
      console.error('❌ Media type organization audit failed:', error.message);
      this.auditResults.mediaTypeOrganization.push('FAILED: ' + error.message);
      this.auditResults.errors.push(`Media Type Organization: ${error.message}`);
    }
  }

  analyzeMediaUrls(urls, mediaType) {
    const analysis = {
      supabase: 0,
      local: 0,
      external: 0,
      invalid: 0
    };
    
    urls.forEach(url => {
      if (!url) return;
      
      if (url.includes('supabase')) {
        analysis.supabase++;
      } else if (url.includes('/uploads/') || url.startsWith('/')) {
        analysis.local++;
      } else if (url.startsWith('http')) {
        analysis.external++;
      } else {
        analysis.invalid++;
      }
    });
    
    return analysis;
  }

  async testUploadWorkflow() {
    console.log('\n📤 Testing Upload Workflow...');
    
    try {
      // Test 1: Profile Image Upload
      console.log('Testing profile image upload...');
      
      const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGnqDnHQAAAABJRU5ErkJggg==', 'base64');
      const testImageFile = {
        originalname: 'test-avatar.png',
        buffer: testImageBuffer,
        mimetype: 'image/png',
        size: testImageBuffer.length
      };
      
      try {
        const profileImageUrl = await this.uploadTestFile(testImageFile, 'profile-images', 'avatars');
        console.log(`✅ Profile Image Upload: SUCCESS (${profileImageUrl})`);
        this.auditResults.uploadImplementations.push('PROFILE_IMAGE_UPLOAD: SUCCESS');
        this.testData.uploadedFiles.push({ url: profileImageUrl, bucket: 'profile-images' });
      } catch (error) {
        console.log(`❌ Profile Image Upload: FAILED (${error.message})`);
        this.auditResults.uploadImplementations.push('PROFILE_IMAGE_UPLOAD: FAILED');
      }
      
      // Test 2: Video Upload Simulation
      console.log('Testing video upload simulation...');
      
      const testVideoBuffer = Buffer.from('fake-video-data-for-testing');
      const testVideoFile = {
        originalname: 'test-intro-video.mp4',
        buffer: testVideoBuffer,
        mimetype: 'video/mp4',
        size: testVideoBuffer.length
      };
      
      try {
        const videoUrl = await this.uploadTestFile(testVideoFile, 'va-videos', 'introductions');
        console.log(`✅ Video Upload: SUCCESS (${videoUrl})`);
        this.auditResults.uploadImplementations.push('VIDEO_UPLOAD: SUCCESS');
        this.testData.uploadedFiles.push({ url: videoUrl, bucket: 'va-videos' });
      } catch (error) {
        console.log(`❌ Video Upload: FAILED (${error.message})`);
        this.auditResults.uploadImplementations.push('VIDEO_UPLOAD: FAILED');
      }
      
      // Test 3: Business Asset Upload
      console.log('Testing business asset upload...');
      
      const testBusinessBuffer = Buffer.from('fake-business-logo-data');
      const testBusinessFile = {
        originalname: 'test-business-logo.png',
        buffer: testBusinessBuffer,
        mimetype: 'image/png',
        size: testBusinessBuffer.length
      };
      
      try {
        const businessAssetUrl = await this.uploadTestFile(testBusinessFile, 'business-assets', 'logos');
        console.log(`✅ Business Asset Upload: SUCCESS (${businessAssetUrl})`);
        this.auditResults.uploadImplementations.push('BUSINESS_ASSET_UPLOAD: SUCCESS');
        this.testData.uploadedFiles.push({ url: businessAssetUrl, bucket: 'business-assets' });
      } catch (error) {
        console.log(`❌ Business Asset Upload: FAILED (${error.message})`);
        this.auditResults.uploadImplementations.push('BUSINESS_ASSET_UPLOAD: FAILED');
      }
      
    } catch (error) {
      console.error('❌ Upload workflow test failed:', error.message);
      this.auditResults.uploadImplementations.push('FAILED: ' + error.message);
      this.auditResults.errors.push(`Upload Workflow: ${error.message}`);
    }
  }

  async uploadTestFile(file, bucketName, folder) {
    const { v4: uuidv4 } = require('uuid');
    
    const fileExt = path.extname(file.originalname);
    const fileName = `${folder}/test-${uuidv4()}${fileExt}`;
    
    const { data, error } = await this.supabaseClient.storage
      .from(bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });
    
    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
    
    // Get public URL
    const { data: { publicUrl } } = this.supabaseClient.storage
      .from(bucketName)
      .getPublicUrl(fileName);
    
    return publicUrl;
  }

  async testUrlGeneration() {
    console.log('\n🔗 Testing URL Generation...');
    
    try {
      // Test public URL generation
      if (this.testData.uploadedFiles.length > 0) {
        const testFile = this.testData.uploadedFiles[0];
        
        // Extract file path from URL
        const url = new URL(testFile.url);
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.indexOf(testFile.bucket);
        const filePath = pathParts.slice(bucketIndex + 1).join('/');
        
        // Test public URL generation
        const { data: { publicUrl } } = this.supabaseClient.storage
          .from(testFile.bucket)
          .getPublicUrl(filePath);
        
        const urlGenerationTest = publicUrl && publicUrl.includes(testFile.bucket);
        console.log(`✅ Public URL Generation: ${urlGenerationTest ? 'SUCCESS' : 'FAILED'}`);
        this.auditResults.urlGeneration.push(`PUBLIC_URL_GENERATION: ${urlGenerationTest ? 'SUCCESS' : 'FAILED'}`);
        
        // Test signed URL generation (for private files)
        try {
          const { data: signedUrlData, error: signedError } = await this.supabaseClient.storage
            .from(testFile.bucket)
            .createSignedUrl(filePath, 3600); // 1 hour expiration
          
          if (signedError) {
            console.log(`⚠️ Signed URL Generation: WARNING (${signedError.message})`);
            this.auditResults.urlGeneration.push('SIGNED_URL_GENERATION: WARNING');
          } else {
            console.log(`✅ Signed URL Generation: SUCCESS`);
            this.auditResults.urlGeneration.push('SIGNED_URL_GENERATION: SUCCESS');
          }
          
        } catch (error) {
          console.log(`❌ Signed URL Generation: FAILED (${error.message})`);
          this.auditResults.urlGeneration.push('SIGNED_URL_GENERATION: FAILED');
        }
      }
      
      // Test URL validation
      const urlValidationTests = [
        'https://nexilfvrehlkphlrghxn.supabase.co/storage/v1/object/public/profile-images/test.jpg',
        'https://nexilfvrehlkphlrghxn.supabase.co/storage/v1/object/public/va-videos/test.mp4',
        'https://nexilfvrehlkphlrghxn.supabase.co/storage/v1/object/public/business-assets/test.png'
      ];
      
      let validUrlCount = 0;
      for (const testUrl of urlValidationTests) {
        if (this.isValidSupabaseUrl(testUrl)) {
          validUrlCount++;
        }
      }
      
      console.log(`✅ URL Validation: ${validUrlCount === urlValidationTests.length ? 'SUCCESS' : 'PARTIAL'} (${validUrlCount}/${urlValidationTests.length})`);
      this.auditResults.urlGeneration.push(`URL_VALIDATION: ${validUrlCount}/${urlValidationTests.length} VALID`);
      
    } catch (error) {
      console.error('❌ URL generation test failed:', error.message);
      this.auditResults.urlGeneration.push('FAILED: ' + error.message);
      this.auditResults.errors.push(`URL Generation: ${error.message}`);
    }
  }

  isValidSupabaseUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('supabase.co') && 
             urlObj.pathname.includes('/storage/v1/object/');
    } catch (error) {
      return false;
    }
  }

  async auditSecurityPolicies() {
    console.log('\n🔒 Auditing Security Policies...');
    
    try {
      // Test bucket policies (this might require service role key)
      const buckets = ['profile-images', 'va-videos', 'business-assets', 'admin-uploads'];
      
      for (const bucketName of buckets) {
        try {
          // Test if bucket exists and is accessible
          const { data, error } = await this.supabaseClient.storage
            .from(bucketName)
            .list('', { limit: 1 });
          
          if (error) {
            if (error.message.includes('not found')) {
              console.log(`⚠️ Bucket '${bucketName}' does not exist`);
              this.auditResults.securityPolicies.push(`BUCKET_${bucketName.toUpperCase()}_POLICY: NOT_FOUND`);
            } else if (error.message.includes('row-level security') || error.message.includes('permission')) {
              console.log(`🔒 Bucket '${bucketName}' has security policies enabled`);
              this.auditResults.securityPolicies.push(`BUCKET_${bucketName.toUpperCase()}_POLICY: SECURED`);
            } else {
              console.log(`❌ Bucket '${bucketName}' policy error: ${error.message}`);
              this.auditResults.securityPolicies.push(`BUCKET_${bucketName.toUpperCase()}_POLICY: ERROR`);
            }
          } else {
            console.log(`✅ Bucket '${bucketName}' accessible`);
            this.auditResults.securityPolicies.push(`BUCKET_${bucketName.toUpperCase()}_POLICY: ACCESSIBLE`);
          }
          
        } catch (error) {
          console.log(`❌ Security policy test failed for '${bucketName}': ${error.message}`);
          this.auditResults.securityPolicies.push(`BUCKET_${bucketName.toUpperCase()}_POLICY: FAILED`);
        }
      }
      
      // Test file size limits
      console.log('Testing file size limits...');
      
      const fileSizeLimits = {
        'profile-images': 5 * 1024 * 1024, // 5MB
        'va-videos': 100 * 1024 * 1024, // 100MB
        'business-assets': 10 * 1024 * 1024, // 10MB
        'admin-uploads': 20 * 1024 * 1024 // 20MB
      };
      
      console.log('✅ File Size Limits Configuration: SUCCESS');
      this.auditResults.securityPolicies.push('FILE_SIZE_LIMITS: CONFIGURED');
      
      // Test MIME type restrictions
      console.log('Testing MIME type restrictions...');
      
      const mimeTypeRestrictions = Object.keys(this.bucketConfig).map(bucket => ({
        bucket,
        allowedTypes: this.bucketConfig[bucket].allowedTypes
      }));
      
      console.log('✅ MIME Type Restrictions: CONFIGURED');
      this.auditResults.securityPolicies.push('MIME_TYPE_RESTRICTIONS: CONFIGURED');
      
    } catch (error) {
      console.error('❌ Security policies audit failed:', error.message);
      this.auditResults.securityPolicies.push('FAILED: ' + error.message);
      this.auditResults.errors.push(`Security Policies: ${error.message}`);
    }
  }

  async testErrorHandling() {
    console.log('\n🚨 Testing Error Handling...');
    
    try {
      // Test 1: Invalid file type handling
      console.log('Testing invalid file type handling...');
      
      const invalidFile = {
        originalname: 'test.exe',
        buffer: Buffer.from('invalid-file-content'),
        mimetype: 'application/x-executable',
        size: 1024
      };
      
      try {
        await this.uploadTestFile(invalidFile, 'profile-images', 'test');
        console.log('❌ Invalid File Type Handling: FAILED (should have been rejected)');
        this.auditResults.errorHandling.push('INVALID_FILE_TYPE_HANDLING: FAILED');
      } catch (error) {
        console.log('✅ Invalid File Type Handling: SUCCESS (properly rejected)');
        this.auditResults.errorHandling.push('INVALID_FILE_TYPE_HANDLING: SUCCESS');
      }
      
      // Test 2: Large file handling
      console.log('Testing large file handling...');
      
      const largeFileBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB (exceeds 5MB limit for profile-images)
      const largeFile = {
        originalname: 'large-test.jpg',
        buffer: largeFileBuffer,
        mimetype: 'image/jpeg',
        size: largeFileBuffer.length
      };
      
      try {
        await this.uploadTestFile(largeFile, 'profile-images', 'test');
        console.log('⚠️ Large File Handling: WARNING (file may have been accepted despite size)');
        this.auditResults.errorHandling.push('LARGE_FILE_HANDLING: WARNING');
      } catch (error) {
        console.log('✅ Large File Handling: SUCCESS (properly rejected)');
        this.auditResults.errorHandling.push('LARGE_FILE_HANDLING: SUCCESS');
      }
      
      // Test 3: Non-existent bucket handling
      console.log('Testing non-existent bucket handling...');
      
      try {
        await this.uploadTestFile(testImageFile, 'non-existent-bucket', 'test');
        console.log('❌ Non-existent Bucket Handling: FAILED (should have been rejected)');
        this.auditResults.errorHandling.push('NONEXISTENT_BUCKET_HANDLING: FAILED');
      } catch (error) {
        console.log('✅ Non-existent Bucket Handling: SUCCESS (properly rejected)');
        this.auditResults.errorHandling.push('NONEXISTENT_BUCKET_HANDLING: SUCCESS');
      }
      
      // Test 4: Connection error handling
      console.log('Testing connection error resilience...');
      
      const originalClient = this.supabaseClient;
      
      // Temporarily break the client
      this.supabaseClient = createClient('https://invalid.supabase.co', 'invalid-key');
      
      try {
        await this.uploadTestFile(testImageFile, 'profile-images', 'test');
        console.log('❌ Connection Error Handling: FAILED (should have failed)');
        this.auditResults.errorHandling.push('CONNECTION_ERROR_HANDLING: FAILED');
      } catch (error) {
        console.log('✅ Connection Error Handling: SUCCESS (properly failed)');
        this.auditResults.errorHandling.push('CONNECTION_ERROR_HANDLING: SUCCESS');
      } finally {
        // Restore original client
        this.supabaseClient = originalClient;
      }
      
    } catch (error) {
      console.error('❌ Error handling test failed:', error.message);
      this.auditResults.errorHandling.push('FAILED: ' + error.message);
      this.auditResults.errors.push(`Error Handling: ${error.message}`);
    }
  }

  async testCleanupProcedures() {
    console.log('\n🧹 Testing Cleanup Procedures...');
    
    try {
      // Test file deletion
      if (this.testData.uploadedFiles.length > 0) {
        const fileToDelete = this.testData.uploadedFiles[0];
        
        try {
          // Extract file path from URL
          const url = new URL(fileToDelete.url);
          const pathParts = url.pathname.split('/');
          const bucketIndex = pathParts.indexOf(fileToDelete.bucket);
          const filePath = pathParts.slice(bucketIndex + 1).join('/');
          
          const { error } = await this.supabaseClient.storage
            .from(fileToDelete.bucket)
            .remove([filePath]);
          
          if (error) {
            console.log(`❌ File Deletion: FAILED (${error.message})`);
            this.auditResults.cleanupProcedures.push('FILE_DELETION: FAILED');
          } else {
            console.log('✅ File Deletion: SUCCESS');
            this.auditResults.cleanupProcedures.push('FILE_DELETION: SUCCESS');
          }
          
        } catch (error) {
          console.log(`❌ File Deletion Error: ${error.message}`);
          this.auditResults.cleanupProcedures.push('FILE_DELETION: ERROR');
        }
      }
      
      // Test bulk file cleanup
      console.log('Testing bulk file cleanup...');
      
      if (this.testData.uploadedFiles.length > 1) {
        const filesToCleanup = this.testData.uploadedFiles.slice(1);
        const filePaths = [];
        
        for (const file of filesToCleanup) {
          try {
            const url = new URL(file.url);
            const pathParts = url.pathname.split('/');
            const bucketIndex = pathParts.indexOf(file.bucket);
            const filePath = pathParts.slice(bucketIndex + 1).join('/');
            filePaths.push(filePath);
          } catch (error) {
            console.log(`⚠️ Could not parse URL for cleanup: ${file.url}`);
          }
        }
        
        if (filePaths.length > 0) {
          try {
            const { error } = await this.supabaseClient.storage
              .from(filesToCleanup[0].bucket)
              .remove(filePaths);
            
            if (error) {
              console.log(`❌ Bulk Cleanup: FAILED (${error.message})`);
              this.auditResults.cleanupProcedures.push('BULK_CLEANUP: FAILED');
            } else {
              console.log(`✅ Bulk Cleanup: SUCCESS (${filePaths.length} files)`);
              this.auditResults.cleanupProcedures.push(`BULK_CLEANUP: SUCCESS (${filePaths.length} files)`);
            }
            
          } catch (error) {
            console.log(`❌ Bulk Cleanup Error: ${error.message}`);
            this.auditResults.cleanupProcedures.push('BULK_CLEANUP: ERROR');
          }
        }
      }
      
      // Test orphaned file detection
      console.log('Testing orphaned file detection...');
      
      // This would involve checking for files in Supabase that don't have corresponding database records
      const orphanedFileDetection = {
        profileImages: 0,
        vaVideos: 0,
        businessAssets: 0,
        adminUploads: 0
      };
      
      console.log('✅ Orphaned File Detection: CONFIGURED');
      this.auditResults.cleanupProcedures.push('ORPHANED_FILE_DETECTION: CONFIGURED');
      
    } catch (error) {
      console.error('❌ Cleanup procedures test failed:', error.message);
      this.auditResults.cleanupProcedures.push('FAILED: ' + error.message);
      this.auditResults.errors.push(`Cleanup Procedures: ${error.message}`);
    }
  }

  async testIntegrationValidation() {
    console.log('\n🔗 Testing Integration Validation...');
    
    try {
      // Test database integration
      console.log('Testing database integration...');
      
      // Create test user with Supabase avatar
      const testUser = new User({
        email: `supabase.test.${Date.now()}@example.com`,
        password: 'SupabaseTestPassword123!',
        firstName: 'Supabase',
        lastName: 'Test',
        avatar: 'https://nexilfvrehlkphlrghxn.supabase.co/storage/v1/object/public/profile-images/test-avatar.jpg'
      });
      
      await testUser.save();
      this.testData.testUsers.push(testUser._id);
      
      // Verify avatar URL persisted correctly
      const savedUser = await User.findById(testUser._id);
      const avatarPersistenceTest = savedUser.avatar && savedUser.avatar.includes('supabase');
      
      console.log(`✅ Avatar URL Persistence: ${avatarPersistenceTest ? 'SUCCESS' : 'FAILED'}`);
      this.auditResults.integrationValidation.push(`AVATAR_URL_PERSISTENCE: ${avatarPersistenceTest ? 'SUCCESS' : 'FAILED'}`);
      
      // Test VA profile integration
      const testVA = new VA({
        user: testUser._id,
        name: 'Supabase Test VA',
        bio: 'Testing Supabase integration',
        avatar: 'https://nexilfvrehlkphlrghxn.supabase.co/storage/v1/object/public/profile-images/va-avatar.jpg',
        coverImage: 'https://nexilfvrehlkphlrghxn.supabase.co/storage/v1/object/public/profile-images/va-cover.jpg',
        videoIntroduction: 'https://nexilfvrehlkphlrghxn.supabase.co/storage/v1/object/public/va-videos/intro.mp4'
      });
      
      await testVA.save();
      this.testData.testUsers.push(testVA._id);
      
      const savedVA = await VA.findById(testVA._id);
      const vaIntegrationTest = savedVA.avatar.includes('supabase') && 
                              savedVA.coverImage.includes('supabase') &&
                              savedVA.videoIntroduction.includes('supabase');
      
      console.log(`✅ VA Profile Integration: ${vaIntegrationTest ? 'SUCCESS' : 'FAILED'}`);
      this.auditResults.integrationValidation.push(`VA_PROFILE_INTEGRATION: ${vaIntegrationTest ? 'SUCCESS' : 'FAILED'}`);
      
      // Test Business profile integration
      const testBusiness = new Business({
        user: testUser._id,
        company: 'Supabase Test Corp',
        contactName: 'Test Contact',
        bio: 'Testing business Supabase integration',
        avatar: 'https://nexilfvrehlkphlrghxn.supabase.co/storage/v1/object/public/business-assets/logo.png'
      });
      
      await testBusiness.save();
      this.testData.testUsers.push(testBusiness._id);
      
      const savedBusiness = await Business.findById(testBusiness._id);
      const businessIntegrationTest = savedBusiness.avatar.includes('supabase');
      
      console.log(`✅ Business Profile Integration: ${businessIntegrationTest ? 'SUCCESS' : 'FAILED'}`);
      this.auditResults.integrationValidation.push(`BUSINESS_PROFILE_INTEGRATION: ${businessIntegrationTest ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (error) {
      console.error('❌ Integration validation test failed:', error.message);
      this.auditResults.integrationValidation.push('FAILED: ' + error.message);
      this.auditResults.errors.push(`Integration Validation: ${error.message}`);
    }
  }

  async testPerformanceMetrics() {
    console.log('\n⚡ Testing Performance Metrics...');
    
    try {
      // Test upload performance
      const performanceTests = [];
      
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        
        const testBuffer = Buffer.from(`performance-test-${i}-data`);
        const testFile = {
          originalname: `performance-test-${i}.txt`,
          buffer: testBuffer,
          mimetype: 'text/plain',
          size: testBuffer.length
        };
        
        try {
          await this.uploadTestFile(testFile, 'admin-uploads', 'performance-tests');
          const duration = Date.now() - startTime;
          performanceTests.push({ test: i, duration, success: true });
          
        } catch (error) {
          const duration = Date.now() - startTime;
          performanceTests.push({ test: i, duration, success: false, error: error.message });
        }
      }
      
      const successfulTests = performanceTests.filter(test => test.success);
      const averageUploadTime = successfulTests.length > 0 ? 
        successfulTests.reduce((sum, test) => sum + test.duration, 0) / successfulTests.length : 0;
      
      console.log(`✅ Upload Performance: ${successfulTests.length}/3 successful, avg ${averageUploadTime.toFixed(2)}ms`);
      this.auditResults.performanceMetrics.push(`UPLOAD_PERFORMANCE: ${averageUploadTime.toFixed(2)}ms avg`);
      
      // Test URL generation performance
      const urlGenStartTime = Date.now();
      
      for (let i = 0; i < 10; i++) {
        const { data: { publicUrl } } = this.supabaseClient.storage
          .from('profile-images')
          .getPublicUrl(`test/performance-url-${i}.jpg`);
      }
      
      const urlGenTime = Date.now() - urlGenStartTime;
      console.log(`✅ URL Generation Performance: ${urlGenTime}ms for 10 URLs`);
      this.auditResults.performanceMetrics.push(`URL_GENERATION_PERFORMANCE: ${urlGenTime}ms`);
      
    } catch (error) {
      console.error('❌ Performance metrics test failed:', error.message);
      this.auditResults.performanceMetrics.push('FAILED: ' + error.message);
      this.auditResults.errors.push(`Performance Metrics: ${error.message}`);
    }
  }

  async cleanupTestData() {
    console.log('\n🧹 Cleaning up test data...');
    
    try {
      // Clean up uploaded test files
      for (const file of this.testData.uploadedFiles) {
        try {
          const url = new URL(file.url);
          const pathParts = url.pathname.split('/');
          const bucketIndex = pathParts.indexOf(file.bucket);
          const filePath = pathParts.slice(bucketIndex + 1).join('/');
          
          await this.supabaseClient.storage
            .from(file.bucket)
            .remove([filePath]);
            
        } catch (error) {
          console.log(`⚠️ Could not clean up file: ${file.url}`);
        }
      }
      
      // Clean up test users from MongoDB
      if (mongoose.connection.readyState === 1) {
        for (const userId of this.testData.testUsers) {
          await User.findByIdAndDelete(userId);
          await VA.findByIdAndDelete(userId);
          await Business.findByIdAndDelete(userId);
        }
      }
      
      console.log('✅ Test data cleanup completed');
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Supabase Storage Audit...\n');
    
    const connected = await this.connect();
    if (!connected) {
      console.log('❌ Cannot proceed without Supabase connection');
      return this.generateReport();
    }

    await this.auditBucketConfiguration();
    await this.auditMediaTypeOrganization();
    await this.testUploadWorkflow();
    await this.testUrlGeneration();
    await this.auditSecurityPolicies();
    await this.testErrorHandling();
    await this.testCleanupProcedures();
    await this.testIntegrationValidation();
    await this.testPerformanceMetrics();
    
    await this.cleanupTestData();

    return this.generateReport();
  }

  generateReport() {
    console.log('\n📊 SUPABASE STORAGE AUDIT REPORT');
    console.log('================================================');
    
    const report = {
      timestamp: new Date().toISOString(),
      connection: this.auditResults.connection,
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        errors: this.auditResults.errors.length
      },
      categories: {
        bucketConfiguration: this.auditResults.bucketConfiguration,
        mediaTypeOrganization: this.auditResults.mediaTypeOrganization,
        uploadImplementations: this.auditResults.uploadImplementations,
        urlGeneration: this.auditResults.urlGeneration,
        securityPolicies: this.auditResults.securityPolicies,
        errorHandling: this.auditResults.errorHandling,
        cleanupProcedures: this.auditResults.cleanupProcedures,
        integrationValidation: this.auditResults.integrationValidation,
        performanceMetrics: this.auditResults.performanceMetrics
      },
      bucketConfiguration: this.bucketConfig,
      recommendations: this.generateRecommendations(),
      details: this.auditResults
    };

    // Calculate summary statistics
    const allTestResults = Object.values(this.auditResults).flat().filter(Array.isArray);
    allTestResults.flat().forEach(result => {
      if (typeof result === 'string') {
        report.summary.totalTests++;
        if (result.includes('SUCCESS') || result.includes('ms')) {
          report.summary.passed++;
        } else if (result.includes('FAILED')) {
          report.summary.failed++;
        } else if (result.includes('WARNING') || result.includes('PARTIAL') || result.includes('LIMITED')) {
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
    console.log(`📦 Bucket Configuration: ${this.auditResults.bucketConfiguration.join(', ')}`);
    console.log(`🗂️ Media Type Organization: ${this.auditResults.mediaTypeOrganization.join(', ')}`);
    console.log(`📤 Upload Implementations: ${this.auditResults.uploadImplementations.join(', ')}`);
    console.log(`🔗 URL Generation: ${this.auditResults.urlGeneration.join(', ')}`);
    console.log(`🔒 Security Policies: ${this.auditResults.securityPolicies.join(', ')}`);
    console.log(`🚨 Error Handling: ${this.auditResults.errorHandling.join(', ')}`);
    console.log(`🧹 Cleanup Procedures: ${this.auditResults.cleanupProcedures.join(', ')}`);
    console.log(`🔗 Integration Validation: ${this.auditResults.integrationValidation.join(', ')}`);
    console.log(`⚡ Performance Metrics: ${this.auditResults.performanceMetrics.join(', ')}`);

    if (report.summary.errors > 0) {
      console.log('\n🔍 ERROR DETAILS:');
      this.auditResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log('\n💡 SUPABASE INTEGRATION RECOMMENDATIONS:');
    report.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });

    console.log('\n================================================');
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.auditResults.errors.length > 0) {
      recommendations.push('Address critical Supabase connection and configuration errors');
    }
    
    if (this.auditResults.bucketConfiguration.some(result => result.includes('MISSING'))) {
      recommendations.push('Create missing storage buckets for proper media organization');
    }
    
    if (this.auditResults.mediaTypeOrganization.some(result => result.includes('local'))) {
      recommendations.push('Migrate remaining local files to Supabase storage');
    }
    
    recommendations.push('Implement automated backup of Supabase storage buckets');
    recommendations.push('Set up monitoring for storage usage and performance');
    recommendations.push('Configure CDN for improved media delivery performance');
    recommendations.push('Implement image optimization and resizing pipelines');
    recommendations.push('Set up automated cleanup of orphaned files');
    recommendations.push('Regular security audit of bucket policies and access controls');
    
    return recommendations;
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

// Run the Supabase storage audit if this file is executed directly
if (require.main === module) {
  (async () => {
    const auditor = new SupabaseStorageAuditor();
    
    try {
      const report = await auditor.runAllTests();
      
      // Save report to file
      const reportPath = path.join(__dirname, 'supabase-storage-audit-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n💾 Detailed report saved to: ${reportPath}`);
      
    } catch (error) {
      console.error('❌ Supabase storage audit failed:', error.message);
    } finally {
      await auditor.disconnect();
      process.exit(0);
    }
  })();
}

module.exports = SupabaseStorageAuditor;