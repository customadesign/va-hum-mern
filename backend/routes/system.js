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

// @route   GET /api/system/debug
// @desc    Debug endpoint to check E-systems mode
// @access  Public
router.get('/debug', (req, res) => {
  res.json({
    ESYSTEMS_MODE: process.env.ESYSTEMS_MODE,
    PORT: process.env.PORT,
    isESystemsMode: isESystemsMode(),
    branding: getESystemsBranding(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      ESYSTEMS_MODE: process.env.ESYSTEMS_MODE,
      PORT: process.env.PORT
    }
  });
});

module.exports = router;