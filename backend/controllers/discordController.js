const axios = require('axios');
const crypto = require('crypto');
const SiteConfig = require('../models/SiteConfig');

// Discord webhook URL validation
const isValidDiscordWebhook = (url) => {
  const discordWebhookRegex = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
  return discordWebhookRegex.test(url);
};

// Send test message to Discord webhook
exports.testWebhook = async (req, res) => {
  try {
    const { webhookUrl } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'Webhook URL is required' 
      });
    }

    if (!isValidDiscordWebhook(webhookUrl)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Discord webhook URL format' 
      });
    }

    // Test message payload
    const testPayload = {
      embeds: [{
        title: '🔔 Linkage VA Hub Test Notification',
        description: 'This is a test message from your Linkage VA Hub admin panel.',
        color: 0x5865F2, // Discord blurple
        fields: [
          {
            name: 'Status',
            value: '✅ Webhook connection successful',
            inline: true
          },
          {
            name: 'Timestamp',
            value: new Date().toLocaleString(),
            inline: true
          }
        ],
        footer: {
          text: 'Linkage VA Hub Admin System'
        },
        timestamp: new Date().toISOString()
      }]
    };

    // Send test message
    const response = await axios.post(webhookUrl, testPayload);

    if (response.status === 204) {
      res.json({ 
        success: true, 
        message: 'Test message sent successfully to Discord' 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Failed to send test message' 
      });
    }
  } catch (error) {
    console.error('Discord webhook test error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.response?.data?.message || 'Failed to connect to Discord webhook' 
    });
  }
};

// Send notification to Discord
exports.sendNotification = async (req, res) => {
  try {
    const { 
      type, 
      title, 
      message, 
      priority = 'normal',
      fields = [],
      webhookUrl 
    } = req.body;

    // Get webhook URL from request or settings
    let webhook = webhookUrl;
    if (!webhook) {
      const settings = await SiteConfig.findOne({ 
        key: 'notifications.discord.webhookUrl' 
      });
      webhook = settings?.value;
    }

    if (!webhook) {
      return res.status(400).json({ 
        success: false, 
        message: 'Discord webhook URL not configured' 
      });
    }

    if (!isValidDiscordWebhook(webhook)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Discord webhook URL' 
      });
    }

    // Determine color based on type/priority
    const colors = {
      success: 0x00FF00,
      error: 0xFF0000,
      warning: 0xFFFF00,
      info: 0x0099FF,
      urgent: 0xFF0000,
      high: 0xFFA500,
      normal: 0x5865F2,
      low: 0x808080
    };

    const color = colors[priority] || colors[type] || colors.normal;

    // Build Discord embed
    const embed = {
      title: title || 'Linkage VA Hub Notification',
      description: message,
      color,
      fields: fields.map(field => ({
        name: field.name,
        value: field.value,
        inline: field.inline !== false
      })),
      footer: {
        text: `Linkage VA Hub • ${type || 'System'}`
      },
      timestamp: new Date().toISOString()
    };

    // Add type-specific emoji
    const emojis = {
      'user-registration': '👤',
      'va-application': '📝',
      'business-signup': '🏢',
      'payment': '💳',
      'error': '❌',
      'warning': '⚠️',
      'success': '✅',
      'info': 'ℹ️'
    };

    if (emojis[type]) {
      embed.title = `${emojis[type]} ${embed.title}`;
    }

    // Send to Discord
    const response = await axios.post(webhook, { embeds: [embed] });

    if (response.status === 204) {
      res.json({ 
        success: true, 
        message: 'Notification sent to Discord' 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Failed to send notification' 
      });
    }
  } catch (error) {
    console.error('Discord notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.response?.data?.message || 'Failed to send Discord notification' 
    });
  }
};

// Send batch notifications
exports.sendBatchNotifications = async (req, res) => {
  try {
    const { notifications, webhookUrl } = req.body;

    if (!Array.isArray(notifications) || notifications.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Notifications array is required' 
      });
    }

    // Get webhook URL
    let webhook = webhookUrl;
    if (!webhook) {
      const settings = await SiteConfig.findOne({ 
        key: 'notifications.discord.webhookUrl' 
      });
      webhook = settings?.value;
    }

    if (!webhook) {
      return res.status(400).json({ 
        success: false, 
        message: 'Discord webhook URL not configured' 
      });
    }

    // Process notifications in batches (Discord allows up to 10 embeds per message)
    const batchSize = 10;
    const results = [];
    
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      
      const embeds = batch.map(notif => ({
        title: notif.title || 'Notification',
        description: notif.message,
        color: notif.color || 0x5865F2,
        fields: notif.fields || [],
        footer: {
          text: notif.footer || 'Linkage VA Hub'
        },
        timestamp: notif.timestamp || new Date().toISOString()
      }));

      try {
        await axios.post(webhook, { embeds });
        results.push({ 
          batch: Math.floor(i / batchSize) + 1, 
          success: true 
        });
      } catch (error) {
        results.push({ 
          batch: Math.floor(i / batchSize) + 1, 
          success: false, 
          error: error.message 
        });
      }

      // Rate limiting - Discord allows 30 requests per minute
      if (i + batchSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.json({ 
      success: failed === 0, 
      message: `Sent ${successful} batch(es), ${failed} failed`,
      results 
    });
  } catch (error) {
    console.error('Discord batch notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send batch notifications' 
    });
  }
};

