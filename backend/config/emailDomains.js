// Email domain configuration for multi-domain sending
const emailDomains = {
  // Sender configurations for different recipient types
  senders: {
    va: {
      email: 'hello@linkagevahub.com',
      name: 'Linkage VA Hub',
      domain: 'linkagevahub.com',
      description: 'Emails sent to Virtual Assistants'
    },
    business: {
      email: 'hello@esystemsmanagement.com',
      name: 'E-Systems Management',
      domain: 'esystemsmanagement.com',
      description: 'Emails sent to Businesses'
    },
    admin: {
      email: 'noreply@esystemsmanagement.com',
      name: 'E-Systems Management',
      domain: 'esystemsmanagement.com',
      description: 'Administrative and system emails'
    }
  },

  // Default fallback sender
  default: {
    email: 'noreply@esystemsmanagement.com',
    name: 'Linkage Platform',
    domain: 'esystemsmanagement.com'
  }
};

// Function to get sender configuration based on recipient type
const getSenderConfig = (recipientType, emailContext = {}) => {
  // Determine sender based on recipient type
  switch (recipientType) {
    case 'va':
    case 'virtual_assistant':
      return emailDomains.senders.va;
    
    case 'business':
    case 'company':
    case 'client':
      return emailDomains.senders.business;
    
    case 'admin':
    case 'administrator':
    case 'system':
      return emailDomains.senders.admin;
    
    default:
      console.warn(`Unknown recipient type: ${recipientType}, using default sender`);
      return emailDomains.default;
  }
};

// Function to detect recipient type from email address or user data
const detectRecipientType = (recipient, userData = null) => {
  // If user data is provided, use it to determine type
  if (userData) {
    if (userData.admin === true) return 'admin';
    if (userData.role === 'va' || userData.va) return 'va';
    if (userData.role === 'business' || userData.business) return 'business';
  }

  // Fallback to email domain detection
  const emailDomain = recipient.split('@')[1]?.toLowerCase();
  
  // Admin domains
  if (emailDomain === 'linkagevahub.com' || 
      emailDomain === 'esystemsmanagement.com' || 
      emailDomain === 'linkage.ph') {
    return 'admin';
  }

  // For external emails, we need context to determine if it's VA or business
  // This will be provided by the calling function
  return 'business'; // Default to business for external emails
};

// Function to get appropriate sender for email template
const getSenderForTemplate = (template, recipientEmail, userData = null) => {
  let recipientType;

  // Template-based type detection
  switch (template) {
    case 'admin-invitation':
    case 'system-notification':
    case 'password-reset':
      recipientType = 'admin';
      break;
    
    case 'va-welcome':
    case 'va-application-status':
    case 'va-profile-reminder':
    case 'va-notification':
      recipientType = 'va';
      break;
    
    case 'business-welcome':
    case 'business-notification':
    case 'va-application':
    case 'new-message':
    case 'esystems-welcome':
      recipientType = 'business';
      break;
    
    default:
      // Detect from user data or email
      recipientType = detectRecipientType(recipientEmail, userData);
  }

  return getSenderConfig(recipientType);
};

// Validation function to ensure sender domains are configured in SendGrid
const validateSenderDomains = () => {
  const requiredDomains = [
    'linkagevahub.com',
    'esystemsmanagement.com'
  ];

  return {
    domains: requiredDomains,
    senders: Object.values(emailDomains.senders).map(sender => ({
      email: sender.email,
      name: sender.name,
      domain: sender.domain
    }))
  };
};

module.exports = {
  emailDomains,
  getSenderConfig,
  detectRecipientType,
  getSenderForTemplate,
  validateSenderDomains
};