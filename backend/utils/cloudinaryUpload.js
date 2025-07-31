const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'linkage-va-hub';
    let resourceType = 'auto';
    let format = undefined;
    
    // Determine folder based on file type
    if (file.fieldname === 'avatar') {
      folder = 'linkage-va-hub/avatars';
    } else if (file.fieldname === 'coverImage' || file.fieldname === 'image') {
      folder = 'linkage-va-hub/covers';
    } else if (file.fieldname === 'video') {
      folder = 'linkage-va-hub/videos';
      resourceType = 'video';
    }

    // For images, specify format
    if (file.mimetype.startsWith('image/')) {
      format = 'jpg'; // Convert all images to jpg for consistency
    }

    return {
      folder: folder,
      resource_type: resourceType,
      format: format,
      transformation: file.mimetype.startsWith('image/') 
        ? [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
        : undefined,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi']
    };
  }
});

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

// Helper function to delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Helper function to extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  // Extract the public ID from the URL
  const urlParts = url.split('/');
  const uploadIndex = urlParts.indexOf('upload');
  if (uploadIndex === -1) return null;
  
  // Get everything after 'upload' and version (if present)
  let publicIdParts = urlParts.slice(uploadIndex + 1);
  
  // Check if first part is version (starts with 'v' followed by numbers)
  if (publicIdParts[0] && publicIdParts[0].match(/^v\d+$/)) {
    publicIdParts = publicIdParts.slice(1);
  }
  
  // Join the parts and remove file extension
  const publicId = publicIdParts.join('/').replace(/\.[^/.]+$/, '');
  
  return publicId;
};

module.exports = {
  upload,
  deleteFromCloudinary,
  getPublicIdFromUrl
};