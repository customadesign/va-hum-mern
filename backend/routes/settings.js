const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Debug middleware to log requests
router.use((req, res, next) => {
  console.log('Settings route accessed:', req.method, req.path);
  console.log('Headers:', req.headers.authorization ? 'Bearer token present' : 'No auth header');
  next();
});

// All settings routes require authentication and admin access
router.use(protect);
router.use(adminAuth);

// Get all settings
router.get('/', settingsController.getSettings);

// Get specific category settings
router.get('/category/:category', settingsController.getSettingCategory);

// Update settings
router.put('/', settingsController.updateSettings);

// Reset settings
router.post('/reset', settingsController.resetSettings);

// Export settings with enhanced metadata
router.get('/export', settingsController.exportSettings);

// Import settings with validation and transactions
router.post('/import', settingsController.importSettings);

// Restore from backup
router.post('/restore', settingsController.restoreFromBackup);

// Get import/export history
router.get('/history', settingsController.getSettingsHistory);

module.exports = router;
