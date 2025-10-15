const multer = require('multer');
const { 
  uploadToSupabase, 
  deleteFromSupabase,
  uploadSupabase 
} = require('./supabaseStorage');
const { 
  uploadToS3, 
  deleteFromS3, 
  getSignedUrl,
  isS3Available,
  uploadS3 
} = require('./awsS3Storage');

// Storage provider enum
const StorageProvider = {
  SUPABASE: 'supabase',
  AWS_S3: 's3',
  LOCAL: 'local'
};

// Determine available storage provider
const getAvailableProvider = () => {
  // Check if Supabase is configured
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    return StorageProvider.SUPABASE;
  }
  
  // Check if AWS S3 is configured
  if (isS3Available()) {
    return StorageProvider.AWS_S3;
  }
  
  // Fallback to local storage
  return StorageProvider.LOCAL;
};

// Unified upload function with fallback support
const uploadWithFallback = async (file, folder) => {
  let primaryError = null;
  
  // Try Supabase first if configured
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      // Map folder to appropriate bucket
      let bucket;
      const customBucket = process.env.SUPABASE_BUCKET && process.env.SUPABASE_BUCKET.trim();
      if (['avatars', 'covers', 'admin-avatars', 'business-logos'].includes(folder)) {
        bucket = customBucket || 'profile-images';
      } else if (['introductions', 'portfolio', 'demos', 'videos'].includes(folder)) {
        bucket = 'va-videos';
      } else if (['logos', 'marketing', 'documents', 'branding'].includes(folder)) {
        bucket = 'business-assets';
      } else if (['system-assets', 'reports', 'backups', 'templates'].includes(folder)) {
        bucket = 'admin-uploads';
      } else {
        // Fallback to profile-images for unknown folders
        console.warn(`⚠️ Unknown folder '${folder}', defaulting to profile-images bucket`);
        bucket = 'profile-images';
      }
      
      console.log(`📦 Uploading to Supabase bucket: ${bucket}/${folder}`);
      const url = await uploadToSupabase(file, bucket, folder);
      return {
        provider: StorageProvider.SUPABASE,
        url,
        bucket,
        path: url,
        success: true
      };
    } catch (error) {
      console.error('Supabase upload failed, trying S3 fallback:', error.message);
      primaryError = error;
    }
  }
  
  // Try AWS S3 as fallback
  if (isS3Available()) {
    try {
      const result = await uploadToS3(file, folder);
      return {
        provider: StorageProvider.AWS_S3,
        url: result.url,
        bucket: result.bucket,
        key: result.key,
        etag: result.etag,
        success: true
      };
    } catch (error) {
      console.error('S3 upload also failed:', error.message);
      
      // If both failed, throw the primary error
      if (primaryError) {
        throw new Error(`Storage upload failed. Primary: ${primaryError.message}, Fallback: ${error.message}`);
      }
      throw error;
    }
  }
  
  // If no cloud storage is available, throw error
  if (primaryError) {
    throw primaryError;
  }
  throw new Error('No storage provider configured. Please configure Supabase or AWS S3.');
};

// Unified delete function
const deleteWithFallback = async (fileData) => {
  try {
    if (fileData.provider === StorageProvider.SUPABASE) {
      await deleteFromSupabase(fileData.url, fileData.bucket);
    } else if (fileData.provider === StorageProvider.AWS_S3) {
      await deleteFromS3(fileData.key);
    }
  } catch (error) {
    console.error('Delete from storage error:', error);
    // Don't throw error for delete operations - log and continue
  }
};

// Get signed URL based on provider
const getFileUrl = async (fileData, expiresIn = 3600) => {
  if (fileData.isPublic) {
    return fileData.url;
  }
  
  if (fileData.provider === StorageProvider.AWS_S3 && fileData.key) {
    return await getSignedUrl(fileData.key, expiresIn);
  }
  
  // For Supabase, the signed URL generation is handled in the routes
  return fileData.url;
};

// Middleware to handle unified upload
const handleUnifiedUpload = (fieldName, folder) => {
  return async (req, res, next) => {
    // Determine which multer instance to use
    const provider = getAvailableProvider();
    let uploadMiddleware;
    
    if (provider === StorageProvider.SUPABASE) {
      uploadMiddleware = uploadSupabase.single(fieldName);
    } else if (provider === StorageProvider.AWS_S3) {
      uploadMiddleware = uploadS3.single(fieldName);
    } else {
      return res.status(503).json({
        success: false,
        error: 'No storage provider available. Please configure Supabase or AWS S3.'
      });
    }
    
    // Execute the appropriate multer middleware
    uploadMiddleware(req, res, async (err) => {
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

      // Upload to storage with fallback
      try {
        const uploadResult = await uploadWithFallback(req.file, folder);
        
        // Add storage info to req.file for the route handler
        req.file.storageProvider = uploadResult.provider;
        req.file.path = uploadResult.url;
        req.file.bucket = uploadResult.bucket;
        req.file.s3Key = uploadResult.key;
        req.file.etag = uploadResult.etag;
        
        console.log(`File uploaded successfully to ${uploadResult.provider}:`, {
          provider: uploadResult.provider,
          url: uploadResult.url,
          filename: req.file.originalname
        });
        
        next();
      } catch (error) {
        console.error('Storage upload failed:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload to storage: ' + error.message
        });
      }
    });
  };
};

// Check storage health
const checkStorageHealth = async () => {
  const health = {
    supabase: false,
    s3: false,
    primary: null,
    fallback: null
  };
  
  // Check Supabase
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      // Simple check - could be enhanced with actual connection test
      health.supabase = true;
      health.primary = StorageProvider.SUPABASE;
    } catch (error) {
      console.error('Supabase health check failed:', error);
    }
  }
  
  // Check S3
  if (isS3Available()) {
    try {
      health.s3 = true;
      if (!health.primary) {
        health.primary = StorageProvider.AWS_S3;
      } else {
        health.fallback = StorageProvider.AWS_S3;
      }
    } catch (error) {
      console.error('S3 health check failed:', error);
    }
  }
  
  return health;
};

// Migration utility to move files between providers
const migrateFile = async (fileData, targetProvider) => {
  if (fileData.provider === targetProvider) {
    console.log('File already on target provider');
    return fileData;
  }
  
  // This would require downloading from one provider and uploading to another
  // Implementation depends on specific requirements
  throw new Error('File migration between providers not yet implemented');
};

module.exports = {
  StorageProvider,
  getAvailableProvider,
  uploadWithFallback,
  deleteWithFallback,
  getFileUrl,
  handleUnifiedUpload,
  checkStorageHealth,
  migrateFile
};