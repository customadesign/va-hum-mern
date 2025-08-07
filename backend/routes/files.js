const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const File = require('../models/File');
const { protect, authorize } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { handleSupabaseUpload, deleteFromSupabase } = require('../utils/supabaseStorage');
const { 
  handleUnifiedUpload, 
  deleteWithFallback, 
  getFileUrl,
  checkStorageHealth,
  StorageProvider 
} = require('../utils/unifiedStorage');
const supabase = require('../config/supabase');

// @route   POST /api/files/upload
// @desc    Upload a file
// @access  Private
router.post('/upload',
  protect,
  uploadLimiter,
  handleUnifiedUpload('file', 'uploads'), // Use unified storage with fallback
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Please upload a file'
        });
      }

      const { category = 'general', description, tags, isPublic = false } = req.body;

      // Create file metadata record with storage provider info
      const file = await File.create({
        filename: req.file.filename || req.file.originalname,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: req.file.path, // URL from storage provider
        bucket: req.file.bucket || process.env.SUPABASE_BUCKET || process.env.AWS_S3_BUCKET,
        path: req.file.path,
        storageProvider: req.file.storageProvider || StorageProvider.SUPABASE,
        s3Key: req.file.s3Key, // Will be undefined for Supabase
        etag: req.file.etag, // Will be undefined for Supabase
        uploadedBy: req.user._id,
        category,
        description,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        isPublic: isPublic === 'true' || isPublic === true,
        metadata: {
          // Add image dimensions if available
          width: req.file.width,
          height: req.file.height
        }
      });

      res.status(201).json({
        success: true,
        file: {
          id: file._id,
          filename: file.filename,
          originalName: file.originalName,
          url: file.url,
          mimetype: file.mimetype,
          size: file.size,
          fileType: file.fileType,
          category: file.category,
          uploadedAt: file.createdAt
        }
      });
    } catch (error) {
      console.error('File upload error:', error);
      
      // Try to delete uploaded file if database save failed
      if (req.file && req.file.path) {
        await deleteWithFallback({
          provider: req.file.storageProvider,
          url: req.file.path,
          bucket: req.file.bucket,
          key: req.file.s3Key
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to save file metadata'
      });
    }
  }
);

// @route   GET /api/files
// @desc    Get user's files
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const {
      category,
      fileType,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    const query = {
      uploadedBy: req.user._id,
      deleted: false
    };

    if (category) query.category = category;
    if (fileType) query.fileType = fileType;

    const files = await File.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-accessList');

    const total = await File.countDocuments(query);

    res.json({
      success: true,
      files,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve files'
    });
  }
});

// @route   GET /api/files/:id
// @desc    Get file details
// @access  Private
router.get('/:id', 
  protect,
  param('id').isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const file = await File.findById(req.params.id)
        .populate('uploadedBy', 'email name');

      if (!file) {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }

      // Check access permissions
      if (!file.hasAccess(req.user._id) && !req.user.admin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Update last accessed
      file.lastAccessed = new Date();
      await file.save();

      res.json({
        success: true,
        file
      });
    } catch (error) {
      console.error('Get file error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve file'
      });
    }
  }
);

// @route   GET /api/files/:id/download
// @desc    Download file (get signed URL)
// @access  Private
router.get('/:id/download',
  protect,
  param('id').isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const file = await File.findById(req.params.id);

      if (!file) {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }

      // Check access permissions
      if (!file.hasAccess(req.user._id) && !req.user.admin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Increment download count
      file.downloadCount += 1;
      file.lastAccessed = new Date();
      await file.save();

      // Get appropriate URL based on storage provider
      let downloadUrl;
      
      if (file.isPublic) {
        downloadUrl = file.url;
      } else {
        // Handle different storage providers
        if (file.storageProvider === StorageProvider.AWS_S3 && file.s3Key) {
          // Use unified storage to get signed URL for S3
          downloadUrl = await getFileUrl(file, 3600);
        } else if (file.storageProvider === StorageProvider.SUPABASE) {
          // Create a signed URL for Supabase
          const { data, error } = await supabase
            .storage
            .from(file.bucket)
            .createSignedUrl(file.path.replace(`${file.bucket}/`, ''), 3600);

          if (error) {
            throw error;
          }
          downloadUrl = data.signedUrl;
        } else {
          downloadUrl = file.url;
        }
      }

      res.json({
        success: true,
        url: downloadUrl,
        filename: file.originalName,
        expiresIn: file.isPublic ? null : 3600 // 1 hour for private files
      });
    } catch (error) {
      console.error('Download file error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate download URL'
      });
    }
  }
);

