const supabase = require('./config/supabase');

async function testBucket() {
  console.log('🧪 Testing Supabase Bucket Access...\n');
  
  if (!supabase) {
    console.log('❌ Supabase not initialized');
    return;
  }
  
  try {
    // Test 1: List files (READ access)
    console.log('1. Testing READ access...');
    const { data: listData, error: listError } = await supabase.storage
      .from('linkage-va-hub')
      .list('', { limit: 1 });
    
    if (listError) {
      console.log('❌ READ failed:', listError.message);
      if (listError.message.includes('Bucket not found')) {
        console.log('🔧 FIX: Create bucket "linkage-va-hub" in Supabase');
      }
      if (listError.message.includes('row-level security')) {
        console.log('🔧 FIX: Add SELECT policy with "true" condition');
      }
      return;
    }
    console.log('✅ READ access works');
    
    // Test 2: Upload file (WRITE access)
    console.log('2. Testing WRITE access...');
    const testFile = Buffer.from('test');
    const fileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('linkage-va-hub')
      .upload(fileName, testFile);
    
    if (uploadError) {
      console.log('❌ WRITE failed:', uploadError.message);
      if (uploadError.message.includes('row-level security')) {
        console.log('🔧 CRITICAL FIX NEEDED: Add RLS policies!');
        console.log('   Go to: Supabase → Storage → linkage-va-hub → Policies');
        console.log('   Add policy: INSERT operation, "true" condition');
        console.log('   Add policy: UPDATE operation, "true" condition');
        console.log('   Add policy: DELETE operation, "true" condition');
      }
      return;
    }
    
    console.log('✅ WRITE access works');
    
    // Cleanup
    await supabase.storage.from('linkage-va-hub').remove([fileName]);
    console.log('✅ Test complete - everything works!');
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
}

// Set environment variables for test
process.env.SUPABASE_URL = 'https://nexilfvrehlkphlrghxn.supabase.co';
process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leGlsZnZyZWhsa3BobHJnaHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MzY1NjksImV4cCI6MjA2OTMxMjU2OX0.pAoVwyVwOKodsU8hlpI1Zqt2THo6-UvXGDZR3rYhTRs';

testBucket();