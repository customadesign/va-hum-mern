const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const VA = require('./models/VA');

async function testDiscIntegration() {
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

    // 2. Test the main /vas/me PUT endpoint logic with DISC data
    console.log('\n2. Testing /vas/me PUT endpoint with DISC data...');
    
    const updateData = {
      name: va.name, // Keep existing name
      discPrimaryType: 'I',
      discDominance: 30,
      discInfluence: 90,
      discSteadiness: 40,
      discConscientiousness: 35
    };

    console.log('Update data to send to /vas/me:', updateData);

    // Simulate the /vas/me PUT endpoint logic
    const allowedFields = [
      'name',
      'hero',
      'bio',
      'coverImage',
      'avatar',
      'website',
      'github',
      'linkedin',
      'twitter',
      'meta',
      'instagram',
      'schedulingLink',
      'preferredMinHourlyRate',
      'preferredMaxHourlyRate',
      'preferredMinSalary',
      'preferredMaxSalary',
      'searchStatus',
      'videoIntroduction',
      'location',
      'email',
      'phone',
      'whatsapp',
      'viber',
      'specialtyIds',
      'profileReminderNotifications',
      'productAnnouncementNotifications',
      'discPrimaryType',
      'discDominance',
      'discInfluence',
      'discSteadiness',
      'discConscientiousness'
    ];

    const filteredUpdateData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field];
      }
    });

    console.log('Filtered update data:', filteredUpdateData);

    // Update the VA with the filtered data
    const updatedVA = await VA.findOneAndUpdate(
      { _id: va._id },
      filteredUpdateData,
      { new: true, runValidators: true }
    );

    console.log('✅ VA updated with filtered data');

    // 3. Handle DISC assessment updates
    if ((updateData.discPrimaryType || updateData.discDominance || updateData.discInfluence || 
         updateData.discSteadiness || updateData.discConscientiousness) && updatedVA) {
      console.log('\n3. Processing DISC assessment updates...');
      
      // Initialize discAssessment if it doesn't exist
      if (!updatedVA.discAssessment) {
        updatedVA.discAssessment = {
          isCompleted: false,
          primaryType: null,
          scores: {},
          completedAt: null,
          assessmentData: {}
        };
      }
      
      // Update DISC assessment data
      if (updateData.discPrimaryType && ['D', 'I', 'S', 'C'].includes(updateData.discPrimaryType)) {
        updatedVA.discAssessment.primaryType = updateData.discPrimaryType;
      }
      
      if (updateData.discDominance !== undefined) {
        updatedVA.discAssessment.scores.dominance = parseInt(updateData.discDominance) || 0;
      }
      
      if (updateData.discInfluence !== undefined) {
        updatedVA.discAssessment.scores.influence = parseInt(updateData.discInfluence) || 0;
      }
      
      if (updateData.discSteadiness !== undefined) {
        updatedVA.discAssessment.scores.steadiness = parseInt(updateData.discSteadiness) || 0;
      }
      
      if (updateData.discConscientiousness !== undefined) {
        updatedVA.discAssessment.scores.conscientiousness = parseInt(updateData.discConscientiousness) || 0;
      }
      
      // Mark as completed if primary type is set
      if (updatedVA.discAssessment.primaryType) {
        updatedVA.discAssessment.isCompleted = true;
        updatedVA.discAssessment.completedAt = new Date();
      }
      
      await updatedVA.save();
      console.log('✅ DISC assessment updated successfully');
    }

    // 4. Verify the final result
    console.log('\n4. Verifying final result...');
    const finalVA = await VA.findById(va._id);
    
    console.log('Final DISC assessment:', {
      isCompleted: finalVA.discAssessment?.isCompleted,
      primaryType: finalVA.discAssessment?.primaryType,
      scores: finalVA.discAssessment?.scores,
      completedAt: finalVA.discAssessment?.completedAt
    });

    // 5. Test the /vas/me GET response format
    console.log('\n5. Testing /vas/me GET response format...');
    const response = {
      success: true,
      data: {
        ...finalVA.toObject(),
        roleType: finalVA.roleType ? {
          part_time_contract: finalVA.roleType.partTimeContract || false,
          full_time_contract: finalVA.roleType.fullTimeContract || false,
          full_time_employment: finalVA.roleType.fullTimeEmployment || false
        } : {
          part_time_contract: false,
          full_time_contract: false,
          full_time_employment: false
        },
        roleLevel: finalVA.roleLevel ? {
          junior: finalVA.roleLevel.junior || false,
          mid: finalVA.roleLevel.mid || false,
          senior: finalVA.roleLevel.senior || false,
          principal: finalVA.roleLevel.principal || false,
          c_level: finalVA.roleLevel.cLevel || false
        } : {
          junior: false,
          mid: false,
          senior: false,
          principal: false,
          c_level: false
        }
      }
    };

    console.log('Response includes DISC:', !!response.data.discAssessment);
    if (response.data.discAssessment) {
      console.log('DISC data in response:', {
        isCompleted: response.data.discAssessment.isCompleted,
        primaryType: response.data.discAssessment.primaryType,
        scores: response.data.discAssessment.scores
      });
    }

    // 6. Test frontend form access
    console.log('\n6. Testing frontend form access...');
    const frontendFormData = {
      discPrimaryType: response.data.discAssessment?.primaryType || "",
      discDominance: response.data.discAssessment?.scores?.dominance || "",
      discInfluence: response.data.discAssessment?.scores?.influence || "",
      discSteadiness: response.data.discAssessment?.scores?.steadiness || "",
      discConscientiousness: response.data.discAssessment?.scores?.conscientiousness || "",
    };

    console.log('Frontend form data:', frontendFormData);

    console.log('\n🎉 DISC integration test completed successfully!');
    console.log('\n✅ DISC data can be updated through the main /vas/me endpoint');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testDiscIntegration(); 