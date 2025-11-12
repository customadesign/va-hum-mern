# SendGrid Multi-Domain Setup Guide

This guide explains how to configure SendGrid for domain-based email sending in the Linkage VA Hub system.

## 📧 Email Domain Strategy

Your system is configured to use different sender addresses based on recipient type:

| Recipient Type | Sender Address | Domain | Usage |
|---|---|---|---|
| **VAs** | `hello@linkagevahub.com` | linkagevahub.com | All emails sent to Virtual Assistants |
| **Businesses** | `hello@esystemsmanagment.com` | esystemsmanagment.com | All emails sent to Business users |
| **Admins/System** | `noreply@esystemsmanagement.com` | esystemsmanagement.com | Admin invitations, system notifications |

## 🛠️ SendGrid Configuration Required

### Step 1: Domain Authentication

You need to authenticate **3 domains** in SendGrid:

1. **linkagevahub.com**
2. **esystemsmanagment.com** 
3. **esystemsmanagement.com**

### Step 2: SendGrid Dashboard Setup

1. **Login to SendGrid Console**
   - Go to https://app.sendgrid.com/
   - Navigate to Settings → Sender Authentication

2. **Authenticate Each Domain**
   
   For **linkagevahub.com**:
   ```
   Domain: linkagevahub.com
   Sender Email: hello@linkagevahub.com
   Sender Name: Linkage VA Hub
   ```

   For **esystemsmanagment.com**:
   ```
   Domain: esystemsmanagment.com  
   Sender Email: hello@esystemsmanagment.com
   Sender Name: E-Systems Management
   ```

   For **esystemsmanagement.com**:
   ```
   Domain: esystemsmanagement.com
   Sender Email: noreply@esystemsmanagement.com
   Sender Name: E-Systems Management
   ```

### Step 3: DNS Records Setup

SendGrid will provide DNS records for each domain. You'll need to add these to your domain DNS settings:

**For each domain, add these record types:**
- **CNAME Records** (for email routing)
- **DKIM Records** (for authentication) 
- **SPF Record** (if not already present)

**Example DNS Records** (SendGrid will provide exact values):
```dns
Type: CNAME
Host: em1234.linkagevahub.com
Value: u12345678.wl123.sendgrid.net

Type: CNAME  
Host: s1._domainkey.linkagevahub.com
Value: s1.domainkey.u12345678.wl123.sendgrid.net

Type: CNAME
Host: s2._domainkey.linkagevahub.com  
Value: s2.domainkey.u12345678.wl123.sendgrid.net
```

### Step 4: Environment Variables

Add these to your `.env` file:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here

# Domain-specific sender addresses (configured automatically)
# VAs: hello@linkagevahub.com
# Businesses: hello@esystemsmanagment.com  
# Admins: noreply@esystemsmanagement.com

# Legacy SMTP fallback (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your_backup_smtp@gmail.com
SMTP_PASSWORD=your_smtp_password
```

## 🧪 Testing Configuration

### Automatic Testing

The system includes built-in email testing endpoints:

1. **Test Configuration**:
   ```bash
   GET /api/email-test/config
   ```

2. **Test Domain Selection**:
   ```bash
   POST /api/email-test/send
   {
     "testEmail": "your-test@email.com",
     "skipActualSend": true
   }
   ```

3. **Get Domain Setup Info**:
   ```bash
   GET /api/email-test/domains
   ```

### Manual Testing

You can test the email sender selection logic:

```javascript
// Test from backend console or route
const { testEmailConfiguration } = require('./utils/email');

