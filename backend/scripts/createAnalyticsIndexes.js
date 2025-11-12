const mongoose = require('mongoose');
const User = require('../models/User');
const VA = require('../models/VA');
const Business = require('../models/Business');
require('dotenv').config();

async function createIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub');
    console.log('Connected to MongoDB');

    // Create indexes for User model
    console.log('Creating User indexes...');
    await User.collection.createIndex({ createdAt: 1 });
    await User.collection.createIndex({ lastLoginAt: 1 });
    await User.collection.createIndex({ createdAt: -1 });
    console.log('User indexes created');

    // Create indexes for VA model
    console.log('Creating VA indexes...');
    await VA.collection.createIndex({ createdAt: 1 });
    await VA.collection.createIndex({ createdAt: -1 });
    await VA.collection.createIndex({ status: 1 });
    await VA.collection.createIndex({ location: 1 });
    await VA.collection.createIndex({ skills: 1 });
    console.log('VA indexes created');

    // Create indexes for Business model
    console.log('Creating Business indexes...');
    await Business.collection.createIndex({ createdAt: 1 });
    await Business.collection.createIndex({ createdAt: -1 });
    await Business.collection.createIndex({ industry: 1 });
    await Business.collection.createIndex({ companySize: 1 });
    console.log('Business indexes created');

    // List all indexes to verify
    console.log('\nVerifying indexes:');
    const userIndexes = await User.collection.indexes();
    const vaIndexes = await VA.collection.indexes();
    const businessIndexes = await Business.collection.indexes();
    
    console.log('User indexes:', userIndexes.map(idx => idx.name));
    console.log('VA indexes:', vaIndexes.map(idx => idx.name));
    console.log('Business indexes:', businessIndexes.map(idx => idx.name));

    console.log('\nAll indexes created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();