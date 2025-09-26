const fs = require('fs').promises;
const path = require('path');

/**
 * Email Sender Audit Logger
 * Tracks which sender address was used for different email types for audit purposes
 */

const logSenderUsage = async (emailData) => {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      senderEmail: emailData.senderEmail,
      recipientEmail: emailData.recipientEmail,
      emailType: emailData.emailType, // 'business', 'va', 'admin'
      subject: emailData.subject,
      success: emailData.success,
      fallbackUsed: emailData.fallbackUsed || false,
      messageId: emailData.messageId,
      userId: emailData.userId,
      ipAddress: emailData.ipAddress
    };

    const logDir = path.join(__dirname, '../logs');
    const logFile = path.join(logDir, `email-sender-audit-${new Date().toISOString().split('T')[0]}.log`);

    // Ensure logs directory exists
    try {
      await fs.access(logDir);
    } catch (error) {
      await fs.mkdir(logDir, { recursive: true });
    }

    // Append log entry
    const logLine = JSON.stringify(logEntry) + '\n';
    await fs.appendFile(logFile, logLine);

    console.log(`[Email Sender Audit] ${logEntry.emailType} email sent from ${logEntry.senderEmail} to ${logEntry.recipientEmail}`);
  } catch (error) {
    console.error('Error logging sender usage:', error);
  }
};

/**
 * Determine which sender email to use based on email context
 */
const getSenderForEmailType = (emailType, settings) => {
  const senderMap = {
    business: settings.sendgrid_business_sender || 'hello@esystemsmanagement.com',
    va: settings.sendgrid_va_sender || 'hello@linkagevahub.com', 
    admin: settings.sendgrid_admin_sender || 'noreply@linkagevahub.com'
  };

  return senderMap[emailType] || settings.sendgrid_fallback_sender || 'hello@linkagevahub.com';
};

/**
 * Detect email type based on content and recipient
 */
const detectEmailType = (emailContent) => {
  const { subject, body, recipientType, context } = emailContent;
  
  // Business-related keywords
  const businessKeywords = ['invoice', 'proposal', 'quote', 'billing', 'payment', 'contract', 'client'];
  
  // VA-related keywords  
  const vaKeywords = ['task', 'assignment', 'va', 'virtual assistant', 'project', 'deadline'];
  
  // Admin-related keywords
  const adminKeywords = ['password', 'reset', 'verification', 'system', 'maintenance', 'alert'];

  const textToCheck = `${subject} ${body}`.toLowerCase();

  if (recipientType === 'business' || businessKeywords.some(keyword => textToCheck.includes(keyword))) {
    return 'business';
  }
  
  if (recipientType === 'va' || vaKeywords.some(keyword => textToCheck.includes(keyword))) {
    return 'va';
  }
  
  if (context === 'system' || adminKeywords.some(keyword => textToCheck.includes(keyword))) {
    return 'admin';
  }

  // Default to admin for system emails
  return 'admin';
};

/**
 * Get recent sender usage statistics
 */
const getSenderStats = async (days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const logDir = path.join(__dirname, '../logs');
    const files = await fs.readdir(logDir);
    const logFiles = files.filter(file => 
      file.startsWith('email-sender-audit-') && 
      file.endsWith('.log')
    );

    const stats = {
      totalEmails: 0,
      senderBreakdown: {},
      typeBreakdown: { business: 0, va: 0, admin: 0 },
      fallbackUsage: 0,
      successRate: 0
    };

    for (const file of logFiles) {
      const filePath = path.join(logDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          const entryDate = new Date(entry.timestamp);
          
          if (entryDate >= startDate) {
            stats.totalEmails++;
            
            // Count by sender
            stats.senderBreakdown[entry.senderEmail] = 
              (stats.senderBreakdown[entry.senderEmail] || 0) + 1;
            
            // Count by type
            if (stats.typeBreakdown[entry.emailType] !== undefined) {
              stats.typeBreakdown[entry.emailType]++;
            }
            
            // Count fallback usage
            if (entry.fallbackUsed) {
              stats.fallbackUsage++;
            }
            
            // Track success rate
            if (entry.success) {
              stats.successRate++;
            }
          }
        } catch (parseError) {
          // Skip invalid log entries
        }
      }
    }

    if (stats.totalEmails > 0) {
      stats.successRate = (stats.successRate / stats.totalEmails) * 100;
    }

    return stats;
  } catch (error) {
    console.error('Error getting sender stats:', error);
    return {
      totalEmails: 0,
      senderBreakdown: {},
      typeBreakdown: { business: 0, va: 0, admin: 0 },
      fallbackUsage: 0,
      successRate: 0
    };
  }
};

module.exports = {
  logSenderUsage,
  getSenderForEmailType,
  detectEmailType,
  getSenderStats
};