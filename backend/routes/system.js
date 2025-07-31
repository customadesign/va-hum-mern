const express = require('express');
const router = express.Router();
const { getESystemsBranding, isESystemsMode } = require('../utils/esystems');

// @route   GET /api/system/branding
// @desc    Get system branding configuration
// @access  Public
router.get('/branding', (req, res) => {
  try {
    const branding = getESystemsBranding();
    
    res.json({
      success: true,
      data: {
        ...branding,
        isESystemsMode: isESystemsMode()
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;