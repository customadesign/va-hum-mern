const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command, CopyObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl: getSignedUrlV3 } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Initialize S3 client
const initializeS3 = () => {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET) {
    console.log('AWS S3 credentials not configured. S3 storage will be unavailable.');
    return null;
  }

  return new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });
};

const s3Client = initializeS3();

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
  if (!s3Client) {
    throw new Error('AWS S3 not configured');
  }

  try {
    // Generate unique filename
    const fileExt = path.extname(file.originalname);
    const fileName = `${folder}/${uuidv4()}${fileExt}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
        uploadedBy: 'linkage-va-hub'
      }
    });

    console.log('Attempting to upload to AWS S3:', {
      bucket: process.env.AWS_S3_BUCKET,
      key: fileName,
      fileSize: file.size,
      mimeType: file.mimetype
    });

    // Upload file to S3
    const data = await s3Client.send(command);

    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`;
    console.log('S3 upload successful:', fileUrl);

    return {
      url: fileUrl,
      key: fileName,
      bucket: process.env.AWS_S3_BUCKET,
      etag: data.ETag
    };
  } catch (error) {
    console.error('Upload to S3 error:', error);
    throw error;
  }
};

// Delete from AWS S3
const deleteFromS3 = async (fileKey) => {
  if (!s3Client || !fileKey) return;

  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey
    });

    await s3Client.send(command);
    console.log('S3 file deleted:', fileKey);
  } catch (error) {
    console.error('Delete from S3 error:', error);
  }
};

// Get signed URL for private files
const getS3SignedUrl = async (fileKey, expiresIn = 3600) => {
  if (!s3Client || !fileKey) {
    throw new Error('Cannot generate signed URL: S3 not configured or missing file key');
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey
    });

    const signedUrl = await getSignedUrlV3(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Get signed URL error:', error);
    throw error;
  }
};

// Check if S3 is available
const isS3Available = () => {
  return s3Client !== null;
};

// List files in S3 bucket
const listS3Files = async (prefix = '', maxKeys = 1000) => {
  if (!s3Client) {
    throw new Error('AWS S3 not configured');
  }

  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET,
      Prefix: prefix,
      MaxKeys: maxKeys
    });

    const data = await s3Client.send(command);
    return data.Contents || [];
  } catch (error) {
    console.error('List S3 files error:', error);
    throw error;
  }
};

// Check if file exists in S3
const checkS3FileExists = async (fileKey) => {
  if (!s3Client) {
    return false;
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
};

// Copy file within S3
const copyS3File = async (sourceKey, destinationKey) => {
  if (!s3Client) {
    throw new Error('AWS S3 not configured');
  }

  try {
    const command = new CopyObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      CopySource: `${process.env.AWS_S3_BUCKET}/${sourceKey}`,
      Key: destinationKey
    });

    const data = await s3Client.send(command);
    console.log('S3 file copied:', { from: sourceKey, to: destinationKey });
    return data;
  } catch (error) {
    console.error('Copy S3 file error:', error);
    throw error;
  }
};

// Get file metadata from S3
const getS3FileMetadata = async (fileKey) => {
  if (!s3Client) {
    throw new Error('AWS S3 not configured');
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey
    });

    const data = await s3Client.send(command);
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
  getSignedUrl: getS3SignedUrl,
  isS3Available,
  listS3Files,
  checkS3FileExists,
  copyS3File,
  getS3FileMetadata
};