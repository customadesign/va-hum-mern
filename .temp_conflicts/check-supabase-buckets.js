const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔍 Checking Supabase Storage Configuration...\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : (process.env.SUPABASE_SERVICE_KEY ? 'SERVICE_KEY' : 'ANON'));

const requiredBuckets = [
  {
    name: 'linkage-va-hub',
    public: true,
    description: 'Main bucket for legacy support'
  },
  {
    name: 'profile-images',
    public: true,
    description: 'User avatars, covers, and profile images'
  },
  {
    name: 'va-videos',
    public: true,
    description: 'VA video introductions and portfolio'
  },
  {
    name: 'business-assets',
    public: true,
    description: 'Business logos and marketing materials'
  },
  {
    name: 'admin-uploads',
    public: false,
    description: 'Admin-only files and sensitive documents'
  }
];

async function checkBuckets() {
  try {
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials');
      console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('\n📦 Fetching existing buckets...\n');
    const { data: existingBuckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error fetching buckets:', error);
      return;
    }

    console.log('Found', existingBuckets.length, 'existing buckets:\n');
    existingBuckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });

    console.log('\n\n📋 Required buckets check:\n');
    
    const missingBuckets = [];
    for (const required of requiredBuckets) {
      const exists = existingBuckets.find(b => b.name === required.name);
      if (exists) {
        const isPublic = exists.public === required.public;
        console.log(`  ✅ ${required.name} - EXISTS (${exists.public ? 'public' : 'private'}) ${!isPublic ? '⚠️ Wrong visibility!' : ''}`);
      } else {
        console.log(`  ❌ ${required.name} - MISSING`);
        missingBuckets.push(required);
      }
    }

    if (missingBuckets.length > 0) {
      console.log('\n\n🔧 Creating missing buckets...\n');
      
      for (const bucket of missingBuckets) {
        console.log(`Creating ${bucket.name}...`);
        const { data, error } = await supabase.storage.createBucket(bucket.name, {
          public: bucket.public,
          fileSizeLimit: bucket.name === 'va-videos' ? 1073741824 : 10485760 // 1GB for videos, 10MB for others
        });
        
        if (error) {
          console.error(`  ❌ Failed to create ${bucket.name}:`, error.message);
        } else {
          console.log(`  ✅ Created ${bucket.name}`);
        }
      }
    } else {
      console.log('\n✅ All required buckets exist!');
    }

    console.log('\n\n🔐 Bucket Policies Check:\n');
    console.log('Note: For public buckets, ensure you have RLS policies that allow:');
    console.log('  - INSERT: Authenticated users can upload');
    console.log('  - SELECT: Public can read');
    console.log('  - UPDATE: Users can update their own files');
    console.log('  - DELETE: Users can delete their own files');
    
    console.log('\n💡 To set up RLS policies, run these in Supabase SQL Editor:');
    console.log(`
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to public buckets
CREATE POLICY "Public Read Access" ON storage.objects
  FOR SELECT USING (bucket_id IN ('profile-images', 'va-videos', 'business-assets', 'linkage-va-hub'));

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id IN ('profile-images', 'va-videos', 'business-assets', 'linkage-va-hub') AND auth.role() = 'authenticated');

-- Allow users to update their own files
CREATE POLICY "User Update Own Files" ON storage.objects
  FOR UPDATE USING (auth.uid()::text = owner);

-- Allow users to delete their own files
CREATE POLICY "User Delete Own Files" ON storage.objects
  FOR DELETE USING (auth.uid()::text = owner);

-- Admin bucket - restrict to admin users only
CREATE POLICY "Admin Only Access" ON storage.objects
  FOR ALL USING (bucket_id = 'admin-uploads' AND auth.jwt()->>'role' = 'admin');
    `);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBuckets();
