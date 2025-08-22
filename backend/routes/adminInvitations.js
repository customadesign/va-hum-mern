const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const AdminInvitation = require('../models/AdminInvitation');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

// @route   POST /api/admin/invitations
// @desc    Send admin invitation
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), [
  body('email').isEmail().normalizeEmail(),
  body('message').optional().isLength({ max: 500 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { email, message } = req.body;
    const invitedBy = req.user.id;

    // Check if user already exists and is admin
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.admin) {
      return res.status(400).json({
        success: false,
        error: 'User is already an admin'
      });
    }

    // Check if there's already a pending invitation
    const existingInvitation = await AdminInvitation.findOne({
      email,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        error: 'A pending invitation already exists for this email'
      });
    }

    // Create new invitation
    const invitation = new AdminInvitation({
      email,
      invitedBy,
      message
    });

    const invitationToken = invitation.generateInvitationToken();
    await invitation.save();

    // Send invitation email
    try {
      const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:3001'}/admin/accept-invitation/${invitationToken}`;
      const inviterUser = await User.findById(invitedBy);
      
      await sendEmail({
        email: email,
        subject: 'Admin Invitation - Linkage VA Hub',
        template: 'admin-invitation',
        data: {
          inviteUrl,
          inviterName: inviterUser.email,
          message: message || '',
          expiresAt: invitation.expiresAt.toLocaleDateString()
        }
      });

      res.status(201).json({
        success: true,
        message: 'Admin invitation sent successfully',
        invitation: {
          id: invitation._id,
          email: invitation.email,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt
        }
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // Still return success but note email issue
      res.status(201).json({
        success: true,
        message: 'Invitation created but email could not be sent',
        invitation: {
          id: invitation._id,
          email: invitation.email,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt
        },
        inviteUrl: process.env.NODE_ENV === 'development' ? inviteUrl : undefined
      });
    }
  } catch (error) {
    console.error('Admin invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send admin invitation'
    });
  }
});

// @route   GET /api/admin/invitations
// @desc    Get all admin invitations
// @access  Private (Admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const invitations = await AdminInvitation.find(query)
      .populate('invitedBy', 'email')
      .populate('acceptedBy', 'email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AdminInvitation.countDocuments(query);

    res.json({
      success: true,
      invitations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invitations'
    });
  }
});

// @route   GET /api/admin/invitations/:token/verify
// @desc    Verify invitation token
// @access  Public
router.get('/:token/verify', async (req, res) => {
  try {
    const { token } = req.params;

    // Find valid invitation
    const invitation = await AdminInvitation.findByToken(token)
      .populate('invitedBy', 'name email');
    
    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired invitation'
      });
    }

    res.json({
      success: true,
      invitation: {
        email: invitation.email,
        message: invitation.message,
        expiresAt: invitation.expiresAt,
        invitedBy: invitation.invitedBy,
        status: invitation.status
      }
    });
  } catch (error) {
    console.error('Verify invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify invitation'
    });
  }
});

// @route   POST /api/admin/invitations/:token/accept
// @desc    Accept admin invitation
// @access  Public
router.post('/:token/accept', [
  body('name').isLength({ min: 1 }).trim(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { token } = req.params;
    const { name, password } = req.body;

    // Find valid invitation
    const invitation = await AdminInvitation.findByToken(token);
    if (!invitation) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired invitation'
      });
    }

    // Use email from invitation
    const email = invitation.email;

    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      // Make existing user admin and update name if provided
      user.admin = true;
      if (name) {
        user.name = name;
      }
      await user.save();
    } else {
      // Create new admin user
      user = await User.create({
        email,
        name,
        password,
        admin: true
      });
    }

    // Update invitation status
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = user._id;
    await invitation.save();

    // Generate tokens
    const jwtToken = user.getSignedJwtToken();
    const refreshToken = user.getRefreshToken();
    await user.save();

    res.json({
      success: true,
      message: 'Admin invitation accepted successfully',
      token: jwtToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        admin: user.admin
      }
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept invitation'
    });
  }
});

// @route   DELETE /api/admin/invitations/:id
// @desc    Cancel admin invitation
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const invitation = await AdminInvitation.findById(req.params.id);
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Can only cancel pending invitations'
      });
    }

    invitation.status = 'cancelled';
    await invitation.save();

    res.json({
      success: true,
      message: 'Invitation cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel invitation'
    });
  }
});

// @route   POST /api/admin/invitations/:id/resend
// @desc    Resend admin invitation
// @access  Private (Admin only)
router.post('/:id/resend', protect, authorize('admin'), async (req, res) => {
  try {
    const invitation = await AdminInvitation.findById(req.params.id);
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Can only resend pending invitations'
      });
    }

    // Generate new token and extend expiry
    const invitationToken = invitation.generateInvitationToken();
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await invitation.save();

    // Send invitation email
    try {
      const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:3001'}/admin/accept-invitation/${invitationToken}`;
      const inviterUser = await User.findById(invitation.invitedBy);
      
      await sendEmail({
        email: invitation.email,
        subject: 'Admin Invitation (Resent) - Linkage VA Hub',
        template: 'admin-invitation',
        data: {
          inviteUrl,
          inviterName: inviterUser.email,
          message: invitation.message || '',
          expiresAt: invitation.expiresAt.toLocaleDateString()
        }
      });

      res.json({
        success: true,
        message: 'Invitation resent successfully'
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      res.status(500).json({
        success: false,
        error: 'Failed to resend invitation email'
      });
    }
  } catch (error) {
    console.error('Resend invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend invitation'
    });
  }
});

module.exports = router;
