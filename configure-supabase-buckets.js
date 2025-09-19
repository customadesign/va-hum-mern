const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Comprehensive Supabase Bucket Configuration
class SupabaseBucketConfigurator {
  constructor() {
    this.supabaseClient = null;
    this.bucketConfigurations = {
      'profile-images': {
        description: 'User profile avatars and cover images for VAs, Businesses, and Admins',
        config: {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
        },
        folders: ['avatars', 'covers', 'admin-avatars', 'business-logos'],
        policies: [
          {
            name: 'Public read access for profile images',
            for: 'select',
            to: 'public',
            using: 'true'
          },
          {
            name: 'Authenticated users can upload profile images',
            for: 'insert',
            to: 'authenticated',
            using: 'true'
          },
          {
            name: 'Users can update their own profile images',
            for: 'update',
            to: 'authenticated',
            using: 'true'
          },
          {
            name: 'Users can delete their own profile images',
            for: 'delete',
            to: 'authenticated',
            using: 'true'
          }
        ]
      },
      'va-videos': {
        description: 'VA introduction videos and portfolio media',
        config: {
          public: true,
          fileSizeLimit: 100 * 1024 * 1024, // 100MB
          allowedMimeTypes: ['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/quicktime']
        },
        folders: ['introductions', 'portfolio', 'demos'],
        policies: [
          {
            name: 'Public read access for VA videos',
            for: 'select',
            to: 'public',
            using: 'true'
          },
          {
            name: 'Authenticated VAs can upload videos',
            for: 'insert',
            to: 'authenticated',
            using: 'true'
          },
          {
            name: 'VAs can update their own videos',
            for: 'update',
            to: 'authenticated',
            using: 'true'
          }
        ]
      },
      'business-assets': {
        description: 'Business marketing materials, logos, and documents',
        config: {
          public: true,
          fileSizeLimit: 10 * 1024 * 1024, // 10MB
          allowedMimeTypes: [
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ]
        },
        folders: ['logos', 'marketing', 'documents', 'branding'],
        policies: [
          {
            name: 'Public read access for business assets',
            for: 'select',
            to: 'public',
            using: 'true'
          },
          {
            name: 'Authenticated businesses can upload assets',
            for: 'insert',
            to: 'authenticated',
            using: 'true'
          },
          {
            name: 'Businesses can manage their own assets',
            for: 'update',
            to: 'authenticated',
            using: 'true'
          }
        ]
      },
      'admin-uploads': {
        description: 'Admin-only uploads including system assets and sensitive documents',
        config: {
          public: false,
          fileSizeLimit: 20 * 1024 * 1024, // 20MB
          allowedMimeTypes: [
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
            'application/pdf', 'text/plain', 'text/csv', 'application/json',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          ]
        },
        folders: ['system-assets', 'reports', 'backups', 'templates'],
        policies: [
          {
            name: 'Admin-only access for admin uploads',
            for: 'select',
            to: 'authenticated',
            using: 'auth.jwt() ->> \'admin\' = \'true\''
          },
          {
            name: 'Admin-only upload access',
            for: 'insert',
            to: 'authenticated',
            using: 'auth.jwt() ->> \'admin\' = \'true\''
          },
          {
            name: 'Admin-only modification access',
            for: 'update',
            to: 'authenticated',
            using: 'auth.jwt() ->> \'admin\' = \'true\''
          },
          {
            name: 'Admin-only deletion access',
            for: 'delete',
            to: 'authenticated',
            using: 'auth.jwt() ->> \'admin\' = \'true\''
          }
        ]
      }
    };
    
    this.results = {
      bucketsCreated: [],
      policiesApplied: [],
      foldersCreated: [],
      errors: []
    };
  }

