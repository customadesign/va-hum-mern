require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('./backend/node_modules/@supabase/supabase-js');

async function testSupabaseFix() {
  console.log('🧪 Testing Supabase Configuration Fix...\n');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  console.log('Environment Variables:');
  console.log('✓ SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('✓ SUPABASE_ANON_KEY:', supabaseKey ? 'Set (length: ' + supabaseKey.length + ')' : 'Missing');
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing credentials');
    return;
  }
  
  try {
    console.log('\n🔗 Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Client created successfully');
    
    console.log('\n🪣 Testing bucket access...');
    const { data, error } = await supabase.storage
      .from('linkage-va-hub')
      .list('', { limit: 1 });
    
    if (error) {
      console.log('❌ Bucket test failed:', error.message);
      
      if (error.message.includes('Invalid API key')) {
        console.log('\n🔧 ISSUE: Invalid API key');
        console.log('   → The ANON key doesn\'t match this project');
        console.log('   → Get the correct key from Supabase dashboard');
      }
      
      if (error.message.includes('Bucket not found')) {
        console.log('\n🔧 ISSUE: Bucket doesn\'t exist');
        console.log('   → Create bucket "linkage-va-hub" in Supabase');
        console.log('   → Make sure it\'s set to PUBLIC');
      }
      
      if (error.message.includes('row-level security')) {
        console.log('\n🔧 ISSUE: RLS policies not configured');
        console.log('   → Add storage policies for anonymous access');
      }
      
      return;
    }
    
    console.log('✅ Bucket test successful!');
    console.log('   → Files in bucket:', data.length);
    
    console.log('\n🧪 Testing upload capabilities...');
    const testFile = Buffer.from('test file content');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('linkage-va-hub')
      .upload('test/test-file.txt', testFile, {
        contentType: 'text/plain',
        upsert: true
      });
    
    if (uploadError) {
      console.log('❌ Upload test failed:', uploadError.message);
      if (uploadError.message.includes('row-level security')) {
        console.log('\n🔧 CRITICAL: You need to add RLS policies!');
        console.log('   1. Go to Supabase → Storage → linkage-va-hub → Policies');
        console.log('   2. Add policy: Operation=INSERT, Policy=true');
        console.log('   3. Add policy: Operation=SELECT, Policy=true');
        console.log('   4. Add policy: Operation=UPDATE, Policy=true');
        console.log('   5. Add policy: Operation=DELETE, Policy=true');
      }
    } else {
      console.log('✅ Upload test successful!');
      console.log('   → File uploaded to:', uploadData.path);
      
      // Clean up test file
      await supabase.storage.from('linkage-va-hub').remove(['test/test-file.txt']);
      console.log('   → Test file cleaned up');
    }
    
  } catch (err) {
    console.log('❌ Test failed with error:', err.message);
  }
}

testSupabaseFix();