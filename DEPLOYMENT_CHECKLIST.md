# 🚀 Linkage VA Hub Deployment Checklist

## 📋 **Pre-Deployment Configuration Checklist**

### **🔧 1. Environment Setup**

#### **Backend Configuration:**
- [ ] **Copy environment template**
  ```bash
  cp .env.complete.template .env
  ```
- [ ] **Generate secure secrets**
  ```bash
  # Generate JWT secrets
  node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
  node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
  node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] **Configure database connection**
  ```env
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
  ```

#### **Frontend Configuration:**
- [ ] **Update API endpoints**
  ```env
  REACT_APP_API_URL=https://your-api-domain.com
  REACT_APP_CLIENT_URL=https://your-app-domain.com
  ```

### **🗄️ 2. Database Configuration**

#### **MongoDB Atlas Setup:**
- [ ] Create MongoDB Atlas cluster
- [ ] Configure network access (IP whitelist)
- [ ] Create database user with appropriate permissions
- [ ] Enable backup and point-in-time recovery
- [ ] Configure connection string with SSL

#### **Database Indexes:**
- [ ] Verify all indexes are properly created
- [ ] Check for duplicate index warnings (should be resolved)
- [ ] Monitor index performance

### **📧 3. Email Service Configuration**

#### **SendGrid Setup (RECOMMENDED):**
- [ ] Create SendGrid account
- [ ] Verify domain ownership for all sender domains:
  - [ ] `linkagevahub.com` (for VA emails)
  - [ ] `esystemsmanagment.com` (for business emails)  
  - [ ] `esystemsmanagement.com` (for admin emails)
- [ ] Configure DKIM, SPF, and DMARC records
- [ ] Create API key with Mail Send permissions
- [ ] Test email delivery to all user types

#### **SMTP Fallback:**
- [ ] Configure SMTP credentials
- [ ] Test SMTP connectivity
- [ ] Set up email templates

### **📁 4. File Storage Configuration**

#### **Option A: Supabase Storage (RECOMMENDED):**
- [ ] Create Supabase project
- [ ] Enable Storage service
- [ ] Create storage bucket: `linkage-va-hub`
- [ ] Configure RLS policies
- [ ] Get Service Role Key for server operations
- [ ] Test file upload/download

#### **Option B: AWS S3:**
- [ ] Create S3 bucket
- [ ] Configure IAM user with S3 permissions
- [ ] Set up CORS policy
- [ ] Enable versioning and lifecycle policies
- [ ] Test upload/download functionality

### **💳 5. Payment Processing (Stripe)**

#### **Stripe Configuration:**
- [ ] Create Stripe account
- [ ] Get API keys (test and live)
- [ ] Configure webhooks endpoint
- [ ] Set up products and pricing
- [ ] Test payment flows
- [ ] Configure tax calculation (if needed)

### **🔗 6. OAuth Configuration**

#### **LinkedIn OAuth (DEPRECATED - Consider Removing):**
- [ ] Update redirect URIs in LinkedIn app
- [ ] Verify OAuth flow still works
- [ ] Plan migration to alternative auth method
- [ ] Document deprecation timeline

### **📊 7. Monitoring & Analytics**

#### **New Relic APM:**
- [ ] Create New Relic account
- [ ] Get license key
- [ ] Configure application monitoring
- [ ] Set up alerts and dashboards

#### **Sentry Error Tracking:**
- [ ] Create Sentry project
- [ ] Get DSN key
- [ ] Configure error tracking
- [ ] Set up performance monitoring
- [ ] Create alert rules

### **🔒 8. Security Configuration**

#### **SSL/TLS:**
- [ ] Obtain SSL certificates
- [ ] Configure HTTPS redirect
- [ ] Set up certificate auto-renewal
- [ ] Test SSL rating (A+ grade target)

#### **Security Headers:**
- [ ] Configure Content Security Policy
- [ ] Enable HSTS
- [ ] Set up security headers
- [ ] Test with security scanners

## 🚀 **Deployment Steps**

### **1. Production Build**
```bash
# Backend
cd backend
npm install --production
npm run build # if build script exists

