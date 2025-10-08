# 🔧 Node.js Application Configuration Fixes & Setup Guide

## 📦 **Package Installation & Updates**

### **1. Install Missing Dependencies**
```bash
cd backend

# Email service
npm install @sendgrid/mail

# AWS SDK v3 (replacing v2)
npm uninstall aws-sdk
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Additional recommended packages
npm install helmet cors compression cookie-parser
npm install winston morgan express-rate-limit
npm install joi express-validator bcryptjs jsonwebtoken
```

### **2. Update Deprecated Dependencies**
```bash
# Update to latest secure versions
npm update supertest superagent multer
npm audit fix --force

# Frontend updates
cd ../admin-frontend
npm update
npm audit fix
```

## 🌐 **Service Configuration Setup**

### **1. SendGrid Email Configuration**

#### **Domain Verification (CRITICAL):**
```bash
# Add these DNS records for domain verification:

# For linkagevahub.com:
TXT    @    v=spf1 include:sendgrid.net ~all
CNAME  s1._domainkey    s1.domainkey.u12345.wl.sendgrid.net
CNAME  s2._domainkey    s2.domainkey.u12345.wl.sendgrid.net

# For esystemsmanagment.com:
TXT    @    v=spf1 include:sendgrid.net ~all
CNAME  s1._domainkey    s1.domainkey.u12345.wl.sendgrid.net
CNAME  s2._domainkey    s2.domainkey.u12345.wl.sendgrid.net
```

#### **Environment Variables:**
```env
SENDGRID_API_KEY=SG.your_actual_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=hello@linkagevahub.com
SENDGRID_FROM_NAME=Linkage VA Hub
```

### **2. Supabase Storage Configuration**

#### **Complete Setup Steps:**
```bash
# 1. Create Supabase project at https://supabase.com
# 2. Enable Storage in dashboard
# 3. Create bucket: linkage-va-hub
# 4. Configure RLS policies
```

#### **Required Environment Variables:**
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_BUCKET=linkage-va-hub
```

#### **RLS Policy Configuration:**
```sql
-- Create policy for authenticated uploads
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'linkage-va-hub');

-- Create policy for public file access
CREATE POLICY "Public file access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'linkage-va-hub');
```

### **3. AWS S3 Alternative Configuration**

#### **IAM Policy for S3 Access:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name/*",
        "arn:aws:s3:::your-bucket-name"
      ]
    }
  ]
}
```

#### **S3 CORS Configuration:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
    "AllowedOrigins": ["http://localhost:4000", "https://yourdomain.com"],
    "ExposeHeaders": []
  }
]
```

### **4. LinkedIn OAuth Deprecation**

#### **Migration Plan:**
```javascript
// 1. Update redirect URIs in LinkedIn app settings
const REDIRECT_URIS = [
  'http://localhost:4000/auth/linkedin/callback',  // Development
  'https://yourdomain.com/auth/linkedin/callback'  // Production
];

// 2. Add deprecation warnings
console.warn('⚠️  LinkedIn OAuth is deprecated and will be removed in v2.0.0');
console.warn('    Please migrate to alternative authentication methods');

// 3. Plan alternative authentication
// Options: Google OAuth, Microsoft OAuth, Magic Links, Email-only auth
```

## 🛠️ **Enhanced Error Handling Implementation**

### **1. Global Error Handler**
```javascript
// File: middleware/globalErrorHandler.js
const globalErrorHandler = (err, req, res, next) => {
  // Log error with context
  console.error('Global Error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Sentry error tracking
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err, {
      tags: {
        endpoint: req.url,
        method: req.method
      },
      user: {
        id: req.user?.id,
        email: req.user?.email
      }
    });
  }

  // Return appropriate error response
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  } else {
    res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }
};

