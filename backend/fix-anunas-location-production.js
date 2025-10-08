const mongoose = require("mongoose");

// This script fixes the Barangay Anunas location data issue
// Run this on the production server with proper MongoDB connection

async function fixAnunasLocationProduction() {
  try {
    // Import models (adjust path as needed)
    const Location = require("./models/Location");
    const VA = require("./models/VA");

    console.log("🔍 Searching for problematic location data...");

    // Find locations where city contains "anunas" or "barangay anunas"
    const problematicLocations = await Location.find({
      $or: [
        { city: { $regex: /anunas/i } },
        { city: { $regex: /barangay.*anunas/i } },
        { city: /^barangay anunas$/i }
      ]
    });

    console.log(`Found ${problematicLocations.length} problematic location records`);
    
    if (problematicLocations.length > 0) {
      console.log("🔧 Fixing location data...");
      
      for (const location of problematicLocations) {
        console.log(`\nFixing Location ID: ${location._id}`);
        console.log(`Previous City: ${location.city}`);
        
        // Find VAs using this location
        const vasUsingLocation = await VA.find({ location: location._id }).select('name');
        console.log(`Used by ${vasUsingLocation.length} VA(s): ${vasUsingLocation.map(va => va.name).join(', ')}`);
        
        // Update the location
        const updatedLocation = await Location.findByIdAndUpdate(
          location._id,
          {
            $set: {
              city: "Angeles City",
              state: "Pampanga", 
              barangay: "Anunas",
              country: "Philippines",
              countryCode: "PH",
              timeZone: "Asia/Manila",
              utcOffset: 8
            }
          },
          { new: true }
        );
        
        console.log(`✅ Updated to: ${updatedLocation.city}, Barangay ${updatedLocation.barangay}`);
      }
      
      console.log("\n🎉 Location data fix completed!");
    } else {
      console.log("✅ No problematic location data found!");
    }

  } catch (error) {
    console.error("❌ Error fixing location data:", error);
    throw error;
  }
}

module.exports = { fixAnunasLocationProduction };

// Only run if called directly
if (require.main === module) {
  const MONGODB_URI = process.env.MONGODB_URI || "your_mongodb_connection_string_here";
  
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log("Connected to MongoDB");
      return fixAnunasLocationProduction();
    })
    .then(() => {
      console.log("Fix completed successfully");
    })
    .catch((error) => {
      console.error("Fix failed:", error);
    })
    .finally(() => {
      mongoose.disconnect();
      console.log("Disconnected from MongoDB");
    });
}