// @route   PUT /api/files/:id/access
// @desc    Update file access permissions
// @access  Private (Owner only)
router.put('/:id/access',
  protect,
  [
    param('id').isMongoId(),
    body('isPublic').optional().isBoolean(),
    body('grantAccess').optional().isArray(),
    body('revokeAccess').optional().isArray()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const file = await File.findById(req.params.id);

      if (!file) {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }

      // Only owner or admin can change access
      if (file.uploadedBy.toString() !== req.user._id.toString() && !req.user.admin) {
        return res.status(403).json({
          success: false,
          error: 'Only file owner can modify access'
        });
      }

      const { isPublic, grantAccess, revokeAccess } = req.body;

      // Update public status
      if (isPublic !== undefined) {
        file.isPublic = isPublic;
      }

      // Grant access to users
      if (grantAccess && Array.isArray(grantAccess)) {
        for (const userId of grantAccess) {
          await file.grantAccess(userId);
        }
      }

      // Revoke access from users
      if (revokeAccess && Array.isArray(revokeAccess)) {
        for (const userId of revokeAccess) {
          await file.revokeAccess(userId);
        }
      }

      await file.save();

      res.json({
        success: true,
        file: {
          id: file._id,
          isPublic: file.isPublic,
          accessList: file.accessList
        }
      });
    } catch (error) {
      console.error('Update file access error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update file access'
      });
    }
  }
);

// @route   DELETE /api/files/:id
// @desc    Delete a file
// @access  Private (Owner only)
router.delete('/:id',
  protect,
  param('id').isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const file = await File.findById(req.params.id);

      if (!file) {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }

      // Only owner or admin can delete
      if (file.uploadedBy.toString() !== req.user._id.toString() && !req.user.admin) {
        return res.status(403).json({
          success: false,
          error: 'Only file owner can delete this file'
        });
      }

      // Delete from storage provider
      await deleteWithFallback({
        provider: file.storageProvider,
        url: file.url,
        bucket: file.bucket,
        key: file.s3Key
      });

      // Soft delete in database
      await file.softDelete();

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      console.error('Delete file error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete file'
      });
    }
  }
);

// @route   GET /api/files/shared/with-me
// @desc    Get files shared with the user
// @access  Private
router.get('/shared/with-me', protect, async (req, res) => {
  try {
    const files = await File.find({
      accessList: req.user._id,
      deleted: false,
      uploadedBy: { $ne: req.user._id } // Exclude own files
    })
    .populate('uploadedBy', 'email name')
    .sort('-createdAt');

    res.json({
      success: true,
      files
    });
  } catch (error) {
    console.error('Get shared files error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve shared files'
    });
  }
});

// @route   POST /api/files/cleanup
// @desc    Clean up expired files (Admin only)
// @access  Private (Admin)
router.post('/cleanup',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const cleanedCount = await File.cleanupExpiredFiles();

      res.json({
        success: true,
        message: `Cleaned up ${cleanedCount} expired files`
      });
    } catch (error) {
      console.error('Cleanup files error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup expired files'
      });
    }
  }
);

// @route   GET /api/files/storage/health
// @desc    Check storage provider health status
// @access  Private
router.get('/storage/health', protect, async (req, res) => {
  try {
    const health = await checkStorageHealth();

    res.json({
      success: true,
      storage: {
        ...health,
        message: health.primary 
          ? `Primary storage: ${health.primary}${health.fallback ? `, Fallback: ${health.fallback}` : ''}`
          : 'No storage providers configured'
      }
    });
  } catch (error) {
    console.error('Storage health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check storage health'
    });
  }
});

module.exports = router;