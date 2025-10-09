const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const VA = require("./models/VA");
const Location = require("./models/Location");

async function testLocationData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // 1. Check all locations in the database
    console.log("\n1. All locations in database:");
    const allLocations = await Location.find({});
    console.log(`Found ${allLocations.length} locations:`);
    allLocations.forEach((loc, index) => {
      console.log(
        `${index + 1}. ${loc.city}, ${loc.state || "N/A"}, ${loc.country}`
      );
      console.log(`   Street: ${loc.streetAddress || "N/A"}`);
      console.log(`   Postal: ${loc.postalCode || "N/A"}`);
      console.log(`   Barangay: ${loc.barangay || "N/A"}`);
      console.log(`   ID: ${loc._id}`);
      console.log("");
    });

    // 2. Check VA profiles and their locations
    console.log("\n2. VA profiles with location data:");
    const vasWithLocation = await VA.find({
      location: { $exists: true, $ne: null },
    })
      .populate("location")
      .limit(5);

    console.log(`Found ${vasWithLocation.length} VAs with location data:`);
    vasWithLocation.forEach((va, index) => {
      console.log(`${index + 1}. VA: ${va.name}`);
      if (va.location) {
        console.log(`   Location ID: ${va.location._id}`);
        console.log(`   City: ${va.location.city}`);
        console.log(`   State/Province: ${va.location.state || "N/A"}`);
        console.log(`   Country: ${va.location.country}`);
        console.log(`   Street: ${va.location.streetAddress || "N/A"}`);
        console.log(`   Postal: ${va.location.postalCode || "N/A"}`);
        console.log(`   Barangay: ${va.location.barangay || "N/A"}`);

        // Test virtuals
        console.log(`   Virtual street: ${va.location.street || "N/A"}`);
        console.log(`   Virtual province: ${va.location.province || "N/A"}`);
        console.log(
          `   Virtual postal_code: ${va.location.postal_code || "N/A"}`
        );
      } else {
        console.log(`   No location data`);
      }
      console.log("");
    });

    // 3. Test location JSON conversion
    if (vasWithLocation.length > 0 && vasWithLocation[0].location) {
      console.log("\n3. Testing location JSON conversion:");
      const location = vasWithLocation[0].location;
      const locationJson = location.toJSON();
      console.log("Location as JSON:");
      console.log(JSON.stringify(locationJson, null, 2));
    }

    // 4. Check for VAs without location
    console.log("\n4. VAs without location data:");
    const vasWithoutLocation = await VA.find({
      $or: [{ location: { $exists: false } }, { location: null }],
    }).limit(5);

    console.log(
      `Found ${vasWithoutLocation.length} VAs without location data:`
    );
    vasWithoutLocation.forEach((va, index) => {
      console.log(`${index + 1}. ${va.name} (ID: ${va._id})`);
    });
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

testLocationData();
