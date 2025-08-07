const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const File = require('../models/File');
const { protect, authorize } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { handleSupabaseUpload, deleteFromSupabase } = require('../utils/supabaseStorage');
const supabase = require('../config/supabase');

// @route   POST /api/files/upload
// @desc    Upload a file
// @access  Private
router.post('/upload',
  protect,
  uploadLimiter,
  handleSupabaseUpload('file', 'uploads'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Please upload a file'
        });
      }

      const { category = 'general', description, tags, isPublic = false } = req.body;

      // Create file metadata record
      const file = await File.create({
        filename: req.file.filename || req.file.originalname,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: req.file.path, // URL from Supabase
        bucket: process.env.SUPABASE_BUCKET || 'linkage-va-hub',
        path: req.file.path,
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
      
      // Try to delete uploaded file from Supabase if database save failed
      if (req.file && req.file.path) {
        await deleteFromSupabase(req.file.path, process.env.SUPABASE_BUCKET || 'linkage-va-hub');
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

      // For Supabase, we can create a signed URL for private files
      // or just return the public URL
      if (file.isPublic) {
        res.json({
          success: true,
          url: file.url,
          filename: file.originalName
        });
      } else {
        // Create a signed URL for private access (expires in 1 hour)
        const { data, error } = await supabase
          .storage
          .from(file.bucket)
          .createSignedUrl(file.path.replace(`${file.bucket}/`, ''), 3600);

        if (error) {
          throw error;
        }

        res.json({
          success: true,
          url: data.signedUrl,
          filename: file.originalName,
          expiresIn: 3600 // 1 hour
        });
      }
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

      // Delete from Supabase
      await deleteFromSupabase(file.url, file.bucket);

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

module.exports = router;