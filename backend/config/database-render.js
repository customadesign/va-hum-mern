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
    
    // MongoDB connection options optimized for Render
    const options = {
      serverSelectionTimeoutMS: 60000, // Increased to 60s for Render cold starts
      socketTimeoutMS: 60000, // Increased to 60s
      family: 4, // Use IPv4, skip trying IPv6
      maxPoolSize: 10, // Maximum number of connections in the connection pool
      minPoolSize: 2, // Minimum number of connections in the connection pool
      maxIdleTimeMS: 30000, // How long a connection can be idle before being closed
      waitQueueTimeoutMS: 60000, // How long operations wait for a connection
      retryWrites: true, // Retry write operations if they fail
      w: 'majority', // Write concern
      readPreference: 'primary', // Read from primary node
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
    };
    
    console.log('Attempting MongoDB connection...');
    console.log('Connection options:', {
      serverSelectionTimeoutMS: options.serverSelectionTimeoutMS,
      socketTimeoutMS: options.socketTimeoutMS,
      maxPoolSize: options.maxPoolSize,
      retryWrites: options.retryWrites
    });
    
    // Try to connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`✅ MongoDB connected successfully to: ${conn.connection.host}`);
    console.log(`✅ Database: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Full error:', error);
    
    // More specific error handling
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n⚠️  MongoDB connection refused!');
      console.log('Please check your MongoDB URI and ensure MongoDB is running');
    } else if (error.message.includes('authentication failed')) {
      console.log('\n⚠️  MongoDB authentication failed!');
      console.log('Please check your MongoDB username and password in MONGODB_URI');
    } else if (error.message.includes('connect ETIMEDOUT')) {
      console.log('\n⚠️  MongoDB connection timed out!');
      console.log('Please check your network connection and MongoDB Atlas whitelist settings');
      console.log('For Render: Ensure your MongoDB Atlas allows access from Render IPs');
    } else if (error.message.includes('MONGODB_URI environment variable')) {
      console.log('\n⚠️  MONGODB_URI not configured!');
      console.log('Please set MONGODB_URI in your environment variables');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log('\n⚠️  MongoDB hostname not found!');
      console.log('Please check your MongoDB URI cluster address');
    }
    
    console.log('\n🔧 MongoDB Atlas Setup Checklist:');
    console.log('  1. ✅ Create MongoDB Atlas cluster');
    console.log('  2. ✅ Create database user with username/password');
    console.log('  3. ⚠️  Whitelist Render IPs in Network Access');
    console.log('  4. ⚠️  Set MONGODB_URI in Render dashboard');
    console.log('  5. ✅ Use connection string format: mongodb+srv://user:pass@cluster.mongodb.net/dbname');
    
    console.log('\n🌐 Render IP Addresses to whitelist:');
    console.log('  - For automatic IP access: Use 0.0.0.0/0 (less secure)');
    console.log('  - For specific IPs: Check Render documentation for current IP ranges');
    
    // On production/Render, log the error but don't crash immediately
    // This allows the health check endpoint to still respond
    if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
      console.error('⚠️  Running in production mode - server will start but database operations will fail');
      console.error('⚠️  Please fix MongoDB configuration immediately!');
      console.error('💡 Check Render dashboard environment variables');
      console.error('💡 Check MongoDB Atlas Network Access settings');
      // Don't exit - let server start so we can see health check errors
      return false;
    }
    
    // In development, exit to force fixing the issue
    process.exit(1);
  }
};

module.exports = connectDB;