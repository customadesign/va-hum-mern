const mongoose = require('mongoose');
const VA = require('./models/VA');

async function checkIndustries() {
  try {
    console.log('🔍 Checking industries in database...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/linkagevahub');
    console.log('✅ Connected to MongoDB\n');

    // Get all unique industries
    const industries = await VA.aggregate([
      { $match: { industry: { $exists: true, $ne: null } } },
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📊 Industries found in database:');
    industries.forEach(ind => {
      console.log(`  ${ind._id}: ${ind.count} VAs`);
    });

    // Check if any match frontend industries
    const frontendIndustries = [
      'ecommerce', 'real_estate', 'digital_marketing', 'social_media_management',
      'customer_service', 'bookkeeping', 'content_creation', 'graphic_design',
      'virtual_assistance', 'data_entry', 'lead_generation', 'email_marketing',
      'amazon_fba', 'shopify', 'wordpress', 'video_editing',
      'podcast_management', 'project_management', 'human_resources', 'online_tutoring',
      'travel_planning', 'healthcare', 'finance', 'saas', 'other'
    ];

    console.log('\n🎯 Matching industries:');
    frontendIndustries.forEach(frontInd => {
      const found = industries.find(dbInd => dbInd._id === frontInd);
      console.log(`  ${frontInd}: ${found ? '✅' : '❌'} ${found ? found.count : 0} VAs`);
    });

    // Update some VAs to have matching industries
    console.log('\n🔧 Updating some VAs to have matching industries...');
    const updates = [
      { name: 'Maria Clara Santos', industry: 'customer_service' },
      { name: 'John Smith', industry: 'technology' },
      { name: 'Jane Doe', industry: 'digital_marketing' },
      { name: 'Bob Wilson', industry: 'ecommerce' }
    ];

    for (const update of updates) {
      const va = await VA.findOne({ name: update.name });
      if (va) {
        await VA.findByIdAndUpdate(va._id, { industry: update.industry });
        console.log(`✅ Updated ${va.name} to industry: ${update.industry}`);
      } else {
        console.log(`❌ VA not found: ${update.name}`);
      }
    }

    console.log('\n✅ Industry check completed!');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkIndustries();