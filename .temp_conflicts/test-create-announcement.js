const mongoose = require('mongoose');
const Announcement = require('./models/Announcement');
const User = require('./models/User');
require('dotenv').config();

async function createTestAnnouncement() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a test VA user
    const vaUser = await User.findOne({ va: { $exists: true } }).populate('va');
    if (!vaUser) {
      console.log('No VA user found');
      return;
    }

    console.log('Found VA user:', vaUser.email);

    // Create a test announcement for VAs
    const announcement = new Announcement({
      title: 'New Platform Features Released',
      content: '<p>We\'re excited to announce <strong>new features</strong> to help you connect with businesses faster:</p><ul><li>Enhanced profile visibility</li><li>Real-time messaging improvements</li><li>New skill badges system</li></ul>',
      targetAudience: 'va',
      priority: 'high',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdBy: vaUser._id
    });

    await announcement.save();
    console.log('Test announcement created successfully:', announcement._id);

    // Create another announcement
    const announcement2 = new Announcement({
      title: 'Weekly Platform Maintenance',
      content: 'The platform will undergo scheduled maintenance on Sunday from 2 AM to 4 AM EST. You may experience brief interruptions during this time.',
      targetAudience: 'all',
      priority: 'normal',
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      createdBy: vaUser._id
    });

    await announcement2.save();
    console.log('Second test announcement created:', announcement2._id);

    // Create an urgent announcement
    const announcement3 = new Announcement({
      title: 'Action Required: Update Your Payment Information',
      content: '<p style="color: red;">Please update your payment information by end of day to ensure uninterrupted service.</p>',
      targetAudience: 'va',
      priority: 'urgent',
      expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      createdBy: vaUser._id
    });

    await announcement3.save();
    console.log('Urgent test announcement created:', announcement3._id);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestAnnouncement();
