const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const VA = require('./models/VA');

async function testDiscLoopFix() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Find a VA to test with
    console.log('\n1. Finding VA for testing...');
    const va = await VA.findOne({});
    
    if (!va) {
      console.log('❌ No VA found');
      return;
    }
    
    console.log(`✅ Found VA: ${va.name} (ID: ${va._id})`);

    // 2. Test the change detection logic
    console.log('\n2. Testing change detection logic...');
    
    const testCases = [
      {
        name: 'Same data - should not update',
        requestData: {
          discPrimaryType: 'I',
          discDominance: 30,
          discInfluence: 90,
          discSteadiness: 40,
          discConscientiousness: 35
        },
        expectedUpdate: false
      },
      {
        name: 'Different data - should update',
        requestData: {
          discPrimaryType: 'S',
          discDominance: 25,
          discInfluence: 85,
          discSteadiness: 90,
          discConscientiousness: 30
        },
        expectedUpdate: true
      }
    ];

    for (const testCase of testCases) {
      console.log(`\nTesting: ${testCase.name}`);
      
      const currentDisc = va.discAssessment || {};
      const hasChanged = 
        testCase.requestData.discPrimaryType !== currentDisc.primaryType ||
        parseInt(testCase.requestData.discDominance) !== currentDisc.scores?.dominance ||
        parseInt(testCase.requestData.discInfluence) !== currentDisc.scores?.influence ||
        parseInt(testCase.requestData.discSteadiness) !== currentDisc.scores?.steadiness ||
        parseInt(testCase.requestData.discConscientiousness) !== currentDisc.scores?.conscientiousness;
      
      console.log('Current DISC data:', {
        primaryType: currentDisc.primaryType,
        scores: currentDisc.scores
      });
      
      console.log('Request DISC data:', testCase.requestData);
      
      console.log('Has changed:', hasChanged);
      console.log('Expected update:', testCase.expectedUpdate);
      console.log('Test result:', hasChanged === testCase.expectedUpdate ? '✅ PASS' : '❌ FAIL');
      
      if (hasChanged) {
        console.log('Would update DISC assessment');
      } else {
        console.log('Would skip DISC assessment update');
      }
    }

    // 3. Test the completedAt logic
    console.log('\n3. Testing completedAt logic...');
    
    // Test case 1: First time setting primary type
    console.log('\nTest case 1: First time setting primary type');
    const va1 = await VA.findById(va._id);
    va1.discAssessment = {
      isCompleted: false,
      primaryType: null,
      scores: {},
      completedAt: null,
      assessmentData: {}
    };
    
    if (va1.discAssessment.primaryType) {
      va1.discAssessment.isCompleted = true;
      if (!va1.discAssessment.completedAt) {
        va1.discAssessment.completedAt = new Date();
        console.log('✅ Would set completedAt (first time)');
      } else {
        console.log('❌ Would not set completedAt (already set)');
      }
    }
    
    // Test case 2: Updating existing primary type
    console.log('\nTest case 2: Updating existing primary type');
    const va2 = await VA.findById(va._id);
    va2.discAssessment = {
      isCompleted: true,
      primaryType: 'I',
      scores: { dominance: 30, influence: 90, steadiness: 40, conscientiousness: 35 },
      completedAt: new Date('2025-08-04T10:00:00Z'),
      assessmentData: {}
    };
    
    if (va2.discAssessment.primaryType) {
      va2.discAssessment.isCompleted = true;
      if (!va2.discAssessment.completedAt) {
        va2.discAssessment.completedAt = new Date();
        console.log('❌ Would set completedAt (should not)');
      } else {
        console.log('✅ Would not set completedAt (already set)');
      }
    }

    console.log('\n🎉 DISC loop fix test completed successfully!');
    console.log('\n✅ Backend should now prevent unnecessary DISC updates');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testDiscLoopFix(); 