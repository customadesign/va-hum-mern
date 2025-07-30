const express = require('express');
const router = express.Router();
const Specialty = require('../models/Specialty');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/specialties
// @desc    Get all specialties
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, active = true } = req.query;

    const query = {};
    if (category) query.category = category;
    if (active === 'true') query.isActive = true;

    const specialties = await Specialty.find(query)
      .sort('-vasCount name');

    res.json({
      success: true,
      data: specialties
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/specialties
// @desc    Create specialty (Admin only)
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const specialty = await Specialty.create(req.body);

    res.status(201).json({
      success: true,
      data: specialty
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/specialties/:id
// @desc    Update specialty (Admin only)
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const specialty = await Specialty.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!specialty) {
      return res.status(404).json({
        success: false,
        error: 'Specialty not found'
      });
    }

    res.json({
      success: true,
      data: specialty
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/specialties/:id
// @desc    Delete specialty (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const specialty = await Specialty.findById(req.params.id);

    if (!specialty) {
      return res.status(404).json({
        success: false,
        error: 'Specialty not found'
      });
    }

    // Soft delete by setting isActive to false
    specialty.isActive = false;
    await specialty.save();

    res.json({
      success: true,
      data: {}
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