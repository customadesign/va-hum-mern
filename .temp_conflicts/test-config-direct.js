const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');

async function testConfigDirectly() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Load models
    const User = require('./models/User');
    const SiteConfig = require('./models/SiteConfig');
    
    // Find an admin user
    const adminUser = await User.findOne({ admin: true });
    if (!adminUser) {
      console.error('❌ No admin user found');
      process.exit(1);
    }
    
    console.log('👤 Using admin:', adminUser.email);
    
    // Generate a token for testing
    const token = jwt.sign(
      { 
        id: adminUser._id,
        email: adminUser.email,
        role: 'admin',
        admin: true
      },
      process.env.JWT_SECRET || 'linkage-secret-key-2024',
      { expiresIn: '1h' }
    );
    
    console.log('\n🔑 Generated test token');
    console.log('Token (for testing):', token.substring(0, 50) + '...');
    
    // Test fetching configs directly
    console.log('\n📋 Fetching configurations from database...');
    const configs = await SiteConfig.find({ isEditable: true });
    
    console.log(`✅ Found ${configs.length} editable configurations`);
    
    // Group by category
    const byCategory = {};
    for (const config of configs) {
      if (!byCategory[config.category]) {
        byCategory[config.category] = [];
      }
      byCategory[config.category].push({
        key: config.key,
        value: config.value,
        type: config.valueType
      });
    }
    
    console.log('\n📊 Configurations by category:');
    Object.entries(byCategory).forEach(([category, items]) => {
      console.log(`\n${category.toUpperCase()} (${items.length} settings):`);
      items.slice(0, 3).forEach(item => {
        const value = typeof item.value === 'object' ? JSON.stringify(item.value) : item.value;
        console.log(`  - ${item.key}: ${value} (${item.type})`);
      });
      if (items.length > 3) {
        console.log(`  ... and ${items.length - 3} more`);
      }
    });
    
    // Test the API endpoint using axios
    console.log('\n🌐 Testing API endpoint...');
    const axios = require('axios');
    
    try {
      const response = await axios.get('http://localhost:8000/api/admin/config', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        console.log('✅ API endpoint working correctly');
        console.log('📦 Response structure:', {
          success: response.data.success,
          dataKeys: Object.keys(response.data.data).length + ' configuration keys',
          sampleKeys: Object.keys(response.data.data).slice(0, 5)
        });
      }
    } catch (apiError) {
      console.error('❌ API Error:', apiError.response?.data || apiError.message);
    }
    
    // Test update functionality
    console.log('\n🔧 Testing update functionality...');
    const testKey = 'site_name';
    const originalConfig = await SiteConfig.findOne({ key: testKey });
    const originalValue = originalConfig.value;
    
    console.log(`Original ${testKey}:`, originalValue);
    
    // Update via API
    try {
      const updateResponse = await axios.put('http://localhost:8000/api/admin/config', {
        configs: {
          [testKey]: 'Test Update - ' + new Date().toISOString()
        }
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (updateResponse.data.success) {
        console.log('✅ Update successful');
        
        // Verify update
        const updatedConfig = await SiteConfig.findOne({ key: testKey });
        console.log('New value:', updatedConfig.value);
        
        // Restore original
        updatedConfig.value = originalValue;
        await updatedConfig.save();
        console.log('✅ Restored original value');
      }
    } catch (updateError) {
      console.error('❌ Update Error:', updateError.response?.data || updateError.message);
    }
    
    console.log('\n====================================');
    console.log('✅ All tests completed successfully');
    console.log('====================================');
    
    // Instructions for frontend testing
    console.log('\n📝 Frontend Testing Instructions:');
    console.log('1. Open http://localhost:3000/admin/settings');
    console.log('2. Login with admin credentials');
    console.log('3. You should see all configuration categories');
    console.log('4. Try updating a setting and saving');
    console.log('\nIf you need to test with curl:');
    console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:8000/api/admin/config`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testConfigDirectly();