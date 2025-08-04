const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const bucketName = process.env.SUPABASE_BUCKET || 'linkage-va-hub';

console.log('🔧 Creating Supabase Storage Bucket...');
console.log('URL:', supabaseUrl);
console.log('Bucket:', bucketName);
console.log('Key configured:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
  try {
    // 1. List existing buckets first
    console.log('\n1. Checking existing buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      console.log('\n💡 This might be a permission issue. Check:');
      console.log('1. Your Supabase API key has storage permissions');
      console.log('2. You\'re using the correct project URL');
      console.log('3. The project has storage enabled');
      return;
    }
    
    console.log('Available buckets:', buckets.map(b => b.name));
    
    // 2. Check if bucket already exists
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    if (bucketExists) {
      console.log(`✅ Bucket '${bucketName}' already exists!`);
      return;
    }
    
    // 3. Create the bucket
    console.log(`\n2. Creating bucket: ${bucketName}`);
    const { data: createData, error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true
    });
    
    if (createError) {
      console.error('❌ Error creating bucket:', createError);
      console.log('\n💡 Possible solutions:');
      console.log('1. Create the bucket manually in Supabase Dashboard');
      console.log('2. Check if you have admin permissions');
      console.log('3. Try a different bucket name');
      return;
    }
    
    console.log('✅ Bucket created successfully!');
    console.log('Bucket data:', createData);
    
    // 4. Verify the bucket was created
    console.log('\n3. Verifying bucket creation...');
    const { data: bucketsAfter, error: listAfterError } = await supabase.storage.listBuckets();
    
    if (listAfterError) {
      console.error('❌ Error listing buckets after creation:', listAfterError);
    } else {
      const newBucketExists = bucketsAfter.some(bucket => bucket.name === bucketName);
      if (newBucketExists) {
        console.log('✅ Bucket confirmed in list!');
        console.log('All buckets:', bucketsAfter.map(b => b.name));
      } else {
        console.log('❌ Bucket not found in list after creation');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createBucket(); 