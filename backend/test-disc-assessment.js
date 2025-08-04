const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const VA = require('./models/VA');
const User = require('./models/User');

async function testDiscAssessment() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Check if VA model has DISC assessment fields
    console.log('\n1. Checking VA model structure...');
    const vaSchema = VA.schema;
    const discFields = vaSchema.path('discAssessment');
    
    if (discFields) {
      console.log('✅ DISC assessment fields found in VA model');
      console.log('DISC fields structure:', Object.keys(discFields.schema.paths));
    } else {
      console.log('❌ DISC assessment fields not found in VA model');
      return;
    }

    // 2. Find a VA to test with
    console.log('\n2. Finding VA for testing...');
    const testVA = await VA.findOne({}).populate('user');
    
    if (!testVA) {
      console.log('❌ No VA found for testing');
      return;
    }
    
    console.log(`✅ Found VA: ${testVA.name} (ID: ${testVA._id})`);
    console.log(`Current DISC assessment:`, testVA.discAssessment);

    // 3. Test updating DISC assessment data
    console.log('\n3. Testing DISC assessment update...');
    const sampleDiscData = {
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

    // Update the VA with DISC data
    testVA.discAssessment = sampleDiscData;
    await testVA.save();
    
    console.log('✅ DISC assessment data updated successfully');
    console.log('Updated DISC data:', testVA.discAssessment);

    // 4. Test retrieving DISC data
    console.log('\n4. Testing DISC assessment retrieval...');
    const retrievedVA = await VA.findById(testVA._id);
    
    if (retrievedVA.discAssessment && retrievedVA.discAssessment.isCompleted) {
      console.log('✅ DISC assessment data retrieved successfully');
      console.log('Primary Type:', retrievedVA.discAssessment.primaryType);
      console.log('Scores:', retrievedVA.discAssessment.scores);
      console.log('Completed At:', retrievedVA.discAssessment.completedAt);
    } else {
      console.log('❌ DISC assessment data not retrieved properly');
    }

    // 5. Test JSON serialization
    console.log('\n5. Testing JSON serialization...');
    const vaJson = retrievedVA.toJSON();
    
    if (vaJson.discAssessment) {
      console.log('✅ DISC assessment included in JSON');
      console.log('JSON DISC data:', JSON.stringify(vaJson.discAssessment, null, 2));
    } else {
      console.log('❌ DISC assessment not included in JSON');
    }

    // 6. Test finding VAs with DISC assessments
    console.log('\n6. Testing VA queries with DISC data...');
    const vasWithDisc = await VA.find({
      'discAssessment.isCompleted': true
    });
    
    console.log(`Found ${vasWithDisc.length} VAs with completed DISC assessments`);
    
    vasWithDisc.forEach((va, index) => {
      console.log(`${index + 1}. ${va.name} - ${va.discAssessment.primaryType} type`);
    });

    console.log('\n🎉 DISC assessment functionality test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testDiscAssessment(); 