const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const VA = require('./models/VA');
const Business = require('./models/Business');
const File = require('./models/File');

async function testProfileImages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test 1: Check User avatars
    console.log('\n📸 Testing User Profile Images...');
    const usersWithAvatars = await User.find({ avatar: { $exists: true, $ne: null } })
      .populate('avatarFileId')
      .limit(5);
    
    console.log(`Found ${usersWithAvatars.length} users with avatars`);
    usersWithAvatars.forEach(user => {
      console.log(`- ${user.email}: ${user.avatar}`);
      if (user.avatarFileId) {
        console.log(`  File storage: ${user.avatarFileId.storageProvider || 'unknown'}`);
      }
    });

    // Test 2: Check VA avatars
    console.log('\n👤 Testing VA Profile Images...');
    const vasWithAvatars = await VA.find({ avatar: { $exists: true, $ne: null } })
      .populate('user')
      .limit(5);
    
    console.log(`Found ${vasWithAvatars.length} VAs with avatars`);
    vasWithAvatars.forEach(va => {
      console.log(`- ${va.name}: ${va.avatar}`);
      if (va.user) {
        console.log(`  User avatar: ${va.user.avatar || 'none'}`);
      }
    });

    // Test 3: Check Business avatars
    console.log('\n🏢 Testing Business Profile Images...');
    const businessesWithAvatars = await Business.find({ avatar: { $exists: true, $ne: null } })
      .populate('user')
      .limit(5);
    
    console.log(`Found ${businessesWithAvatars.length} businesses with avatars`);
    businessesWithAvatars.forEach(business => {
      console.log(`- ${business.company}: ${business.avatar}`);
      if (business.user) {
        console.log(`  User avatar: ${business.user.avatar || 'none'}`);
      }
    });

    // Test 4: Check avatar synchronization
    console.log('\n🔄 Testing Avatar Synchronization...');
    const vasWithUsers = await VA.find({})
      .populate('user')
      .limit(10);
    
    let syncedCount = 0;
    let unsyncedCount = 0;
    
    vasWithUsers.forEach(va => {
      if (va.avatar && va.user) {
        if (va.avatar === va.user.avatar) {
          syncedCount++;
        } else {
          unsyncedCount++;
          console.log(`❌ Unsynchronized: VA ${va.name} has ${va.avatar}, User has ${va.user.avatar}`);
        }
      }
    });
    
    console.log(`✅ Synchronized avatars: ${syncedCount}`);
    console.log(`❌ Unsynchronized avatars: ${unsyncedCount}`);

    // Test 5: Check File records
    console.log('\n📁 Testing File Records...');
    const profileFiles = await File.find({ category: 'profile' })
      .sort('-createdAt')
      .limit(5);
    
    console.log(`Found ${profileFiles.length} recent profile image files`);
    profileFiles.forEach(file => {
      console.log(`- ${file.originalName}: ${file.url}`);
      console.log(`  Storage: ${file.storageProvider}, Public: ${file.isPublic}`);
    });

    // Test 6: Fix unsynchronized avatars (optional)
    if (unsyncedCount > 0) {
      console.log('\n🔧 Would you like to fix unsynchronized avatars? (Uncomment the code below)');
      /*
      const fixResult = await fixUnsynchronizedAvatars();
      console.log(`Fixed ${fixResult.fixed} unsynchronized avatars`);
      */
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connection closed');
  }
}

async function fixUnsynchronizedAvatars() {
  let fixed = 0;
  
  // Fix VAs
  const vas = await VA.find({ avatar: { $exists: true, $ne: null } }).populate('user');
  for (const va of vas) {
    if (va.user && va.avatar !== va.user.avatar) {
      va.user.avatar = va.avatar;
      await va.user.save();
      fixed++;
    }
  }
  
  // Fix Businesses
  const businesses = await Business.find({ avatar: { $exists: true, $ne: null } }).populate('user');
  for (const business of businesses) {
    if (business.user && business.avatar !== business.user.avatar) {
      business.user.avatar = business.avatar;
      await business.user.save();
      fixed++;
    }
  }
  
  return { fixed };
}

// Run the test
testProfileImages();