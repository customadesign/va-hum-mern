#!/usr/bin/env node

/**
 * VA Database Test Script
 * Tests VA collection and data integrity
 */

require('dotenv').config();
const mongoose = require('mongoose');
const VA = require('./models/VA');
const User = require('./models/User');
const Location = require('./models/Location');
const Specialty = require('./models/Specialty');
const RoleType = require('./models/RoleType');
const RoleLevel = require('./models/RoleLevel');

console.log('🔍 VA Database Analysis');
console.log('=======================\n');

async function analyzeVAData() {
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    console.log('Port:', process.env.PORT || 5000);
    console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully\n');
    
    // Check database name
    const dbName = mongoose.connection.db.databaseName;
    console.log('📁 Database:', dbName);
    
    // 1. Count VAs
    const vaCount = await VA.countDocuments();
    console.log(`\n📊 Total VAs in database: ${vaCount}`);
    
    // 2. Count VAs by search status
    const statusCounts = await VA.aggregate([
      {
        $group: {
          _id: '$searchStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\n🔍 VAs by Search Status:');
    statusCounts.forEach(status => {
      console.log(`  - ${status._id || 'not set'}: ${status.count}`);
    });
    
    // 3. Check for VAs with missing relationships
    const vasWithoutUser = await VA.countDocuments({ user: { $exists: false } });
    const vasWithoutLocation = await VA.countDocuments({ location: { $exists: false } });
    const vasWithoutRoleType = await VA.countDocuments({ roleType: { $exists: false } });
    const vasWithoutRoleLevel = await VA.countDocuments({ roleLevel: { $exists: false } });
    
    console.log('\n⚠️  Missing Relationships:');
    console.log(`  - VAs without User reference: ${vasWithoutUser}`);
    console.log(`  - VAs without Location: ${vasWithoutLocation}`);
    console.log(`  - VAs without RoleType: ${vasWithoutRoleType}`);
    console.log(`  - VAs without RoleLevel: ${vasWithoutRoleLevel}`);
    
    // 4. Sample a few VAs to check data
    console.log('\n📋 Sample VA Data (first 3 visible VAs):');
    const sampleVAs = await VA.find({
      searchStatus: { $in: ['actively_looking', 'open'] }
    })
      .populate('user', 'email')
      .populate('location')
      .populate('specialties')
      .populate('roleType')
      .populate('roleLevel')
      .limit(3);
    
    sampleVAs.forEach((va, index) => {
      console.log(`\n  VA ${index + 1}:`);
      console.log(`    - Name: ${va.name}`);
      console.log(`    - Email: ${va.email || 'not set'}`);
      console.log(`    - User: ${va.user ? va.user.email : 'missing'}`);
      console.log(`    - Location: ${va.location ? `${va.location.city}, ${va.location.country}` : 'not set'}`);
      console.log(`    - Search Status: ${va.searchStatus}`);
      console.log(`    - Specialties: ${va.specialties?.length || 0} specialties`);
      console.log(`    - RoleType exists: ${!!va.roleType}`);
      console.log(`    - RoleLevel exists: ${!!va.roleLevel}`);
      console.log(`    - Created: ${va.createdAt}`);
    });
    
    // 5. Check text indexes
    console.log('\n🔍 Checking Text Indexes:');
    const indexes = await VA.collection.getIndexes();
    const textIndexes = Object.keys(indexes).filter(key => 
      JSON.stringify(indexes[key]).includes('text')
    );
    
    if (textIndexes.length > 0) {
      console.log('  ✅ Text indexes found:', textIndexes.join(', '));
    } else {
      console.log('  ⚠️ No text indexes found - text search may fail');
      console.log('  💡 Creating text index...');
      try {
        await VA.collection.createIndex({
          name: 'text',
          bio: 'text',
          hero: 'text'
        });
        console.log('  ✅ Text index created successfully');
      } catch (err) {
        console.log('  ❌ Failed to create text index:', err.message);
      }
    }
    
    // 6. Check orphaned RoleType/RoleLevel documents
    const orphanedRoleTypes = await RoleType.find({ va: { $exists: false } });
    const orphanedRoleLevels = await RoleLevel.find({ va: { $exists: false } });
    
    console.log('\n🔗 Orphaned Documents:');
    console.log(`  - RoleTypes without VA: ${orphanedRoleTypes.length}`);
    console.log(`  - RoleLevels without VA: ${orphanedRoleLevels.length}`);
    
    // 7. Test a simple query like the frontend would make
    console.log('\n🧪 Testing VA Query (like frontend):');
    const testQuery = {
      searchStatus: { $in: ['actively_looking', 'open'] }
    };
    
    const testResults = await VA.find(testQuery)
      .populate('location')
      .populate('specialties')
      .populate('roleLevel')
      .populate('roleType')
      .limit(5);
    
    console.log(`  Found ${testResults.length} VAs matching query`);
    
    // 8. Check for recent VAs
    const recentVAs = await VA.find({})
      .sort({ createdAt: -1 })
      .limit(3);
    
    console.log('\n📅 Most Recently Created VAs:');
    recentVAs.forEach(va => {
      console.log(`  - ${va.name} (${va.createdAt.toLocaleDateString()})`);
    });
    
    console.log('\n✨ Analysis Complete!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
  }
}

analyzeVAData();