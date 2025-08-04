const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const Location = require("./models/Location");
const VA = require("./models/VA");

async function fixAnunasLocation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    console.log("🔍 Searching for location records with 'barangay anunas' in city field...");

    // Find locations where city contains "anunas" or "barangay anunas"
    const problematicLocations = await Location.find({
      $or: [
        { city: { $regex: /anunas/i } },
        { city: { $regex: /barangay.*anunas/i } }
      ]
    });

    console.log(`Found ${problematicLocations.length} problematic location records:`);
    
    for (const location of problematicLocations) {
      console.log(`\n📍 Location ID: ${location._id}`);
      console.log(`   Current City: ${location.city}`);
      console.log(`   Current Barangay: ${location.barangay || "N/A"}`);
      console.log(`   Country: ${location.country}`);
      
      // Check if this location is used by any VAs
      const vasUsingLocation = await VA.find({ location: location._id }).select('name');
      console.log(`   Used by ${vasUsingLocation.length} VA(s): ${vasUsingLocation.map(va => va.name).join(', ')}`);
    }

    if (problematicLocations.length > 0) {
      console.log("\n🔧 Fixing location data...");
      
      for (const location of problematicLocations) {
        // Update the location to have proper city and barangay
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
        
        console.log(`✅ Fixed location ${location._id}:`);
        console.log(`   New City: ${updatedLocation.city}`);
        console.log(`   New Barangay: ${updatedLocation.barangay}`);
        console.log(`   State: ${updatedLocation.state}`);
      }
      
      console.log("\n🎉 Location data fix completed!");
      console.log("📍 'barangay anunas' has been properly updated to:");
      console.log("   City: Angeles City");
      console.log("   Barangay: Anunas");
      console.log("   State: Pampanga");
    } else {
      console.log("✅ No problematic location data found!");
      
      // Let's also check if there are any locations with Angeles City to see the proper format
      const angelesLocations = await Location.find({ 
        city: { $regex: /angeles/i } 
      });
      
      console.log(`\n📍 Found ${angelesLocations.length} Angeles City location(s):`);
      for (const location of angelesLocations) {
        console.log(`   City: ${location.city}, Barangay: ${location.barangay || "N/A"}`);
      }
    }

  } catch (error) {
    console.error("❌ Error fixing location data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

// Run the fix
fixAnunasLocation().catch(console.error);