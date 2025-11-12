# 🔧 COMPLETE Environment Variables Guide - Linkage VA Hub MERN Stack

## 🚨 **CRITICAL: This is the COMPLETE list of ALL environment variables needed**

Based on comprehensive codebase analysis, here are **ALL** environment variables your application uses:

---

## 📋 **Backend API Service** (`linkage-va-hub-api`)

### **Core Configuration (REQUIRED)**
```bash
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/linkagevahub?retryWrites=true&w=majority
```

### **JWT Configuration (REQUIRED)**
```bash
JWT_SECRET=your_secure_jwt_secret_here_64_chars_minimum
JWT_EXPIRE=30d
JWT_REFRESH_SECRET=your_secure_refresh_secret_here_64_chars_minimum
JWT_REFRESH_EXPIRE=7d
```

### **CORS & URL Configuration (REQUIRED)**
```bash
CLIENT_URL=https://linkage-va-hub.onrender.com
ESYSTEMS_CLIENT_URL=https://esystems-frontend.onrender.com
ADMIN_CLIENT_URL=https://admin-3pxa.onrender.com
SERVER_URL=https://linkage-va-hub-api.onrender.com
```

### **LinkedIn OAuth (REQUIRED)**
```bash
# For Linkage VA Hub mode
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# For E-Systems mode
LINKEDIN_ESYSTEMS_CLIENT_ID=your_esystems_linkedin_client_id
LINKEDIN_ESYSTEMS_CLIENT_SECRET=your_esystems_linkedin_client_secret
```

### **Stripe Payment Processing (REQUIRED)**
```bash
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_DEFAULT_CURRENCY=usd
STRIPE_TAX_ENABLED=false
```

### **HitPay Payment Processing (REQUIRED)**
```bash
HITPAY_API_KEY=your_hitpay_api_key
HITPAY_API_SALT=your_hitpay_api_salt
HITPAY_ENV=sandbox  # or 'live' for production
HITPAY_BASE_URL=https://api.hit-pay.com/v1
APP_BASE_URL=https://linkage-va-hub.onrender.com
```

### **Email Configuration (REQUIRED)**
```bash
# SendGrid (Primary Email Service)
SENDGRID_API_KEY=SG.your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@linkage.ph
SENDGRID_FROM_NAME=Linkage VA Hub

# SMTP Fallback (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
EMAIL_FROM=your_email@gmail.com
EMAIL_FROM_NAME=Linkage VA Hub
EMAIL_SECURE=false
```

### **Supabase File Storage (REQUIRED)**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_BUCKET=linkage-va-hub
```

### **Rate Limiting & Security**
```bash
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### **Business Logic Configuration**
```bash
ESYSTEMS_MODE=false  # Set to 'true' for E-Systems deployment
MAX_SAVED_VAS=500
```

### **Monitoring & Analytics (OPTIONAL)**
```bash
SENTRY_DSN=your_sentry_dsn
```

---

## 🌐 **Frontend Services** (All React Apps)

