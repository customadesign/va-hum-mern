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
  
  // Test write permissions (non-fatal if fails on read-only filesystem like Render)
  try {
    const testFile = path.join(uploadsDir, '.test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('✅ Write permissions verified');
  } catch (writeError) {
    // Non-fatal: Render uses ephemeral filesystem, uploads go to Supabase anyway
    console.warn('⚠️  Local uploads directory not writable (OK on Render - using Supabase)');
  }
  
} catch (error) {
  // Non-fatal: If directory creation fails on Render, we use Supabase storage
  console.warn('⚠️  Could not create local uploads directory:', error.message);
  console.log('ℹ️  Uploads will use Supabase storage (configured via env vars)');
  // Don't exit - let the server start anyway
}