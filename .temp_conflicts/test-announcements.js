const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Announcement = require('./models/Announcement');
const AnnouncementRead = require('./models/AnnouncementRead');
const User = require('./models/User');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for announcement testing');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Test the announcement system
const testAnnouncements = async () => {
  await connectDB();

  try {
    // Find an admin user
    const adminUser = await User.findOne({ admin: true });
    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.');
      process.exit(1);
    }
    console.log(`Using admin user: ${adminUser.email}`);

    // Create test announcements
    console.log('\n--- Creating Test Announcements ---');
    
    const announcements = [
      {
        title: 'Welcome to the New Announcement System!',
        content: 'We are excited to introduce our new announcement system that will keep you updated with important news and updates.',
        contentRichText: '<p>We are excited to introduce our <strong>new announcement system</strong> that will keep you updated with important news and updates.</p>',
        targetAudience: 'all',
        priority: 'high',
        category: 'feature',
        tags: ['system', 'new-feature'],
        createdBy: adminUser._id
      },
      {
        title: 'VA Training Session Next Week',
        content: 'All VAs are invited to join our comprehensive training session on advanced business support techniques.',
        targetAudience: 'va',
        priority: 'normal',
        category: 'event',
        tags: ['training', 'va-only'],
        createdBy: adminUser._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
      },
      {
        title: 'New Business Features Available',
        content: 'Business accounts now have access to enhanced analytics and reporting tools.',
        targetAudience: 'business',
        priority: 'normal',
        category: 'update',
        tags: ['business', 'features'],
        createdBy: adminUser._id
      },
      {
        title: 'Urgent: System Maintenance Tonight',
        content: 'The platform will be undergoing maintenance from 11 PM to 2 AM EST. Please save your work.',
        targetAudience: 'all',
        priority: 'urgent',
        category: 'maintenance',
        tags: ['maintenance', 'urgent'],
        createdBy: adminUser._id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 24 hours
      }
    ];

    const createdAnnouncements = [];
    for (const announcementData of announcements) {
      const announcement = await Announcement.create(announcementData);
      createdAnnouncements.push(announcement);
      console.log(`✅ Created: "${announcement.title}" (Priority: ${announcement.priority}, Target: ${announcement.targetAudience})`);
    }

    // Test fetching announcements for different user types
    console.log('\n--- Testing Announcement Retrieval ---');
    
    // For VA users
    const vaAnnouncements = await Announcement.getActiveForUser({ role: 'va', admin: false });
    console.log(`VA user can see ${vaAnnouncements.length} announcements`);
    
    // For Business users
    const businessAnnouncements = await Announcement.getActiveForUser({ role: 'business', admin: false });
    console.log(`Business user can see ${businessAnnouncements.length} announcements`);
    
    // For Admin users
    const adminAnnouncements = await Announcement.getActiveForUser(adminUser);
    console.log(`Admin user can see ${adminAnnouncements.length} announcements`);

    // Test marking announcements as read
    console.log('\n--- Testing Read Tracking ---');
    
    const firstAnnouncement = createdAnnouncements[0];
    await AnnouncementRead.markAsRead(firstAnnouncement._id, adminUser._id, {
      interaction: 'viewed',
      timeSpent: 15
    });
    console.log(`✅ Marked announcement "${firstAnnouncement.title}" as read by admin`);

    // Check if announcement is read
    const isRead = await AnnouncementRead.hasUserRead(firstAnnouncement._id, adminUser._id);
    console.log(`Is announcement read by admin? ${isRead}`);

    // Get statistics
    const stats = await AnnouncementRead.getAnnouncementStats(firstAnnouncement._id);
    console.log(`Announcement stats:`, stats);

    // Test archive expired functionality
    console.log('\n--- Testing Archive Functionality ---');
    
    // Create an expired announcement
    const expiredAnnouncement = await Announcement.create({
      title: 'Expired Test Announcement',
      content: 'This announcement has already expired.',
      targetAudience: 'all',
      priority: 'low',
      createdBy: adminUser._id,
      expiresAt: new Date(Date.now() - 1000) // Already expired
    });
    console.log(`Created expired announcement: "${expiredAnnouncement.title}"`);

    // Archive expired announcements
    const archiveResult = await Announcement.archiveExpired();
    console.log(`Archived ${archiveResult.modifiedCount} expired announcements`);

    // Verify the expired announcement is now inactive
    const archivedAnnouncement = await Announcement.findById(expiredAnnouncement._id);
    console.log(`Expired announcement is now inactive: ${!archivedAnnouncement.isActive}`);

    console.log('\n✅ All announcement tests completed successfully!');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Clean up test data
    console.log('\n--- Cleaning Up Test Data ---');
    await Announcement.deleteMany({ 
      title: { 
        $in: [
          'Welcome to the New Announcement System!',
          'VA Training Session Next Week',
          'New Business Features Available',
          'Urgent: System Maintenance Tonight',
          'Expired Test Announcement'
        ] 
      } 
    });
    await AnnouncementRead.deleteMany({});
    console.log('Test data cleaned up');
    
    mongoose.connection.close();
    process.exit(0);
  }
};

// Run the tests
testAnnouncements();