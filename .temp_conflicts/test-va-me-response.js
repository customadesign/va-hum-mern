const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const VA = require('./models/VA');
const User = require('./models/User');

async function testVAMeResponse() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Find a VA to test with
    console.log('\n1. Finding VA for testing...');
    const testVA = await VA.findOne({}).populate('user');
    
    if (!testVA) {
      console.log('❌ No VA found for testing');
      return;
    }
    
    console.log(`✅ Found VA: ${testVA.name} (ID: ${testVA._id})`);

    // 2. Check current DISC assessment data
    console.log('\n2. Current DISC assessment data:');
    console.log('discAssessment:', testVA.discAssessment);
    console.log('discAssessment.isCompleted:', testVA.discAssessment?.isCompleted);
    console.log('discAssessment.primaryType:', testVA.discAssessment?.primaryType);
    console.log('discAssessment.scores:', testVA.discAssessment?.scores);

    // 3. Add sample DISC data if not present
    if (!testVA.discAssessment?.isCompleted) {
      console.log('\n3. Adding sample DISC assessment data...');
      testVA.discAssessment = {
        isCompleted: true,
        primaryType: 'I',
        scores: {
          dominance: 25,
          influence: 85,
          steadiness: 45,
          conscientiousness: 30
        },
        completedAt: new Date(),
        assessmentData: {
          responses: [
            { question: 1, answer: 'A' },
            { question: 2, answer: 'B' }
          ]
        }
      };
      await testVA.save();
      console.log('✅ Sample DISC data added');
    }

    // 4. Test the toObject() method
    console.log('\n4. Testing toObject() serialization...');
    const vaObject = testVA.toObject();
    console.log('discAssessment in toObject():', vaObject.discAssessment);
    console.log('discAssessment.scores in toObject():', vaObject.discAssessment?.scores);

    // 5. Test JSON.stringify
    console.log('\n5. Testing JSON serialization...');
    const vaJson = JSON.stringify(testVA, null, 2);
    console.log('Full VA JSON (first 1000 chars):', vaJson.substring(0, 1000));
    
    // Check if DISC data is in JSON
    if (vaJson.includes('discAssessment')) {
      console.log('✅ DISC assessment found in JSON');
    } else {
      console.log('❌ DISC assessment NOT found in JSON');
    }

    // 6. Test the exact transformation that happens in /vas/me route
    console.log('\n6. Testing /vas/me route transformation...');
    const transformedVA = {
      ...testVA.toObject(),
      roleType: testVA.roleType ? {
        part_time_contract: testVA.roleType.partTimeContract || false,
        full_time_contract: testVA.roleType.fullTimeContract || false,
        full_time_employment: testVA.roleType.fullTimeEmployment || false
      } : {
        part_time_contract: false,
        full_time_contract: false,
        full_time_employment: false
      },
      roleLevel: testVA.roleLevel ? {
        junior: testVA.roleLevel.junior || false,
        mid: testVA.roleLevel.mid || false,
        senior: testVA.roleLevel.senior || false,
        principal: testVA.roleLevel.principal || false,
        c_level: testVA.roleLevel.cLevel || false
      } : {
        junior: false,
        mid: false,
        senior: false,
        principal: false,
        c_level: false
      }
    };

    console.log('Transformed DISC assessment:', transformedVA.discAssessment);
    console.log('Transformed DISC scores:', transformedVA.discAssessment?.scores);

    // 7. Test the final response format
    console.log('\n7. Final response format:');
    const response = {
      success: true,
      data: transformedVA
    };
    
    console.log('Response DISC assessment:', response.data.discAssessment);
    console.log('Response DISC scores:', response.data.discAssessment?.scores);

    console.log('\n🎉 VA /me response test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testVAMeResponse(); 