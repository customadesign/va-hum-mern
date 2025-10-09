#!/usr/bin/env node

/**
 * Update Render Environment Variables for Media Persistence
 * 
 * This script helps you update the linkage-va-hub-api service on Render
 * with the correct environment variables to ensure media files persist.
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('\n🔧 Render Environment Variable Update Helper\n');
  console.log('This script will help you configure the correct environment variables');
  console.log('for media persistence using Supabase Storage.\n');
  
  console.log('📋 Required Environment Variables:\n');
  
  const requiredVars = [
    {
      key: 'NODE_ENV',
      description: 'Must be "production" for Render deployment',
      defaultValue: 'production',
      required: true
    },
    {
      key: 'FORCE_SUPABASE',
      description: 'Forces Supabase storage (prevents local fallback)',
      defaultValue: 'true',
      required: true
    },
    {
      key: 'SUPABASE_URL',
      description: 'Your Supabase project URL (e.g., https://xxx.supabase.co)',
      currentValue: process.env.SUPABASE_URL || '',
      required: true
    },
    {
      key: 'SUPABASE_ANON_KEY',
      description: 'Your Supabase anonymous/public key',
      currentValue: process.env.SUPABASE_ANON_KEY ? '[CONFIGURED]' : '',
      required: true
    }
  ];
  
  requiredVars.forEach((v, i) => {
    console.log(`${i + 1}. ${v.key}`);
    console.log(`   Description: ${v.description}`);
    if (v.defaultValue) {
      console.log(`   Recommended value: ${v.defaultValue}`);
    }
    if (v.currentValue) {
      console.log(`   Current value: ${v.currentValue}`);
    }
    console.log('');
  });
  
  console.log('🎯 How to Update on Render:\n');
  console.log('1. Visit: https://dashboard.render.com/web/srv-d25arrripnbc73dpeqs0');
  console.log('2. Click "Environment" in the left sidebar');
  console.log('3. Add/update these variables:');
  console.log('');
  console.log('   Variable Name              | Value');
  console.log('   ---------------------------|-----------------------------------');
  console.log('   NODE_ENV                   | production');
  console.log('   FORCE_SUPABASE            | true');
  console.log('   SUPABASE_URL              | https://YOUR_PROJECT.supabase.co');
  console.log('   SUPABASE_ANON_KEY         | eyJhbGc... (your key)');
  console.log('');
  console.log('4. Click "Save Changes"');
  console.log('5. Render will automatically redeploy with new settings');
  console.log('');
  
  console.log('📦 Supabase Bucket Setup:\n');
  console.log('Ensure these buckets exist in your Supabase project:\n');
  console.log('  ✓ profile-images (Public) - For avatars and covers');
  console.log('  ✓ va-videos (Public) - For introduction videos');  
  console.log('  ✓ business-assets (Public) - For business files');
  console.log('  ✓ admin-uploads (Private) - For admin files');
  console.log('');
  console.log('To create buckets automatically:');
  console.log('  node configure-supabase-buckets.js');
  console.log('');
  
  console.log('🔍 Current Environment Check:\n');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'NOT SET ❌'}`);
  console.log(`  FORCE_SUPABASE: ${process.env.FORCE_SUPABASE || 'NOT SET ❌'}`);
  console.log(`  SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Configured' : 'NOT SET ❌'}`);
  console.log(`  SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Configured' : 'NOT SET ❌'}`);
  console.log('');
  
  const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;
  
  if (!hasSupabase) {
    console.log('⚠️  WARNING: Supabase credentials not configured in this environment!');
    console.log('   This is expected if running locally.');
    console.log('   Make sure to add them to your Render service.');
  } else {
    console.log('✅ Supabase credentials found in current environment');
  }
  console.log('');
  
  console.log('✨ After Update:\n');
  console.log('1. New uploads will go to Supabase Storage');
  console.log('2. URLs will look like: https://xxx.supabase.co/storage/v1/object/public/...');
  console.log('3. Images will persist across redeploys');
  console.log('4. Existing users need to re-upload their media');
  console.log('');
  
  rl.close();
}

main().catch(console.error);