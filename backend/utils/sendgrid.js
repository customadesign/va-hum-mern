// SendGrid integration - optional dependency
let sgMail;
try {
  sgMail = require('@sendgrid/mail');
} catch (error) {
  console.log('SendGrid package not installed. Install with: npm install @sendgrid/mail');
  sgMail = null;
}

// Import domain configuration
const { getSenderForTemplate, detectRecipientType, validateSenderDomains } = require('../config/emailDomains');

// Initialize SendGrid
const initializeSendGrid = () => {
  if (!sgMail) {
    console.log('SendGrid package not available');
    return false;
  }

  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('SendGrid initialized successfully');
    
    // Validate domain configuration
    const domainConfig = validateSenderDomains();
    console.log('Required SendGrid domains:', domainConfig.domains.join(', '));
    console.log('Configured senders:', domainConfig.senders);
    
    return true;
  }
  console.log('SendGrid not configured - SENDGRID_API_KEY not found');
  return false;
};

// Email templates for SendGrid
const sendGridTemplates = {
  welcome: (data) => ({
    subject: 'Welcome to Linkage VA Hub!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Welcome to Linkage VA Hub!</h2>
        <p>Thank you for joining our platform connecting talented Filipino virtual assistants with businesses.</p>
        <p>Please confirm your email by clicking the link below:</p>
        <a href="${data.confirmUrl}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Confirm Email</a>
        <p style="margin-top: 20px;">If you have any questions, feel free to contact us.</p>
        <p>Best regards,<br><strong>Linkage VA Hub Team</strong></p>
      </div>
    `
  }),
  'esystems-welcome': (data) => ({
    subject: 'Welcome to E-Systems Management - Please confirm your email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Welcome to E-Systems Management!</h2>
        <p>Hi ${data.name || 'there'},</p>
        <p>Thank you for joining our comprehensive business solutions platform.</p>
        <p>Please confirm your email by clicking the link below:</p>
        <a href="${data.confirmUrl}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Confirm Email</a>
        <p style="margin-top: 20px;">Once confirmed, you'll be able to:</p>
        <ul style="margin: 20px 0;">
          <li>Complete your company profile</li>
          <li>Browse qualified virtual assistants</li>
          <li>Post job requirements</li>
          <li>Manage your team and projects</li>
        </ul>
        <p>If you have any questions, feel free to contact us.</p>
        <p>Best regards,<br><strong>E-Systems Management Team</strong></p>
      </div>
    `
  }),
  'reset-password': (data) => ({
    subject: 'Password Reset Request - Linkage VA Hub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Password Reset Request</h2>
        <p>You requested a password reset for your Linkage VA Hub account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${data.resetUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Reset Password</a>
        <p style="color: #ef4444; font-weight: bold;">This link will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br><strong>Linkage VA Hub Team</strong></p>
      </div>
    `
  }),
  'new-message': (data) => ({
    subject: `New message from ${data.senderName} - Linkage VA Hub`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">You have a new message!</h2>
        <p><strong>${data.senderName}</strong> sent you a message on Linkage VA Hub:</p>
        <div style="border-left: 4px solid #059669; padding-left: 16px; margin: 20px 0; background-color: #f0fdf4; padding: 16px; border-radius: 4px;">
          <p style="margin: 0; font-style: italic;">"${data.messagePreview}"</p>
        </div>
        <a href="${data.conversationUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Conversation</a>
        <p style="margin-top: 20px;">Best regards,<br><strong>Linkage VA Hub Team</strong></p>
      </div>
    `
  }),
  'admin-invitation': (data) => ({
    subject: 'Admin Invitation - Linkage VA Hub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">You've been invited to become an admin!</h2>
        <p>Hello,</p>
        <p><strong>${data.inviterName}</strong> has invited you to become an administrator for Linkage VA Hub.</p>
        ${data.message ? `<div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; margin: 16px 0;"><p style="margin: 0;"><strong>Personal Message:</strong></p><p style="margin: 8px 0 0 0; font-style: italic;">"${data.message}"</p></div>` : ''}
        <p>Click the link below to accept this invitation and create your admin account:</p>
        <a href="${data.inviteUrl}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Accept Admin Invitation</a>
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;"><strong>⚠️ Important:</strong> This invitation will expire on ${data.expiresAt}.</p>
        </div>
        <p>If you don't want to accept this invitation, you can safely ignore this email.</p>
        <p>Best regards,<br><strong>Linkage VA Hub Team</strong></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="font-size: 12px; color: #6b7280;">This is an automated email from Linkage VA Hub. Please do not reply to this email.</p>
      </div>
    `
  }),
  'admin-password-reset': (data) => ({
    subject: 'Password Reset Initiated by Administrator',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Password Reset Initiated by Administrator</h2>
        <p>Hello,</p>
        <p>An administrator (${data.adminName}) has initiated a password reset for your account.</p>
        ${data.reason ? `<div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; margin: 16px 0;"><p style="margin: 0;"><strong>Reason:</strong></p><p style="margin: 8px 0 0 0; font-style: italic;">"${data.reason}"</p></div>` : ''}
        <p>Click the link below to set your new password:</p>
        <a href="${data.resetUrl}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Set New Password</a>
        <div style="background-color: #fef2f2; border: 1px solid #ef4444; padding: 12px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #dc2626;"><strong>⚠️ Important:</strong> This link will expire in ${data.expiresIn || '30 minutes'}.</p>
        </div>
        <p>If you have any questions about this password reset, please contact support immediately.</p>
        <p>Best regards,<br><strong>Linkage VA Hub Team</strong></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="font-size: 12px; color: #6b7280;">This password reset was initiated by an administrator. If you believe this was done in error, please contact support immediately.</p>
      </div>
    `
  }),
  'system-notification': (data) => ({
    subject: data.subject || 'System Notification - Linkage VA Hub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">${data.title || 'System Notification'}</h2>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
          ${data.content}
        </div>
        ${data.actionUrl && data.actionText ? `
          <p style="margin-top: 20px;">
            <a href="${data.actionUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">${data.actionText}</a>
          </p>
        ` : ''}
        <p style="margin-top: 20px;">Best regards,<br><strong>Linkage VA Hub Team</strong></p>
      </div>
    `
  })
};

// Send email using SendGrid with domain-based sender selection
const sendSendGridEmail = async (options) => {
  try {
    if (!sgMail) {
      throw new Error('SendGrid package not available');
    }

    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SendGrid API key not configured');
    }

    // Get template
    const template = sendGridTemplates[options.template];
    if (!template) {
      throw new Error(`Email template '${options.template}' not found`);
    }

    // Get appropriate sender based on recipient type
    const senderConfig = getSenderForTemplate(
      options.template,
      options.email,
      options.userData
    );

    console.log(`SendGrid: Using sender ${senderConfig.email} for template ${options.template} to ${options.email}`);

    const emailContent = template(options.data || {});

    const msg = {
      to: options.email,
      from: {
        email: senderConfig.email,
        name: senderConfig.name
      },
      subject: options.subject || emailContent.subject,
      html: emailContent.html,
      text: options.text || emailContent.text,
      // Add tracking
      trackingSettings: {
        clickTracking: {
          enable: true,
          enableText: false
        },
        openTracking: {
          enable: true
        }
      },
      // Add categories for analytics and sender tracking
      categories: [
        'linkage-platform',
        senderConfig.domain.replace('.', '-'), // e.g., 'linkagevahub-com'
        options.template || 'notification',
        detectRecipientType(options.email, options.userData) // e.g., 'va', 'business', 'admin'
      ]
    };

    // Add reply-to if specified, otherwise use appropriate reply-to
    if (options.replyTo) {
      msg.replyTo = options.replyTo;
    } else if (options.template !== 'admin-invitation') {
      // For non-admin emails, provide a reply-to address
      if (senderConfig.email.includes('noreply')) {
        msg.replyTo = senderConfig.email.replace('noreply@', 'support@');
      }
    }

    const result = await sgMail.send(msg);
    
    console.log('SendGrid email sent successfully:', {
      to: options.email,
      from: senderConfig.email,
      template: options.template,
      domain: senderConfig.domain,
      messageId: result[0]?.headers?.['x-message-id']
    });

    return result;
  } catch (error) {
    console.error('SendGrid email error:', error);
    
    // Re-throw with more context
    if (error.response) {
      const { message, code, response } = error;
      const errorInfo = {
        message,
        code,
        statusCode: response?.statusCode,
        body: response?.body
      };
      throw new Error(`SendGrid Error: ${JSON.stringify(errorInfo)}`);
    }
    
    throw error;
  }
};

