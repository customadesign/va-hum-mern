#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Script to quickly update VA routes for Supabase uploads

const vasRoutesPath = path.join(__dirname, 'backend/routes/vas.js');
const businessRoutesPath = path.join(__dirname, 'backend/routes/businesses.js');

console.log('🔧 Updating routes for Supabase uploads...\n');

// Read the current vas.js file
const vasContent = fs.readFileSync(vasRoutesPath, 'utf8');

// Create a wrapper function for handling uploads
const uploadWrapper = `
// Upload handler wrapper that chooses between local and Supabase
const handleFileUpload = (fieldName, folder, handler) => {
  return async (req, res) => {
    if (useSupabase) {
      handleSupabaseUpload(fieldName, folder)(req, res, async (err) => {
        if (err) return; // Error already handled by middleware
        
        // For Supabase, file URL is in req.file.path
        handler(req, res);
      });
    } else {
      // Local upload
      upload.single(fieldName)(req, res, (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            error: err.message
          });
        }
        
        // For local, construct the URL
        if (req.file) {
          req.file.path = \`/uploads/\${req.file.filename}\`;
        }
        
        handler(req, res);
      });
    }
  };
};
`;

// Find where to insert the wrapper (after the upload variable definition)
const insertPoint = vasContent.indexOf('const upload = useSupabase ? require(\'../utils/supabaseStorage\').uploadSupabase : localUpload;');
const afterUploadDef = vasContent.indexOf('\n', insertPoint) + 1;

// Insert the wrapper function
const updatedVasContent = vasContent.slice(0, afterUploadDef) + uploadWrapper + vasContent.slice(afterUploadDef);

// Write the updated content
fs.writeFileSync(vasRoutesPath, updatedVasContent);

console.log('✅ Updated vas.js with upload wrapper function');

// Now let's create a simple instruction file for the remaining changes
const instructions = `
# Upload Fix Instructions

The routes have been updated with a wrapper function. Now you need to:

1. **Update each upload endpoint to use the wrapper:**
   
   Change from:
   \`\`\`javascript
   router.post('/:id/avatar', protect, authorize('va'), upload.single('avatar'), async (req, res) => {
     // ... handler code
   });
   \`\`\`
   
   To:
   \`\`\`javascript
   router.post('/:id/avatar', protect, authorize('va'), handleFileUpload('avatar', 'avatars', async (req, res) => {
     // ... handler code
     // Use req.file.path instead of constructing URL manually
   }));
   \`\`\`

2. **Update these endpoints:**
   - POST /:id/avatar - handleFileUpload('avatar', 'avatars', ...)
   - POST /:id/cover-image - handleFileUpload('coverImage', 'covers', ...)
   - POST /:id/video-introduction - handleFileUpload('video', 'videos', ...)

3. **In each handler, change:**
   - From: \`va.avatar = \\\`/uploads/\\\${req.file.filename}\\\`;\`
   - To: \`va.avatar = req.file.path;\`

4. **Set Supabase environment variables in Render dashboard:**
   - SUPABASE_URL: Your Supabase project URL
   - SUPABASE_ANON_KEY: Your Supabase anon key
   - SUPABASE_BUCKET: linkage-va-hub (or your bucket name)

5. **Commit and push changes to trigger deployment**
`;

fs.writeFileSync(path.join(__dirname, 'UPLOAD_FIX_INSTRUCTIONS.md'), instructions);

console.log('📝 Created UPLOAD_FIX_INSTRUCTIONS.md with remaining steps');
console.log('\n⚠️  Important: Review the instructions and complete the remaining steps!');