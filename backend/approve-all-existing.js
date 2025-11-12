const mongoose = require('mongoose');
const VA = require('./models/VA');
const Business = require('./models/Business');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub';

async function approveAllExisting() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all VAs to approved status
    const vaResult = await VA.updateMany(
      { status: 'pending' }, // Only update pending ones
      { $set: { status: 'approved' } }
    );

    // Update all Businesses to approved status
    const businessResult = await Business.updateMany(
      { status: 'pending' }, // Only update pending ones
      { $set: { status: 'approved' } }
    );

    console.log(`Updated ${vaResult.modifiedCount} VAs to approved status`);
    console.log(`Updated ${businessResult.modifiedCount} Businesses to approved status`);

    // Verify the updates
    const pendingVAs = await VA.countDocuments({ status: 'pending' });
    const approvedVAs = await VA.countDocuments({ status: 'approved' });
    const pendingBusinesses = await Business.countDocuments({ status: 'pending' });
    const approvedBusinesses = await Business.countDocuments({ status: 'approved' });

    console.log('\nFinal Status Count:');
    console.log(`VAs - Pending: ${pendingVAs}, Approved: ${approvedVAs}`);
    console.log(`Businesses - Pending: ${pendingBusinesses}, Approved: ${approvedBusinesses}`);

    console.log('\nAll existing accounts have been approved successfully!');

  } catch (error) {
    console.error('Error approving existing accounts:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
approveAllExisting();