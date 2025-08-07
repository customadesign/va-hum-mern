const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  bucket: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  storageProvider: {
    type: String,
    enum: ['supabase', 's3', 'local'],
    default: 'supabase'
  },
  s3Key: {
    type: String, // AWS S3 object key
    sparse: true
  },
  etag: {
    type: String, // AWS S3 ETag for file verification
    sparse: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileType: {
    type: String,
    enum: ['image', 'video', 'document', 'other'],
    required: true
  },
  category: {
    type: String,
    enum: ['profile', 'va-document', 'business-document', 'course-material', 'general'],
    default: 'general'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  accessList: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  metadata: {
    width: Number,
    height: Number,
    duration: Number, // For videos
    thumbnailUrl: String
  },
  tags: [String],
  description: String,
  downloadCount: {
    type: Number,
    default: 0
  },
  lastAccessed: Date,
  expiresAt: Date, // For temporary files
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ category: 1 });
fileSchema.index({ fileType: 1 });
fileSchema.index({ deleted: 1 });
fileSchema.index({ expiresAt: 1 });

// Virtual for determining if file is an image
fileSchema.virtual('isImage').get(function() {
  return this.fileType === 'image';
});

// Virtual for determining if file is a video
fileSchema.virtual('isVideo').get(function() {
  return this.fileType === 'video';
});

// Method to check if user has access to file
fileSchema.methods.hasAccess = function(userId) {
  // Public files are accessible to everyone
  if (this.isPublic) return true;
  
  // Owner always has access
  if (this.uploadedBy.toString() === userId.toString()) return true;
  
  // Check if user is in access list
  return this.accessList.some(id => id.toString() === userId.toString());
};

// Method to grant access to a user
fileSchema.methods.grantAccess = async function(userId) {
  if (!this.accessList.includes(userId)) {
    this.accessList.push(userId);
    await this.save();
  }
};

// Method to revoke access from a user
fileSchema.methods.revokeAccess = async function(userId) {
  this.accessList = this.accessList.filter(id => id.toString() !== userId.toString());
  await this.save();
};

// Method to soft delete file
fileSchema.methods.softDelete = async function() {
  this.deleted = true;
  this.deletedAt = new Date();
  await this.save();
};

// Static method to clean up expired files
fileSchema.statics.cleanupExpiredFiles = async function() {
  const expiredFiles = await this.find({
    expiresAt: { $lt: new Date() },
    deleted: false
  });
  
  for (const file of expiredFiles) {
    await file.softDelete();
  }
  
  return expiredFiles.length;
};

// Pre-save hook to determine file type
fileSchema.pre('save', function(next) {
  if (this.isNew) {
    // Determine file type based on mimetype
    if (this.mimetype.startsWith('image/')) {
      this.fileType = 'image';
    } else if (this.mimetype.startsWith('video/')) {
      this.fileType = 'video';
    } else if (
      this.mimetype.includes('pdf') ||
      this.mimetype.includes('document') ||
      this.mimetype.includes('msword') ||
      this.mimetype.includes('spreadsheet') ||
      this.mimetype.includes('presentation')
    ) {
      this.fileType = 'document';
    } else {
      this.fileType = 'other';
    }
  }
  next();
});

module.exports = mongoose.model('File', fileSchema);