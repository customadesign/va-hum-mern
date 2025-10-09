const mongoose = require('mongoose');
const Announcement = require('./models/Announcement');
const VA = require('./models/VA'); // Import VA model
require('dotenv').config();

async function createTestAnnouncement() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create test announcements without specific user
    const announcement1 = new Announcement({
      title: 'New Platform Features Released',
      content: '<p>We\'re excited to announce <strong>new features</strong> to help you connect with businesses faster:</p><ul><li>Enhanced profile visibility</li><li>Real-time messaging improvements</li><li>New skill badges system</li></ul>',
      targetAudience: 'va',
      priority: 'high',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    await announcement1.save();
    console.log('Test announcement 1 created successfully:', announcement1._id);

    // Create another announcement
    const announcement2 = new Announcement({
      title: 'Weekly Platform Maintenance',
      content: 'The platform will undergo scheduled maintenance on Sunday from 2 AM to 4 AM EST. You may experience brief interruptions during this time.',
      targetAudience: 'all',
      priority: 'normal',
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    });

    await announcement2.save();
    console.log('Test announcement 2 created:', announcement2._id);

    // Create an urgent announcement
    const announcement3 = new Announcement({
      title: 'Action Required: Update Your Payment Information',
      content: '<p style="color: red;">Please update your payment information by end of day to ensure uninterrupted service.</p>',
      targetAudience: 'va',
      priority: 'urgent',
      expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // 1 day from now
    });

    await announcement3.save();
    console.log('Test announcement 3 (urgent) created:', announcement3._id);

    // Create a low priority announcement
    const announcement4 = new Announcement({
      title: 'New Blog Post: Tips for Virtual Assistants',
      content: 'Check out our latest blog post with tips and tricks for maximizing your success as a virtual assistant.',
      targetAudience: 'va',
      priority: 'low',
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
    });

    await announcement4.save();
    console.log('Test announcement 4 (low priority) created:', announcement4._id);

    console.log('\nAll test announcements created successfully!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestAnnouncement();
