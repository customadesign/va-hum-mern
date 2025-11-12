require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:8000/api';

const testAdminInterceptAPI = async () => {
  try {
    // Connect to MongoDB to get admin user
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find an admin user
    const adminUser = await User.findOne({ email: 'pat@murphyconsulting.us' });
    if (!adminUser) {
      console.error('Admin user not found');
      process.exit(1);
    }

    console.log('Found admin user:', adminUser.email);

    // Generate a JWT token for the admin
    const token = jwt.sign(
      {
        id: adminUser._id,
        role: 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('\n✅ Generated admin token');
    console.log('Token:', token.substring(0, 50) + '...');

    // Test 1: Get intercepted conversations
    console.log('\n📋 Testing GET /api/admin/intercept/conversations');
    try {
      const response = await axios.get(`${API_BASE}/admin/intercept/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Success! Response:');
      console.log('- Total conversations:', response.data.data.conversations.length);
      console.log('- Unread count:', response.data.data.unreadCount);
      console.log('- Status counts:', response.data.data.statusCounts);

      if (response.data.data.conversations.length > 0) {
        const conv = response.data.data.conversations[0];
        console.log('\nFirst conversation:');
        console.log('- ID:', conv._id);
        console.log('- Business:', conv.business?.email || conv.business?.profile?.company);
        console.log('- VA:', conv.va?.email || conv.va?.profile?.name);
        console.log('- Status:', conv.adminStatus);
        console.log('- Messages:', conv.messages?.length);
        console.log('- Last message:', conv.lastMessage?.substring(0, 50));
      }
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
    }

    // Test 2: Get statistics
    console.log('\n📊 Testing GET /api/admin/intercept/stats');
    try {
      const response = await axios.get(`${API_BASE}/admin/intercept/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Success! Statistics:');
      console.log('- Overview:', response.data.data.overview);
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
    }

    console.log('\n🎉 Tests complete!');
    console.log('\nTo use this token in the admin frontend:');
    console.log('1. Open browser console at http://localhost:4000');
    console.log('2. Run: document.cookie = "authToken=' + token + '; path=/;"');
    console.log('3. Refresh the page');

    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
};

testAdminInterceptAPI();