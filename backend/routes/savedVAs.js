const express = require('express');
const router = express.Router();
const savedVAController = require('../controllers/savedVAController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Save a VA (POST /api/saved-vas)
router.post('/', savedVAController.saveVA);

// Get saved VAs list (GET /api/saved-vas)
router.get('/', savedVAController.getSavedVAs);

// Get saved count (GET /api/saved-vas/count)
router.get('/count', savedVAController.getSavedCount);

// Check if a specific VA is saved (GET /api/saved-vas/exists/:vaId)
router.get('/exists/:vaId', savedVAController.checkIfSaved);

// Unsave a VA (DELETE /api/saved-vas/:vaId)
router.delete('/:vaId', savedVAController.unsaveVA);

module.exports = router;