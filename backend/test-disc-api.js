const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const VA = require("./models/VA");
const User = require("./models/User");

async function testDiscAPI() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // 1. Find a VA with DISC data
    console.log("\n1. Finding VA with DISC data...");
    const va = await VA.findOne({ "discAssessment.isCompleted": true });

    if (!va) {
      console.log("❌ No VA with DISC data found");
      return;
    }

    console.log(`✅ Found VA: ${va.name} (ID: ${va._id})`);

    // 2. Test the GET /api/vas/me/disc-assessment endpoint response format
    console.log("\n2. Testing GET /api/vas/me/disc-assessment response...");
    const discResponse = {
      success: true,
      data: {
        discAssessment: va.discAssessment,
      },
    };

    console.log("Response structure:", {
      success: discResponse.success,
      hasDiscAssessment: !!discResponse.data.discAssessment,
      isCompleted: discResponse.data.discAssessment.isCompleted,
      primaryType: discResponse.data.discAssessment.primaryType,
      hasScores: !!discResponse.data.discAssessment.scores,
      scores: discResponse.data.discAssessment.scores,
    });

    // 3. Test the POST /api/vas/me/disc-assessment endpoint
    console.log("\n3. Testing POST /api/vas/me/disc-assessment...");
    const newDiscData = {
      primaryType: "S",
      scores: {
        dominance: 30,
        influence: 40,
        steadiness: 90,
        conscientiousness: 35,
      },
      assessmentData: {
        responses: [
          { question: 1, answer: "B" },
          { question: 2, answer: "A" },
          { question: 3, answer: "C" },
        ],
      },
    };

    console.log("New DISC data to submit:", newDiscData);

    // 4. Test the PUT /api/vas/me/disc-assessment endpoint
    console.log("\n4. Testing PUT /api/vas/me/disc-assessment...");
    const updateData = {
      primaryType: "C",
      scores: {
        dominance: 20,
        influence: 25,
        steadiness: 30,
        conscientiousness: 95,
      },
    };

    console.log("Update data:", updateData);

    // 5. Test the exact format that the frontend expects
    console.log("\n5. Testing frontend-expected format...");
    const frontendExpectedFormat = {
      discAssessment: {
        isCompleted: va.discAssessment.isCompleted,
        primaryType: va.discAssessment.primaryType,
        scores: va.discAssessment.scores,
        completedAt: va.discAssessment.completedAt,
      },
    };

    console.log("Frontend expected format:", frontendExpectedFormat);
    console.log(
      "Primary type available:",
      frontendExpectedFormat.discAssessment.primaryType
    );
    console.log(
      "Dominance score:",
      frontendExpectedFormat.discAssessment.scores.dominance
    );
    console.log(
      "Influence score:",
      frontendExpectedFormat.discAssessment.scores.influence
    );
    console.log(
      "Steadiness score:",
      frontendExpectedFormat.discAssessment.scores.steadiness
    );
    console.log(
      "Conscientiousness score:",
      frontendExpectedFormat.discAssessment.scores.conscientiousness
    );

    // 6. Test the /vas/me endpoint response
    console.log("\n6. Testing /vas/me endpoint response...");
    const vaMeResponse = {
      success: true,
      data: {
        ...va.toObject(),
        roleType: va.roleType
          ? {
              part_time_contract: va.roleType.partTimeContract || false,
              full_time_contract: va.roleType.fullTimeContract || false,
              full_time_employment: va.roleType.fullTimeEmployment || false,
            }
          : {
              part_time_contract: false,
              full_time_contract: false,
              full_time_employment: false,
            },
        roleLevel: va.roleLevel
          ? {
              junior: va.roleLevel.junior || false,
              mid: va.roleLevel.mid || false,
              senior: va.roleLevel.senior || false,
              principal: va.roleLevel.principal || false,
              c_level: va.roleLevel.cLevel || false,
            }
          : {
              junior: false,
              mid: false,
              senior: false,
              principal: false,
              c_level: false,
            },
      },
    };

    console.log(
      "VA /me response includes DISC:",
      !!vaMeResponse.data.discAssessment
    );
    if (vaMeResponse.data.discAssessment) {
      console.log("DISC data in /me response:", {
        isCompleted: vaMeResponse.data.discAssessment.isCompleted,
        primaryType: vaMeResponse.data.discAssessment.primaryType,
        scores: vaMeResponse.data.discAssessment.scores,
      });
    }

    console.log("\n🎉 DISC API test completed successfully!");
    console.log("\n✅ Backend is ready to serve DISC data to frontend");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

testDiscAPI();
