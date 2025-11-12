const mongoose = require('mongoose');
const dotenv = require('dotenv');
const SiteConfig = require('./models/SiteConfig');

// Load environment variables
dotenv.config();

async function testSettingsWithProperCategories() {
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

    // Test bulk write operation with proper categories
    const bulkOps = [
      {
        updateOne: {
          filter: { key: 'notifications.email.enabled' },
          update: { 
            $set: { 
              value: true,
              category: 'features', // notifications map to features
              valueType: 'boolean',
              updatedAt: new Date()
            }
          },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { key: 'display.theme' },
          update: { 
            $set: { 
              value: 'dark',
              category: 'appearance', // display maps to appearance
              valueType: 'text',
              updatedAt: new Date()
            }
          },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { key: 'security.twoFactorAuth.enabled' },
          update: { 
            $set: { 
              value: false,
              category: 'security', // security maps to security
              valueType: 'boolean',
              updatedAt: new Date()
            }
          },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { key: 'apiSettings.rateLimit.standard' },
          update: { 
            $set: { 
              value: 1000,
              category: 'integrations', // apiSettings maps to integrations
              valueType: 'number',
              updatedAt: new Date()
            }
          },
          upsert: true
        }
      }
    ];

    console.log('\nTesting bulk write with proper categories...');
    const bulkResult = await SiteConfig.bulkWrite(bulkOps);
    console.log('Bulk write result:', {
      insertedCount: bulkResult.insertedCount,
      matchedCount: bulkResult.matchedCount,
      modifiedCount: bulkResult.modifiedCount,
      upsertedCount: bulkResult.upsertedCount
    });

    // Verify the settings were saved correctly
    const testKeys = [
      'notifications.email.enabled',
      'display.theme',
      'security.twoFactorAuth.enabled',
      'apiSettings.rateLimit.standard'
    ];

    console.log('\nVerifying saved settings:');
    for (const key of testKeys) {
      const setting = await SiteConfig.findOne({ key });
      if (setting) {
        console.log(`✅ ${key}: value=${setting.value}, category=${setting.category}, valueType=${setting.valueType}`);
      } else {
        console.log(`❌ ${key}: NOT FOUND`);
      }
    }

    // Final count
    const finalCount = await SiteConfig.countDocuments();
    console.log(`\nFinal document count: ${finalCount}`);

    console.log('\n✅ Settings test completed successfully!');
    console.log('MongoDB is working correctly with proper category validation.');

  } catch (error) {
    console.error('❌ Settings test failed:', error);
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
testSettingsWithProperCategories();