// Send bulk emails using SendGrid
const sendBulkSendGridEmails = async (recipients, options) => {
  try {
    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('Recipients must be a non-empty array');
    }

    const template = sendGridTemplates[options.template];
    if (!template) {
      throw new Error(`Email template '${options.template}' not found`);
    }

    // Prepare personalized messages
    const personalizations = recipients.map(recipient => {
      const emailContent = template({ ...options.data, ...recipient.data });
      
      return {
        to: [{ email: recipient.email, name: recipient.name }],
        subject: options.subject || emailContent.subject,
        substitutions: recipient.substitutions || {}
      };
    });

    const templateContent = template(options.data || {});

    const msg = {
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@linkage.ph',
        name: process.env.SENDGRID_FROM_NAME || process.env.EMAIL_FROM_NAME || 'Linkage VA Hub'
      },
      subject: options.subject || templateContent.subject,
      html: templateContent.html,
      personalizations,
      trackingSettings: {
        clickTracking: { enable: true, enableText: false },
        openTracking: { enable: true }
      },
      categories: ['linkage-va-hub', 'bulk', options.template || 'notification']
    };

    const result = await sgMail.sendMultiple(msg);
    
    console.log('SendGrid bulk emails sent successfully:', {
      count: recipients.length,
      template: options.template
    });

    return result;
  } catch (error) {
    console.error('SendGrid bulk email error:', error);
    throw error;
  }
};

// Test SendGrid configuration
const testSendGridConfig = async () => {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      return {
        success: false,
        error: 'SENDGRID_API_KEY not configured'
      };
    }

    // Test with a simple email to verify API key
    const testEmail = {
      to: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || 'test@example.com',
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@linkage.ph',
        name: 'Linkage VA Hub Test'
      },
      subject: 'SendGrid Configuration Test',
      text: 'This is a test email to verify SendGrid configuration.',
      html: '<p>This is a test email to verify SendGrid configuration.</p>',
      mailSettings: {
        sandboxMode: { enable: true } // Sandbox mode for testing
      }
    };

    const result = await sgMail.send(testEmail);
    
    return {
      success: true,
      message: 'SendGrid configuration is valid',
      messageId: result[0]?.headers?.['x-message-id']
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: error.response?.body || error
    };
  }
};

module.exports = {
  initializeSendGrid,
  sendSendGridEmail,
  sendBulkSendGridEmails,
  testSendGridConfig,
  sendGridTemplates
};