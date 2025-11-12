const mongoose = require('mongoose');
const VA = require('./models/VA');

async function createTestVAs() {
  try {
    console.log('🔧 Creating test VAs with different industries...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/linkagevahub');
    console.log('✅ Connected to MongoDB\n');

    // Create test VAs with different industries
    const testVAs = [
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        bio: 'Experienced software developer with 5 years of experience in web development.',
        searchStatus: 'actively_looking',
        industry: 'technology',
        yearsOfExperience: 5,
        availability: 'immediately',
        preferredMinHourlyRate: 25,
        preferredMaxHourlyRate: 50
      },
      {
        name: 'Bob Smith',
        email: 'bob@example.com',
        bio: 'Digital marketing specialist with expertise in social media and email campaigns.',
        searchStatus: 'actively_looking',
        industry: 'digital_marketing',
        yearsOfExperience: 3,
        availability: 'within_week',
        preferredMinHourlyRate: 20,
        preferredMaxHourlyRate: 40
      },
      {
        name: 'Carol Williams',
        email: 'carol@example.com',
        bio: 'E-commerce specialist with experience in Shopify and Amazon FBA.',
        searchStatus: 'actively_looking',
        industry: 'ecommerce',
        yearsOfExperience: 4,
        availability: 'immediately',
        preferredMinHourlyRate: 22,
        preferredMaxHourlyRate: 45
      },
      {
        name: 'David Brown',
        email: 'david@example.com',
        bio: 'Creative graphic designer specializing in branding and visual identity.',
        searchStatus: 'actively_looking',
        industry: 'graphic_design',
        yearsOfExperience: 2,
        availability: 'within_month',
        preferredMinHourlyRate: 18,
        preferredMaxHourlyRate: 35
      },
      {
        name: 'Emma Davis',
        email: 'emma@example.com',
        bio: 'Customer service representative with excellent communication skills.',
        searchStatus: 'actively_looking',
        industry: 'customer_service',
        yearsOfExperience: 6,
        availability: 'immediately',
        preferredMinHourlyRate: 15,
        preferredMaxHourlyRate: 30
      },
      {
        name: 'Frank Miller',
        email: 'frank@example.com',
        bio: 'Content creator and social media manager.',
        searchStatus: 'actively_looking',
        industry: 'social_media_management',
        yearsOfExperience: 3,
        availability: 'within_week',
        preferredMinHourlyRate: 20,
        preferredMaxHourlyRate: 40
      },
      {
        name: 'Grace Wilson',
        email: 'grace@example.com',
        bio: 'Bookkeeping and accounting professional.',
        searchStatus: 'actively_looking',
        industry: 'bookkeeping',
        yearsOfExperience: 7,
        availability: 'immediately',
        preferredMinHourlyRate: 25,
        preferredMaxHourlyRate: 50
      },
      {
        name: 'Henry Taylor',
        email: 'henry@example.com',
        bio: 'Content writer and video editor.',
        searchStatus: 'actively_looking',
        industry: 'content_creation',
        yearsOfExperience: 4,
        availability: 'within_month',
        preferredMinHourlyRate: 22,
        preferredMaxHourlyRate: 45
      },
      {
        name: 'Ivy Anderson',
        email: 'ivy@example.com',
        bio: 'Data entry specialist with high accuracy and speed.',
        searchStatus: 'actively_looking',
        industry: 'data_entry',
        yearsOfExperience: 2,
        availability: 'immediately',
        preferredMinHourlyRate: 12,
        preferredMaxHourlyRate: 25
      },
      {
        name: 'Jack Thomas',
        email: 'jack@example.com',
        bio: 'Lead generation expert with proven results.',
        searchStatus: 'actively_looking',
        industry: 'lead_generation',
        yearsOfExperience: 5,
        availability: 'within_week',
        preferredMinHourlyRate: 28,
        preferredMaxHourlyRate: 55
      }
    ];

    console.log(`Creating ${testVAs.length} test VAs...`);
    
    for (const vaData of testVAs) {
      try {
        // Check if VA already exists
        const existingVA = await VA.findOne({ email: vaData.email });
        if (existingVA) {
          console.log(`⚠️  VA with email ${vaData.email} already exists, skipping...`);
          continue;
        }

        // Create VA
        const va = await VA.create(vaData);
        console.log(`✅ Created VA: ${va.name} (${va.industry})`);
      } catch (error) {
        console.error(`❌ Failed to create VA ${vaData.name}:`, error.message);
      }
    }

    console.log('\n✅ Test VA creation completed!');
    
  } catch (error) {
    console.error('❌ Creation failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createTestVAs();