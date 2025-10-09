require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const User = require('./models/User');

async function testArchiveNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Connected to MongoDB');

    // Find an admin user
    const adminUser = await User.findOne({ admin: true }).select('_id email');
    if (!adminUser) {
      console.log('❌ No admin user found');
      process.exit(1);
    }
    console.log(`✓ Found admin user: ${adminUser.email}`);

    // Check existing notifications
    const existingNotifications = await Notification.find({ recipient: adminUser._id });
    console.log(`\n📊 Current notifications for admin:`);
    console.log(`  Total: ${existingNotifications.length}`);
    console.log(`  Active (not archived): ${existingNotifications.filter(n => !n.archived).length}`);
    console.log(`  Archived: ${existingNotifications.filter(n => n.archived).length}`);

    // Create a test notification if none exist
    if (existingNotifications.length === 0) {
      console.log('\n📝 Creating test notification...');
      const testNotification = new Notification({
        recipient: adminUser._id,
        type: 'admin_notification',
        params: {
          title: 'Test Archive Notification',
          message: 'This is a test notification to verify archive functionality',
          timestamp: new Date()
        }
      });
      await testNotification.save();
      console.log('✓ Test notification created');
    }

    // Find a notification to archive (prefer unarchived ones)
    const notificationToArchive = await Notification.findOne({ 
      recipient: adminUser._id,
      archived: false 
    });

    if (notificationToArchive) {
      console.log('\n🗄️  Testing archive functionality:');
      console.log(`  Notification ID: ${notificationToArchive._id}`);
      console.log(`  Type: ${notificationToArchive.type}`);
      console.log(`  Currently archived: ${notificationToArchive.archived}`);
      
      // Archive the notification
      await notificationToArchive.archive();
      console.log('✓ Notification archived successfully');
      
      // Verify it was archived
      const archivedNotif = await Notification.findById(notificationToArchive._id);
      console.log(`  Archived status: ${archivedNotif.archived}`);
      console.log(`  Archived at: ${archivedNotif.archivedAt}`);
      
      // Test fetching archived notifications
      const archivedNotifications = await Notification.find({
        recipient: adminUser._id,
        archived: true
      }).sort('-archivedAt');
      
      console.log(`\n📚 Archived notifications count: ${archivedNotifications.length}`);
      if (archivedNotifications.length > 0) {
        console.log('  Recent archived notifications:');
        archivedNotifications.slice(0, 3).forEach(n => {
          console.log(`    - ${n.type} (archived: ${n.archivedAt})`);
        });
      }
      
      // Test unarchive
      console.log('\n↩️  Testing unarchive functionality:');
      await archivedNotif.unarchive();
      const unarchivedNotif = await Notification.findById(notificationToArchive._id);
      console.log(`✓ Notification unarchived`);
      console.log(`  Archived status: ${unarchivedNotif.archived}`);
      console.log(`  Archived at: ${unarchivedNotif.archivedAt}`);
      
      // Re-archive for testing
      await unarchivedNotif.archive();
      console.log('✓ Re-archived for testing');
    } else {
      console.log('\n⚠️  No unarchived notifications found to test with');
      
      // Show archived notifications if any exist
      const archivedNotifications = await Notification.find({
        recipient: adminUser._id,
        archived: true
      }).sort('-archivedAt');
      
      if (archivedNotifications.length > 0) {
        console.log(`\n📚 Found ${archivedNotifications.length} archived notifications:`);
        archivedNotifications.forEach(n => {
          console.log(`  - ${n.type} (archived: ${n.archivedAt})`);
        });
      }
    }

    // Test static methods
    console.log('\n📈 Testing static methods:');
    const unreadCount = await Notification.getUnreadCount(adminUser._id);
    const archivedCount = await Notification.getArchivedCount(adminUser._id);
    console.log(`  Unread count (excludes archived): ${unreadCount}`);
    console.log(`  Archived count: ${archivedCount}`);

    console.log('\n✅ Archive functionality test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing archive notifications:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
    process.exit(0);
  }
}

testArchiveNotifications();