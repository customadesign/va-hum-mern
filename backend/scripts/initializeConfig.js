const mongoose = require('mongoose');
const SiteConfig = require('../models/SiteConfig');
require('dotenv').config();

// Import default configuration values
const defaultConfigs = require('./defaultConfigs');

async function initializeConfig(silent = false) {
  try {
    // Only connect if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }

    if (!silent) {
      console.log('Connected to MongoDB');
      console.log('Initializing default configuration...\n');
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const config of defaultConfigs) {
      const existing = await SiteConfig.findOne({ key: config.key });
      
      if (existing) {
        // Only update if the value type or category has changed
        if (existing.valueType !== config.valueType || 
            existing.category !== config.category ||
            existing.description !== config.description) {
          await SiteConfig.findByIdAndUpdate(existing._id, {
            valueType: config.valueType,
            category: config.category,
            description: config.description,
            isPublic: config.isPublic,
            isEditable: config.isEditable
          });
          if (!silent) console.log(`✓ Updated config: ${config.key}`);
          updated++;
        } else {
          if (!silent) console.log(`- Skipped existing config: ${config.key}`);
          skipped++;
        }
      } else {
        // Create new config
        await SiteConfig.create(config);
        if (!silent) console.log(`✓ Created config: ${config.key}`);
        created++;
      }
    }

    if (!silent) {
      console.log('\n=================================');
      console.log('Configuration Initialization Complete');
      console.log(`Created: ${created} configs`);
      console.log(`Updated: ${updated} configs`);
      console.log(`Skipped: ${skipped} configs`);
      console.log('=================================\n');

      // Display current configuration summary
      console.log('Current Configuration Summary:');
      const categories = ['general', 'email', 'security', 'features', 'limits'];
      
      for (const category of categories) {
        const configs = await SiteConfig.find({ category }).sort('key');
        console.log(`\n${category.toUpperCase()} (${configs.length} settings):`);
        configs.forEach(config => {
          const value = config.valueType === 'boolean' ? (config.value ? 'Yes' : 'No') : config.value;
          console.log(`  - ${config.key}: ${value}`);
        });
      }
    }

    // Only exit if running as main module
    if (require.main === module) {
      process.exit(0);
    }

    return { created, updated, skipped };
  } catch (error) {
    console.error('Error initializing configuration:', error);
    if (require.main === module) {
      process.exit(1);
    }
    throw error; // Re-throw for programmatic usage
  }
}

// Run if called directly
if (require.main === module) {
  initializeConfig();
}

module.exports = initializeConfig;