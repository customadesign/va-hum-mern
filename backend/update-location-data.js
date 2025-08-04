const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const Location = require("./models/Location");

async function updateLocationData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Sample data to update locations
    const locationUpdates = [
      {
        city: "Manila",
        state: "NCR",
        updates: {
          streetAddress: "123 Rizal Avenue, Binondo",
          postalCode: "1006",
          barangay: "Binondo",
        },
      },
      {
        city: "Cebu City",
        state: "NCR",
        updates: {
          streetAddress: "456 Mango Avenue, Lahug",
          postalCode: "6000",
          barangay: "Lahug",
        },
      },
      {
        city: "Makati",
        state: "NCR",
        updates: {
          streetAddress: "789 Ayala Avenue, Bel-Air",
          postalCode: "1200",
          barangay: "Bel-Air",
        },
      },
      {
        city: "Quezon City",
        state: "NCR",
        updates: {
          streetAddress: "321 EDSA, Diliman",
          postalCode: "1101",
          barangay: "Diliman",
        },
      },
      {
        city: "Davao City",
        state: "NCR",
        updates: {
          streetAddress: "654 Pichon Street, Poblacion",
          postalCode: "8000",
          barangay: "Poblacion",
        },
      },
    ];

    console.log("Updating location data...");
    let updatedCount = 0;

    for (const locationUpdate of locationUpdates) {
      const location = await Location.findOne({
        city: locationUpdate.city,
        state: locationUpdate.state,
      });

      if (location) {
        // Only update if fields are empty
        let needsUpdate = false;
        if (!location.streetAddress && locationUpdate.updates.streetAddress) {
          location.streetAddress = locationUpdate.updates.streetAddress;
          needsUpdate = true;
        }
        if (!location.postalCode && locationUpdate.updates.postalCode) {
          location.postalCode = locationUpdate.updates.postalCode;
          needsUpdate = true;
        }
        if (!location.barangay && locationUpdate.updates.barangay) {
          location.barangay = locationUpdate.updates.barangay;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await location.save();
          updatedCount++;
          console.log(`✅ Updated ${location.city}, ${location.state}`);
          console.log(`   Street: ${location.streetAddress}`);
          console.log(`   Postal: ${location.postalCode}`);
          console.log(`   Barangay: ${location.barangay}`);
        } else {
          console.log(
            `⏭️  Skipped ${location.city}, ${location.state} (already has data)`
          );
        }
      } else {
        console.log(
          `❌ Location not found: ${locationUpdate.city}, ${locationUpdate.state}`
        );
      }
    }

    console.log(`\n🎉 Updated ${updatedCount} locations successfully!`);

    // Test the virtuals after update
    console.log("\nTesting virtuals after update:");
    const testLocation = await Location.findOne({
      city: "Manila",
      state: "NCR",
    });
    if (testLocation) {
      const locationJson = testLocation.toJSON();
      console.log("Manila location as JSON:");
      console.log(JSON.stringify(locationJson, null, 2));
    }
  } catch (error) {
    console.error("Update failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

updateLocationData();
