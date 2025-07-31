const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Debug logging
    console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
    if (process.env.MONGODB_URI) {
      console.log('MongoDB URI format check:', process.env.MONGODB_URI.startsWith('mongodb'));
    }
    
    // Try to connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error('Full error:', error);
    console.log('\n⚠️  MongoDB is not running!');
    console.log('Please install and start MongoDB:');
    console.log('  brew install mongodb-community');
    console.log('  brew services start mongodb-community');
    console.log('\nOr use MongoDB Atlas (cloud):');
    console.log('  1. Create a free account at https://www.mongodb.com/cloud/atlas');
    console.log('  2. Update MONGODB_URI in backend/.env with your connection string');
    
    // For now, let's exit gracefully
    process.exit(1);
  }
};

module.exports = connectDB;