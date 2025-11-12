const mongoose = require('mongoose');
const VA = require('./models/VA');
const Business = require('./models/Business');

// Load environment variables
require('dotenv').config();

const updateStatusFields = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update all VAs that don't have a status field
    const vaUpdateResult = await VA.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'pending' } }
    );
    console.log(`✅ Updated ${vaUpdateResult.modifiedCount} VAs with status field`);

    // Update all Businesses that don't have a status field
    const businessUpdateResult = await Business.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'pending' } }
    );
    console.log(`✅ Updated ${businessUpdateResult.modifiedCount} Businesses with status field`);

    // Show current counts
    const pendingVAs = await VA.countDocuments({ status: 'pending' });
    const pendingBusinesses = await Business.countDocuments({ status: 'pending' });
    
    console.log(`📊 Current pending VAs: ${pendingVAs}`);
    console.log(`📊 Current pending Businesses: ${pendingBusinesses}`);

    console.log('✅ Status field update completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating status fields:', error);
    process.exit(1);
  }
};

updateStatusFields();