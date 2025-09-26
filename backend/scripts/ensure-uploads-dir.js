const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Uploads directory created successfully:', uploadsDir);
  } else {
    console.log('✅ Uploads directory already exists:', uploadsDir);
  }
  
  // Test write permissions
  const testFile = path.join(uploadsDir, '.test');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log('✅ Write permissions verified');
  
} catch (error) {
  console.error('❌ Error with uploads directory:', error);
  process.exit(1);
}