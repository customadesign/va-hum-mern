const mongoose = require('mongoose');
const dotenv = require('dotenv');
const VA = require('./models/VA');

dotenv.config();

async function fixAvailabilityIssue() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all VAs with invalid availability values
    const invalidVAs = await VA.find({
      availability: { $nin: ['immediately', 'within_week', 'within_month', 'not_available', null] }
    });

    console.log(`Found ${invalidVAs.length} VAs with invalid availability values`);

    if (invalidVAs.length > 0) {
      console.log('\nInvalid availability values found:');
      invalidVAs.forEach(va => {
        console.log(`- VA: ${va.name} (${va._id}), Availability: "${va.availability}"`);
      });

      // Fix invalid values
      const result = await VA.updateMany(
        { availability: { $nin: ['immediately', 'within_week', 'within_month', 'not_available', null] } },
        { $set: { availability: 'immediately' } }
      );

      console.log(`\n✅ Fixed ${result.modifiedCount} VA profiles`);
      console.log('Set invalid availability values to "immediately"');
    }

    // Also check for the specific "full-time" value
    const fullTimeVAs = await VA.find({ availability: 'full-time' });
    if (fullTimeVAs.length > 0) {
      console.log(`\nFound ${fullTimeVAs.length} VAs with "full-time" availability`);
      
      const fullTimeResult = await VA.updateMany(
        { availability: 'full-time' },
        { $set: { availability: 'immediately' } }
      );
      
      console.log(`✅ Fixed ${fullTimeResult.modifiedCount} VAs with "full-time" availability`);
    }

    // Verify fix
    const stillInvalid = await VA.find({
      availability: { $nin: ['immediately', 'within_week', 'within_month', 'not_available', null] }
    });

    if (stillInvalid.length === 0) {
      console.log('\n✅ All availability values are now valid!');
    } else {
      console.log(`\n⚠️ Still ${stillInvalid.length} VAs with invalid availability`);
    }

    console.log('\n✨ Database fix complete! You should now be able to upload profile media.');
    
  } catch (error) {
    console.error('❌ Error fixing availability:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixAvailabilityIssue();