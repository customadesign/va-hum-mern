// Quick test to verify Supabase setup
const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const supabaseUrl = 'https://nexilfvrehlkphlrghxn.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY_HERE';

console.log('Testing Supabase connection...\n');
console.log('URL:', supabaseUrl);
console.log('Key provided:', !!supabaseKey);

try {
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client created successfully');
  
  // Test bucket access
  const bucketName = 'linkage-va-hub';
  console.log(`\nChecking bucket '${bucketName}'...`);
  
  // List files in bucket (will fail if bucket doesn't exist or isn't public)
  supabase.storage
    .from(bucketName)
    .list('', { limit: 1 })
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Bucket error:', error.message);
        console.log('\nPossible issues:');
        console.log('1. Bucket does not exist - create it in Supabase dashboard');
        console.log('2. Bucket is not PUBLIC - toggle public access in bucket settings');
        console.log('3. Invalid API key - check your SUPABASE_ANON_KEY');
      } else {
        console.log('✅ Bucket is accessible!');
        console.log('Files in bucket:', data.length);
      }
    });
} catch (err) {
  console.error('❌ Failed to create Supabase client:', err.message);
}