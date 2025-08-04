const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email
exports.sendEmail = async (options) => {
  const transporter = createTransporter();

  // Email templates
  const templates = {
    welcome: (data) => ({
      subject: 'Welcome to Linkage VA Hub!',
      html: `
        <h2>Welcome to Linkage VA Hub!</h2>
        <p>Thank you for joining our platform connecting talented Filipino virtual assistants with businesses.</p>
        <p>Please confirm your email by clicking the link below:</p>
        <a href="${data.confirmUrl}" style="background-color: #4B5563; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Confirm Email</a>
        <p>If you have any questions, feel free to contact us.</p>
        <p>Best regards,<br>Linkage VA Hub Team</p>
      `
    }),
    'reset-password': (data) => ({
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${data.resetUrl}" style="background-color: #4B5563; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>Linkage VA Hub Team</p>
      `
    }),
    'new-message': (data) => ({
      subject: `New message from ${data.senderName}`,
      html: `
        <h2>You have a new message</h2>
        <p><strong>${data.senderName}</strong> sent you a message:</p>
        <blockquote style="border-left: 3px solid #4B5563; padding-left: 10px; margin-left: 0;">
          ${data.messagePreview}
        </blockquote>
        <a href="${data.conversationUrl}" style="background-color: #4B5563; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Conversation</a>
        <p>Best regards,<br>Linkage VA Hub Team</p>
      `
    })
  };

  // Get template
  const template = templates[options.template] || (() => ({
    subject: options.subject,
    html: options.html || options.text
  }));

  const emailContent = template(options.data || {});

  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME || 'Linkage VA Hub'} <${process.env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject || emailContent.subject,
    html: emailContent.html,
    text: options.text || emailContent.text
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

// Send bulk emails
exports.sendBulkEmails = async (recipients, options) => {
  const results = [];
  
  for (const recipient of recipients) {
    try {
      const result = await exports.sendEmail({
        ...options,
        email: recipient.email,
        data: { ...options.data, ...recipient.data }
      });
      results.push({ email: recipient.email, success: true, info: result });
    } catch (error) {
      results.push({ email: recipient.email, success: false, error: error.message });
    }
  }
  
  return results;
};