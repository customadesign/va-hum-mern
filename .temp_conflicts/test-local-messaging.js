require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const VA = require('./models/VA');
const Business = require('./models/Business');

// Create a minimal test server
const app = express();
const PORT = 5001; // Use different port to avoid conflicts

// Test endpoint that mimics the VA detail endpoint
app.get('/test/vas/:id', async (req, res) => {
  try {
    const { via } = req.query;
    const vaId = req.params.id;
    
    console.log(`\n📍 Request received for VA: ${vaId}`);
    console.log(`   Query params: via=${via}`);
    
    // Connect to database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    
    // Find the VA
    const va = await VA.findById(vaId)
      .populate('location')
      .populate('specialties');
    
    if (!va) {
      return res.status(404).json({ error: 'VA not found' });
    }
    
    console.log(`✅ VA found: ${va.name}`);
    
    // Simulate unauthenticated user (no req.user)
    const user = null;
    
    // Build messaging configuration
    let businessProfileCompletion = 0;
    let canMessage = false;
    let isBusinessUser = false;
    
    // Since user is null (unauthenticated), they can't message
    
    // Determine action button
    let actionButton = {
      type: 'register',
      text: 'Register Your Business To Chat',
      url: process.env.ESYSTEMS_FRONTEND_URL || 'http://localhost:3002/register'
    };
    
    console.log(`\n📊 Messaging Configuration:`);
    console.log(`   Can Message: ${canMessage}`);
    console.log(`   Is Business User: ${isBusinessUser}`);
    console.log(`   Profile Completion: ${businessProfileCompletion}%`);
    console.log(`   Action Button: ${actionButton.type} - "${actionButton.text}"`);
    console.log(`   Redirect URL: ${actionButton.url}`);
    
    // Send response matching the actual endpoint structure
    const response = {
      success: true,
      data: {
        _id: va._id,
        name: va.name,
        bio: va.bio,
        hero: va.hero,
        location: va.location,
        specialties: va.specialties,
        searchStatus: va.searchStatus
      },
      messaging: {
        canMessage,
        isBusinessUser,
        businessProfileCompletion,
        actionButton,
        viaShortlink: via === 'shortlink'
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start test server
app.listen(PORT, () => {
  console.log(`\n🚀 Test server running on http://localhost:${PORT}`);
  console.log(`\n📝 Test with:`);
  console.log(`   curl http://localhost:${PORT}/test/vas/68b0a91656fc851327f11c32?via=shortlink`);
  console.log(`\n🔍 This simulates an unauthenticated user viewing a VA profile`);
  console.log(`   Expected: Should return messaging.actionButton.type = 'register'`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.disconnect();
  process.exit(0);
});