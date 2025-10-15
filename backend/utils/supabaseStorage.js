const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const supabase = require('../config/supabase');

// Enhanced bucket configuration with specific media types
const PRIMARY_IMAGE_BUCKET = (process.env.SUPABASE_BUCKET && process.env.SUPABASE_BUCKET.trim()) || 'profile-images';

const IMAGE_BUCKET_CONFIG = {
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  maxSize: 10 * 1024 * 1024, // 10MB
  folders: ['avatars', 'covers', 'admin-avatars', 'business-logos']
};

// Build BUCKET_CONFIG without computed properties to avoid timing issues
const BUCKET_CONFIG = {
  'profile-images': IMAGE_BUCKET_CONFIG,
  'va-videos': {
    allowedTypes: ['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/quicktime'],
    maxSize: 1024 * 1024 * 1024, // 1GB
    folders: ['introductions', 'portfolio', 'demos']
  },
  'business-assets': {
    allowedTypes: [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    folders: ['logos', 'marketing', 'documents', 'branding']
  },
  'admin-uploads': {
    allowedTypes: [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf', 'text/plain', 'text/csv', 'application/json',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    maxSize: 20 * 1024 * 1024, // 20MB
    folders: ['system-assets', 'reports', 'backups', 'templates']
  }
};

// Add custom bucket name as alias if different from 'profile-images'
if (PRIMARY_IMAGE_BUCKET !== 'profile-images') {
  BUCKET_CONFIG[PRIMARY_IMAGE_BUCKET] = IMAGE_BUCKET_CONFIG;
}

console.log('[storage] PRIMARY_IMAGE_BUCKET =', PRIMARY_IMAGE_BUCKET, 'BUCKETS =', Object.keys(BUCKET_CONFIG));

// Multer memory storage for Supabase
const storage = multer.memoryStorage();

// Enhanced file filter with bucket-specific validation
const createFileFilter = (bucketName) => {
  return (req, file, cb) => {
    const bucketConfig = BUCKET_CONFIG[bucketName];
    
    if (!bucketConfig) {
      return cb(new Error(`Invalid bucket: ${bucketName}`));
    }
    
    // Check MIME type
    if (!bucketConfig.allowedTypes.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type for ${bucketName}. Allowed types: ${bucketConfig.allowedTypes.join(', ')}`));
    }
    
    // File size will be checked by multer limits
    cb(null, true);
  };
};

// Create bucket-specific multer instances
const createBucketUploader = (bucketName) => {
  const bucketConfig = BUCKET_CONFIG[bucketName];
  
  if (!bucketConfig) {
    throw new Error(`Invalid bucket configuration: ${bucketName}`);
  }
  
  return multer({
    storage: storage,
    limits: {
      fileSize: bucketConfig.maxSize
    },
    fileFilter: createFileFilter(bucketName)
  });
};

// Create multer instances for each bucket
const uploadProfileImages = createBucketUploader(PRIMARY_IMAGE_BUCKET);
const uploadVAVideos = createBucketUploader('va-videos');
const uploadBusinessAssets = createBucketUploader('business-assets');
const uploadAdminFiles = createBucketUploader('admin-uploads');

// Legacy multer instance for backward compatibility
const uploadSupabase = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 1024 // 1GB limit
  },
  fileFilter: (req, file, cb) => {
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
  }
});

// Enhanced upload function with bucket-specific validation
const uploadToSupabase = async (file, bucket, folder, options = {}) => {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Check your environment variables.');
    }

    // Validate bucket configuration
    const bucketConfig = BUCKET_CONFIG[bucket];
    if (!bucketConfig) {
      throw new Error(`Invalid bucket: ${bucket}. Allowed buckets: ${Object.keys(BUCKET_CONFIG).join(', ')}`);
    }

    // Validate file type
    if (!bucketConfig.allowedTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type ${file.mimetype} for bucket ${bucket}. Allowed types: ${bucketConfig.allowedTypes.join(', ')}`);
    }

    // Validate file size
    if (file.size > bucketConfig.maxSize) {
      throw new Error(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds limit of ${(bucketConfig.maxSize / 1024 / 1024).toFixed(2)}MB for bucket ${bucket}`);
    }

    // Validate folder
    if (!bucketConfig.folders.includes(folder)) {
      console.warn(`⚠️ Folder '${folder}' not in predefined folders for bucket '${bucket}'. Using anyway.`);
    }

    // Generate unique filename with timestamp and UUID
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const fileExt = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, fileExt).toLowerCase().replace(/[^a-z0-9]/g, '-');
    const fileName = `${folder}/${timestamp}/${baseName}-${uuidv4()}${fileExt}`;

    console.log('Attempting enhanced Supabase upload:', {
      bucket,
      fileName,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      mimeType: file.mimetype,
      originalName: file.originalname
    });

    // Upload file to Supabase with metadata
    const uploadMetadata = {
      originalName: file.originalname,
      uploadedAt: new Date().toISOString(),
      userAgent: options.userAgent || 'Unknown',
      ipAddress: options.ipAddress || 'Unknown',
      ...options.metadata
    };

    const { data, error } = await supabase
      .storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: options.upsert || false,
        metadata: uploadMetadata
      });

    if (error) {
      console.error('Supabase upload error details:', {
        message: error.message,
        error: error,
        bucket,
        fileName
      });
      
      if (error.message?.includes('row-level security')) {
        throw new Error('Storage bucket RLS policies not configured. Please check Supabase setup guide.');
      }
      
      if (error.message?.includes('not found')) {
        throw new Error(`Bucket '${bucket}' does not exist. Please create it first.`);
      }
      
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL for public buckets, signed URL for private buckets
    let fileUrl;
    
    if (bucket === 'admin-uploads') {
      // Generate signed URL for private/admin files
      const { data: signedUrlData, error: signedError } = await supabase
        .storage
        .from(bucket)
        .createSignedUrl(fileName, 3600); // 1 hour expiration
      
      if (signedError) {
        console.warn('⚠️ Could not generate signed URL, falling back to public URL');
        const { data: { publicUrl } } = supabase
          .storage
          .from(bucket)
          .getPublicUrl(fileName);
        fileUrl = publicUrl;
      } else {
        fileUrl = signedUrlData.signedUrl;
      }
    } else {
      // Get public URL for public buckets
      const { data: { publicUrl } } = supabase
        .storage
        .from(bucket)
        .getPublicUrl(fileName);
      fileUrl = publicUrl;
    }

    console.log('Enhanced upload successful:', {
      url: fileUrl,
      bucket,
      fileName,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
    });

    return {
      url: fileUrl,
      bucket,
      fileName,
      size: file.size,
      mimetype: file.mimetype,
      originalName: file.originalname,
      uploadedAt: new Date(),
      metadata: uploadMetadata
    };
  } catch (error) {
    console.error('Enhanced upload to Supabase error:', error);
    throw error;
  }
};

// Backward compatibility function
const uploadToSupabaseSimple = async (file, bucket, folder) => {
  const result = await uploadToSupabase(file, bucket, folder);
  return result.url; // Return just the URL for backward compatibility
};

// Enhanced delete function with comprehensive error handling
const deleteFromSupabase = async (fileUrl, bucketName = null, options = {}) => {
  try {
    if (!supabase || !fileUrl) {
      console.warn('⚠️ Cannot delete: Missing Supabase client or file URL');
      return { success: false, reason: 'Missing client or URL' };
    }

    console.log('Attempting to delete from Supabase:', { fileUrl, bucketName });

    // Extract bucket and file path from URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    
    // Find bucket name in URL path if not provided
    let bucket = bucketName;
    let filePath;
    
    if (!bucket) {
      // Try to extract bucket from URL path
      const publicIndex = pathParts.indexOf('public');
      if (publicIndex !== -1 && pathParts[publicIndex + 1]) {
        bucket = pathParts[publicIndex + 1];
        filePath = pathParts.slice(publicIndex + 2).join('/');
      } else {
        // Try to find known bucket names in path
        for (const knownBucket of Object.keys(BUCKET_CONFIG)) {
          const bucketIndex = pathParts.indexOf(knownBucket);
          if (bucketIndex !== -1) {
            bucket = knownBucket;
            filePath = pathParts.slice(bucketIndex + 1).join('/');
            break;
          }
        }
      }
    } else {
      const bucketIndex = pathParts.indexOf(bucket);
      if (bucketIndex !== -1) {
        filePath = pathParts.slice(bucketIndex + 1).join('/');
      }
    }

    if (!bucket || !filePath) {
      console.warn('⚠️ Could not extract bucket or file path from URL:', fileUrl);
      return { success: false, reason: 'Could not parse URL' };
    }

    console.log('Deleting file:', { bucket, filePath });

    const { error } = await supabase
      .storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ File deleted successfully from Supabase');
    return { success: true, bucket, filePath };

  } catch (error) {
    console.error('Delete from Supabase error:', error);
    return { success: false, error: error.message };
  }
};

// Enhanced middleware with bucket-specific handling
const handleSupabaseUpload = (fieldName, bucketName, folder, options = {}) => {
  return (req, res, next) => {
    // Use bucket-specific uploader if available
    let uploader;
    
    switch (bucketName) {
      case 'profile-images':
        uploader = uploadProfileImages;
        break;
      case 'va-videos':
        uploader = uploadVAVideos;
        break;
      case 'business-assets':
        uploader = uploadBusinessAssets;
        break;
      case 'admin-uploads':
        uploader = uploadAdminFiles;
        break;
      default:
        uploader = uploadSupabase; // Fallback to legacy uploader
    }

    uploader.single(fieldName)(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          const bucketConfig = BUCKET_CONFIG[bucketName];
          const maxSizeMB = bucketConfig ? (bucketConfig.maxSize / 1024 / 1024).toFixed(0) : '500';
          return res.status(400).json({
            success: false,
            error: `File size too large. Maximum size for ${bucketName} is ${maxSizeMB}MB`
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

      // Upload to Supabase with enhanced options
      try {
        const uploadOptions = {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip || req.connection.remoteAddress,
          metadata: {
            userId: req.user?._id?.toString(),
            userEmail: req.user?.email,
            uploadSource: 'admin-panel',
            ...options.metadata
          },
          ...options
        };

        const result = await uploadToSupabase(req.file, bucketName, folder, uploadOptions);
        
        // Add enhanced data to req.file for the route handler
        req.file.path = result.url;
        req.file.supabaseData = result;
        req.file.bucket = result.bucket;
        req.file.fileName = result.fileName;
        
        console.log(`📤 File uploaded successfully to ${bucketName}/${folder}:`, {
          originalName: req.file.originalname,
          size: `${(req.file.size / 1024 / 1024).toFixed(2)}MB`,
          url: result.url
        });
        
        next();
      } catch (error) {
        console.error('Enhanced Supabase upload failed:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload to Supabase: ' + error.message,
          details: {
            bucket: bucketName,
            folder: folder,
            originalError: error.message
          }
        });
      }
    });
  };
};

// Utility functions for bucket management
const getBucketConfig = (bucketName) => {
  return BUCKET_CONFIG[bucketName] || null;
};

const getAllBuckets = () => {
  return Object.keys(BUCKET_CONFIG);
};

const validateFileForBucket = (file, bucketName) => {
  const config = BUCKET_CONFIG[bucketName];
  if (!config) {
    return { valid: false, error: `Invalid bucket: ${bucketName}` };
  }
  
  if (!config.allowedTypes.includes(file.mimetype)) {
    return { valid: false, error: `Invalid file type: ${file.mimetype}` };
  }
  
  if (file.size > config.maxSize) {
    return { valid: false, error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB` };
  }
  
  return { valid: true };
};

// Storage health check
const checkStorageHealth = async () => {
  try {
    if (!supabase) {
      return { healthy: false, error: 'Supabase client not initialized' };
    }

    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      return { healthy: false, error: error.message };
    }

    const health = {
      healthy: true,
      bucketsFound: buckets.length,
      requiredBuckets: Object.keys(BUCKET_CONFIG),
      missingBuckets: [],
      timestamp: new Date().toISOString()
    };

    // Check for required buckets
    for (const requiredBucket of health.requiredBuckets) {
      if (!buckets.some(bucket => bucket.name === requiredBucket)) {
        health.missingBuckets.push(requiredBucket);
      }
    }

    if (health.missingBuckets.length > 0) {
      health.healthy = false;
      health.warning = `Missing required buckets: ${health.missingBuckets.join(', ')}`;
    }

    return health;

  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = {
  // Legacy exports for backward compatibility
  uploadSupabase,
  uploadToSupabase: uploadToSupabaseSimple, // Backward compatible version
  deleteFromSupabase,
  handleSupabaseUpload,
  
  // Enhanced exports
  uploadToSupabaseEnhanced: uploadToSupabase,
  deleteFromSupabaseEnhanced: deleteFromSupabase,
  
  // Bucket-specific uploaders
  uploadProfileImages,
  uploadVAVideos,
  uploadBusinessAssets,
  uploadAdminFiles,
  
  // Utility functions
  getBucketConfig,
  getAllBuckets,
  validateFileForBucket,
  checkStorageHealth,
  BUCKET_CONFIG
};