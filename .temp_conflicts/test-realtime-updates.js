const io = require('socket.io-client');

// Test script to verify real-time dashboard updates
const testRealtimeUpdates = async () => {
  console.log('Testing real-time dashboard updates...\n');
  
  // Connect to the Socket.io server
  const socket = io('http://localhost:8000', {
    auth: {
      // You may need to provide a valid admin token here
      token: process.env.ADMIN_TOKEN || 'your-admin-token'
    }
  });

  socket.on('connect', () => {
    console.log('✅ Connected to Socket.io server');
    console.log('Socket ID:', socket.id);
    
    // Join admin notification room
    socket.emit('join-admin-room', 'test-admin-id');
    console.log('📢 Joined admin notification room\n');
    
    // Listen for dashboard updates
    socket.on('dashboard_update', (data) => {
      console.log('📊 Dashboard Update Received:');
      console.log('  Type:', data.type);
      console.log('  Data:', JSON.stringify(data.data, null, 2));
      console.log('  Timestamp:', new Date().toLocaleTimeString());
      console.log('---\n');
    });
    
    socket.on('new_va_registered', (data) => {
      console.log('👤 New VA Registered:');
      console.log('  Name:', data.name);
      console.log('  Email:', data.email);
      console.log('  VA ID:', data.vaId);
      console.log('  Created:', new Date(data.createdAt).toLocaleString());
      console.log('---\n');
    });
    
    socket.on('new_business_registered', (data) => {
      console.log('🏢 New Business Registered:');
      console.log('  Company:', data.company);
      console.log('  Contact:', data.contactName);
      console.log('  Email:', data.email);
      console.log('  Business ID:', data.businessId);
      console.log('  Created:', new Date(data.createdAt).toLocaleString());
      console.log('---\n');
    });
    
    // Simulate test events after 2 seconds
    setTimeout(() => {
      console.log('🔄 Simulating test events...\n');
      
      // Note: In production, these events would be emitted from the server
      // when actual VAs/Businesses register
      console.log('To test real events:');
      console.log('1. Keep this script running');
      console.log('2. Register a new VA or Business through the app');
      console.log('3. Watch for real-time updates here\n');
    }, 2000);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Connection Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Ensure the backend server is running on port 8000');
    console.log('2. Check if Socket.io is properly configured in server.js');
    console.log('3. Verify the authentication token if required\n');
  });

  socket.on('disconnect', () => {
    console.log('🔌 Disconnected from Socket.io server');
  });
};

// Instructions
console.log('='.repeat(60));
console.log('Real-Time Dashboard Updates Test');
console.log('='.repeat(60));
console.log('\nThis script will:');
console.log('1. Connect to the Socket.io server');
console.log('2. Join the admin notification room');
console.log('3. Listen for real-time VA/Business registration events');
console.log('4. Display any received updates\n');
console.log('Press Ctrl+C to stop\n');
console.log('='.repeat(60));
console.log('\n');

// Run the test
testRealtimeUpdates();

// Keep the script running
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping test script...');
  process.exit(0);
});