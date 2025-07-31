const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const supabase = require('../config/supabase');

// Multer memory storage for Supabase
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    image: /jpeg|jpg|png|gif|webp/,
    video: /mp4|avi|mov|wmv|flv|mkv|webm/,
  };

  const extname = path.extname(file.originalname).toLowerCase();
  const isImage = allowedTypes.image.test(extname);
  const isVideo = allowedTypes.video.test(extname);

  if (isImage || isVideo) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

// Create multer instance for Supabase
const uploadSupabase = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: fileFilter
});

// Upload to Supabase Storage
const uploadToSupabase = async (file, bucket, folder) => {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Check your environment variables.');
    }

    // Generate unique filename
    const fileExt = path.extname(file.originalname);
    const fileName = `${folder}/${uuidv4()}${fileExt}`;

    console.log('Attempting to upload to Supabase:', {
      bucket,
      fileName,
      fileSize: file.size,
      mimeType: file.mimetype
    });

    // Skip bucket check - it might fail due to permissions
    // Just try to upload directly

    // Upload file to Supabase
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error details:', {
        message: error.message,
        error: error
      });
      
      if (error.message?.includes('row-level security')) {
        throw new Error('Storage bucket RLS policies not configured. Please check Supabase setup guide.');
      }
      
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from(bucket)
      .getPublicUrl(fileName);

    console.log('Upload successful, public URL:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('Upload to Supabase error:', error);
    throw error;
  }
};

// Delete from Supabase Storage
const deleteFromSupabase = async (fileUrl, bucket) => {
  try {
    if (!supabase || !fileUrl) return;

    // Extract file path from URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.indexOf(bucket);
    
    if (bucketIndex === -1) return;
    
    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase
      .storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
    }
  } catch (error) {
    console.error('Delete from Supabase error:', error);
  }
};

// Middleware to handle Supabase upload
const handleSupabaseUpload = (fieldName, folder) => {
  return (req, res, next) => {
    uploadSupabase.single(fieldName)(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'File size too large. Maximum size is 500MB'
          });
        }
        return res.status(400).json({
          success: false,
          error: `Upload error: ${err.message}`
        });
      } else if (err) {
        console.error('Upload error:', err);
        return res.status(500).json({
          success: false,
          error: err.message || 'Failed to upload file'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Please upload a file'
        });
      }

      // Upload to Supabase
      try {
        const bucket = process.env.SUPABASE_BUCKET || 'linkage-va-hub'; // Your Supabase bucket name
        const publicUrl = await uploadToSupabase(req.file, bucket, folder);
        
        // Add the URL to req.file for the route handler
        req.file.path = publicUrl;
        
        next();
      } catch (error) {
        console.error('Supabase upload failed:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload to Supabase: ' + error.message
        });
      }
    });
  };
};

module.exports = {
  uploadSupabase,
  uploadToSupabase,
  deleteFromSupabase,
  handleSupabaseUpload
};