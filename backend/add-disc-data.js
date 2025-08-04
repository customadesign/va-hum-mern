const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const VA = require("./models/VA");

async function addDiscData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // 1. Find the first VA
    console.log("\n1. Finding VA...");
    const va = await VA.findOne({});

    if (!va) {
      console.log("❌ No VA found");
      return;
    }

    console.log(`✅ Found VA: ${va.name} (ID: ${va._id})`);

    // 2. Add DISC assessment data
    console.log("\n2. Adding DISC assessment data...");
    va.discAssessment = {
      isCompleted: true,
      primaryType: "I",
      scores: {
        dominance: 25,
        influence: 85,
        steadiness: 45,
        conscientiousness: 30,
      },
      completedAt: new Date(),
      assessmentData: {
        responses: [
          { question: 1, answer: "A" },
          { question: 2, answer: "B" },
          { question: 3, answer: "C" },
        ],
      },
    };

    await va.save();
    console.log("✅ DISC assessment data added successfully");

    // 3. Verify the data was saved
    console.log("\n3. Verifying saved data...");
    const savedVA = await VA.findById(va._id);
    console.log("Saved DISC assessment:", savedVA.discAssessment);
    console.log("Primary type:", savedVA.discAssessment.primaryType);
    console.log("Scores:", savedVA.discAssessment.scores);

    // 4. Test the toObject() method
    console.log("\n4. Testing toObject()...");
    const vaObject = savedVA.toObject();
    console.log("DISC in toObject():", vaObject.discAssessment);
    console.log("Scores in toObject():", vaObject.discAssessment.scores);

    // 5. Test JSON serialization
    console.log("\n5. Testing JSON serialization...");
    const vaJson = JSON.stringify(savedVA, null, 2);
    console.log(
      "JSON includes discAssessment:",
      vaJson.includes("discAssessment")
    );
    console.log("JSON includes scores:", vaJson.includes("scores"));

    // 6. Test the exact response format that /vas/me returns
    console.log("\n6. Testing /vas/me response format...");
    const response = {
      success: true,
      data: {
        ...savedVA.toObject(),
        roleType: savedVA.roleType
          ? {
              part_time_contract: savedVA.roleType.partTimeContract || false,
              full_time_contract: savedVA.roleType.fullTimeContract || false,
              full_time_employment:
                savedVA.roleType.fullTimeEmployment || false,
            }
          : {
              part_time_contract: false,
              full_time_contract: false,
              full_time_employment: false,
            },
        roleLevel: savedVA.roleLevel
          ? {
              junior: savedVA.roleLevel.junior || false,
              mid: savedVA.roleLevel.mid || false,
              senior: savedVA.roleLevel.senior || false,
              principal: savedVA.roleLevel.principal || false,
              c_level: savedVA.roleLevel.cLevel || false,
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

    console.log("Response DISC assessment:", response.data.discAssessment);
    console.log("Response DISC scores:", response.data.discAssessment.scores);
    console.log(
      "Response DISC primary type:",
      response.data.discAssessment.primaryType
    );

    // 7. Test the specific fields the frontend is looking for
    console.log("\n7. Testing frontend-expected fields...");
    const discData = response.data.discAssessment;
    console.log("discAssessment.isCompleted:", discData.isCompleted);
    console.log("discAssessment.primaryType:", discData.primaryType);
    console.log("discAssessment.scores.dominance:", discData.scores.dominance);
    console.log("discAssessment.scores.influence:", discData.scores.influence);
    console.log(
      "discAssessment.scores.steadiness:",
      discData.scores.steadiness
    );
    console.log(
      "discAssessment.scores.conscientiousness:",
      discData.scores.conscientiousness
    );

    console.log("\n🎉 DISC data test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

addDiscData();
