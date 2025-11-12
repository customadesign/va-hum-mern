#!/usr/bin/env node

/**
 * Test script to verify real-time notification clearing
 * This simulates an admin replying to a message and checks if unread count updates
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const io = require('socket.io-client');

const API_URL = process.env.API_URL || 'http://localhost:8000';
const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:8000';

async function testNotificationClearing() {
  try {
    console.log('🔄 Testing real-time notification clearing...\n');

    // Connect to Socket.IO
    const socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
    });

    // Listen for admin unread updates
    socket.on('admin_unread_update', (data) => {
      console.log('📨 Received admin_unread_update event:');
      console.log('  - New unread count:', data.unreadCount);
      console.log('  - Conversation ID:', data.conversationId);
      console.log('  - Action:', data.action);
      
      if (data.unreadCount === 0) {
        console.log('\n✅ SUCCESS: Notification badge should now be hidden!');
      }
    });

    // First, get admin token (you'll need to login as admin)
    console.log('\n📝 Instructions for testing:');
    console.log('1. Open admin panel at http://localhost:4000');
    console.log('2. Navigate to Messages tab');
    console.log('3. You should see a red badge with unread count');
    console.log('4. Click on an unread conversation to view it');
    console.log('5. The badge count should decrease in real-time');
    console.log('6. Reply to the message');
    console.log('7. The badge should disappear completely if no more unread messages\n');

    console.log('👀 Monitoring Socket.IO events...');
    console.log('Press Ctrl+C to exit\n');

    // Keep the script running
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testNotificationClearing();