// Default configuration values exported for use by other modules
const defaultConfigs = [
  // General Settings
  {
    key: 'site_name',
    value: 'Linkage VA Hub',
    valueType: 'text',
    category: 'general',
    description: 'The name of your platform',
    isPublic: true,
    isEditable: true
  },
  {
    key: 'site_url',
    value: process.env.FRONTEND_URL || 'http://localhost:3000',
    valueType: 'url',
    category: 'general',
    description: 'The main URL of your platform',
    isPublic: true,
    isEditable: true
  },
  {
    key: 'admin_email',
    value: process.env.ADMIN_EMAIL || 'admin@linkage.com',
    valueType: 'email',
    category: 'general',
    description: 'Primary administrator email address',
    isPublic: false,
    isEditable: true
  },
  {
    key: 'support_email',
    value: process.env.SUPPORT_EMAIL || 'support@linkage.com',
    valueType: 'email',
    category: 'general',
    description: 'Support team email address',
    isPublic: true,
    isEditable: true
  },
  {
    key: 'timezone',
    value: 'America/New_York',
    valueType: 'text',
    category: 'general',
    description: 'Default timezone for the platform',
    isPublic: false,
    isEditable: true
  },
  {
    key: 'maintenance_mode',
    value: false,
    valueType: 'boolean',
    category: 'general',
    description: 'Enable maintenance mode for the platform',
    isPublic: true,
    isEditable: true
  },
  {
    key: 'maintenance_message',
    value: 'We are currently performing scheduled maintenance. Please check back soon.',
    valueType: 'textarea',
    category: 'general',
    description: 'Message to display during maintenance mode',
    isPublic: true,
    isEditable: true
  },

  // Email Configuration
  {
    key: 'smtp_host',
    value: process.env.SMTP_HOST || 'smtp.gmail.com',
    valueType: 'text',
    category: 'email',
    description: 'SMTP server hostname',
    isPublic: false,
    isEditable: true
  },
  {
    key: 'smtp_port',
    value: parseInt(process.env.SMTP_PORT) || 587,
    valueType: 'number',
    category: 'email',
    description: 'SMTP server port',
    isPublic: false,
    isEditable: true
  },
  {
    key: 'smtp_user',
    value: process.env.SMTP_USER || '',
    valueType: 'text',
    category: 'email',
    description: 'SMTP authentication username',
    isPublic: false,
    isEditable: true
  },
  {
    key: 'smtp_secure',
    value: process.env.SMTP_SECURE === 'true' || false,
    valueType: 'boolean',
    category: 'email',
    description: 'Use TLS/SSL for SMTP connection',
    isPublic: false,
    isEditable: true
  },
  {
    key: 'email_from',
    value: process.env.EMAIL_FROM || 'noreply@linkage.com',
    valueType: 'email',
    category: 'email',
    description: 'Default "from" email address',
    isPublic: false,
    isEditable: true
  },
  {
    key: 'email_from_name',
    value: 'Linkage VA Hub',
    valueType: 'text',
    category: 'email',
    description: 'Default "from" name for emails',
    isPublic: false,
    isEditable: true
  },

  // Security Settings
  {
    key: 'password_min_length',
    value: 8,
    valueType: 'number',
    category: 'security',
    description: 'Minimum password length required',
    isPublic: false,
    isEditable: true
  },
  {
    key: 'session_timeout',
    value: 86400000, // 24 hours in milliseconds
    valueType: 'number',
    category: 'security',
    description: 'Session timeout duration in milliseconds',
    isPublic: false,
    isEditable: true
  },
  {
    key: 'max_login_attempts',
    value: 5,
    valueType: 'number',
    category: 'security',
    description: 'Maximum failed login attempts before account lock',
    isPublic: false,
    isEditable: true
  },
  {
    key: 'account_lock_duration',
    value: 1800000, // 30 minutes in milliseconds
    valueType: 'number',
    category: 'security',
    description: 'Account lock duration in milliseconds',
    isPublic: false,
    isEditable: true
  },
  {
    key: 'enable_2fa',
    value: false,
    valueType: 'boolean',
    category: 'security',
    description: 'Enable two-factor authentication',
    isPublic: false,
    isEditable: true
  },
  {
    key: 'require_email_verification',
    value: true,
    valueType: 'boolean',
    category: 'security',
    description: 'Require email verification for new accounts',
    isPublic: false,
    isEditable: true
  },

  // Feature Toggles
  {
    key: 'registration_enabled',
    value: true,
    valueType: 'boolean',
    category: 'features',
    description: 'Enable new user registration',
    isPublic: true,
    isEditable: true
  },
  {
    key: 'va_registration_enabled',
    value: true,
    valueType: 'boolean',
    category: 'features',
    description: 'Enable VA registration',
    isPublic: true,
    isEditable: true
  },
  {
    key: 'business_registration_enabled',
    value: true,
    valueType: 'boolean',
    category: 'features',
    description: 'Enable business registration',
    isPublic: true,
    isEditable: true
  },
  {
    key: 'va_approval_required',
    value: false,
    valueType: 'boolean',
    category: 'features',
    description: 'Require admin approval for new VA profiles',
    isPublic: false,
    isEditable: true
  },
  {
    key: 'business_approval_required',
    value: false,
    valueType: 'boolean',
    category: 'features',
    description: 'Require admin approval for new business profiles',
    isPublic: false,
    isEditable: true
  },
  {
    key: 'messaging_enabled',
    value: true,
    valueType: 'boolean',
    category: 'features',
    description: 'Enable messaging between users',
    isPublic: true,
    isEditable: true
  },
  {
    key: 'video_calls_enabled',
    value: true,
    valueType: 'boolean',
    category: 'features',
    description: 'Enable video call functionality',
    isPublic: true,
    isEditable: true
  },
  {
    key: 'file_sharing_enabled',
    value: true,
    valueType: 'boolean',
    category: 'features',
    description: 'Enable file sharing in messages',
    isPublic: true,
    isEditable: true
  },
  {
    key: 'courses_enabled',
    value: true,
    valueType: 'boolean',
    category: 'features',
    description: 'Enable courses and training module',
    isPublic: true,
    isEditable: true
  },
  {
    key: 'announcements_enabled',
    value: true,
    valueType: 'boolean',
    category: 'features',
    description: 'Enable announcements feature',
    isPublic: true,
    isEditable: true
  },

  // System Limits
  {
    key: 'max_vas_per_page',
    value: 20,
    valueType: 'number',
    category: 'limits',
    description: 'Maximum number of VAs to display per page',
    isPublic: false,
    isEditable: true
  },
  {
    key: 'max_businesses_per_page',
    value: 20,
    valueType: 'number',
    category: 'limits',
    description: 'Maximum number of businesses to display per page',
    isPublic: false,
    isEditable: true
  },
  {
    key: 'max_file_size',
    value: 10485760, // 10MB in bytes
    valueType: 'number',
    category: 'limits',
    description: 'Maximum file upload size in bytes',
    isPublic: true,
    isEditable: true
  },
  {
    key: 'max_profile_images',
    value: 5,
    valueType: 'number',
    category: 'limits',
    description: 'Maximum number of profile images allowed',
    isPublic: true,
    isEditable: true
  },
  {
    key: 'max_portfolio_items',
    value: 10,
    valueType: 'number',
    category: 'limits',
    description: 'Maximum number of portfolio items per VA',
    isPublic: true,
    isEditable: true
  },
  {
    key: 'rate_limit_window',
    value: 900000, // 15 minutes in milliseconds
    valueType: 'number',
    category: 'limits',
    description: 'Rate limiting window in milliseconds',
    isPublic: false,
    isEditable: true
  },
  {
    key: 'rate_limit_max_requests',
    value: 100,
    valueType: 'number',
    category: 'limits',
    description: 'Maximum requests per rate limit window',
    isPublic: false,
    isEditable: true
  },
  {
    key: 'max_message_length',
    value: 5000,
    valueType: 'number',
    category: 'limits',
    description: 'Maximum character length for messages',
    isPublic: true,
    isEditable: true
  },
  {
    key: 'max_bio_length',
    value: 2000,
    valueType: 'number',
    category: 'limits',
    description: 'Maximum character length for user bios',
    isPublic: true,
    isEditable: true
  },
  {
    key: 'invitation_expiry_days',
    value: 7,
    valueType: 'number',
    category: 'limits',
    description: 'Number of days before invitations expire',
    isPublic: false,
    isEditable: true
  }
];

module.exports = defaultConfigs;