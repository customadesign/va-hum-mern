const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function testSupabaseConfiguration() {
  console.log('🔍 Testing Supabase Configuration...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`SUPABASE_BUCKET: ${process.env.SUPABASE_BUCKET ? '✅ Set' : '❌ Missing'}\n`);
  
  // Check if values are placeholders
  console.log('🔍 Checking for Placeholder Values:');
  if (process.env.SUPABASE_URL?.includes('your-supabase-project')) {
    console.log('❌ SUPABASE_URL contains placeholder value');
  } else if (process.env.SUPABASE_URL?.includes('.supabase.co')) {
    console.log('✅ SUPABASE_URL appears to be valid');
  }
  
  if (process.env.SUPABASE_ANON_KEY?.includes('your-supabase')) {
    console.log('❌ SUPABASE_ANON_KEY contains placeholder value');
  } else if (process.env.SUPABASE_ANON_KEY?.startsWith('eyJ')) {
    console.log('✅ SUPABASE_ANON_KEY appears to be valid JWT');
  }
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY is missing');
  } else if (process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ')) {
    console.log('✅ SUPABASE_SERVICE_ROLE_KEY appears to be valid JWT');
  }
  
  console.log('');
  
  // Test connection if we have valid looking credentials
  if (process.env.SUPABASE_URL && 
      process.env.SUPABASE_URL.includes('.supabase.co') && 
      !process.env.SUPABASE_URL.includes('your-supabase-project')) {
    
    console.log('🌐 Testing Connection...');
    
    try {
      // Test with anon key
      const supabaseAnon = createClient(
        process.env.SUPABASE_URL, 
        process.env.SUPABASE_ANON_KEY
      );
      
      // Test basic connection
      const { data, error } = await supabaseAnon.storage.listBuckets();
      
      if (error) {
        console.log('❌ Connection failed:', error.message);
      } else {
        console.log('✅ Connection successful!');
        console.log(`📦 Found ${data.length} bucket(s):`, data.map(b => b.name));
        
        // Check for required bucket
        const hasRequiredBucket = data.some(bucket => bucket.name === process.env.SUPABASE_BUCKET);
        if (hasRequiredBucket) {
          console.log(`✅ Required bucket '${process.env.SUPABASE_BUCKET}' exists`);
        } else {
          console.log(`❌ Required bucket '${process.env.SUPABASE_BUCKET}' not found`);
          console.log('   Create it in Supabase Dashboard → Storage → Buckets');
        }
      }
    } catch (error) {
      console.log('❌ Connection test failed:', error.message);
    }
    
    // Test service role key if available
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('\n🔑 Testing Service Role Key...');
      try {
        const supabaseService = createClient(
          process.env.SUPABASE_URL, 
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        const { data, error } = await supabaseService.storage.listBuckets();
        if (error) {
          console.log('❌ Service role key test failed:', error.message);
        } else {
          console.log('✅ Service role key working correctly');
        }
      } catch (error) {
        console.log('❌ Service role key test failed:', error.message);
      }
    }
  } else {
    console.log('⚠️ Cannot test connection - using placeholder values');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select or create your project');
  console.log('3. Go to Settings → API');
  console.log('4. Copy Project URL, anon key, and service_role key');
  console.log('5. Update your .env file with actual values');
  console.log('6. Create storage bucket: linkage-va-hub');
  console.log('7. Run this test again to verify setup');
}

testSupabaseConfiguration().catch(console.error);