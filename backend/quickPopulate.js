const axios = require('axios');

const API_URL = process.env.API_URL || 'https://linkage-va-hub.onrender.com/api';

async function quickPopulate() {
  console.log('🚀 Quick populate starting...');
  console.log('API URL:', API_URL);

  try {
    // First, try to register test accounts
    const testVA = {
      name: 'Sarah Johnson',
      email: 'sarah.test@example.com',
      password: 'password123',
      role: 'va'
    };

    const testBusiness = {
      name: 'TechStartup Inc',
      email: 'john.test@example.com',
      password: 'password123',
      role: 'business'
    };

    // Try to register accounts
    try {
      await axios.post(`${API_URL}/auth/register`, testVA);
      console.log('✅ Created VA account');
    } catch (e) {
      console.log('ℹ️  VA account might already exist');
    }

    try {
      await axios.post(`${API_URL}/auth/register`, testBusiness);
      console.log('✅ Created Business account');
    } catch (e) {
      console.log('ℹ️  Business account might already exist');
    }

    // Login as business
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: testBusiness.email,
      password: testBusiness.password
    });

    const token = loginRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Create a conversation
    const conversationData = {
      participants: [], // Will be set by backend
      messages: [
        {
          content: "Hi! I saw your profile and I'm interested in hiring you for some administrative tasks. Are you available?",
          timestamp: new Date()
        }
      ]
    };

    const convRes = await axios.post(`${API_URL}/conversations`, conversationData, { headers });
    console.log('✅ Created conversation');

    // Add more messages
    const conversationId = convRes.data._id;
    
    const messages = [
      "I specifically need help with email management and calendar scheduling.",
      "My business is growing and I need someone who can handle client communications professionally.",
      "What are your rates and availability?"
    ];

    for (const msg of messages) {
      await axios.post(`${API_URL}/conversations/${conversationId}/messages`, {
        content: msg
      }, { headers });
      console.log('✅ Added message');
    }

    console.log('\n✨ Success! Sample conversation created.');
    console.log(`\n📧 Login credentials:`);
    console.log(`Business: ${testBusiness.email} / password123`);
    console.log(`VA: ${testVA.email} / password123`);
    console.log(`\n🔗 View at: https://linkage-va-hub.onrender.com/conversations`);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

quickPopulate();