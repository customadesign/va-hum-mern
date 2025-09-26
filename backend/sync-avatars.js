const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const VA = require('./models/VA');
const Business = require('./models/Business');

async function syncAvatars() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    let syncedVAs = 0;
    let syncedBusinesses = 0;

    // Sync VA avatars to Users
    console.log('\n🔄 Syncing VA avatars to Users...');
    const vas = await VA.find({ avatar: { $exists: true, $ne: null } }).populate('user');
    
    for (const va of vas) {
      if (va.user && va.avatar !== va.user.avatar) {
        va.user.avatar = va.avatar;
        await va.user.save();
        syncedVAs++;
        console.log(`✅ Synced avatar for VA: ${va.name}`);
      }
    }
    
    // Sync Business avatars to Users
    console.log('\n🔄 Syncing Business avatars to Users...');
    const businesses = await Business.find({ avatar: { $exists: true, $ne: null } }).populate('user');
    
    for (const business of businesses) {
      if (business.user && business.avatar !== business.user.avatar) {
        business.user.avatar = business.avatar;
        await business.user.save();
        syncedBusinesses++;
        console.log(`✅ Synced avatar for Business: ${business.company}`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Synced ${syncedVAs} VA avatars`);
    console.log(`✅ Synced ${syncedBusinesses} Business avatars`);
    console.log(`✅ Total synced: ${syncedVAs + syncedBusinesses}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connection closed');
  }
}

// Run the sync
syncAvatars();