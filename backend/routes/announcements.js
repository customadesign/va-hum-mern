const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createAnnouncement,
  getAnnouncements,
  getAllAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  markAsRead,
  getUnreadCount,
  archiveExpired,
  getAnnouncementStats
} = require('../controllers/announcementController');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.admin) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Administrator privileges required.'
    });
  }
  next();
};

// Public routes (require authentication)
router.use(protect); // All routes below require authentication

// User routes
router.get('/', getAnnouncements); // Get announcements for current user
router.get('/unread-count', getUnreadCount); // Get unread count for current user
router.post('/:id/read', markAsRead); // Mark announcement as read

// Admin only routes
router.get('/admin', isAdmin, getAllAnnouncements); // Get all announcements (admin dashboard)
router.post('/', isAdmin, createAnnouncement); // Create new announcement
router.put('/:id', isAdmin, updateAnnouncement); // Update announcement
router.delete('/:id', isAdmin, deleteAnnouncement); // Delete announcement
router.post('/archive-expired', isAdmin, archiveExpired); // Archive expired announcements
router.get('/:id/stats', isAdmin, getAnnouncementStats); // Get announcement statistics

module.exports = router;