// Get Discord webhook info
exports.getWebhookInfo = async (req, res) => {
  try {
    const { webhookUrl } = req.query;

    if (!webhookUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'Webhook URL is required' 
      });
    }

    if (!isValidDiscordWebhook(webhookUrl)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Discord webhook URL format' 
      });
    }

    // Extract webhook ID and token from URL
    const matches = webhookUrl.match(/\/webhooks\/(\d+)\/([\w-]+)$/);
    if (!matches) {
      return res.status(400).json({ 
        success: false, 
        message: 'Could not parse webhook URL' 
      });
    }

    const [, webhookId, webhookToken] = matches;

    // Get webhook info from Discord API
    const response = await axios.get(
      `https://discord.com/api/webhooks/${webhookId}/${webhookToken}`
    );

    res.json({
      success: true,
      webhook: {
        id: response.data.id,
        name: response.data.name,
        avatar: response.data.avatar,
        channel_id: response.data.channel_id,
        guild_id: response.data.guild_id,
        type: response.data.type
      }
    });
  } catch (error) {
    console.error('Discord webhook info error:', error);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        success: false, 
        message: 'Webhook not found or invalid' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Failed to get webhook information' 
    });
  }
};

// Create Discord invite link (for OAuth)
exports.createInviteLink = async (req, res) => {
  try {
    const { guildId, permissions = '536870912' } = req.body; // Default: send messages permission

    // Get Discord application ID from settings
    const appIdSetting = await SiteConfig.findOne({ 
      key: 'integrations.discord.applicationId' 
    });

    if (!appIdSetting?.value) {
      return res.status(400).json({ 
        success: false, 
        message: 'Discord application ID not configured' 
      });
    }

    const params = new URLSearchParams({
      client_id: appIdSetting.value,
      permissions,
      scope: 'bot applications.commands'
    });

    if (guildId) {
      params.append('guild_id', guildId);
    }

    const inviteUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;

    res.json({
      success: true,
      inviteUrl
    });
  } catch (error) {
    console.error('Discord invite link error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create Discord invite link' 
    });
  }
};

// Send activity log to Discord
exports.sendActivityLog = async (req, res) => {
  try {
    const { 
      action, 
      user, 
      details, 
      ip, 
      userAgent 
    } = req.body;

    // Get activity log webhook URL from settings
    const settings = await SiteConfig.findOne({ 
      key: 'notifications.discord.activityWebhookUrl' 
    });
    
    const webhookUrl = settings?.value;

    if (!webhookUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'Activity log webhook not configured' 
      });
    }

    // Build activity embed
    const embed = {
      title: '📋 Admin Activity Log',
      description: action,
      color: 0x0099FF,
      fields: [
        {
          name: 'User',
          value: user || 'Unknown',
          inline: true
        },
        {
          name: 'Timestamp',
          value: new Date().toLocaleString(),
          inline: true
        }
      ],
      footer: {
        text: `IP: ${ip || 'Unknown'}`
      },
      timestamp: new Date().toISOString()
    };

    // Add details if provided
    if (details) {
      embed.fields.push({
        name: 'Details',
        value: typeof details === 'string' ? details : JSON.stringify(details, null, 2),
        inline: false
      });
    }

    // Add user agent if provided
    if (userAgent) {
      embed.footer.text += ` • ${userAgent.substring(0, 50)}...`;
    }

    // Send to Discord
    const response = await axios.post(webhookUrl, { embeds: [embed] });

    if (response.status === 204) {
      res.json({ 
        success: true, 
        message: 'Activity logged to Discord' 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Failed to log activity' 
      });
    }
  } catch (error) {
    console.error('Discord activity log error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send activity log' 
    });
  }
};

// Verify Discord signature (for webhooks from Discord)
exports.verifySignature = (req, res, next) => {
  try {
    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];
    const body = JSON.stringify(req.body);

    if (!signature || !timestamp) {
      return res.status(401).json({ 
        success: false, 
        message: 'Missing Discord signature headers' 
      });
    }

    // Get Discord public key from settings
    const publicKey = process.env.DISCORD_PUBLIC_KEY;
    if (!publicKey) {
      return res.status(500).json({ 
        success: false, 
        message: 'Discord public key not configured' 
      });
    }

    const isVerified = crypto.verify(
      'ed25519',
      Buffer.from(timestamp + body),
      publicKey,
      Buffer.from(signature, 'hex')
    );

    if (!isVerified) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid Discord signature' 
      });
    }

    next();
  } catch (error) {
    console.error('Discord signature verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify Discord signature' 
    });
  }
};