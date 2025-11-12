const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function updateSystemUserName() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Find and update the system user
    const result = await User.updateOne(
      { email: 'system@linkagevahub.com' },
      { $set: { name: 'Linkage Admin' } }
    );

    if (result.matchedCount === 0) {
      console.log('System user not found');
    } else if (result.modifiedCount > 0) {
      console.log('✓ System user name updated to "Linkage Admin"');
    } else {
      console.log('System user already has correct name');
    }

    // Verify the update
    const systemUser = await User.findOne({ email: 'system@linkagevahub.com' });
    if (systemUser) {
      console.log(`Current system user name: "${systemUser.name}"`);
      console.log(`Admin flag: ${systemUser.admin}`);
    }

  } catch (error) {
    console.error('Error updating system user:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

updateSystemUserName();