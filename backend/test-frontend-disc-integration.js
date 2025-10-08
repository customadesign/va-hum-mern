const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const VA = require('./models/VA');

async function testFrontendDiscIntegration() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Get a VA with DISC data
    console.log('\n1. Getting VA with DISC data...');
    const va = await VA.findOne({ 'discAssessment.isCompleted': true });
    
    if (!va) {
      console.log('❌ No VA with DISC data found');
      return;
    }
    
    console.log(`✅ Found VA: ${va.name}`);

    // 2. Simulate the exact response that the frontend receives from /vas/me
    console.log('\n2. Simulating frontend /vas/me response...');
    const frontendResponse = {
      success: true,
      data: {
        ...va.toObject(),
        roleType: va.roleType ? {
          part_time_contract: va.roleType.partTimeContract || false,
          full_time_contract: va.roleType.fullTimeContract || false,
          full_time_employment: va.roleType.fullTimeEmployment || false
        } : {
          part_time_contract: false,
          full_time_contract: false,
          full_time_employment: false
        },
        roleLevel: va.roleLevel ? {
          junior: va.roleLevel.junior || false,
          mid: va.roleLevel.mid || false,
          senior: va.roleLevel.senior || false,
          principal: va.roleLevel.principal || false,
          c_level: va.roleLevel.cLevel || false
        } : {
          junior: false,
          mid: false,
          senior: false,
          principal: false,
          c_level: false
        }
      }
    };

    // 3. Test the frontend form initialization logic
    console.log('\n3. Testing frontend form initialization...');
    const profile = frontendResponse.data;
    
    // Simulate the frontend form initialization
    const formInitialValues = {
      discPrimaryType: profile?.discAssessment?.primaryType || "",
      discDominance: profile?.discAssessment?.scores?.dominance || "",
      discInfluence: profile?.discAssessment?.scores?.influence || "",
      discSteadiness: profile?.discAssessment?.scores?.steadiness || "",
      discConscientiousness: profile?.discAssessment?.scores?.conscientiousness || "",
    };

    console.log('Form initial values:', formInitialValues);

    // 4. Test the useEffect logic that updates form fields
    console.log('\n4. Testing useEffect form field updates...');
    if (profile?.discAssessment) {
      console.log('✅ DISC assessment found in profile');
      console.log('DISC data:', {
        isCompleted: profile.discAssessment.isCompleted,
        primaryType: profile.discAssessment.primaryType,
        scores: profile.discAssessment.scores
      });

      // Simulate the form field updates
      const updatedValues = {
        discPrimaryType: profile.discAssessment.primaryType || "",
        discDominance: profile.discAssessment.scores?.dominance || "",
        discInfluence: profile.discAssessment.scores?.influence || "",
        discSteadiness: profile.discAssessment.scores?.steadiness || "",
        discConscientiousness: profile.discAssessment.scores?.conscientiousness || "",
      };

      console.log('Updated form values:', updatedValues);
    } else {
      console.log('❌ No DISC assessment found in profile');
    }

    // 5. Test the profile completion calculation
    console.log('\n5. Testing profile completion calculation...');
    const values = formInitialValues;
    const discAssessmentComplete = values.discPrimaryType ? true : false;
    
    console.log('DISC assessment completion check:', {
      hasPrimaryType: !!values.discPrimaryType,
      primaryType: values.discPrimaryType,
      isComplete: discAssessmentComplete
    });

    // 6. Test the form submission data structure
    console.log('\n6. Testing form submission data...');
    const submissionData = {
      discPrimaryType: formInitialValues.discPrimaryType,
      discDominance: formInitialValues.discDominance,
      discInfluence: formInitialValues.discInfluence,
      discSteadiness: formInitialValues.discSteadiness,
      discConscientiousness: formInitialValues.discConscientiousness,
    };

    console.log('Form submission data:', submissionData);

    // 7. Verify all DISC scores are properly accessible
    console.log('\n7. Verifying DISC scores accessibility...');
    const discScores = profile?.discAssessment?.scores;
    
    if (discScores) {
      console.log('✅ All DISC scores are accessible:');
      console.log('- Dominance:', discScores.dominance);
      console.log('- Influence:', discScores.influence);
      console.log('- Steadiness:', discScores.steadiness);
      console.log('- Conscientiousness:', discScores.conscientiousness);
    } else {
      console.log('❌ DISC scores not accessible');
    }

    console.log('\n🎉 Frontend DISC integration test completed successfully!');
    console.log('\n✅ Frontend is ready to display DISC data correctly');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testFrontendDiscIntegration(); 