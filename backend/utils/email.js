const nodemailer = require('nodemailer');
const { sendSendGridEmail, initializeSendGrid } = require('./sendgrid');
const { getSenderForTemplate, detectRecipientType } = require('../config/emailDomains');

// Initialize SendGrid on startup
const isUsingSendGrid = initializeSendGrid();

// Create reusable transporter for SMTP fallback
const createTransporter = (senderConfig = null) => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST,
    port: process.env.EMAIL_PORT || process.env.SMTP_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true' || process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || process.env.SMTP_USER,
      pass: process.env.EMAIL_PASS || process.env.SMTP_PASSWORD
    }
  });
};

// Email templates with domain-aware branding
const getEmailTemplates = (senderConfig) => {
  const brandName = senderConfig.name;
  const isVADomain = senderConfig.domain === 'linkagevahub.com';
  const isBusinessDomain = senderConfig.domain === 'esystemsmanagment.com';
  
  return {
    welcome: (data) => ({
      subject: `Welcome to ${brandName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Welcome to ${brandName}!</h2>
          <p>Thank you for joining our platform ${isVADomain ? 'for Filipino virtual assistants' : 'for business management solutions'}.</p>
          <p>Please confirm your email by clicking the link below:</p>
          <a href="${data.confirmUrl}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Confirm Email</a>
          <p style="margin-top: 20px;">If you have any questions, feel free to contact us.</p>
          <p>Best regards,<br><strong>${brandName} Team</strong></p>
        </div>
      `
    }),
    'reset-password': (data) => ({
      subject: `Password Reset Request - ${brandName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Password Reset Request</h2>
          <p>You requested a password reset for your ${brandName} account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${data.resetUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Reset Password</a>
          <p style="color: #ef4444; font-weight: bold;">This link will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br><strong>${brandName} Team</strong></p>
        </div>
      `
    }),
    'new-message': (data) => ({
      subject: `New message from ${data.senderName} - ${brandName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">You have a new message!</h2>
          <p><strong>${data.senderName}</strong> sent you a message on ${brandName}:</p>
          <div style="border-left: 4px solid #059669; padding-left: 16px; margin: 20px 0; background-color: #f0fdf4; padding: 16px; border-radius: 4px;">
            <p style="margin: 0; font-style: italic;">"${data.messagePreview}"</p>
          </div>
          <a href="${data.conversationUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Conversation</a>
          <p style="margin-top: 20px;">Best regards,<br><strong>${brandName} Team</strong></p>
        </div>
      `
    }),
    'admin-invitation': (data) => ({
      subject: `Admin Invitation - ${brandName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">You've been invited to become an admin!</h2>
          <p>Hello,</p>
          <p><strong>${data.inviterName}</strong> has invited you to become an administrator for ${brandName}.</p>
          ${data.message ? `<div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; margin: 16px 0;"><p style="margin: 0;"><strong>Personal Message:</strong></p><p style="margin: 8px 0 0 0; font-style: italic;">"${data.message}"</p></div>` : ''}
          <p>Click the link below to accept this invitation and create your admin account:</p>
          <a href="${data.inviteUrl}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Accept Admin Invitation</a>
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;"><strong>⚠️ Important:</strong> This invitation will expire on ${data.expiresAt}.</p>
          </div>
          <p>If you don't want to accept this invitation, you can safely ignore this email.</p>
          <p>Best regards,<br><strong>${brandName} Team</strong></p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="font-size: 12px; color: #6b7280;">This is an automated email from ${brandName}. Please do not reply to this email.</p>
        </div>
      `
    }),
    'va-welcome': (data) => ({
      subject: `Welcome to Linkage VA Hub - Start Your Journey!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Welcome to Linkage VA Hub!</h2>
          <p>Hi ${data.name || 'there'},</p>
          <p>Welcome to the premier platform connecting Filipino virtual assistants with businesses worldwide!</p>
          <p>Your VA profile has been created successfully. Here's what you can do next:</p>
          <ul style="margin: 20px 0;">
            <li>Complete your profile with skills and experience</li>
            <li>Upload a professional photo</li>
            <li>Set your availability and rates</li>
            <li>Start connecting with businesses</li>
          </ul>
          <a href="${data.profileUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Complete Your Profile</a>
          <p style="margin-top: 20px;">Best regards,<br><strong>Linkage VA Hub Team</strong></p>
        </div>
      `
    }),
    'business-welcome': (data) => ({
      subject: `Welcome to E-Systems Management - Your Business Solutions Partner`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Welcome to E-Systems Management!</h2>
          <p>Hi ${data.name || 'there'},</p>
          <p>Welcome to E-Systems Management, your comprehensive business solutions platform!</p>
          <p>Your business account has been created successfully. Here's what you can do now:</p>
          <ul style="margin: 20px 0;">
            <li>Complete your company profile</li>
            <li>Browse qualified virtual assistants</li>
            <li>Post job requirements</li>
            <li>Manage your team and projects</li>
          </ul>
          <a href="${data.dashboardUrl}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Access Your Dashboard</a>
          <p style="margin-top: 20px;">Best regards,<br><strong>E-Systems Management Team</strong></p>
        </div>
      `
    }),
    'admin-password-reset': (data) => ({
      subject: `Password Reset Initiated by Administrator - ${brandName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Password Reset Initiated by Administrator</h2>
          <p>Hello,</p>
          <p>An administrator (${data.adminName}) has initiated a password reset for your ${brandName} account.</p>
          ${data.reason ? `<div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; margin: 16px 0;"><p style="margin: 0;"><strong>Reason:</strong></p><p style="margin: 8px 0 0 0; font-style: italic;">"${data.reason}"</p></div>` : ''}
          <p>Click the link below to set your new password:</p>
          <a href="${data.resetUrl}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Set New Password</a>
          <div style="background-color: #fef2f2; border: 1px solid #ef4444; padding: 12px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #dc2626;"><strong>⚠️ Important:</strong> This link will expire in ${data.expiresIn || '30 minutes'}.</p>
          </div>
          <p>If you have any questions about this password reset, please contact support immediately.</p>
          <p>Best regards,<br><strong>${brandName} Team</strong></p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="font-size: 12px; color: #6b7280;">This password reset was initiated by an administrator. If you believe this was done in error, please contact support immediately.</p>
        </div>
      `
    }),
    'system-notification': (data) => ({
      subject: data.subject || `System Notification - ${brandName}`,
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
          <p style="margin-top: 20px;">Best regards,<br><strong>${brandName} Team</strong></p>
        </div>
      `
    })
  };
};