# Frontend
cd admin-frontend
npm install
npm run build
```

### **2. Environment Configuration**
```bash
# Set production environment
export NODE_ENV=production

# Verify all required environment variables
node -e "
const required = ['MONGODB_URI', 'JWT_SECRET', 'PORT'];
const missing = required.filter(key => !process.env[key]);
if (missing.length) {
  console.error('Missing required env vars:', missing);
  process.exit(1);
}
console.log('✅ All required environment variables configured');
"
```

### **3. Database Migration**
```bash
# Run any pending migrations
npm run migrate # if migration scripts exist

# Seed initial data if needed
npm run seed:production # if production seed script exists
```

### **4. Health Check Verification**
```bash
# Test health endpoint
curl -f http://localhost:8000/health

# Test database connection
curl -f http://localhost:8000/api/health/db

# Test email service
curl -f http://localhost:8000/api/health/email
```

### **5. Service Startup**
```bash
# Option A: PM2 (Recommended)
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Option B: Docker
docker build -t linkage-va-hub .
docker run -d --name linkage-va-hub -p 8000:8000 linkage-va-hub

# Option C: Direct Node.js
node server.js
```

## 🔍 **Post-Deployment Verification**

### **Functional Testing:**
- [ ] User registration and login
- [ ] Password reset functionality (both admin and user-initiated)
- [ ] File upload and download
- [ ] Email delivery to all user types
- [ ] Admin panel access and functionality
- [ ] API endpoints responding correctly

### **Performance Testing:**
- [ ] Load testing with expected traffic
- [ ] Database query performance
- [ ] File upload performance
- [ ] Email delivery performance

### **Security Testing:**
- [ ] Penetration testing
- [ ] SQL injection testing
- [ ] XSS vulnerability testing
- [ ] Authentication bypass testing
- [ ] Rate limiting verification

### **Monitoring Verification:**
- [ ] Application metrics in New Relic
- [ ] Error tracking in Sentry
- [ ] Log aggregation working
- [ ] Alert notifications functioning

## 🚨 **Disaster Recovery**

### **Backup Strategy:**
- [ ] Database backups (automated daily)
- [ ] File storage backups
- [ ] Configuration backups
- [ ] Code repository backups

### **Recovery Procedures:**
- [ ] Database restore procedures tested
- [ ] Application rollback procedures
- [ ] Emergency contact procedures
- [ ] Incident response plan

## 📞 **Support & Maintenance**

### **Documentation:**
- [ ] API documentation updated
- [ ] Deployment procedures documented
- [ ] Troubleshooting guide created
- [ ] Emergency procedures documented

### **Team Training:**
- [ ] Production deployment procedures
- [ ] Monitoring and alerting
- [ ] Incident response
- [ ] Security best practices

---

## 🎯 **Quick Production Deploy Commands**

```bash
# 1. Clone and setup
git clone <repository>
cd Linkage\ VA\ Hub\ MERN\ Stack

# 2. Backend setup
cd backend
npm install --production
cp .env.complete.template .env
# Edit .env with production values
npm start

# 3. Frontend setup (new terminal)
cd ../admin-frontend  
npm install
npm run build
npm run serve

# 4. Verify deployment
curl http://localhost:8000/health
curl http://localhost:4000

# 5. Setup process manager
npm install -g pm2
pm2 start server.js --name linkage-backend
pm2 startup
pm2 save
```

---

## ⚡ **Emergency Rollback Procedure**

```bash
# 1. Stop current deployment
pm2 stop linkage-backend

# 2. Rollback to previous version
git checkout <previous-stable-commit>
npm install

# 3. Restore database if needed
mongorestore --uri="$MONGODB_URI" <backup-path>

# 4. Restart services
pm2 restart linkage-backend

# 5. Verify functionality
curl http://localhost:8000/health