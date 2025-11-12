require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');
console.log('URI:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('\nPlease check:');
    console.log('1. Your MongoDB Atlas cluster name');
    console.log('2. Username and password are correct');
    console.log('3. Your IP address is whitelisted in MongoDB Atlas');
    console.log('\nTo get the correct connection string:');
    console.log('1. Go to MongoDB Atlas dashboard');
    console.log('2. Click "Connect" on your cluster');
    console.log('3. Choose "Connect your application"');
    console.log('4. Copy the connection string');
    process.exit(1);
  });