// Enhanced send email function with domain-based sending
exports.sendEmail = async (options) => {
  try {
    // Enhance options with recipient type detection if not provided
    if (!options.recipientType && !options.userData) {
      // Try to detect recipient type from template
      if (options.template === 'admin-invitation') {
        options.recipientType = 'admin';
      } else if (options.template === 'va-welcome' || options.template?.includes('va')) {
        options.recipientType = 'va';
      } else if (options.template === 'business-welcome' || options.template?.includes('business')) {
        options.recipientType = 'business';
      }
    }

    // Get appropriate sender configuration
    const senderConfig = getSenderForTemplate(
      options.template, 
      options.email, 
      options.userData
    );

    console.log(`Email: Using sender ${senderConfig.email} (${senderConfig.domain}) for template ${options.template} to ${options.email}`);

    // Try SendGrid first if configured
    if (isUsingSendGrid && process.env.SENDGRID_API_KEY) {
      try {
        return await sendSendGridEmail({
          ...options,
          senderConfig
        });
      } catch (error) {
        console.error('SendGrid failed, falling back to SMTP:', error.message);
        // Fall through to SMTP fallback
      }
    }

    // Fallback to SMTP with domain-based sender
    console.log('Sending email via SMTP with domain-based sender:', options.email);
    const transporter = createTransporter(senderConfig);

    // Get domain-aware email templates
    const templates = getEmailTemplates(senderConfig);
    
    // Get template
    const template = templates[options.template] || (() => ({
      subject: options.subject,
      html: options.html || options.text
    }));

    const emailContent = template(options.data || {});

    const mailOptions = {
      from: `${senderConfig.name} <${senderConfig.email}>`,
      to: options.email,
      subject: options.subject || emailContent.subject,
      html: emailContent.html,
      text: options.text || emailContent.text
    };

    // Add reply-to if specified
    if (options.replyTo) {
      mailOptions.replyTo = options.replyTo;
    } else if (!senderConfig.email.includes('noreply')) {
      // For non-noreply addresses, set reply-to to support
      mailOptions.replyTo = senderConfig.email.replace('hello@', 'support@');
    }

    const info = await transporter.sendMail(mailOptions);
    
    console.log('SMTP email sent successfully:', {
      to: options.email,
      from: senderConfig.email,
      template: options.template,
      domain: senderConfig.domain,
      messageId: info.messageId
    });

    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

// Enhanced bulk email sending with domain-based senders
exports.sendBulkEmails = async (recipients, options) => {
  const results = [];
  
  for (const recipient of recipients) {
    try {
      // Enhance each recipient with user data if available
      const emailOptions = {
        ...options,
        email: recipient.email,
        userData: recipient.userData,
        recipientType: recipient.recipientType,
        data: { ...options.data, ...recipient.data }
      };

      const result = await exports.sendEmail(emailOptions);
      results.push({ 
        email: recipient.email, 
        success: true, 
        info: result,
        sender: getSenderForTemplate(options.template, recipient.email, recipient.userData).email
      });
    } catch (error) {
      results.push({ 
        email: recipient.email, 
        success: false, 
        error: error.message 
      });
    }
  }
  
  return results;
};

// Send email to VA (convenience function)
exports.sendEmailToVA = async (email, template, data, userData = null) => {
  return exports.sendEmail({
    email,
    template,
    data,
    userData: userData || { role: 'va' },
    recipientType: 'va'
  });
};

// Send email to Business (convenience function)
exports.sendEmailToBusiness = async (email, template, data, userData = null) => {
  return exports.sendEmail({
    email,
    template,
    data,
    userData: userData || { role: 'business' },
    recipientType: 'business'
  });
};

// Send email to Admin (convenience function)
exports.sendEmailToAdmin = async (email, template, data, userData = null) => {
  return exports.sendEmail({
    email,
    template,
    data,
    userData: userData || { admin: true },
    recipientType: 'admin'
  });
};

// Test email configuration for all domains
exports.testEmailConfiguration = async () => {
  const { validateSenderDomains } = require('../config/emailDomains');
  const senderConfig = validateSenderDomains();
  
  const testResults = {
    sendgridConfigured: !!process.env.SENDGRID_API_KEY,
    smtpConfigured: !!(process.env.EMAIL_HOST || process.env.SMTP_HOST),
    requiredDomains: senderConfig.domains,
    configuredSenders: senderConfig.senders,
    tests: []
  };

  // Test each sender configuration
  for (const sender of senderConfig.senders) {
    try {
      console.log(`Testing email configuration for ${sender.email}...`);
      
      // Create a test email
      const testOptions = {
        email: 'test@example.com',
        template: 'system-notification',
        userData: sender.domain === 'linkagevahub.com' ? { role: 'va' } : 
                  sender.domain === 'esystemsmanagment.com' ? { role: 'business' } : 
                  { admin: true },
        data: {
          title: 'Email Configuration Test',
          content: `This is a test email from ${sender.email} to verify domain-based sending configuration.`
        }
      };

      // Test sender selection (without actually sending)
      const selectedSender = getSenderForTemplate(
        testOptions.template, 
        testOptions.email, 
        testOptions.userData
      );

      testResults.tests.push({
        domain: sender.domain,
        email: sender.email,
        name: sender.name,
        configurationValid: selectedSender.email === sender.email,
        selectedSender: selectedSender.email
      });

    } catch (error) {
      testResults.tests.push({
        domain: sender.domain,
        email: sender.email,
        error: error.message
      });
    }
  }

  return testResults;
};
