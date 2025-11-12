const mongoose = require('mongoose');
const ShortUrl = require('./models/ShortUrl');
require('dotenv').config();

async function fixShortUrls() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all short URLs that have the wrong format
    const shortUrls = await ShortUrl.find({
      originalUrl: { $regex: /\/vas\// }
    });

    console.log(`Found ${shortUrls.length} short URLs to check`);

    const frontendHost = process.env.FRONTEND_URL || 'http://localhost:3000';

    for (const shortUrl of shortUrls) {
      // Check if URL needs fixing
      if (!shortUrl.originalUrl.includes('localhost:3000') && !shortUrl.originalUrl.includes('render.com')) {
        const oldUrl = shortUrl.originalUrl;
        
        // Extract the VA ID from the URL
        const vaIdMatch = shortUrl.originalUrl.match(/\/vas\/([a-f0-9]{24})/);
        if (vaIdMatch) {
          const vaId = vaIdMatch[1];
          shortUrl.originalUrl = `${frontendHost}/vas/${vaId}`;
          
          await shortUrl.save();
          console.log(`Fixed: ${oldUrl} -> ${shortUrl.originalUrl}`);
        }
      } else {
        console.log(`URL already correct: ${shortUrl.originalUrl}`);
      }
    }

    console.log('Done fixing short URLs');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixShortUrls();