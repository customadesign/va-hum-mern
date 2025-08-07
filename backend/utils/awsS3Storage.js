const AWS = require('aws-sdk');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Initialize S3 client
const initializeS3 = () => {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET) {
    console.log('AWS S3 credentials not configured. S3 storage will be unavailable.');
    return null;
  }

  return new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
  });
};

const s3 = initializeS3();

// Multer memory storage for S3
const storage = multer.memoryStorage();

// File filter (same as Supabase)
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    image: /jpeg|jpg|png|gif|webp/,
    video: /mp4|avi|mov|wmv|flv|mkv|webm/,
    document: /pdf|doc|docx|txt|rtf/
  };

  const extname = path.extname(file.originalname).toLowerCase();
  const isImage = allowedTypes.image.test(extname);
  const isVideo = allowedTypes.video.test(extname);
  const isDocument = allowedTypes.document.test(extname);

  if (isImage || isVideo || isDocument) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

// Create multer instance for S3
const uploadS3 = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: fileFilter
});

// Upload to AWS S3
const uploadToS3 = async (file, folder) => {
  if (!s3) {
    throw new Error('AWS S3 not configured');
  }

  try {
    // Generate unique filename
    const fileExt = path.extname(file.originalname);
    const fileName = `${folder}/${uuidv4()}${fileExt}`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', // Make file publicly accessible
      Metadata: {
        originalName: file.originalname,
        uploadedBy: 'linkage-va-hub'
      }
    };

    console.log('Attempting to upload to AWS S3:', {
      bucket: process.env.AWS_S3_BUCKET,
      key: fileName,
      fileSize: file.size,
      mimeType: file.mimetype
    });

    // Upload file to S3
    const data = await s3.upload(params).promise();

    console.log('S3 upload successful:', data.Location);

    return {
      url: data.Location,
      key: data.Key,
      bucket: data.Bucket,
      etag: data.ETag
    };
  } catch (error) {
    console.error('Upload to S3 error:', error);
    throw error;
  }
};

// Delete from AWS S3
const deleteFromS3 = async (fileKey) => {
  if (!s3 || !fileKey) return;

  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey
    };

    await s3.deleteObject(params).promise();
    console.log('S3 file deleted:', fileKey);
  } catch (error) {
    console.error('Delete from S3 error:', error);
  }
};

// Get signed URL for private files
const getSignedUrl = async (fileKey, expiresIn = 3600) => {
  if (!s3 || !fileKey) {
    throw new Error('Cannot generate signed URL: S3 not configured or missing file key');
  }

  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey,
      Expires: expiresIn // URL expiration time in seconds
    };

    const signedUrl = await s3.getSignedUrlPromise('getObject', params);
    return signedUrl;
  } catch (error) {
    console.error('Get signed URL error:', error);
    throw error;
  }
};

// Check if S3 is available
const isS3Available = () => {
  return s3 !== null;
};

// List files in S3 bucket
const listS3Files = async (prefix = '', maxKeys = 1000) => {
  if (!s3) {
    throw new Error('AWS S3 not configured');
  }

  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Prefix: prefix,
      MaxKeys: maxKeys
    };

    const data = await s3.listObjectsV2(params).promise();
    return data.Contents || [];
  } catch (error) {
    console.error('List S3 files error:', error);
    throw error;
  }
};

// Check if file exists in S3
const checkS3FileExists = async (fileKey) => {
  if (!s3) {
    return false;
  }

  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey
    };

    await s3.headObject(params).promise();
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
      return false;
    }
    throw error;
  }
};

// Copy file within S3
const copyS3File = async (sourceKey, destinationKey) => {
  if (!s3) {
    throw new Error('AWS S3 not configured');
  }

  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      CopySource: `${process.env.AWS_S3_BUCKET}/${sourceKey}`,
      Key: destinationKey
    };

    const data = await s3.copyObject(params).promise();
    console.log('S3 file copied:', { from: sourceKey, to: destinationKey });
    return data;
  } catch (error) {
    console.error('Copy S3 file error:', error);
    throw error;
  }
};

// Get file metadata from S3
const getS3FileMetadata = async (fileKey) => {
  if (!s3) {
    throw new Error('AWS S3 not configured');
  }

  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey
    };

    const data = await s3.headObject(params).promise();
    return {
      contentType: data.ContentType,
      contentLength: data.ContentLength,
      lastModified: data.LastModified,
      etag: data.ETag,
      metadata: data.Metadata
    };
  } catch (error) {
    console.error('Get S3 file metadata error:', error);
    throw error;
  }
};

module.exports = {
  uploadS3,
  uploadToS3,
  deleteFromS3,
  getSignedUrl,
  isS3Available,
  listS3Files,
  checkS3FileExists,
  copyS3File,
  getS3FileMetadata
};