const results = await testEmailConfiguration();
console.log('Email config test results:', results);
```

## 📋 Deployment Checklist

### Before Going Live:

- [ ] All 3 domains authenticated in SendGrid
- [ ] DNS records added and verified (green checkmarks in SendGrid)
- [ ] SendGrid API key added to production environment
- [ ] Sender addresses verified in SendGrid
- [ ] Test emails sent successfully
- [ ] Email deliverability tested (check spam folders)

### SendGrid Best Practices:

1. **Domain Reputation**: Start with low volume and gradually increase
2. **Email Content**: Avoid spam trigger words
3. **List Hygiene**: Remove bounced/invalid emails
4. **Monitoring**: Set up SendGrid webhooks for delivery tracking
5. **Authentication**: Ensure all DNS records are properly configured

## 🔧 Troubleshooting

### Verification Emails Not Arriving

If verification emails worked previously but suddenly stopped:

#### Step 1: Check SendGrid Suppression Lists

**Problem**: Your email may be on SendGrid's suppression list, causing emails to be silently blocked.

**Solution**:
1. Go to https://app.sendgrid.com/suppressions
2. Check these tabs for your email:
   - **Bounces** - Hard bounces from invalid addresses
   - **Blocks** - Blocked by recipient server  
   - **Spam Reports** - Marked as spam
   - **Invalid Emails** - Rejected addresses
3. If found, click "Delete" to remove from suppression list
4. Try resending the verification email

**API Check** (Admin only):
```bash
GET /api/email-test/suppressions/inspect?email=your@email.com
```

**Remove from Suppression** (Admin only):
```bash
POST /api/email-test/suppressions/clear
{ "email": "your@email.com" }
```

#### Step 2: Check SendGrid Activity Feed

1. Go to https://app.sendgrid.com/email_activity
2. Filter by your email address
3. Look for recent delivery attempts
4. Check status codes:
   - `delivered` = Success
   - `bounce` = Hard bounce (invalid email)
   - `blocked` = Recipient server blocked
   - `dropped` = SendGrid suppression list

#### Step 3: Check Backend Logs

1. Go to https://dashboard.render.com/web/srv-d25arrripnbc73dpeqs0/logs
2. Click "Resend" button on the frontend
3. Look for these messages:
   ```
   🔄 === RESEND VERIFICATION DEBUG START ===
   📤 Attempting to send email...
   ✅ verification email sent successfully
   ```
4. If errors appear, note the error code:
   - `402` - SendGrid account issue
   - `403` - Permission/authentication error
   - `413` - Message too large
   - `429` - Rate limit exceeded
   - `451` - Suppressed address

#### Step 4: Test with Different Email

Try registering with a different email provider to isolate the issue:
- If Gmail doesn't work, try Outlook/Yahoo
- If Yahoo doesn't work, try Gmail/Outlook
- Avoid temporary email services (they're often blocked)

### Common Issues:

1. **"Authentication Failed"**
   - Verify DNS records are correctly added
   - Check domain authentication status in SendGrid
   - Ensure no typos in sender email addresses

2. **"Domain Not Verified"**
   - DNS propagation can take up to 48 hours
   - Use DNS checker tools to verify records
   - Contact domain registrar if issues persist

3. **Emails Going to Spam**
   - Warm up domains gradually
   - Improve email content and formatting
   - Monitor SendGrid reputation metrics

4. **"Your email address may be blocked"**
   - Email is on SendGrid suppression list
   - Check suppressions using steps above
   - Remove from list or use different email

5. **"Too many requests"**
   - SendGrid rate limiting active
   - Wait 10-15 minutes before retry
   - Consider upgrading SendGrid plan

### Diagnostic Endpoints

**Public Verification Status Check**:
```bash
POST /api/email-test/check-verification-status
{ "email": "your@email.com" }
```
Returns whether email can receive verification emails.

**Admin Suppression Inspect**:
```bash
GET /api/email-test/suppressions/inspect?email=your@email.com
```
Returns detailed suppression list information.

### Support Contacts:

- **SendGrid Support**: https://support.sendgrid.com/
- **DNS Issues**: Contact your domain registrar
- **System Issues**: Check server logs and email test endpoints
- **Suppression Issues**: Use admin endpoints to clear or contact support

## 📊 Monitoring & Analytics

SendGrid provides analytics for:
- Delivery rates
- Open rates  
- Click rates
- Bounce rates
- Spam reports

Monitor these metrics by domain to optimize email performance.

## 🚀 System Benefits

With this multi-domain setup:

✅ **Brand Consistency**: VAs receive emails from Linkage VA Hub domain  
✅ **Business Focus**: Businesses receive emails from E-Systems domain  
✅ **Professional Admin**: System emails from dedicated admin domain  
✅ **Improved Deliverability**: Domain-specific reputation management  
✅ **Scalability**: Easy to add new domains or modify sender logic  
✅ **Fallback Support**: Automatic SMTP fallback if SendGrid unavailable

Your email system is now enterprise-ready with professional domain-based sending!