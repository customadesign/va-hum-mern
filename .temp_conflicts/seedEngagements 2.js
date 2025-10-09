const mongoose = require('mongoose');
const Engagement = require('../models/Engagement');
const User = require('../models/User');

// Connect to MongoDB
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub');

async function seedEngagements() {
  try {
    console.log('🌱 Starting engagement seeding...');

    // Find some business users and VAs for sample data
    const businessUsers = await User.find({ 
      $or: [
        { business: { $exists: true, $ne: null } },
        { isBusinessUser: true }
      ]
    }).limit(3);

    const vaUsers = await User.find({
      va: { $exists: true, $ne: null }
    }).limit(10);

    if (businessUsers.length === 0) {
      console.log('❌ No business users found. Please seed business users first.');
      return;
    }

    if (vaUsers.length === 0) {
      console.log('❌ No VA users found. Please seed VAs first.');
      return;
    }

    console.log(`Found ${businessUsers.length} business users and ${vaUsers.length} VAs`);

    // Clear existing engagements
    await Engagement.deleteMany({});
    console.log('🗑️  Cleared existing engagements');

    const sampleEngagements = [];
    const statuses = ['active', 'considering', 'past', 'paused'];
    
    // Create sample engagements for each business user
    for (const businessUser of businessUsers) {
      const numEngagements = Math.floor(Math.random() * 8) + 3; // 3-10 engagements per business
      
      for (let i = 0; i < numEngagements && i < vaUsers.length; i++) {
        const va = vaUsers[i % vaUsers.length];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Generate realistic dates
        const daysAgo = Math.floor(Math.random() * 365); // Up to 1 year ago
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);
        
        let endDate = null;
        if (status === 'past' || Math.random() > 0.7) {
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 180) + 30); // 30-210 days duration
        }

        const hoursPerWeek = [10, 15, 20, 25, 30, 40][Math.floor(Math.random() * 6)];
        const rate = Math.floor(Math.random() * 40) + 10; // $10-50/hr

        const engagement = {
          clientId: businessUser._id,
          vaId: va._id,
          status,
          contract: {
            startDate,
            endDate,
            hoursPerWeek,
            rate,
            currency: 'USD'
          },
          notes: [
            'Great communication and attention to detail',
            'Excellent work on the project deliverables',
            'Very responsive and professional',
            'Strong technical skills and problem-solving',
            'Reliable and meets all deadlines'
          ][Math.floor(Math.random() * 5)],
          tags: [
            ['admin', 'data-entry'],
            ['marketing', 'social-media'],
            ['development', 'frontend'],
            ['design', 'graphics'],
            ['customer-service', 'support']
          ][Math.floor(Math.random() * 5)],
          createdBy: businessUser._id,
          lastActivityAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Within last 30 days
        };

        sampleEngagements.push(engagement);
      }
    }

    // Insert sample engagements
    const insertedEngagements = await Engagement.insertMany(sampleEngagements);
    console.log(`✅ Created ${insertedEngagements.length} sample engagements`);

    // Print summary by business user
    for (const businessUser of businessUsers) {
      const userEngagements = insertedEngagements.filter(
        e => e.clientId.toString() === businessUser._id.toString()
      );
      
      const statusCounts = userEngagements.reduce((acc, e) => {
        acc[e.status] = (acc[e.status] || 0) + 1;
        return acc;
      }, {});

      console.log(`📊 ${businessUser.name || businessUser.email}:`, statusCounts);
    }

    console.log('🎉 Engagement seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding engagements:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run if called directly
if (require.main === module) {
  seedEngagements();
}

module.exports = seedEngagements;
