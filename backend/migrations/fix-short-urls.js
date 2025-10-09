const mongoose = require('mongoose');
const ShortUrl = require('../models/ShortUrl');
require('dotenv').config();

async function migrateShortUrls() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully');

    // Find all short URLs with hardcoded frontend URLs
    const shortUrls = await ShortUrl.find({
      originalUrl: { 
        $regex: /^https?:\/\//, // URLs that start with http:// or https://
      }
    });

    console.log(`Found ${shortUrls.length} short URLs to migrate`);

    let updated = 0;
    for (const shortUrl of shortUrls) {
      // Extract the path from the full URL
      // Example: http://localhost:3000/vas/123 -> /vas/123
      const urlMatch = shortUrl.originalUrl.match(/\/vas\/[a-f0-9]{24}/);
      
      if (urlMatch) {
        const relativePath = urlMatch[0];
        console.log(`Updating ${shortUrl.shortCode}: ${shortUrl.originalUrl} -> ${relativePath}`);
        
        shortUrl.originalUrl = relativePath;
        await shortUrl.save();
        updated++;
      } else {
        console.warn(`Could not extract path from: ${shortUrl.originalUrl}`);
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`Total short URLs found: ${shortUrls.length}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Skipped: ${shortUrls.length - updated}`);

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrateShortUrls();