const express = require('express');
const { clerkClient } = require('@clerk/clerk-sdk-node');
const User = require('../models/User');
const { findOrCreateUser } = require('../middleware/clerkAuth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// @route   POST /api/clerk/webhooks
// @desc    Handle Clerk webhooks for user management
// @access  Public (with webhook verification)
router.post('/webhooks', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    switch (type) {
      case 'user.created':
        await handleUserCreated(data);
        break;
      case 'user.updated':
        await handleUserUpdated(data);
        break;
      case 'user.deleted':
        await handleUserDeleted(data);
        break;
      default:
        console.log(`Unhandled webhook type: ${type}`);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
});

// @route   POST /api/clerk/sync-user
// @desc    Sync user data from Clerk to our database
// @access  Private (requires Clerk auth)
router.post('/sync-user', async (req, res) => {
  try {
    const authUserId = req.auth && req.auth.userId;
    const { clerkUserId: bodyClerkUserId } = req.body || {};
    const clerkUserId = authUserId || bodyClerkUserId;
    
    if (!clerkUserId) {
      return res.status(400).json({
        success: false,
        error: 'Clerk user ID required'
      });
    }
    
    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    
    // Find or create user in our database
    const user = await findOrCreateUser(clerkUser);
    
    // Load related data
    await user.populate(['va', 'business']);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        admin: user.admin,
        referralCode: user.referralCode,
        va: user.va,
        business: user.business,
        clerkUserId: user.clerkUserId
      }
    });
  } catch (error) {
    console.error('Sync user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync user data'
    });
  }
});

// @route   POST /api/clerk/complete-profile
// @desc    Complete user profile after Clerk signup
// @access  Private (requires Clerk auth)
router.post('/complete-profile', [
  body('role').isIn(['va', 'business']).withMessage('Role must be va or business'),
  body('referralCode').optional({ checkFalsy: true, nullable: true }).isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Complete-profile validation failed:', errors.array());
    console.log('Complete-profile request body:', req.body);
    console.log('Complete-profile req.auth:', req.auth);
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const authUserId = req.auth && req.auth.userId;
    const { clerkUserId: bodyClerkUserId, role, referralCode } = req.body || {};
    const clerkUserId = authUserId || bodyClerkUserId;
    
    if (!clerkUserId) {
      console.log('Complete-profile missing clerkUserId. req.auth:', req.auth, 'body:', req.body);
      return res.status(400).json({
        success: false,
        error: 'Clerk user ID required'
      });
    }
    
    // Find user in our database
    let user = await User.findOne({ clerkUserId });
    
    if (!user) {
      // Get user from Clerk and create in our database
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      user = await findOrCreateUser(clerkUser);
    }
    
    // Update user profile
    user.role = role;
    
    // Handle referral code
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        user.referredBy = referrer._id;
        referrer.referrals.push(user._id);
        await referrer.save();
      }
    }
    
    await user.save();
    
    // Load related data
    await user.populate(['va', 'business', 'referredBy']);
    
    res.json({
      success: true,
      message: 'Profile completed successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        admin: user.admin,
        referralCode: user.referralCode,
        va: user.va,
        business: user.business,
        clerkUserId: user.clerkUserId
      }
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete profile'
    });
  }
});

// @route   GET /api/clerk/me
// @desc    Get current user profile
// @access  Private (requires Clerk auth)
router.get('/me', async (req, res) => {
  try {
    const authUserId = req.auth && req.auth.userId;
    const { clerkUserId: bodyClerkUserId } = req.body || {};
    const clerkUserId = authUserId || bodyClerkUserId;
    
    if (!clerkUserId) {
      return res.status(400).json({
        success: false,
        error: 'Clerk user ID required'
      });
    }
    
    const user = await User.findOne({ clerkUserId }).populate(['va', 'business']);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        admin: user.admin,
        referralCode: user.referralCode,
        va: user.va,
        business: user.business,
        clerkUserId: user.clerkUserId
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data'
    });
  }
});

// Webhook event handlers
async function handleUserCreated(userData) {
  try {
    console.log('User created in Clerk:', userData.id);
    
    // Create user in our database
    const user = await findOrCreateUser(userData);
    console.log('User synced to database:', user._id);
  } catch (error) {
    console.error('Error handling user.created webhook:', error);
  }
}

async function handleUserUpdated(userData) {
  try {
    console.log('User updated in Clerk:', userData.id);
    
    // Update user in our database
    const user = await User.findOne({ clerkUserId: userData.id });
    if (user) {
      const email = userData.email_addresses?.[0]?.email_address;
      if (email) {
        user.email = email.toLowerCase();
      }
      
      const name = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
      if (name) {
        user.name = name;
      }
      
      await user.save();
      console.log('User updated in database:', user._id);
    }
  } catch (error) {
    console.error('Error handling user.updated webhook:', error);
  }
}

async function handleUserDeleted(userData) {
  try {
    console.log('User deleted in Clerk:', userData.id);
    
    // Mark user as suspended instead of deleting (preserve relationships)
    const user = await User.findOne({ clerkUserId: userData.id });
    if (user) {
      user.suspended = true;
      user.clerkUserId = null; // Remove Clerk association
      await user.save();
      console.log('User suspended in database:', user._id);
    }
  } catch (error) {
    console.error('Error handling user.deleted webhook:', error);
  }
}

module.exports = router;