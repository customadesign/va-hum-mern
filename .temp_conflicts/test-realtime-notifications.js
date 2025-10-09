/**
 * Test script for real-time notification system
 * Run this after starting the server to test Socket.io notifications
 */

const io = require('socket.io-client');
const axios = require('axios');
require('dotenv').config();

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8000';
const API_URL = `${SERVER_URL}/api`;

// Test admin credentials
const ADMIN_EMAIL = 'admin@linkage.com';
const ADMIN_PASSWORD = 'admin123';

let adminToken = null;
let adminUserId = null;

/**
 * Login as admin to get auth token
 */
async function loginAsAdmin() {
  try {
    console.log('🔐 Logging in as admin...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    adminToken = response.data.token;
    adminUserId = response.data.user.id;
    
    console.log('✅ Admin login successful');
    console.log(`   User ID: ${adminUserId}`);
    return true;
  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test Socket.io connection and notification events
 */
function testSocketConnection() {
  console.log('\n🔌 Connecting to Socket.io server...');
  
  const socket = io(SERVER_URL, {
    transports: ['websocket'],
    reconnection: true
  });
  
  socket.on('connect', () => {
    console.log('✅ Socket.io connected');
    console.log(`   Socket ID: ${socket.id}`);
    
    // Join admin room
    socket.emit('join', adminUserId);
    socket.emit('join-admin-room', adminUserId);
    console.log('📢 Joined admin notification rooms');
  });
  
  // Listen for new notifications
  socket.on('new-notification', (data) => {
    console.log('\n🔔 NEW NOTIFICATION RECEIVED:');
    console.log('   Title:', data.notification.title || data.notification.type);
    console.log('   Message:', data.notification.params?.message);
    console.log('   Unread Count:', data.unreadCount);
  });
  
  // Listen for notification read events
  socket.on('notification-read', (data) => {
    console.log('\n✅ NOTIFICATION MARKED AS READ:');
    console.log('   Notification IDs:', data.notificationIds);
    console.log('   New Unread Count:', data.unreadCount);
  });
  
  // Listen for all notifications read
  socket.on('all-notifications-read', (data) => {
    console.log('\n✅ ALL NOTIFICATIONS MARKED AS READ');
    console.log('   Total Marked:', data.notificationIds.length);
    console.log('   New Unread Count:', data.unreadCount);
  });
  
  // Listen for notification deletion
  socket.on('notification-deleted', (data) => {
    console.log('\n🗑️ NOTIFICATION DELETED:');
    console.log('   Notification ID:', data.notificationId);
    console.log('   New Unread Count:', data.unreadCount);
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Socket.io disconnected');
  });
  
  socket.on('error', (error) => {
    console.error('❌ Socket.io error:', error);
  });
  
  return socket;
}

/**
 * Test notification CRUD operations
 */
async function testNotificationOperations() {
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  };
  
  console.log('\n📋 Testing Notification Operations...\n');
  
  try {
    // 1. Get current notifications
    console.log('1️⃣ Fetching current notifications...');
    const getResponse = await axios.get(`${API_URL}/admin/notifications`, { headers });
    console.log(`   Found ${getResponse.data.data.length} notifications`);
    console.log(`   Unread count: ${getResponse.data.unreadCount}`);
    
    // 2. Create a test notification (via admin notification endpoint)
    console.log('\n2️⃣ Creating test notification...');
    const createResponse = await axios.post(
      `${API_URL}/admin/notifications/send-targeted`,
      {
        userIds: [adminUserId],
        title: 'Test Real-time Notification',
        message: 'This is a test of the real-time notification system',
        type: 'system_announcement',
        priority: 'high'
      },
      { headers }
    );
    console.log(`   Created ${createResponse.data.notifications.length} notification(s)`);
    
    // Wait a moment for Socket.io to process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. Get unread count
    console.log('\n3️⃣ Getting unread count...');
    const countResponse = await axios.get(`${API_URL}/admin/notifications/unread-count`, { headers });
    console.log(`   Unread count: ${countResponse.data.unreadCount}`);
    
    // 4. Get notifications with filtering
    console.log('\n4️⃣ Testing filtered fetch (unread only)...');
    const unreadResponse = await axios.get(
      `${API_URL}/admin/notifications?unreadOnly=true`,
      { headers }
    );
    console.log(`   Found ${unreadResponse.data.data.length} unread notifications`);
    
    if (unreadResponse.data.data.length > 0) {
      const firstNotification = unreadResponse.data.data[0];
      
      // 5. Mark single notification as read
      console.log('\n5️⃣ Marking single notification as read...');
      const markReadResponse = await axios.put(
        `${API_URL}/admin/notifications/read`,
        { notificationId: firstNotification._id },
        { headers }
      );
      console.log(`   Modified ${markReadResponse.data.modifiedCount} notification(s)`);
      console.log(`   New unread count: ${markReadResponse.data.unreadCount}`);
      
      // Wait for Socket.io
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 6. Delete a notification
      console.log('\n6️⃣ Deleting notification...');
      const deleteResponse = await axios.delete(
        `${API_URL}/admin/notifications/${firstNotification._id}`,
        { headers }
      );
      console.log(`   Notification deleted`);
      console.log(`   New unread count: ${deleteResponse.data.unreadCount}`);
    }
    
    // 7. Mark all as read
    console.log('\n7️⃣ Marking all notifications as read...');
    const markAllResponse = await axios.put(
      `${API_URL}/admin/notifications/read-all`,
      {},
      { headers }
    );
    console.log(`   Modified ${markAllResponse.data.modifiedCount} notification(s)`);
    
    // 8. Test broadcast notification
    console.log('\n8️⃣ Testing broadcast notification...');
    const broadcastResponse = await axios.post(
      `${API_URL}/admin/notifications/send-broadcast`,
      {
        targetGroup: 'admins',
        title: 'Broadcast Test',
        message: 'This is a broadcast to all admins',
        type: 'system_announcement',
        priority: 'medium'
      },
      { headers }
    );
    console.log(`   Broadcast sent to ${broadcastResponse.data.summary.totalRecipients} recipients`);
    
    console.log('\n✅ All notification operations completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error during notification operations:', error.response?.data || error.message);
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting Real-time Notification System Test\n');
  console.log('=' .repeat(50));
  
  // Login as admin
  const loginSuccess = await loginAsAdmin();
  if (!loginSuccess) {
    console.error('\n⛔ Cannot proceed without admin login. Exiting...');
    process.exit(1);
  }
  
  // Connect to Socket.io
  const socket = testSocketConnection();
  
  // Wait for socket connection
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Run notification tests
  await testNotificationOperations();
  
  // Keep connection open for a bit to see any remaining events
  console.log('\n⏳ Waiting 5 seconds for any remaining Socket.io events...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Cleanup
  console.log('\n🧹 Cleaning up...');
  socket.disconnect();
  
  console.log('\n✨ Test completed!');
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
  process.exit(1);
});

// Run tests
runTests();