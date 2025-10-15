const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Debug logging
    console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    if (process.env.MONGODB_URI) {
      console.log('MongoDB URI format check:', process.env.MONGODB_URI.startsWith('mongodb'));
      // Don't log the full URI as it contains credentials
      const uriParts = process.env.MONGODB_URI.split('@');
      if (uriParts.length > 1) {
        console.log('MongoDB URI cluster:', '@' + uriParts[1]);
      }
    }
    
    // MongoDB connection options for Atlas with longer timeout for Render
    const options = {
      serverSelectionTimeoutMS: 30000, // 30s timeout for Render cold starts
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    };
    
    console.log('Attempting MongoDB connection...');
    // Try to connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`✅ MongoDB connected successfully to: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
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
    } else if (error.message.includes('MONGODB_URI environment variable')) {
      console.log('\n⚠️  MONGODB_URI not configured!');
      console.log('Please set MONGODB_URI in your environment variables');
    }
    
    console.log('\nFor MongoDB Atlas (cloud):');
    console.log('  1. Ensure your IP is whitelisted in MongoDB Atlas (or use 0.0.0.0/0)');
    console.log('  2. Check your connection string format');
    console.log('  3. Verify database user credentials');
    console.log('  4. For Render: Add Render IPs to MongoDB Atlas Network Access');
    
    // On production/Render, log the error but don't crash immediately
    // This allows the health check endpoint to still respond
    if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
      console.error('⚠️  Running in production mode - server will start but database operations will fail');
      console.error('⚠️  Please fix MongoDB configuration immediately!');
      // Don't exit - let server start so we can see health check errors
      return false;
    }
    
    // In development, exit to force fixing the issue
    process.exit(1);
  }
};

module.exports = connectDB;