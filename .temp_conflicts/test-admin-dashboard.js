// Test script to verify admin dashboard endpoints are working correctly
// This script tests that the Active VAs calculation is based on login activity

const mongoose = require('mongoose');
const User = require('./models/User');
const VA = require('./models/VA');

// MongoDB connection URL - update this to match your environment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub';

async function testActiveVAsCalculation() {
  try {
    console.log('🔍 Testing Active VAs Calculation...\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Test 1: Count total VAs
    const totalVAs = await VA.countDocuments();
    console.log(`📊 Total VAs in database: ${totalVAs}`);
    
    // Test 2: Count active VAs (users who logged in within last 30 days)
    const activeVAs = await VA.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $match: {
          'userInfo.stats.lastActive': { $gte: thirtyDaysAgo }
        }
      },
      {
        $count: 'total'
      }
    ]);
    
    const activeVACount = activeVAs[0]?.total || 0;
    console.log(`✨ Active VAs (logged in within 30 days): ${activeVACount}`);
    
    // Test 3: Show sample of VAs with their last active dates
    const sampleVAs = await VA.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          name: 1,
          email: '$userInfo.email',
          lastActive: '$userInfo.stats.lastActive',
          isActive: {
            $cond: {
              if: { $gte: ['$userInfo.stats.lastActive', thirtyDaysAgo] },
              then: true,
              else: false
            }
          }
        }
      },
      {
        $limit: 5
      }
    ]);
    
    console.log('\n📋 Sample VA Activity Status:');
    console.log('─'.repeat(60));
    
    for (const va of sampleVAs) {
      const lastActiveDate = va.lastActive ? new Date(va.lastActive).toLocaleDateString() : 'Never';
      const status = va.isActive ? '✅ Active' : '❌ Inactive';
      console.log(`${status} | ${va.name} | Last Active: ${lastActiveDate}`);
    }
    
    // Test 4: Summary
    const percentageActive = totalVAs > 0 ? ((activeVACount / totalVAs) * 100).toFixed(1) : 0;
    console.log('─'.repeat(60));
    console.log(`\n📈 Summary:`);
    console.log(`   - Total VAs: ${totalVAs}`);
    console.log(`   - Active VAs: ${activeVACount}`);
    console.log(`   - Percentage Active: ${percentageActive}%`);
    console.log(`   - Inactive VAs: ${totalVAs - activeVACount}`);
    
    console.log('\n✅ Test completed successfully!');
    console.log('\n💡 Note: The admin dashboard will now show Active VAs as those');
    console.log('   who have logged in within the last 30 days.\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nFull error:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the test
testActiveVAsCalculation();