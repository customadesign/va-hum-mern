const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Email templates
const templates = {
  welcome: (data) => ({
    subject: 'Welcome to Linkage VA Hub - Please verify your email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Linkage VA Hub!</h2>
        <p>Thank you for joining our platform connecting talented Filipino virtual assistants with businesses.</p>
        <p>Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verifyUrl}" style="background-color: #4B5563; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email Address</a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">${data.verifyUrl}</p>
        <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">If you didn't create an account with Linkage VA Hub, please ignore this email.</p>
      </div>
    `,
    text: `Welcome to Linkage VA Hub!
    
Thank you for joining our platform connecting talented Filipino virtual assistants with businesses.

Please verify your email address by clicking the link below:
${data.verifyUrl}

This link will expire in 24 hours.

If you didn't create an account with Linkage VA Hub, please ignore this email.`
  }),
  
  'email-verification': (data) => ({
    subject: 'Verify your email address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify Your Email Address</h2>
        <p>Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verifyUrl}" style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email</a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">${data.verifyUrl}</p>
        <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">If you didn't request this verification, please ignore this email.</p>
      </div>
    `,
    text: `Verify Your Email Address

Please click the link below to verify your email address:
${data.verifyUrl}

This link will expire in 24 hours.

If you didn't request this verification, please ignore this email.`
  }),
  
  'reset-password': (data) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested a password reset for your Linkage VA Hub account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.resetUrl}" style="background-color: #DC2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">${data.resetUrl}</p>
        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
      </div>
    `,
    text: `Password Reset Request

You requested a password reset for your Linkage VA Hub account.

Click the link below to reset your password:
${data.resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email and your password will remain unchanged.`
  }),
  
  'new-message': (data) => ({
    subject: `New message from ${data.senderName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">You have a new message</h2>
        <p><strong>${data.senderName}</strong> sent you a message:</p>
        <div style="background: #f5f5f5; padding: 15px; border-left: 3px solid #4B5563; margin: 20px 0;">
          ${data.messagePreview}
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.conversationUrl}" style="background-color: #4B5563; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Conversation</a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">You're receiving this email because you have message notifications enabled.</p>
      </div>
    `,
    text: `You have a new message

${data.senderName} sent you a message:

${data.messagePreview}

View conversation: ${data.conversationUrl}

You're receiving this email because you have message notifications enabled.`
  }),
  
  'admin-invitation': (data) => ({
    subject: 'Admin Invitation - Linkage VA Hub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">You've been invited to become an admin!</h2>
        <p>Hello,</p>
        <p><strong>${data.inviterName}</strong> has invited you to become an administrator for Linkage VA Hub.</p>
        ${data.message ? `<p style="background: #f5f5f5; padding: 15px; border-radius: 5px;"><strong>Message:</strong> ${data.message}</p>` : ''}
        <p>Click the button below to accept this invitation:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.acceptUrl}" style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Accept Admin Invitation</a>
        </div>
        <p style="color: #666; font-size: 14px;"><strong>Important:</strong> This invitation will expire on ${new Date(data.expiresAt).toLocaleDateString()} at ${new Date(data.expiresAt).toLocaleTimeString()}.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">If you don't want to accept this invitation, you can safely ignore this email.</p>
      </div>
    `,
    text: `You've been invited to become an admin!

Hello,

${data.inviterName} has invited you to become an administrator for Linkage VA Hub.

${data.message ? `Message: ${data.message}` : ''}

Accept invitation: ${data.acceptUrl}

Important: This invitation will expire on ${new Date(data.expiresAt).toLocaleDateString()} at ${new Date(data.expiresAt).toLocaleTimeString()}.

If you don't want to accept this invitation, you can safely ignore this email.`
  })
};

// Send email using SendGrid
exports.sendEmail = async (options) => {
  try {
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured. Email not sent.');
      
      // In development, log the email details
      if (process.env.NODE_ENV === 'development') {
        console.log('Email details:', {
          to: options.email,
          subject: options.subject,
          template: options.template,
          data: options.data
        });
      }
      
      return { success: false, message: 'Email service not configured' };
    }

    // Get template
    const template = templates[options.template] || (() => ({
      subject: options.subject,
      html: options.html || options.text,
      text: options.text
    }));

    const emailContent = template(options.data || {});

    // Prepare email message
    const msg = {
      to: options.email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@linkagevahub.com',
        name: process.env.SENDGRID_FROM_NAME || process.env.EMAIL_FROM_NAME || 'Linkage VA Hub'
      },
      subject: options.subject || emailContent.subject,
      text: emailContent.text || options.text,
      html: emailContent.html || options.html
    };

    // Add reply-to if specified
    if (options.replyTo) {
      msg.replyTo = options.replyTo;
    }

    // Send email
    const result = await sgMail.send(msg);
    
    console.log('Email sent successfully to:', options.email);
    return { success: true, messageId: result[0].headers['x-message-id'] };
  } catch (error) {
    console.error('SendGrid email error:', error);
    
    // Log more details in development
    if (process.env.NODE_ENV === 'development' && error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    
    throw error;
  }
};

// Send bulk emails
exports.sendBulkEmails = async (recipients, options) => {
  const results = [];
  
  // SendGrid allows up to 1000 recipients per request
  // But we'll send individually for better error handling and personalization
  for (const recipient of recipients) {
    try {
      const result = await exports.sendEmail({
        ...options,
        email: recipient.email,
        data: { ...options.data, ...recipient.data }
      });
      results.push({ email: recipient.email, success: true, ...result });
    } catch (error) {
      results.push({ email: recipient.email, success: false, error: error.message });
    }
  }
  
  return results;
};

// Verify email configuration
exports.verifyEmailConfig = async () => {
  if (!process.env.SENDGRID_API_KEY) {
    return { configured: false, message: 'SendGrid API key not configured' };
  }
  
  try {
    // Try to send a test email to verify configuration
    // This doesn't actually send an email, just validates the API key
    await sgMail.send({
      to: 'test@example.com',
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@linkagevahub.com',
      subject: 'Test',
      text: 'Test',
      mailSettings: {
        sandboxMode: {
          enable: true // This prevents the email from actually being sent
        }
      }
    });
    
    return { configured: true, message: 'SendGrid configured successfully' };
  } catch (error) {
    return { configured: false, message: error.message };
  }
};