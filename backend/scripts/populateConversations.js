#!/usr/bin/env node

/**
 * API-based script to populate conversations
 * Can be run from command line: node populateConversations.js
 * 
 * This script uses the API endpoints directly, which is useful for:
 * - Testing the API
 * - Populating data on deployed instances
 * - Quick data population without database access
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://linkage-va-hub.onrender.com';

// Test accounts to use
const testAccounts = {
  va: {
    email: 'test.va@example.com',
    password: 'Test123!'
  },
  business: {
    email: 'test.business@example.com',
    password: 'Test123!'
  }
};

// Sample messages to create realistic conversations
const sampleMessages = [
  // Initial contact messages
  [
    "Hi! I noticed you're looking for a virtual assistant with social media expertise. I have 5 years of experience managing social media for various businesses. Would love to discuss how I can help!",
    "Thank you for reaching out! Yes, we're looking for someone to manage our social media presence. Can you tell me more about your experience with Instagram and TikTok specifically?",
    "Absolutely! I've managed Instagram accounts growing from 1K to 50K followers, and I'm very familiar with TikTok trends and content creation. I can share some examples of my work if you'd like.",
    "That would be great! Please send over some examples. Also, what are your rates and availability?"
  ],
  // Project discussion
  [
    "I've completed the content calendar for next month as requested. You'll find 30 posts scheduled across all platforms.",
    "Excellent work! The content looks engaging. Can we add a few more posts about our new product launch?",
    "Of course! I'll add 5 more posts specifically about the product launch. Should I focus on any particular features?",
    "Yes, please highlight the eco-friendly aspects and the limited-time discount. Thanks!"
  ],
  // Quick check-in
  [
    "Just wanted to check if you received the weekly analytics report I sent yesterday?",
    "Yes, got it! The engagement rates look promising. Keep up the good work!",
    "Thank you! I'll continue with the same strategy for next week."
  ]
];

// Helper function to login and get token
async function login(email, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });
    return response.data.token;
  } catch (error) {
    console.error(`Failed to login with ${email}:`, error.response?.data || error.message);
    return null;
  }
}

// Helper function to get user profile
async function getUserProfile(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  } catch (error) {
    console.error('Failed to get user profile:', error.response?.data || error.message);
    return null;
  }
}

// Helper function to create a conversation
async function createConversation(vaToken, businessToken, vaId, businessId) {
  try {
    // Business initiates conversation with VA
    const response = await axios.post(
      `${API_BASE_URL}/conversations/start/${vaId}`,
      {
        message: sampleMessages[0][0]
      },
      {
        headers: { Authorization: `Bearer ${businessToken}` }
      }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Failed to create conversation:', error.response?.data || error.message);
    return null;
  }
}

// Helper function to send a message
async function sendMessage(token, conversationId, message) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/conversations/${conversationId}/messages`,
      { message },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Failed to send message:', error.response?.data || error.message);
    return null;
  }
}

// Main function to populate conversations
async function populateConversations() {
  console.log('🚀 Starting conversation population...');
  console.log(`API URL: ${API_BASE_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}\n`);

  // First, try to register the test accounts (they might already exist)
  console.log('📝 Setting up test accounts...');
  
  // Try to register VA
  try {
    await axios.post(`${API_BASE_URL}/auth/register`, {
      email: testAccounts.va.email,
      password: testAccounts.va.password,
      role: 'va',
      profile: {
        name: 'Test VA User',
        hero: 'Experienced Virtual Assistant',
        hourlyRate: 30,
        skills: ['Social Media', 'Content Creation', 'Admin Support']
      }
    });
    console.log('✅ Created VA account');
  } catch (error) {
    console.log('ℹ️  VA account might already exist');
  }

  // Try to register Business
  try {
    await axios.post(`${API_BASE_URL}/auth/register`, {
      email: testAccounts.business.email,
      password: testAccounts.business.password,
      role: 'business',
      profile: {
        company: 'Test Business Inc.',
        name: 'John Doe',
        industry: 'Technology'
      }
    });
    console.log('✅ Created Business account');
  } catch (error) {
    console.log('ℹ️  Business account might already exist');
  }

  // Login with both accounts
  console.log('\n🔐 Logging in...');
  const vaToken = await login(testAccounts.va.email, testAccounts.va.password);
  const businessToken = await login(testAccounts.business.email, testAccounts.business.password);

  if (!vaToken || !businessToken) {
    console.error('❌ Failed to login with test accounts. Please ensure they exist.');
    return;
  }

  console.log('✅ Successfully logged in with both accounts');

  // Get user profiles
  const vaProfile = await getUserProfile(vaToken);
  const businessProfile = await getUserProfile(businessToken);

  if (!vaProfile || !businessProfile) {
    console.error('❌ Failed to get user profiles');
    return;
  }

  console.log(`✅ VA: ${vaProfile.email} (ID: ${vaProfile.id})`);
  console.log(`✅ Business: ${businessProfile.email} (ID: ${businessProfile.id})`);

  // Create conversations with different message patterns
  console.log('\n💬 Creating conversations...');

  for (let i = 0; i < sampleMessages.length; i++) {
    console.log(`\n📨 Creating conversation ${i + 1}/${sampleMessages.length}...`);
    
    // Create the conversation
    const conversation = await createConversation(vaToken, businessToken, vaProfile.id, businessProfile.id);
    
    if (conversation) {
      console.log(`✅ Created conversation ${conversation._id}`);
      
      // Send messages in the conversation
      const messages = sampleMessages[i];
      for (let j = 1; j < messages.length; j++) {
        // Alternate between VA and Business sending messages
        const isVaMessage = j % 2 === 0;
        const token = isVaMessage ? vaToken : businessToken;
        const sender = isVaMessage ? 'VA' : 'Business';
        
        // Add a small delay to make timestamps different
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const message = await sendMessage(token, conversation._id, messages[j]);
        if (message) {
          console.log(`  ✉️  ${sender} sent: "${messages[j].substring(0, 50)}..."`);
        }
      }
    }
  }

  console.log('\n✨ Population complete!');
  console.log(`\n🌐 View the conversations at: ${FRONTEND_URL}/conversations`);
  console.log('\n📧 Login credentials:');
  console.log(`  VA: ${testAccounts.va.email} / ${testAccounts.va.password}`);
  console.log(`  Business: ${testAccounts.business.email} / ${testAccounts.business.password}`);
}

// Run the script
populateConversations().catch(console.error);