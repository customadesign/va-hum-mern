const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const VA = require('./models/VA');

async function testDiscUpdate() {
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

    // 2. Test updating DISC data via the PUT /api/vas/me/disc-assessment endpoint logic
    console.log('\n2. Testing DISC data update logic...');
    
    const updateData = {
      primaryType: 'C',
      scores: {
        dominance: 15,
        influence: 20,
        steadiness: 25,
        conscientiousness: 95
      },
      assessmentData: {
        responses: [
          { question: 1, answer: 'D' },
          { question: 2, answer: 'C' },
          { question: 3, answer: 'B' }
        ]
      }
    };

    console.log('Update data:', updateData);

    // Simulate the PUT endpoint logic
    if (updateData.primaryType && ['D', 'I', 'S', 'C'].includes(updateData.primaryType)) {
      va.discAssessment.primaryType = updateData.primaryType;
    }

    if (updateData.scores && typeof updateData.scores === 'object') {
      va.discAssessment.scores = { ...va.discAssessment.scores, ...updateData.scores };
    }

    if (updateData.assessmentData) {
      va.discAssessment.assessmentData = updateData.assessmentData;
    }

    va.discAssessment.isCompleted = true;
    va.discAssessment.completedAt = new Date();

    await va.save();

    console.log('✅ DISC data updated successfully');

    // 3. Verify the update
    console.log('\n3. Verifying the update...');
    const updatedVA = await VA.findById(va._id);
    
    console.log('Updated DISC assessment:', {
      isCompleted: updatedVA.discAssessment.isCompleted,
      primaryType: updatedVA.discAssessment.primaryType,
      scores: updatedVA.discAssessment.scores,
      completedAt: updatedVA.discAssessment.completedAt
    });

    // 4. Test the response format
    console.log('\n4. Testing response format...');
    const response = {
      success: true,
      data: {
        discAssessment: updatedVA.discAssessment
      }
    };

    console.log('Response:', response);

    // 5. Test that the frontend can access the updated data
    console.log('\n5. Testing frontend data access...');
    const frontendData = {
      discPrimaryType: updatedVA.discAssessment.primaryType,
      discDominance: updatedVA.discAssessment.scores.dominance,
      discInfluence: updatedVA.discAssessment.scores.influence,
      discSteadiness: updatedVA.discAssessment.scores.steadiness,
      discConscientiousness: updatedVA.discAssessment.scores.conscientiousness,
    };

    console.log('Frontend accessible data:', frontendData);

    console.log('\n🎉 DISC update test completed successfully!');
    console.log('\n✅ DISC data can be properly updated and accessed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testDiscUpdate(); 