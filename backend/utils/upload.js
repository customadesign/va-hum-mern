const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    image: /jpeg|jpg|png|gif|webp/,
    video: /mp4|avi|mov|wmv|flv|mkv|webm/,
    document: /pdf|doc|docx|txt|rtf/
  };

  const extname = allowedTypes.image.test(path.extname(file.originalname).toLowerCase()) ||
                  allowedTypes.video.test(path.extname(file.originalname).toLowerCase()) ||
                  allowedTypes.document.test(path.extname(file.originalname).toLowerCase());
  
  const mimetype = allowedTypes.image.test(file.mimetype) ||
                   allowedTypes.video.test(file.mimetype) ||
                   allowedTypes.document.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: fileFilter
});

module.exports = upload;