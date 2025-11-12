const request = require('supertest');
const express = require('express');
const File = require('../models/File');
const fileRoutes = require('../routes/files');
const { protect } = require('../middleware/auth');

// Mock multer for file upload testing
jest.mock('multer', () => {
  const multer = () => ({
    single: () => (req, res, next) => {
      req.file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test file content'),
        filename: 'test-123456789.jpg'
      };
      next();
    },
    array: () => (req, res, next) => {
      req.files = [{
        originalname: 'test1.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test file 1')
      }, {
        originalname: 'test2.pdf',
        mimetype: 'application/pdf',
        size: 2048,
        buffer: Buffer.from('test file 2')
      }];
      next();
    }
  });
  multer.memoryStorage = () => ({});
  multer.diskStorage = () => ({});
  return multer;
});

describe('File Management Tests', () => {
  let app;
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Create test user
    testUser = await createTestUser();
    authToken = generateTestToken(testUser._id);

    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.user = { _id: testUser._id };
      next();
    });
    app.use('/api/files', fileRoutes);
  });

  describe('POST /api/files/upload', () => {
    it('should upload file successfully', async () => {
      const response = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('category', 'general')
        .field('description', 'Test file description')
        .field('tags', 'test,upload')
        .field('isPublic', 'false')
        .attach('file', Buffer.from('test content'), 'test.jpg')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.file).toBeDefined();
      expect(response.body.file.filename).toBeDefined();
      expect(response.body.file.url).toBeDefined();
      expect(response.body.file.mimetype).toBe('image/jpeg');

      // Verify file was saved to database
      const file = await File.findById(response.body.file.id);
      expect(file).toBeDefined();
      expect(file.uploadedBy.toString()).toBe(testUser._id.toString());
    });

    it('should handle upload with S3 fallback', async () => {
      // Mock Supabase failure to trigger S3 fallback
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const response = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('category', 'general')
        .attach('file', Buffer.from('test content'), 'test.jpg')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.file.url).toBeDefined();
    });

    it('should reject upload without file', async () => {
      const response = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('category', 'general')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('upload a file');
    });

    it('should enforce file size limits', async () => {
      // Mock oversized file
      const largeBuffer = Buffer.alloc(600 * 1024 * 1024); // 600MB
      
      const response = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', largeBuffer, 'large.jpg')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('size');
    });
  });

  describe('GET /api/files', () => {
    beforeEach(async () => {
      // Create test files
      await File.create([
        {
          filename: 'file1.jpg',
          originalName: 'file1.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          url: 'https://test.url/file1.jpg',
          bucket: 'test-bucket',
          path: '/uploads/file1.jpg',
          uploadedBy: testUser._id,
          category: 'profile',
          fileType: 'image'
        },
        {
          filename: 'file2.pdf',
          originalName: 'file2.pdf',
          mimetype: 'application/pdf',
          size: 2048,
          url: 'https://test.url/file2.pdf',
          bucket: 'test-bucket',
          path: '/uploads/file2.pdf',
          uploadedBy: testUser._id,
          category: 'document',
          fileType: 'document'
        }
      ]);
    });

    it('should retrieve user files', async () => {
      const response = await request(app)
        .get('/api/files')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.files).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter files by category', async () => {
      const response = await request(app)
        .get('/api/files?category=profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.files).toHaveLength(1);
      expect(response.body.files[0].category).toBe('profile');
    });

    it('should filter files by type', async () => {
      const response = await request(app)
        .get('/api/files?fileType=document')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.files).toHaveLength(1);
      expect(response.body.files[0].fileType).toBe('document');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/files?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.files).toHaveLength(1);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.pagination.pages).toBe(2);
    });
  });

  describe('GET /api/files/:id', () => {
    let testFile;

    beforeEach(async () => {
      testFile = await File.create({
        filename: 'test.jpg',
        originalName: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        url: 'https://test.url/test.jpg',
        bucket: 'test-bucket',
        path: '/uploads/test.jpg',
        uploadedBy: testUser._id,
        fileType: 'image'
      });
    });

    it('should retrieve file details', async () => {
      const response = await request(app)
        .get(`/api/files/${testFile._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.file._id).toBe(testFile._id.toString());
      expect(response.body.file.filename).toBe('test.jpg');
    });

    it('should update last accessed timestamp', async () => {
      const originalAccess = testFile.lastAccessed;

      await request(app)
        .get(`/api/files/${testFile._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const updatedFile = await File.findById(testFile._id);
      expect(updatedFile.lastAccessed).not.toBe(originalAccess);
    });

    it('should return 404 for non-existent file', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/files/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should deny access to unauthorized files', async () => {
      const otherUser = await createTestUser();
      const privateFile = await File.create({
        filename: 'private.jpg',
        originalName: 'private.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        url: 'https://test.url/private.jpg',
        bucket: 'test-bucket',
        path: '/uploads/private.jpg',
        uploadedBy: otherUser._id,
        isPublic: false,
        fileType: 'image'
      });

      const response = await request(app)
        .get(`/api/files/${privateFile._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Access denied');
    });
  });

  describe('GET /api/files/:id/download', () => {
    let testFile;

    beforeEach(async () => {
      testFile = await File.create({
        filename: 'download.pdf',
        originalName: 'download.pdf',
        mimetype: 'application/pdf',
        size: 2048,
        url: 'https://test.url/download.pdf',
        bucket: 'test-bucket',
        path: '/uploads/download.pdf',
        uploadedBy: testUser._id,
        isPublic: false,
        fileType: 'document'
      });
    });

    it('should generate download URL for authorized user', async () => {
      const response = await request(app)
        .get(`/api/files/${testFile._id}/download`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.url).toBeDefined();
      expect(response.body.filename).toBe('download.pdf');
      expect(response.body.expiresIn).toBe(3600);
    });

    it('should increment download count', async () => {
      const initialCount = testFile.downloadCount;

      await request(app)
        .get(`/api/files/${testFile._id}/download`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const updatedFile = await File.findById(testFile._id);
      expect(updatedFile.downloadCount).toBe(initialCount + 1);
    });

    it('should return public URL for public files', async () => {
      testFile.isPublic = true;
      await testFile.save();

      const response = await request(app)
        .get(`/api/files/${testFile._id}/download`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.url).toBe(testFile.url);
      expect(response.body.expiresIn).toBeNull();
    });
  });

  describe('DELETE /api/files/:id', () => {
    let testFile;

    beforeEach(async () => {
      testFile = await File.create({
        filename: 'delete.jpg',
        originalName: 'delete.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        url: 'https://test.url/delete.jpg',
        bucket: 'test-bucket',
        path: '/uploads/delete.jpg',
        uploadedBy: testUser._id,
        fileType: 'image'
      });
    });

    it('should soft delete file', async () => {
      const response = await request(app)
        .delete(`/api/files/${testFile._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify soft delete
      const deletedFile = await File.findById(testFile._id);
      expect(deletedFile.deleted).toBe(true);
      expect(deletedFile.deletedAt).toBeDefined();
    });

    it('should prevent non-owner from deleting file', async () => {
      const otherUser = await createTestUser();
      const otherToken = generateTestToken(otherUser._id);

      // Override user for this request
      app.use((req, res, next) => {
        req.user = { _id: otherUser._id };
        next();
      });

      const response = await request(app)
        .delete(`/api/files/${testFile._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('owner');
    });

    it('should allow admin to delete any file', async () => {
      const adminUser = await createTestUser();
      adminUser.admin = true;
      await adminUser.save();
      const adminToken = generateTestToken(adminUser._id, true);

      // Override user for this request
      app.use((req, res, next) => {
        req.user = { _id: adminUser._id, admin: true };
        next();
      });

      const response = await request(app)
        .delete(`/api/files/${testFile._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/files/storage/health', () => {
    it('should check storage health status', async () => {
      const response = await request(app)
        .get('/api/files/storage/health')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.storage).toBeDefined();
      expect(response.body.storage.message).toBeDefined();
    });
  });
});