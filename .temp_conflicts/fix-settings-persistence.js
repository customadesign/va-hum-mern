#!/usr/bin/env node

/**
 * Script to fix settings persistence issues in the database
 * This script ensures that SiteConfig values are properly saved and retrievable
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import the SiteConfig model
const SiteConfig = require('../models/SiteConfig');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper function for colored console output
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
};

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    log.success('Connected to MongoDB');
  } catch (error) {
    log.error(`Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
}

async function analyzeCurrentSettings() {
  log.header('Analyzing Current Settings...');

  try {
    // Get all configs
    const configs = await SiteConfig.find({}).lean();
    log.info(`Found ${configs.length} configuration entries`);

    // Check for problematic configs
    const issues = [];

    for (const config of configs) {
      // Check for vasPerPage related settings
      if (config.key === 'max_vas_per_page' || config.key === 'vasPerPage') {
        log.info(`Found ${config.key}: ${JSON.stringify(config.value)} (type: ${typeof config.value})`);

        // Check if value type matches valueType
        const expectedType = config.valueType || 'number';
        const actualType = typeof config.value;

        if (expectedType === 'number' && actualType !== 'number') {
          issues.push({
            key: config.key,
            issue: 'Type mismatch',
            expected: expectedType,
            actual: actualType,
            value: config.value
          });
        }
      }

      // Check for Mixed type fields that might not be persisting
      if (config.value === undefined || config.value === null) {
        issues.push({
          key: config.key,
          issue: 'Null or undefined value',
          value: config.value
        });
      }
    }

    if (issues.length > 0) {
      log.warning(`Found ${issues.length} potential issues:`);
      issues.forEach(issue => {
        log.warning(`  - ${issue.key}: ${issue.issue} (value: ${JSON.stringify(issue.value)})`);
      });
    } else {
      log.success('No obvious issues found with current settings');
    }

    return { configs, issues };
  } catch (error) {
    log.error(`Error analyzing settings: ${error.message}`);
    throw error;
  }
}

async function fixSettingsPersistence() {
  log.header('Fixing Settings Persistence...');

  try {
    // Key settings to ensure exist and persist
    const criticalSettings = [
      {
        key: 'max_vas_per_page',
        value: 20,
        valueType: 'number',
        category: 'limits',
        description: 'Maximum number of VAs to display per page'
      },
      {
        key: 'max_businesses_per_page',
        value: 20,
        valueType: 'number',
        category: 'limits',
        description: 'Maximum number of businesses to display per page'
      },
      {
        key: 'registration_enabled',
        value: true,
        valueType: 'boolean',
        category: 'features',
        description: 'Enable new user registration'
      }
    ];

    for (const setting of criticalSettings) {
      try {
        // Find or create the setting
        let config = await SiteConfig.findOne({ key: setting.key });

        if (config) {
          log.info(`Updating ${setting.key}...`);

          // Ensure the value is properly typed
          let typedValue = setting.value;
          if (setting.valueType === 'number') {
            typedValue = Number(setting.value);
          } else if (setting.valueType === 'boolean') {
            typedValue = Boolean(setting.value);
          }

          // Update the document
          config.value = typedValue;
          config.valueType = setting.valueType;
          config.category = setting.category;
          config.description = setting.description;

          // Critical: Mark the mixed field as modified
          config.markModified('value');

          // Save with error handling
          await config.save();

          // Verify the save
          const verifyConfig = await SiteConfig.findOne({ key: setting.key }).lean();
          if (verifyConfig && verifyConfig.value === typedValue) {
            log.success(`  ✓ ${setting.key} saved successfully with value: ${verifyConfig.value}`);
          } else {
            log.error(`  ✗ ${setting.key} verification failed`);
          }
        } else {
          log.info(`Creating ${setting.key}...`);

          // Create new config
          const newConfig = new SiteConfig({
            key: setting.key,
            value: setting.value,
            valueType: setting.valueType,
            category: setting.category,
            description: setting.description,
            isPublic: false,
            isEditable: true
          });

          // Mark as modified before first save
          newConfig.markModified('value');
          await newConfig.save();

          log.success(`  ✓ ${setting.key} created with value: ${setting.value}`);
        }
      } catch (error) {
        log.error(`  ✗ Error processing ${setting.key}: ${error.message}`);
      }
    }

    // Clean up duplicate or conflicting entries
    log.header('Cleaning Up Duplicate Entries...');

    const duplicateKeys = await SiteConfig.aggregate([
      { $group: { _id: '$key', count: { $sum: 1 }, docs: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (duplicateKeys.length > 0) {
      log.warning(`Found ${duplicateKeys.length} duplicate keys`);

      for (const dup of duplicateKeys) {
        log.info(`  Resolving duplicates for key: ${dup._id}`);

        // Keep the most recent one, delete others
        const configs = await SiteConfig.find({ key: dup._id }).sort({ updatedAt: -1 });
        const toKeep = configs[0];
        const toDelete = configs.slice(1);

        for (const config of toDelete) {
          await SiteConfig.deleteOne({ _id: config._id });
          log.info(`    Deleted duplicate with _id: ${config._id}`);
        }

        log.success(`    Kept config with _id: ${toKeep._id}`);
      }
    } else {
      log.success('No duplicate entries found');
    }

  } catch (error) {
    log.error(`Error fixing settings: ${error.message}`);
    throw error;
  }
}

async function testPersistence() {
  log.header('Testing Persistence...');

  try {
    const testKey = 'test_persistence_check';
    const testValue = Date.now();

    // Create test config
    log.info('Creating test configuration...');
    const testConfig = new SiteConfig({
      key: testKey,
      value: testValue,
      valueType: 'number',
      category: 'general',
      description: 'Test configuration for persistence check',
      isPublic: false,
      isEditable: true
    });

    testConfig.markModified('value');
    await testConfig.save();

    // Read it back
    log.info('Reading test configuration...');
    const readConfig = await SiteConfig.findOne({ key: testKey }).lean();

    if (readConfig && readConfig.value === testValue) {
      log.success(`Persistence test passed! Value saved and retrieved correctly: ${testValue}`);

      // Clean up test config
      await SiteConfig.deleteOne({ key: testKey });
      log.info('Test configuration cleaned up');
    } else {
      log.error(`Persistence test failed! Expected ${testValue}, got ${readConfig?.value}`);
    }

  } catch (error) {
    log.error(`Persistence test error: ${error.message}`);
    throw error;
  }
}

async function createIndexes() {
  log.header('Ensuring Indexes...');

  try {
    // Ensure indexes are created
    await SiteConfig.ensureIndexes();

    // Get current indexes
    const indexes = await SiteConfig.collection.getIndexes();
    log.info(`Current indexes: ${Object.keys(indexes).join(', ')}`);

    // Create compound index if not exists
    const hasCompoundIndex = Object.keys(indexes).some(idx =>
      idx.includes('category') && idx.includes('isEditable')
    );

    if (!hasCompoundIndex) {
      await SiteConfig.collection.createIndex({ category: 1, isEditable: 1 });
      log.success('Created compound index on category and isEditable');
    } else {
      log.info('Compound index already exists');
    }

  } catch (error) {
    log.error(`Error creating indexes: ${error.message}`);
  }
}

async function main() {
  try {
    log.header('=== Settings Persistence Fix Script ===');

    // Connect to database
    await connectDB();

    // Analyze current state
    const { configs, issues } = await analyzeCurrentSettings();

    // Fix persistence issues
    await fixSettingsPersistence();

    // Ensure indexes
    await createIndexes();

    // Test that persistence works
    await testPersistence();

    // Final verification
    log.header('Final Verification...');
    const maxVasConfig = await SiteConfig.findOne({ key: 'max_vas_per_page' }).lean();
    if (maxVasConfig) {
      log.success(`max_vas_per_page is set to: ${maxVasConfig.value} (type: ${typeof maxVasConfig.value})`);
    } else {
      log.warning('max_vas_per_page configuration not found');
    }

    log.header('=== Script Completed Successfully ===');

  } catch (error) {
    log.error(`Script failed: ${error.message}`);
    console.error(error);
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    log.info('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
main();