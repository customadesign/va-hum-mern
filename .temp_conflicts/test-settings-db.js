const mongoose = require('mongoose');
const dotenv = require('dotenv');
const SiteConfig = require('./models/SiteConfig');

// Load environment variables
dotenv.config();

async function testSettingsDatabase() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully');

    // Check current documents in the collection
    const count = await SiteConfig.countDocuments();
    console.log(`Current document count in siteconfigs: ${count}`);

    // List all existing settings
    const existingSettings = await SiteConfig.find({});
    console.log('Existing settings:', existingSettings);

    // Create a test setting
    const testSetting = new SiteConfig({
      key: 'test.manual.insert',
      value: 'This is a manual test ' + new Date().toISOString(),
      category: 'test',
      updatedAt: new Date()
    });

    // Save the test setting
    const saved = await testSetting.save();
    console.log('Test setting saved:', saved);

    // Verify it was saved
    const verifyCount = await SiteConfig.countDocuments();
    console.log(`Document count after save: ${verifyCount}`);

    // Find the test setting
    const found = await SiteConfig.findOne({ key: 'test.manual.insert' });
    console.log('Found test setting:', found);

    // Test bulk write operation (like the settings controller uses)
    const bulkOps = [
      {
        updateOne: {
          filter: { key: 'test.bulk.operation1' },
          update: { 
            $set: { 
              value: 'Bulk test 1',
              category: 'test',
              updatedAt: new Date()
            }
          },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { key: 'test.bulk.operation2' },
          update: { 
            $set: { 
              value: 'Bulk test 2',
              category: 'test',
              updatedAt: new Date()
            }
          },
          upsert: true
        }
      }
    ];

    const bulkResult = await SiteConfig.bulkWrite(bulkOps);
    console.log('Bulk write result:', {
      insertedCount: bulkResult.insertedCount,
      matchedCount: bulkResult.matchedCount,
      modifiedCount: bulkResult.modifiedCount,
      upsertedCount: bulkResult.upsertedCount
    });

    // Final count
    const finalCount = await SiteConfig.countDocuments();
    console.log(`Final document count: ${finalCount}`);

    // List all test settings
    const testSettings = await SiteConfig.find({ category: 'test' });
    console.log('All test settings:', testSettings.map(s => ({ key: s.key, value: s.value })));

    console.log('\n✅ Database test completed successfully!');
    console.log('MongoDB is working correctly and can save settings.');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

// Run the test
testSettingsDatabase();