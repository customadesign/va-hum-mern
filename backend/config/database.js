const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Debug logging
    console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
    if (process.env.MONGODB_URI) {
      console.log('MongoDB URI format check:', process.env.MONGODB_URI.startsWith('mongodb'));
      // Don't log the full URI as it contains credentials
      const uriParts = process.env.MONGODB_URI.split('@');
      if (uriParts.length > 1) {
        console.log('MongoDB URI cluster:', '@' + uriParts[1]);
      }
    }
    
    // MongoDB connection options for Atlas
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };
    
    // Try to connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`MongoDB connected successfully to: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error('Full error:', error);
    
    // More specific error handling
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n⚠️  MongoDB is not running locally!');
      console.log('Please install and start MongoDB:');
      console.log('  brew install mongodb-community');
      console.log('  brew services start mongodb-community');
    } else if (error.message.includes('authentication failed')) {
      console.log('\n⚠️  MongoDB authentication failed!');
      console.log('Please check your MongoDB username and password in MONGODB_URI');
    } else if (error.message.includes('connect ETIMEDOUT')) {
      console.log('\n⚠️  MongoDB connection timed out!');
      console.log('Please check your network connection and MongoDB Atlas whitelist settings');
    }
    
    console.log('\nFor MongoDB Atlas (cloud):');
    console.log('  1. Ensure your IP is whitelisted in MongoDB Atlas');
    console.log('  2. Check your connection string format');
    console.log('  3. Verify database user credentials');
    
    // For now, let's exit gracefully
    process.exit(1);
  }
};

module.exports = connectDB;