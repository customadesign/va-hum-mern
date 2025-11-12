const express = require('express');
const router = express.Router();
const universalSearchController = require('../controllers/universalSearchController');
const { protect, authorize } = require('../middleware/hybridAuth');

/**
 * Universal Search Routes for Admin Panel
 */

// Main search endpoint
// GET /api/admin/search/universal?query=searchterm&limit=5
router.get('/universal', protect, authorize('admin'), universalSearchController.search.bind(universalSearchController));

// Create text indexes endpoint (should be called once during setup)
// POST /api/admin/search/create-indexes
router.post('/create-indexes', protect, authorize('admin'), async (req, res) => {
  try {
    const result = await universalSearchController.createTextIndexes();
    if (result.success) {
      res.json({
        success: true,
        message: 'Text indexes created successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create text indexes',
      details: error.message
    });
  }
});

module.exports = router;