const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Business = require('../models/Business');
const VA = require('../models/VA');
// HYBRID AUTH: Support both Clerk and legacy JWT during migration
const { protect } = require('../middleware/hybridAuth');
const { calculateCompletionPercentage, getMissingFields } = require('../middleware/profileCompletion');

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'va',
        populate: [
          { path: 'location' },
          { path: 'specialties' },
          { path: 'roleLevel' },
          { path: 'roleType' }
        ]
      })
      .populate({
        path: 'business'
      })
      .populate('referredBy', 'email referralCode')
      .populate('referrals', 'email createdAt');

    // Calculate profile completion based on VA or Business profile
    let profileCompletion = null;

    if (user.va) {
      const vaProfile = user.va;
      const percentage = calculateCompletionPercentage(vaProfile, 'va');
      const missingFields = getMissingFields(vaProfile, 'va');

      profileCompletion = {
        percentage,
        userType: 'va',
        isComplete: percentage >= 80,
        missingFields
      };
    } else if (user.business) {
      const businessProfile = user.business;
      const percentage = calculateCompletionPercentage(businessProfile, 'business');
      const missingFields = getMissingFields(businessProfile, 'business');

      profileCompletion = {
        percentage,
        userType: 'business',
        isComplete: percentage >= 80,
        missingFields
      };
    }

    res.json({
      success: true,
      data: user,
      profileCompletion
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { email, inboxEnabled } = req.body;

    const user = await User.findById(req.user.id);

    if (email) user.email = email;
    if (typeof inboxEnabled === 'boolean') user.inboxEnabled = inboxEnabled;

    await user.save();

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/users/password
// @desc    Update password
// @access  Private
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', protect, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);

    res.json({
      success: true,
      message: 'Account deleted successfully'
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