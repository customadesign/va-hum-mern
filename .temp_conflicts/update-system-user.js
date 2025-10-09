const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function updateSystemUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    const systemUser = await User.findOne({ email: 'system@linkagevahub.com' });

    if (systemUser) {
      if (systemUser.name !== 'Linkage Admin') {
        systemUser.name = 'Linkage Admin';
        await systemUser.save();
        console.log('✅ Updated system user name to "Linkage Admin"');
      } else {
        console.log('✅ System user already has the correct name');
      }
    } else {
      console.log('⚠️  System user not found. Creating one...');
      const newSystemUser = await User.create({
        email: 'system@linkagevahub.com',
        password: 'system-password-never-used',
        name: 'Linkage Admin',
        role: 'va',
        admin: true,
        isEmailVerified: true,
        isActive: true
      });
      console.log('✅ Created system user:', newSystemUser.email);
    }

    console.log('✅ System user update complete');
  } catch (error) {
    console.error('❌ Error updating system user:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

updateSystemUser();