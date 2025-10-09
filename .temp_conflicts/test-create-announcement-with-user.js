const mongoose = require('mongoose');
const Announcement = require('./models/Announcement');
const User = require('./models/User');
require('dotenv').config();

async function createTestAnnouncement() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin user or any user to use as creator
    let adminUser = await User.findOne({ admin: true });
    if (!adminUser) {
      adminUser = await User.findOne();
      if (!adminUser) {
        console.log('No users found in database. Please create a user first.');
        return;
      }
    }

    console.log('Using user:', adminUser.email, 'as creator');

    // Clear existing announcements first (optional)
    const clearExisting = process.argv.includes('--clear');
    if (clearExisting) {
      await Announcement.deleteMany({});
      console.log('Cleared existing announcements');
    }

    // Create test announcements
    const announcement1 = new Announcement({
      title: 'New Platform Features Released',
      content: '<p>We\'re excited to announce <strong>new features</strong> to help you connect with businesses faster:</p><ul><li>Enhanced profile visibility</li><li>Real-time messaging improvements</li><li>New skill badges system</li></ul>',
      targetAudience: 'va',
      priority: 'high',
      category: 'feature',
      tags: ['update', 'features', 'platform'],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdBy: adminUser._id
    });

    await announcement1.save();
    console.log('✅ Test announcement 1 created successfully:', announcement1._id);

    // Create another announcement
    const announcement2 = new Announcement({
      title: 'Weekly Platform Maintenance',
      content: 'The platform will undergo scheduled maintenance on Sunday from 2 AM to 4 AM EST. You may experience brief interruptions during this time.',
      targetAudience: 'all',
      priority: 'normal',
      category: 'maintenance',
      tags: ['maintenance', 'scheduled'],
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      createdBy: adminUser._id
    });

    await announcement2.save();
    console.log('✅ Test announcement 2 created:', announcement2._id);

    // Create an urgent announcement
    const announcement3 = new Announcement({
      title: 'Action Required: Update Your Payment Information',
      content: '<p style="color: red;">Please update your payment information by end of day to ensure uninterrupted service.</p>',
      targetAudience: 'va',
      priority: 'urgent',
      category: 'policy',
      tags: ['urgent', 'payment', 'action-required'],
      expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      createdBy: adminUser._id
    });

    await announcement3.save();
    console.log('✅ Test announcement 3 (urgent) created:', announcement3._id);

    // Create a low priority announcement
    const announcement4 = new Announcement({
      title: 'New Blog Post: Tips for Virtual Assistants',
      content: 'Check out our latest blog post with tips and tricks for maximizing your success as a virtual assistant.',
      targetAudience: 'va',
      priority: 'low',
      category: 'general',
      tags: ['blog', 'tips', 'resources'],
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      createdBy: adminUser._id
    });

    await announcement4.save();
    console.log('✅ Test announcement 4 (low priority) created:', announcement4._id);

    // Create business-specific announcement
    const announcement5 = new Announcement({
      title: 'Business Feature Update: Enhanced VA Search',
      content: '<p>New search filters are now available to help you find the perfect VA:</p><ul><li>Filter by industry experience</li><li>Sort by availability</li><li>View detailed skill assessments</li></ul>',
      targetAudience: 'business',
      priority: 'normal',
      category: 'feature',
      tags: ['business', 'search', 'filters'],
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      createdBy: adminUser._id
    });

    await announcement5.save();
    console.log('✅ Test announcement 5 (business) created:', announcement5._id);

    // Create event announcement
    const announcement6 = new Announcement({
      title: 'Upcoming Webinar: Mastering Client Communication',
      content: '<p>Join us for an exclusive webinar on <strong>March 15th at 2 PM EST</strong>!</p><p>Learn effective communication strategies that will help you:</p><ul><li>Build stronger client relationships</li><li>Handle difficult conversations professionally</li><li>Improve your response rates</li></ul><p><a href="#">Register Now →</a></p>',
      targetAudience: 'va',
      priority: 'high',
      category: 'event',
      tags: ['webinar', 'training', 'communication'],
      expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      createdBy: adminUser._id
    });

    await announcement6.save();
    console.log('✅ Test announcement 6 (event) created:', announcement6._id);

    console.log('\n🎉 All test announcements created successfully!');

    // Count total announcements
    const count = await Announcement.countDocuments();
    const vaCount = await Announcement.countDocuments({ targetAudience: { $in: ['va', 'all'] } });
    const businessCount = await Announcement.countDocuments({ targetAudience: { $in: ['business', 'all'] } });
    
    console.log(`\n📊 Announcement Statistics:`);
    console.log(`  Total announcements: ${count}`);
    console.log(`  VA-targeted: ${vaCount}`);
    console.log(`  Business-targeted: ${businessCount}`);
    console.log(`\n💡 Usage: Run with --clear flag to delete existing announcements first`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      Object.keys(error.errors).forEach(field => {
        console.error(`  - ${field}: ${error.errors[field].message}`);
      });
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

createTestAnnouncement();