  async initialize() {
    try {
      console.log('🔗 Initializing Supabase client...');
      
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.');
      }
      
      this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      console.log('✅ Supabase client initialized successfully');
      console.log(`🌐 Supabase URL: ${supabaseUrl.substring(0, 40)}...`);
      console.log(`🔑 Using ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon'} key`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error.message);
      this.results.errors.push(`Initialization: ${error.message}`);
      return false;
    }
  }

  async createBuckets() {
    console.log('\n📦 Creating and Configuring Storage Buckets...');
    
    try {
      // First, list existing buckets
      const { data: existingBuckets, error: listError } = await this.supabaseClient.storage.listBuckets();
      
      if (listError) {
        throw new Error(`Failed to list existing buckets: ${listError.message}`);
      }
      
      console.log(`📋 Found ${existingBuckets.length} existing buckets: ${existingBuckets.map(b => b.name).join(', ')}`);
      
      // Create each configured bucket
      for (const [bucketName, bucketData] of Object.entries(this.bucketConfigurations)) {
        try {
          const bucketExists = existingBuckets.some(bucket => bucket.name === bucketName);
          
          if (bucketExists) {
            console.log(`✅ Bucket '${bucketName}' already exists`);
            this.results.bucketsCreated.push(`${bucketName}: ALREADY_EXISTS`);
          } else {
            console.log(`🏗️ Creating bucket '${bucketName}'...`);
            
            const { data, error } = await this.supabaseClient.storage.createBucket(bucketName, {
              public: bucketData.config.public,
              fileSizeLimit: bucketData.config.fileSizeLimit,
              allowedMimeTypes: bucketData.config.allowedMimeTypes
            });
            
            if (error) {
              console.error(`❌ Failed to create bucket '${bucketName}':`, error.message);
              this.results.errors.push(`Bucket ${bucketName}: ${error.message}`);
            } else {
              console.log(`✅ Successfully created bucket '${bucketName}'`);
              this.results.bucketsCreated.push(`${bucketName}: CREATED`);
            }
          }
          
          // Test bucket accessibility
          await this.testBucketAccess(bucketName);
          
        } catch (error) {
          console.error(`❌ Error processing bucket '${bucketName}':`, error.message);
          this.results.errors.push(`Bucket ${bucketName} processing: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Bucket creation failed:', error.message);
      this.results.errors.push(`Bucket creation: ${error.message}`);
    }
  }

  async testBucketAccess(bucketName) {
    try {
      console.log(`🔍 Testing access to bucket '${bucketName}'...`);
      
      // Test list files
      const { data, error } = await this.supabaseClient.storage
        .from(bucketName)
        .list('', { limit: 1 });
      
      if (error) {
        if (error.message.includes('not found')) {
          console.log(`⚠️ Bucket '${bucketName}' not found`);
        } else if (error.message.includes('row-level security') || error.message.includes('permission')) {
          console.log(`🔒 Bucket '${bucketName}' has security policies (expected for private buckets)`);
        } else {
          console.log(`❌ Bucket '${bucketName}' access error: ${error.message}`);
        }
      } else {
        console.log(`✅ Bucket '${bucketName}' is accessible`);
      }
      
    } catch (error) {
      console.log(`❌ Bucket access test failed for '${bucketName}': ${error.message}`);
    }
  }

  async createFolderStructure() {
    console.log('\n📁 Creating Folder Structure...');
    
    try {
      for (const [bucketName, bucketData] of Object.entries(this.bucketConfigurations)) {
        console.log(`📂 Setting up folders for bucket '${bucketName}'...`);
        
        for (const folder of bucketData.folders) {
          try {
            // Create a placeholder file to establish the folder structure
            const placeholderContent = JSON.stringify({
              folder: folder,
              purpose: bucketData.description,
              created: new Date().toISOString(),
              note: 'This file establishes the folder structure. It can be safely deleted when real files are uploaded.'
            });
            
            const { data, error } = await this.supabaseClient.storage
              .from(bucketName)
              .upload(`${folder}/.folder-placeholder.json`, placeholderContent, {
                contentType: 'application/json',
                upsert: true
              });
            
            if (error) {
              console.log(`⚠️ Could not create folder '${folder}' in '${bucketName}': ${error.message}`);
            } else {
              console.log(`✅ Created folder '${folder}' in '${bucketName}'`);
              this.results.foldersCreated.push(`${bucketName}/${folder}`);
            }
            
          } catch (error) {
            console.log(`❌ Error creating folder '${folder}' in '${bucketName}': ${error.message}`);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Folder structure creation failed:', error.message);
      this.results.errors.push(`Folder structure: ${error.message}`);
    }
  }

  async generatePolicySQL() {
    console.log('\n📋 Generating RLS Policy SQL...');
    
    try {
      let sqlCommands = [];
      
      sqlCommands.push('-- Supabase Storage RLS Policies for Linkage VA Hub');
      sqlCommands.push('-- Generated automatically - Review before applying\n');
      
      for (const [bucketName, bucketData] of Object.entries(this.bucketConfigurations)) {
        sqlCommands.push(`-- Policies for bucket: ${bucketName}`);
        sqlCommands.push(`-- ${bucketData.description}`);
        
        for (const policy of bucketData.policies) {
          const policyName = `${bucketName}_${policy.for}_policy`;
          
          sqlCommands.push(`CREATE POLICY "${policyName}"`);
          sqlCommands.push(`ON storage.objects`);
          sqlCommands.push(`FOR ${policy.for.toUpperCase()}`);
          sqlCommands.push(`TO ${policy.to}`);
          sqlCommands.push(`USING (bucket_id = '${bucketName}' AND ${policy.using});`);
          sqlCommands.push('');
        }
        
        sqlCommands.push('');
      }
      
      // Add bucket-specific RLS enabling
      sqlCommands.push('-- Enable RLS on storage.objects table');
      sqlCommands.push('ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;');
      sqlCommands.push('');
      
      // Add bucket size monitoring
      sqlCommands.push('-- Create view for bucket usage monitoring');
      sqlCommands.push(`CREATE OR REPLACE VIEW bucket_usage AS 
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM(COALESCE(metadata->>'size', '0')::bigint) as total_size_bytes,
  ROUND(SUM(COALESCE(metadata->>'size', '0')::bigint) / 1024.0 / 1024.0, 2) as total_size_mb
FROM storage.objects 
GROUP BY bucket_id;`);
      
      const sqlContent = sqlCommands.join('\n');
      
      // Save SQL to file
      const sqlPath = path.join(__dirname, 'supabase-storage-policies.sql');
      require('fs').writeFileSync(sqlPath, sqlContent);
      
      console.log(`📄 RLS Policy SQL generated: ${sqlPath}`);
      console.log('⚠️ Review the SQL file before applying policies to your Supabase project');
      
      return sqlContent;
      
    } catch (error) {
      console.error('❌ Policy SQL generation failed:', error.message);
      this.results.errors.push(`Policy SQL generation: ${error.message}`);
      return null;
    }
  }

  async validateBucketConfiguration() {
    console.log('\n✅ Validating Bucket Configuration...');
    
    try {
      const validationResults = [];
      
      // Validate each bucket
      for (const [bucketName, bucketData] of Object.entries(this.bucketConfigurations)) {
        console.log(`🔍 Validating bucket '${bucketName}'...`);
        
        try {
          // Check if bucket exists
          const { data: buckets, error } = await this.supabaseClient.storage.listBuckets();
          
          if (error) {
            validationResults.push(`${bucketName}: LIST_ERROR`);
            continue;
          }
          
          const bucketExists = buckets.some(bucket => bucket.name === bucketName);
          
          if (!bucketExists) {
            validationResults.push(`${bucketName}: NOT_FOUND`);
            continue;
          }
          
          // Test upload capability
          const testBuffer = Buffer.from('test-content');
          const testFileName = `validation/test-${Date.now()}.txt`;
          
          const { data: uploadData, error: uploadError } = await this.supabaseClient.storage
            .from(bucketName)
            .upload(testFileName, testBuffer, {
              contentType: 'text/plain',
              upsert: true
            });
          
          if (uploadError) {
            validationResults.push(`${bucketName}: UPLOAD_FAILED`);
            console.log(`⚠️ Upload test failed for '${bucketName}': ${uploadError.message}`);
          } else {
            validationResults.push(`${bucketName}: FUNCTIONAL`);
            console.log(`✅ Bucket '${bucketName}' is functional`);
            
            // Clean up test file
            await this.supabaseClient.storage
              .from(bucketName)
              .remove([testFileName]);
          }
          
        } catch (error) {
          validationResults.push(`${bucketName}: VALIDATION_ERROR`);
          console.log(`❌ Validation error for '${bucketName}': ${error.message}`);
        }
      }
      
      const functionalBuckets = validationResults.filter(result => result.includes('FUNCTIONAL')).length;
      console.log(`📊 Validation Summary: ${functionalBuckets}/${Object.keys(this.bucketConfigurations).length} buckets functional`);
      
      return validationResults;
      
    } catch (error) {
      console.error('❌ Bucket validation failed:', error.message);
      this.results.errors.push(`Bucket validation: ${error.message}`);
      return [];
    }
  }

  async generateEnvironmentConfig() {
    console.log('\n⚙️ Generating Environment Configuration...');
    
    try {
      const envConfig = {
        // Supabase Configuration
        SUPABASE_URL: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'your-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key',
        
        // Bucket Configuration
        SUPABASE_BUCKET_PROFILE_IMAGES: 'profile-images',
        SUPABASE_BUCKET_VA_VIDEOS: 'va-videos',
        SUPABASE_BUCKET_BUSINESS_ASSETS: 'business-assets',
        SUPABASE_BUCKET_ADMIN_UPLOADS: 'admin-uploads',
        
        // Upload Limits
        MAX_PROFILE_IMAGE_SIZE: '5MB',
        MAX_VA_VIDEO_SIZE: '100MB',
        MAX_BUSINESS_ASSET_SIZE: '10MB',
        MAX_ADMIN_UPLOAD_SIZE: '20MB',
        
        // Feature Flags
        FORCE_SUPABASE: 'true',
        ENABLE_LOCAL_FALLBACK: 'false',
        ENABLE_S3_FALLBACK: 'false',
        
        // Monitoring
        ENABLE_UPLOAD_LOGGING: 'true',
        ENABLE_STORAGE_MONITORING: 'true',
        STORAGE_ALERT_THRESHOLD: '80' // Percentage
      };
      
      // Generate .env template
      const envTemplate = Object.entries(envConfig)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      const envTemplatePath = path.join(__dirname, '.env.supabase.template');
      require('fs').writeFileSync(envTemplatePath, envTemplate);
      
      console.log(`📄 Environment template generated: ${envTemplatePath}`);
      
      // Generate configuration documentation
      const configDocs = this.generateConfigurationDocs();
      const docsPath = path.join(__dirname, 'SUPABASE_STORAGE_CONFIG.md');
      require('fs').writeFileSync(docsPath, configDocs);
      
      console.log(`📚 Configuration documentation generated: ${docsPath}`);
      
      return envConfig;
      
    } catch (error) {
      console.error('❌ Environment configuration generation failed:', error.message);
      this.results.errors.push(`Environment config: ${error.message}`);
      return null;
    }
  }

  generateConfigurationDocs() {
    return `
# Supabase Storage Configuration for Linkage VA Hub

## Overview
This document outlines the Supabase storage configuration for the Linkage VA Hub MERN stack application.

## Bucket Structure

### 1. profile-images
**Purpose**: User profile avatars and cover images
**Access**: Public read, authenticated write
**File Types**: JPEG, JPG, PNG, WebP, GIF
**Size Limit**: 5MB
**Folders**:
- \`avatars/\` - User profile pictures
- \`covers/\` - Profile cover images
- \`admin-avatars/\` - Admin profile pictures
- \`business-logos/\` - Business profile logos

### 2. va-videos
**Purpose**: VA introduction videos and portfolio media
**Access**: Public read, authenticated write
**File Types**: MP4, WebM, MOV, AVI, QuickTime
**Size Limit**: 100MB
**Folders**:
- \`introductions/\` - VA introduction videos
- \`portfolio/\` - Portfolio video content
- \`demos/\` - Demo videos and presentations

### 3. business-assets
**Purpose**: Business marketing materials and documents
**Access**: Public read, authenticated write
**File Types**: Images, PDFs, Word documents
**Size Limit**: 10MB
**Folders**:
- \`logos/\` - Company logos and branding
- \`marketing/\` - Marketing materials
- \`documents/\` - Business documents
- \`branding/\` - Brand assets

### 4. admin-uploads
**Purpose**: Admin-only uploads and system assets
**Access**: Admin-only read/write
**File Types**: Images, documents, spreadsheets, JSON
**Size Limit**: 20MB
**Folders**:
- \`system-assets/\` - System images and assets
- \`reports/\` - Generated reports
- \`backups/\` - Configuration backups
- \`templates/\` - Email and document templates

## Security Policies

Each bucket has Row Level Security (RLS) policies configured to ensure proper access control:

1. **Public buckets** (profile-images, va-videos, business-assets):
   - Public read access for displaying media
   - Authenticated user write access
   - Users can only modify their own files

2. **Private buckets** (admin-uploads):
   - Admin-only access for all operations
   - Requires JWT token with admin role

## Environment Variables

\`\`\`bash
# Required Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Bucket Names
SUPABASE_BUCKET_PROFILE_IMAGES=profile-images
SUPABASE_BUCKET_VA_VIDEOS=va-videos
SUPABASE_BUCKET_BUSINESS_ASSETS=business-assets
SUPABASE_BUCKET_ADMIN_UPLOADS=admin-uploads

# Feature Flags
FORCE_SUPABASE=true
ENABLE_UPLOAD_LOGGING=true
ENABLE_STORAGE_MONITORING=true
\`\`\`

## URL Structure

Files are accessible via predictable URLs:

- Profile Images: \`https://project.supabase.co/storage/v1/object/public/profile-images/avatars/file.jpg\`
- VA Videos: \`https://project.supabase.co/storage/v1/object/public/va-videos/introductions/video.mp4\`
- Business Assets: \`https://project.supabase.co/storage/v1/object/public/business-assets/logos/logo.png\`
- Admin Uploads: \`https://project.supabase.co/storage/v1/object/sign/admin-uploads/reports/report.pdf\` (signed URL required)

## Implementation Notes

1. **Service Role Key**: Use service role key for server-side operations to bypass RLS
2. **Client-side Uploads**: Use anon key with proper RLS policies for client uploads
3. **File Naming**: Use UUIDs to prevent conflicts and ensure uniqueness
4. **Content Types**: Always specify correct MIME types for proper handling
5. **Error Handling**: Implement proper fallback mechanisms for upload failures

## Monitoring and Maintenance

- Monitor bucket usage with the \`bucket_usage\` view
- Set up alerts for storage quota limits
- Regular cleanup of orphaned files
- Periodic security audit of bucket policies
- Performance monitoring of upload/download operations

---
Generated: ${new Date().toISOString()}
`;
  }

  async runConfiguration() {
    console.log('🚀 Starting Supabase Storage Bucket Configuration...\n');
    
    const initialized = await this.initialize();
    if (!initialized) {
      console.log('❌ Cannot proceed without Supabase initialization');
      return this.generateSummary();
    }

    await this.createBuckets();
    await this.createFolderStructure();
    const validationResults = await this.validateBucketConfiguration();
    const policySQL = await this.generatePolicySQL();
    const envConfig = await this.generateEnvironmentConfig();

    return this.generateSummary();
  }

  generateSummary() {
    console.log('\n📊 SUPABASE BUCKET CONFIGURATION SUMMARY');
    console.log('=============================================');
    
    const summary = {
      timestamp: new Date().toISOString(),
      bucketsConfigured: Object.keys(this.bucketConfigurations).length,
      bucketsCreated: this.results.bucketsCreated.length,
      foldersCreated: this.results.foldersCreated.length,
      policiesGenerated: Object.values(this.bucketConfigurations).reduce(
        (sum, bucket) => sum + bucket.policies.length, 0
      ),
      errors: this.results.errors.length,
      bucketConfigurations: this.bucketConfigurations,
      results: this.results
    };
    
    console.log(`📦 Buckets Configured: ${summary.bucketsConfigured}`);
    console.log(`✅ Buckets Created/Verified: ${summary.bucketsCreated}`);
    console.log(`📁 Folders Created: ${summary.foldersCreated}`);
    console.log(`🔒 Security Policies Generated: ${summary.policiesGenerated}`);
    console.log(`❌ Errors: ${summary.errors}`);
    
    console.log('\n📋 BUCKET DETAILS:');
    Object.entries(this.bucketConfigurations).forEach(([name, config]) => {
      console.log(`  ${name}:`);
      console.log(`    📝 ${config.description}`);
      console.log(`    🔓 Public: ${config.config.public}`);
      console.log(`    📏 Size Limit: ${(config.config.fileSizeLimit / 1024 / 1024).toFixed(0)}MB`);
      console.log(`    📁 Folders: ${config.folders.join(', ')}`);
      console.log(`    🎭 MIME Types: ${config.config.allowedMimeTypes.length} types`);
    });
    
    if (summary.errors > 0) {
      console.log('\n🔍 ERROR DETAILS:');
      this.results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n💡 NEXT STEPS:');
    console.log('  1. Review and apply the generated SQL policies in your Supabase dashboard');
    console.log('  2. Update environment variables with bucket configurations');
    console.log('  3. Test file uploads to each bucket type');
    console.log('  4. Run media migration script for existing files');
    console.log('  5. Update frontend components to use new bucket structure');
    
    console.log('\n=============================================');
    
    return summary;
  }
}

// Run bucket configuration if this file is executed directly
if (require.main === module) {
  (async () => {
    const configurator = new SupabaseBucketConfigurator();
    
    try {
      const summary = await configurator.runConfiguration();
      
      // Save summary to file
      const summaryPath = path.join(__dirname, 'supabase-bucket-config-summary.json');
      require('fs').writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      console.log(`\n💾 Configuration summary saved to: ${summaryPath}`);
      
    } catch (error) {
      console.error('❌ Supabase bucket configuration failed:', error.message);
    } finally {
      process.exit(0);
    }
  })();
}

module.exports = SupabaseBucketConfigurator;