module.exports = globalErrorHandler;
```

### **2. Service-Specific Error Handling**

#### **Email Service Resilience:**
```javascript
const sendEmailWithRetry = async (options, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendEmail(options);
    } catch (error) {
      console.error(`Email attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        // Log final failure
        Sentry.captureException(error, {
          tags: { service: 'email', attempt: 'final' }
        });
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};
```

#### **Database Connection Resilience:**
```javascript
const connectWithRetry = async () => {
  const maxRetries = 5;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      });
      console.log('MongoDB connected successfully');
      return;
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('Failed to connect to MongoDB after maximum retries');
        process.exit(1);
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
    }
  }
};
```

## 🔍 **Performance Optimizations**

### **1. Database Query Optimization**
```javascript
// Add query performance monitoring
mongoose.set('debug', (collectionName, method, query, doc) => {
  const executionTime = Date.now() - query.startTime;
  if (executionTime > 100) { // Log slow queries
    console.warn('Slow Query:', {
      collection: collectionName,
      method,
      duration: executionTime,
      query: JSON.stringify(query)
    });
  }
});
```

### **2. Memory Management**
```javascript
// Monitor memory usage
const monitorMemory = () => {
  const used = process.memoryUsage();
  const memoryUsage = {
    rss: Math.round(used.rss / 1024 / 1024 * 100) / 100,
    heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
    heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
    external: Math.round(used.external / 1024 / 1024 * 100) / 100
  };
  
  if (memoryUsage.heapUsed > 500) { // Alert if heap usage > 500MB
    console.warn('High memory usage detected:', memoryUsage);
  }
  
  return memoryUsage;
};

// Run memory check every 5 minutes
setInterval(monitorMemory, 5 * 60 * 1000);
```

## 🔐 **Enhanced Security Implementation**

### **1. Request Validation Middleware**
```javascript
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }
    next();
  };
};
```

### **2. Security Headers Configuration**
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  crossOriginEmbedderPolicy: false
}));
```

## 📊 **Health Check Implementation**

### **Comprehensive Health Checks:**
```javascript
// File: routes/health.js
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: require('../package.json').version,
    services: {
      database: 'unknown',
      email: 'unknown',
      storage: 'unknown',
      monitoring: 'unknown'
    }
  };

  // Check database
  try {
    await mongoose.connection.db.admin().ping();
    health.services.database = 'healthy';
  } catch (error) {
    health.services.database = 'unhealthy';
    health.status = 'degraded';
  }

  // Check email service
  if (process.env.SENDGRID_API_KEY) {
    health.services.email = 'configured';
  } else {
    health.services.email = 'not_configured';
  }

  // Check storage service
  if (process.env.SUPABASE_URL || process.env.AWS_S3_BUCKET) {
    health.services.storage = 'configured';
  } else {
    health.services.storage = 'not_configured';
  }

  // Check monitoring
  if (process.env.SENTRY_DSN && process.env.NEW_RELIC_LICENSE_KEY) {
    health.services.monitoring = 'configured';
  } else {
    health.services.monitoring = 'partial';
  }

  res.json(health);
});
```

## 🚀 **Production Readiness Commands**

### **Final Setup Commands:**
```bash
#!/bin/bash
# File: scripts/production-setup.sh

echo "🚀 Setting up Linkage VA Hub for production..."

# 1. Environment validation
echo "📋 Validating environment configuration..."
node scripts/validate-env.js

# 2. Database setup
echo "🗄️  Setting up database..."
node scripts/setup-database.js

# 3. Email configuration test
echo "📧 Testing email configuration..."
node scripts/test-email.js

# 4. Storage configuration test
echo "📁 Testing file storage..."
node scripts/test-storage.js

# 5. Security validation
echo "🔐 Validating security configuration..."
node scripts/security-check.js

# 6. Performance baseline
echo "⚡ Establishing performance baseline..."
node scripts/performance-baseline.js

echo "✅ Production setup complete!"
echo "🎯 Ready for deployment!"
```

### **Environment Validation Script:**
```javascript
// File: scripts/validate-env.js
const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET', 
  'JWT_REFRESH_SECRET',
  'ENCRYPTION_KEY',
  'PORT'
];

const recommendedVars = [
  'SENDGRID_API_KEY',
  'SUPABASE_URL',
  'SENTRY_DSN',
  'NEW_RELIC_LICENSE_KEY'
];

console.log('🔍 Validating environment configuration...');

