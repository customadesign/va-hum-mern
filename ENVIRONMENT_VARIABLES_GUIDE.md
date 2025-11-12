# 🔧 Environment Variables Guide - Linkage VA Hub MERN Stack

## Overview
This guide provides the exact environment variables needed for each service in your deployed Linkage VA Hub application on Render.

## 🚨 Security Notice
**All sensitive values (Client IDs, Secrets, API Keys) should be set in Render Dashboard, NOT in the YAML files.**

---

## 📋 **Backend API Service** (`linkage-va-hub-api`)

### Required Environment Variables:

```bash
# Core Configuration
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/linkagevahub?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRE=30d

# CORS Configuration
CLIENT_URL=https://linkage-va-hub.onrender.com
SERVER_URL=https://linkage-va-hub-api.onrender.com

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Supabase Configuration (for file uploads)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_BUCKET=linkage-va-hub

# LinkedIn OAuth Configuration
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_DEFAULT_CURRENCY=usd
STRIPE_TAX_ENABLED=false

# Email Configuration (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
EMAIL_FROM=your_email@gmail.com
EMAIL_FROM_NAME=Linkage VA Hub
```

---

## 🌐 **Frontend Service** (`linkage-va-hub`)

### Required Environment Variables:

```bash
# API Configuration
REACT_APP_API_URL=https://linkage-va-hub-api.onrender.com/api
REACT_APP_SOCKET_URL=https://linkage-va-hub-api.onrender.com

# Branding Configuration
REACT_APP_BRAND=linkage
REACT_APP_NAME=Linkage VA Hub

# LinkedIn OAuth
REACT_APP_LINKEDIN_CLIENT_ID=your_linkedin_client_id

# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

---

## 👨‍💼 **Admin Frontend Service** (`admin`)

### Required Environment Variables:

```bash
# API Configuration
REACT_APP_API_URL=https://linkage-va-hub-api.onrender.com/api
REACT_APP_SOCKET_URL=https://linkage-va-hub-api.onrender.com

# Branding Configuration
REACT_APP_BRAND=admin
REACT_APP_NAME=Linkage VA Hub Admin

# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

---

## 🏢 **E-Systems Frontend Service** (`esystems`)

### Required Environment Variables:

```bash
# API Configuration
REACT_APP_API_URL=https://linkage-va-hub-api.onrender.com/api
REACT_APP_SOCKET_URL=https://linkage-va-hub-api.onrender.com

# Branding Configuration
REACT_APP_BRAND=esystems
REACT_APP_NAME=E-Systems VA Hub

# LinkedIn OAuth (E-Systems specific)
REACT_APP_LINKEDIN_CLIENT_ID=your_esystems_linkedin_client_id

# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

---

## 🔐 **Security Best Practices**

### 1. **Never Hardcode Sensitive Values**
- ✅ Use `sync: false` in YAML files for sensitive variables
- ❌ Never put actual secrets in YAML files
- ✅ Set all sensitive values in Render Dashboard

### 2. **Environment-Specific Configuration**
- **Development**: Use `.env` files locally
- **Production**: Use Render Dashboard environment variables
- **Staging**: Use separate Render services with different variables

### 3. **LinkedIn OAuth Setup**
- **VA Hub Mode**: Use `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`
- **E-Systems Mode**: Use `LINKEDIN_ESYSTEMS_CLIENT_ID` and `LINKEDIN_ESYSTEMS_CLIENT_SECRET`
- **Redirect URLs**: Must match exactly in LinkedIn Developer Console

---

## 🚀 **Deployment Checklist**

### Before Deploying:
- [ ] All sensitive variables set in Render Dashboard
- [ ] LinkedIn redirect URLs configured correctly
- [ ] MongoDB connection string updated
- [ ] Supabase credentials configured

### After Deploying:
- [ ] Test LinkedIn OAuth flow
- [ ] Verify file uploads work
- [ ] Check admin panel access
- [ ] Test E-Systems branding

---

## 🔧 **Render Dashboard Configuration**

### How to Set Environment Variables in Render:

1. **Go to your service dashboard**
2. **Click on "Environment" tab**
3. **Add each variable with its value**
4. **Click "Save Changes"**
5. **Service will automatically redeploy**

### Example Render Dashboard Setup:
```
LINKEDIN_CLIENT_ID = 862opndk5vhk47
LINKEDIN_CLIENT_SECRET = [Your Secret from LinkedIn]
MONGODB_URI = [Your MongoDB Connection String]
SUPABASE_URL = [Your Supabase URL]
SUPABASE_ANON_KEY = [Your Supabase Anon Key]
```

---

## 📞 **Support**

If you encounter issues:
1. Check Render service logs
2. Verify all environment variables are set
3. Test LinkedIn OAuth configuration
4. Ensure MongoDB connection is working

---

**Last Updated**: December 2024
**Version**: 1.0
