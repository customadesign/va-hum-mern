#!/usr/bin/env node
/**
 * Supabase Storage Bucket Setup Script
 * 
 * This script creates all required storage buckets for the Linkage VA Hub application
 * Run this locally to set up your Supabase storage infrastructure
 * 
 * Usage: node setup-supabase-buckets.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🚀 Linkage VA Hub - Supabase Storage Setup\n');
console.log('═══════════════════════════════════════════\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Service Role Key:', supabaseKey ? '✅ Configured' : '❌ Missing');
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.log('\nPlease ensure your .env file contains:');
  console.log('  SUPABASE_URL=https://nexilfvrehlkphlrghxn.supabase.co');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Bucket configurations matching backend/utils/supabaseStorage.js
const REQUIRED_BUCKETS = [
  {
    name: 'profile-images',
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  },
  {
    name: 'va-videos',
    public: true,
    fileSizeLimit: 1073741824, // 1GB
    allowedMimeTypes: ['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/quicktime']
  },
  {
    name: 'business-assets',
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
  },
  {
    name: 'admin-uploads',
    public: false, // Private bucket
    fileSizeLimit: 20971520, // 20MB
    allowedMimeTypes: ['image/*', 'application/pdf', 'text/*', 'application/json']
  },
  {
    name: 'linkage-va-hub',
    public: true,
    fileSizeLimit: 10485760, // 10MB (legacy bucket)
    allowedMimeTypes: ['image/*', 'video/*']
  }
];

async function setupBuckets() {
  try {
    // List existing buckets
    console.log('📋 Step 1: Checking existing buckets...\n');
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }
    
    const existingBucketNames = existingBuckets.map(b => b.name);
    console.log('Found existing buckets:', existingBucketNames.length > 0 ? existingBucketNames.join(', ') : 'None');
    console.log('');

    // Create missing buckets
    console.log('🏗️  Step 2: Creating missing buckets...\n');
    
    for (const bucketConfig of REQUIRED_BUCKETS) {
      const exists = existingBucketNames.includes(bucketConfig.name);
      
      if (exists) {
        console.log(`  ✅ ${bucketConfig.name} - Already exists`);
        continue;
      }

      console.log(`  🔨 Creating ${bucketConfig.name}...`);
      
      const { data, error } = await supabase.storage.createBucket(bucketConfig.name, {
        public: bucketConfig.public,
        fileSizeLimit: bucketConfig.fileSizeLimit,
        allowedMimeTypes: bucketConfig.allowedMimeTypes
      });

      if (error) {
        console.error(`  ❌ Failed to create ${bucketConfig.name}:`, error.message);
        
        if (error.message.includes('already exists')) {
          console.log(`  ℹ️  Bucket exists but wasn't in list - continuing...`);
        } else {
          console.log(`  ⚠️  You may need to create this bucket manually in Supabase Dashboard`);
        }
      } else {
        console.log(`  ✅ ${bucketConfig.name} - Created successfully!`);
      }
    }

    // Verify all buckets
    console.log('\n✅ Step 3: Verifying all buckets...\n');
    const { data: finalBuckets, error: finalError } = await supabase.storage.listBuckets();
    
    if (finalError) {
      throw new Error(`Failed to verify buckets: ${finalError.message}`);
    }
    
    const finalBucketNames = finalBuckets.map(b => b.name);
    const allPresent = REQUIRED_BUCKETS.every(config => finalBucketNames.includes(config.name));
    
    console.log('Final bucket list:');
    REQUIRED_BUCKETS.forEach(config => {
      const exists = finalBucketNames.includes(config.name);
      console.log(`  ${exists ? '✅' : '❌'} ${config.name} (${config.public ? 'Public' : 'Private'})`);
    });
    
    if (allPresent) {
      console.log('\n🎉 SUCCESS! All required buckets are configured.\n');
      console.log('Next steps:');
      console.log('1. Run the RLS policies: supabase-rls-policies-complete.sql');
      console.log('2. Verify environment variables in Render dashboard');
      console.log('3. Redeploy your backend service');
      console.log('4. Test uploading a profile picture\n');
    } else {
      console.log('\n⚠️  Some buckets are missing. You may need to create them manually.\n');
      console.log('Go to: https://supabase.com/dashboard/project/nexilfvrehlkphlrghxn/storage/buckets\n');
    }

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    console.log('2. Check you have admin access to your Supabase project');
    console.log('3. Try creating buckets manually in Supabase Dashboard');
    process.exit(1);
  }
}

setupBuckets();