const missing = requiredVars.filter(key => !process.env[key]);
const missingRecommended = recommendedVars.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:', missing);
  process.exit(1);
}

if (missingRecommended.length > 0) {
  console.warn('⚠️  Missing recommended environment variables:', missingRecommended);
}

console.log('✅ Environment validation complete');
```

## 🛡️ **Security Configuration Fixes**

### **1. Enhanced Authentication Security**
```javascript
// File: middleware/enhancedAuth.js
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Progressive delay for repeated failed attempts
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 2, // allow 2 requests per 15 minutes at full speed
  delayMs: 500, // add 500ms delay per request after delayAfter
  maxDelayMs: 20000 // max delay of 20 seconds
});

// Strict rate limiting for authentication
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { speedLimiter, authRateLimit };
```

### **2. Input Sanitization**
```javascript
// File: middleware/sanitization.js
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

const sanitizeInput = (req, res, next) => {
  // Remove any keys that start with '$' or contain '.'
  mongoSanitize({
    replaceWith: '_'
  })(req, res, () => {
    // XSS protection for string fields
    if (req.body) {
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = xss(req.body[key]);
        }
      }
    }
    next();
  });
};

module.exports = sanitizeInput;
```

## 📝 **Configuration Issue Summary**

### **✅ RESOLVED:**
1. **SendGrid Package**: Installed `@sendgrid/mail`
2. **MongoDB Indexes**: Fixed all duplicate index warnings
3. **AWS SDK**: Upgraded to v3, eliminated maintenance warnings
4. **Rate Limiting**: Fixed X-Forwarded-For header handling
5. **Email Templates**: Added admin-password-reset template

### **🔧 CONFIGURED:**
1. **Environment Template**: Complete `.env.complete.template` created
2. **Security Guide**: Comprehensive security recommendations
3. **Deployment Guide**: Step-by-step deployment checklist
4. **Monitoring Setup**: New Relic and Sentry configuration

### **⚠️ REQUIRES MANUAL SETUP:**
1. **SendGrid Domain Verification**: Add DNS records for email domains
2. **Supabase Service Role**: Obtain and configure service role key
3. **New Relic License**: Create account and get license key
4. **Sentry DSN**: Create project and get DSN
5. **AWS/S3 Credentials**: Set up IAM user and bucket (if using S3)

### **📋 PRODUCTION READINESS STATUS:**

#### **Security: 🟢 READY**
- JWT configuration secure
- Rate limiting implemented
- Input validation in place
- Error handling comprehensive

#### **Scalability: 🟡 NEEDS SETUP**
- Database connection pooling configured
- File storage needs service setup
- Monitoring needs license keys

#### **Reliability: 🟢 READY**
- Error handling implemented
- Health checks available
- Graceful shutdown configured
- Audit logging in place

## 🎯 **Next Steps for Production**

### **1. Immediate Actions (< 1 day):**
- [ ] Configure SendGrid domain verification
- [ ] Set up Supabase or AWS S3 storage
- [ ] Configure monitoring services (New Relic + Sentry)
- [ ] Update environment variables for production

### **2. Short-term Actions (< 1 week):**
- [ ] Performance testing and optimization
- [ ] Security penetration testing
- [ ] Backup and recovery testing
- [ ] Team training on monitoring and alerts

### **3. Long-term Actions (< 1 month):**
- [ ] LinkedIn OAuth migration planning
- [ ] Advanced security features (WAF, DDoS protection)
- [ ] Compliance audit (GDPR, SOC2)
- [ ] Disaster recovery planning

---

## 📞 **Support & Troubleshooting**

### **Common Issues & Solutions:**

#### **Issue**: Email delivery failures
**Solution**: Check SendGrid domain verification status

#### **Issue**: File upload errors  
**Solution**: Verify storage service configuration and permissions

#### **Issue**: High memory usage
**Solution**: Implement connection pooling and caching

#### **Issue**: Slow database queries
**Solution**: Review and optimize indexes, add query monitoring

### **Emergency Contacts:**
- **Development Team**: dev-team@yourdomain.com
- **DevOps Team**: devops@yourdomain.com
- **Security Team**: security@yourdomain.com