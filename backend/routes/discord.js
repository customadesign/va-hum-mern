const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const discordController = require('../controllers/discordController');

// Test webhook connection
router.post('/test-webhook', protect, adminAuth, discordController.testWebhook);

// Send single notification
router.post('/send-notification', protect, adminAuth, discordController.sendNotification);

// Send batch notifications
router.post('/send-batch', protect, adminAuth, discordController.sendBatchNotifications);

// Get webhook information
router.get('/webhook-info', protect, adminAuth, discordController.getWebhookInfo);

// Create Discord bot invite link
router.post('/create-invite', protect, adminAuth, discordController.createInviteLink);

// Send activity log
router.post('/activity-log', protect, adminAuth, discordController.sendActivityLog);

// Discord webhook endpoint (for receiving events from Discord)
router.post('/webhook', discordController.verifySignature, (req, res) => {
  // Handle Discord interaction
  const { type } = req.body;
  
  // Discord ping verification
  if (type === 1) {
    return res.json({ type: 1 });
  }
  
  // Handle other interaction types
  console.log('Discord webhook received:', req.body);
  res.json({ success: true });
});

module.exports = router;