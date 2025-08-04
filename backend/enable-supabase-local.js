const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");

try {
  // Read the current .env file
  let envContent = fs.readFileSync(envPath, "utf8");

  // Check if FORCE_SUPABASE already exists
  if (!envContent.includes("FORCE_SUPABASE=")) {
    // Add FORCE_SUPABASE=true after the SERVER_URL line
    envContent = envContent.replace(
      /SERVER_URL=http:\/\/localhost:5000/,
      `SERVER_URL=http://localhost:5000\n\n# Force Supabase usage in development\nFORCE_SUPABASE=true`
    );

    // Write back to .env file
    fs.writeFileSync(envPath, envContent);
    console.log("✅ FORCE_SUPABASE=true added to .env file");
  } else {
    // Update existing FORCE_SUPABASE to true
    envContent = envContent.replace(
      /FORCE_SUPABASE=(false|true)/,
      "FORCE_SUPABASE=true"
    );
    fs.writeFileSync(envPath, envContent);
    console.log("✅ FORCE_SUPABASE set to true in .env file");
  }

  console.log(
    "\n🎉 Supabase will now be used for uploads in local development!"
  );
  console.log("📁 Files will be stored in Supabase bucket: linkage-va-hub");
  console.log(
    "🌐 URLs will be: https://nxjrkfcnwwvijptmwrfz.supabase.co/storage/v1/object/public/linkage-va-hub/..."
  );
} catch (error) {
  console.error("❌ Error updating .env file:", error.message);
}