### **Main Frontend** (`linkage-va-hub`)
```bash
REACT_APP_API_URL=https://linkage-va-hub-api.onrender.com/api
REACT_APP_SOCKET_URL=https://linkage-va-hub-api.onrender.com
REACT_APP_BRAND=linkage
REACT_APP_NAME=Linkage VA Hub
REACT_APP_LINKEDIN_CLIENT_ID=your_linkedin_client_id
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Admin Frontend** (`admin-3pxa`)
```bash
REACT_APP_API_URL=https://linkage-va-hub-api.onrender.com/api
REACT_APP_SOCKET_URL=https://linkage-va-hub-api.onrender.com
REACT_APP_BRAND=admin
REACT_APP_NAME=Admin Dashboard
REACT_APP_LINKAGE_URL=https://linkage-va-hub.onrender.com
REACT_APP_MAIN_APP_URL=https://linkage-va-hub.onrender.com
REACT_APP_ADMIN_URL=https://admin-3pxa.onrender.com
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **E-Systems Frontend** (`esystems-frontend`)
```bash
REACT_APP_API_URL=https://linkage-va-hub-api.onrender.com/api
REACT_APP_SOCKET_URL=https://linkage-va-hub-api.onrender.com
REACT_APP_BRAND=esystems
REACT_APP_NAME=E-Systems Management Hub
REACT_APP_IS_ESYSTEMS=true
REACT_APP_LINKEDIN_CLIENT_ID=your_esystems_linkedin_client_id
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
REACT_APP_ADMIN_URL=https://admin-3pxa.onrender.com
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🔑 **Service-Specific Environment Variables**

### **Backend API Service Only:**
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`
- `CLERK_FRONTEND_API`
- `CLERK_JWKS_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `HITPAY_API_KEY`
- `HITPAY_API_SALT`
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`
- `SENDGRID_FROM_NAME`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_ESYSTEMS_CLIENT_SECRET`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

### **Frontend Services Only:**
- `REACT_APP_*` variables (all start with REACT_APP_)
- `REACT_APP_STRIPE_PUBLISHABLE_KEY` (not the secret key)
- `REACT_APP_LINKEDIN_CLIENT_ID` (not the secret)

---

## 🚨 **CRITICAL MISSING VARIABLES**

Based on my analysis, you were **missing these critical variables**:

### **1. HitPay Payment Processing (COMPLETELY MISSING)**
```bash
HITPAY_API_KEY=your_hitpay_api_key
HITPAY_API_SALT=your_hitpay_api_salt
HITPAY_ENV=sandbox
HITPAY_BASE_URL=https://api.hit-pay.com/v1
APP_BASE_URL=https://linkage-va-hub.onrender.com
```

### **2. Legacy Clerk Authentication (REMOVED)**

Clerk was previously the primary auth provider but has been fully decommissioned. Remove any `CLERK_*`
environment variables from your Render services to avoid confusion. Authentication now relies on our
JWT + LinkedIn OAuth flow documented above.

### **3. JWT Refresh Token Support (MISSING)**
```bash
JWT_REFRESH_SECRET=your_secure_refresh_secret_here_64_chars_minimum
JWT_REFRESH_EXPIRE=7d
```

### **4. SendGrid Email Configuration (MISSING)**
```bash
SENDGRID_API_KEY=SG.your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@linkage.ph
SENDGRID_FROM_NAME=Linkage VA Hub
```

### **5. E-Systems Specific Variables (MISSING)**
```bash
ESYSTEMS_MODE=false
ESYSTEMS_CLIENT_URL=https://esystems-frontend.onrender.com
LINKEDIN_ESYSTEMS_CLIENT_ID=your_esystems_linkedin_client_id
LINKEDIN_ESYSTEMS_CLIENT_SECRET=your_esystems_linkedin_client_secret
```

### **6. Business Logic Variables (MISSING)**
```bash
MAX_SAVED_VAS=500
```

---

## 📝 **Environment Variable Setup Instructions**

### **1. Backend API Service (linkage-va-hub-api)**
Set **ALL** variables listed under "Backend API Service" section above.

### **2. Frontend Services**
- **Main Frontend**: Set variables under "Main Frontend" section
- **Admin Frontend**: Set variables under "Admin Frontend" section  
- **E-Systems Frontend**: Set variables under "E-Systems Frontend" section

### **3. Security Notes**
- **Never** put secret keys in frontend services
- **Only** put `REACT_APP_*` variables in frontend services
- **Backend secrets** should only be in the backend API service

---

## ✅ **Verification Checklist**

After setting all variables, verify:

1. **Backend Health Check**: `https://linkage-va-hub-api.onrender.com/api/health`
2. **Authentication**: Test login/logout flows
3. **Payments**: Test Stripe and HitPay integrations
4. **File Uploads**: Test Supabase file uploads
5. **Email**: Test password reset emails
6. **LinkedIn OAuth**: Test LinkedIn login
7. **Live Sessions**: Confirm Zoom/meeting reminder emails are delivering to registrants

---

## 🎯 **Summary**

Your original configuration was **missing 15+ critical environment variables**. This complete guide includes **ALL** variables your application actually uses based on comprehensive codebase analysis.

**Total Variables Needed:**
- **Backend API**: ~35 variables
- **Main Frontend**: ~10 variables  
- **Admin Frontend**: ~8 variables
- **E-Systems Frontend**: ~10 variables

**Total: ~63 environment variables** across all services.
