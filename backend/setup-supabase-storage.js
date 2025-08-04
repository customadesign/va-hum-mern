const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const bucketName = process.env.SUPABASE_BUCKET || "linkage-va-hub";

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase configuration in .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  try {
    console.log("🔧 Setting up Supabase Storage...");
    console.log("URL:", supabaseUrl);
    console.log("Bucket:", bucketName);

    // 1. Check if bucket exists
    console.log("\n1. Checking if bucket exists...");
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error("❌ Error listing buckets:", listError);
      return;
    }

    const bucketExists = buckets.some((bucket) => bucket.name === bucketName);

    if (!bucketExists) {
      console.log(`📦 Creating bucket: ${bucketName}`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true
      });
      
      if (createError) {
        console.error('❌ Error creating bucket:', createError);
        return;
      }
      console.log('✅ Bucket created successfully');
    } else {
      console.log('✅ Bucket already exists');
    }

    // 2. Set up RLS policies
    console.log('\n2. Setting up RLS policies...');
    
    // Policy to allow public read access
    const publicReadPolicy = `
      CREATE POLICY "Public read access" ON storage.objects
      FOR SELECT USING (bucket_id = '${bucketName}');
    `;

    // Policy to allow authenticated users to upload
    const uploadPolicy = `
      CREATE POLICY "Authenticated users can upload" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = '${bucketName}' 
        AND auth.role() = 'authenticated'
      );
    `;

    // Policy to allow users to update their own files
    const updatePolicy = `
      CREATE POLICY "Users can update own files" ON storage.objects
      FOR UPDATE USING (
        bucket_id = '${bucketName}' 
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
    `;

    // Policy to allow users to delete their own files
    const deletePolicy = `
      CREATE POLICY "Users can delete own files" ON storage.objects
      FOR DELETE USING (
        bucket_id = '${bucketName}' 
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
    `;

    console.log('📝 Note: RLS policies need to be set up manually in Supabase Dashboard');
    console.log('\n📋 Copy and paste these SQL commands in your Supabase SQL Editor:');
    console.log('\n' + '='.repeat(60));
    console.log(publicReadPolicy);
    console.log(uploadPolicy);
    console.log(updatePolicy);
    console.log(deletePolicy);
    console.log('='.repeat(60));

    // 3. Test upload
    console.log('\n3. Testing upload...');
    const testFile = Buffer.from('test file content');
    const testFileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testFileName, testFile, {
        contentType: 'text/plain'
      });

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message);
      console.log('\n💡 This is likely due to RLS policies. Please:');
      console.log('1. Go to Supabase Dashboard → Storage → Policies');
      console.log('2. Click "New Policy" for the bucket');
      console.log('3. Choose "Create a policy from scratch"');
      console.log('4. Set Policy Name: "Public read access"');
      console.log('5. Set Target roles: "public"');
      console.log('6. Set Using expression: "true"');
      console.log('7. Save the policy');
    } else {
      console.log('✅ Upload test successful!');
      
      // Clean up test file
      await supabase.storage.from(bucketName).remove([testFileName]);
      console.log('🧹 Test file cleaned up');
    }

    console.log('\n🎉 Supabase Storage setup complete!');
    console.log(`📁 Files will be stored in: ${bucketName}`);
    console.log(`🌐 Public URL format: ${supabaseUrl}/storage/v1/object/public/${bucketName}/...`);

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupStorage();
