# Email Integration Rollout Plan (SendGrid Multi‑domain)

Scope
- Brands/senders:
  - VA: hello@linkagevahub.com (linkagevahub.com)
  - Business: hello@esystemsmanagement.com (esystemsmanagement.com)
  - Admin: noreply@admin.linkagevahub.com (admin.linkagevahub.com)
- Code artifacts implemented:
  - Config validation: [emailConfig.js](../../backend/config/emailConfig.js)
  - Sender mapping: [emailDomains.js](../../backend/config/emailDomains.js)
  - SendGrid utility: [sendgrid.js](../../backend/utils/sendgrid.js)
  - Composition and routing: [email.js](../../backend/utils/email.js)
  - Non‑prod health endpoint: [internalEmailHealth.js](../../backend/routes/internalEmailHealth.js)
  - Stripe notification templates: [stripeWebhookController.js](../../backend/controllers/stripeWebhookController.js)
  - Admin invitations: [adminInvitations.js](../../backend/routes/adminInvitations.js)
  - Auth flows (welcome/reset): [auth.js](../../backend/routes/auth.js)
  - New message template usage:
    - [messagesController.js](../../backend/controllers/messagesController.js)
    - [messages.js](../../backend/routes/messages.js)

Pre‑flight checklist (before staging sends)
- DNS
  - Complete domain authentication (SPF/DKIM) and DMARC on all domains.
  - Guide: [email-dns-setup.md](./email-dns-setup.md)
- Environment
  - For each Render backend service:
    - linkage-va-hub-api: SENDGRID_API_KEY, EMAIL_FROM=hello@linkagevahub.com
    - esystems-backend: SENDGRID_API_KEY, EMAIL_FROM=hello@esystemsmanagement.com
    - admin-backend: SENDGRID_API_KEY, EMAIL_FROM=noreply@admin.linkagevahub.com
  - In non‑prod, verify config via:
    - GET /api/internal/email/health (non‑prod only)
      - Returns config validation, sandbox status, and example sender/category selections
    - GET /api/email-test/config
    - POST /api/email-test/send {"testEmail":"you@example.com","skipActualSend":true}

Staging smoke tests (live send)
- Precondition: Staging SENDGRID_SANDBOX=false (deliverable), real SENDGRID_API_KEY present.
- Use admin‑protected route to exercise all templates:
  - POST /api/email-test/send
    - Body examples:
      - {"testEmail":"you@yourdomain.com","skipActualSend":false}
- Expectation for each brand/template:
  - HTTP 202 from SendGrid
  - From header matches sender:
    - VA → hello@linkagevahub.com
    - Business → hello@esystemsmanagement.com
    - Admin → noreply@admin.linkagevahub.com
  - Categories contain: [brand-domain, template, recipientType]
    - Example: ["linkagevahub.com","new-message","va"]
- Optional functional triggers (staging):
  - Welcome: POST /api/auth/register then confirm welcome (template "welcome")
  - Reset password: POST /api/auth/forgot-password (template "reset-password")
  - New message: POST /api/messages (template "new-message")
    - See [messages.js](../../backend/routes/messages.js) and [messagesController.js](../../backend/controllers/messagesController.js)
  - Admin invitation: POST /api/admin/invitations (template "admin-invitation")
    - See [adminInvitations.js](../../backend/routes/adminInvitations.js)
  - Billing notifications (system-notification): trigger Stripe webhook path
    - See [stripeWebhookController.js](../../backend/controllers/stripeWebhookController.js)

Production cutover
- Preconditions:
  - [emailConfig.ensureEmailProdConfig()](../../backend/config/emailConfig.js) succeeds at boot (server fails fast otherwise)
  - DNS verified (SendGrid “Authenticated” for all domains)
  - Staging smoke tests pass for all templates and brands
- Steps:
  1) Deploy services with SENDGRID_SANDBOX=false, correct EMAIL_FROM per service
  2) Validate startup logs show “[SendGrid] Initialized successfully.” and no email config errors
  3) Run a minimal production smoke:
     - Admin: Send an admin invitation to a controlled test inbox
     - Business: Trigger a password reset
     - VA: Send a new message in a controlled conversation
  4) Confirm SendGrid Activity: categories present, no policy errors, deliverability OK

Monitoring and Observability
- Logs
  - SendGrid send log with status and messageId in [sendgrid.sendSendGridEmail()](../../backend/utils/sendgrid.js:line)
  - SMTP fallback logs in [email.js](../../backend/utils/email.js:line)
- Health
  - Production basic health:
    - GET /health and GET /api/health
  - Non‑prod detailed email health:
    - GET /api/internal/email/health
- Metrics
  - Use SendGrid dashboards (blocks, bounces, spam reports)
  - Adjust DMARC from p=none to p=quarantine/reject after sustained pass

Rollback plan
- Set SENDGRID_SANDBOX=true (non‑prod only) to stop delivery rapidly
- Toggle feature flags to pause email triggers if available
- Revert deployment to previous version or switch EMAIL_FROM to a fallback domain identity

Negative test cases (expected safeguards)
- Missing SENDGRID_API_KEY in production:
  - Boot will fail via ensureEmailProdConfig()
- EMAIL_FROM domain mismatch in production:
  - Boot will fail with allowed-domain and sender identity checks
- SendGrid failure at send time:
  - Code falls back to SMTP (if configured) in [email.js](../../backend/utils/email.js:line)

Appendix: Keys to verify in Render
- SENDGRID_API_KEY (secret)
- EMAIL_FROM (exact sender email)
- SENDGRID_SANDBOX (true/false; true only in non‑prod)