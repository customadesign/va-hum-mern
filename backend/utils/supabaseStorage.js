const multer = require('multer');
const supabase = require('../config/supabase');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Memory storage for processing files before uploading to Supabase
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } 
  // Accept videos
  else if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } 
  else {
    cb(new Error('Only image and video files are allowed'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// Helper function to upload file to Supabase
const uploadToSupabase = async (file, folder = 'uploads') => {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  // Generate unique filename
  const fileExt = path.extname(file.originalname);
  const fileName = `${uuidv4()}${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  // Upload file to Supabase Storage
  const { data, error } = await supabase.storage
    .from('linkage-va-hub') // Bucket name
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Failed to upload to Supabase: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('linkage-va-hub')
    .getPublicUrl(filePath);

  return {
    url: publicUrl,
    path: filePath,
    size: file.size,
    mimetype: file.mimetype
  };
};

// Helper function to delete file from Supabase
const deleteFromSupabase = async (filePath) => {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabase.storage
    .from('linkage-va-hub')
    .remove([filePath]);

  if (error) {
    console.error('Error deleting from Supabase:', error);
    throw error;
  }

  return { success: true };
};

// Helper function to get file path from Supabase URL
const getFilePathFromUrl = (url) => {
  if (!url || !url.includes('supabase')) return null;
  
  // Extract the file path from the URL
  const urlParts = url.split('/storage/v1/object/public/linkage-va-hub/');
  if (urlParts.length > 1) {
    return urlParts[1];
  }
  
  return null;
};

// Middleware to handle Supabase upload
const handleSupabaseUpload = (fieldName, folder) => {
  return async (req, res, next) => {
    // First, use multer to parse the file
    upload.single(fieldName)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }

      // If no file or not using Supabase, continue
      if (!req.file || !supabase) {
        return next();
      }

      try {
        // Upload to Supabase
        const result = await uploadToSupabase(req.file, folder);
        
        // Replace file info with Supabase result
        req.file.supabase = result;
        req.file.path = result.url;
        req.file.filename = result.path;
        
        next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
  };
};

module.exports = {
  upload,
  uploadToSupabase,
  deleteFromSupabase,
  getFilePathFromUrl,
  handleSupabaseUpload
};