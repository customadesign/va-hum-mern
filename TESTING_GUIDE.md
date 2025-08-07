# Clerk Migration Testing Guide

## 🧪 Test Plan for Linkage VA Hub Clerk Migration

This guide covers testing the Clerk authentication migration for both local development and production deployment.

## 🔧 Environment Setup for Testing

### 1. Development Environment Variables

**Backend (.env):**
```env
# Existing variables (keep these)
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/linkage-va-hub

# ADD THESE for Clerk testing
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_test_key_here
CLERK_SECRET_KEY=sk_test_your_clerk_test_secret_here

# Keep legacy auth during testing (for rollback)
JWT_SECRET=your_existing_jwt_secret
```

**Frontend (.env):**
```env
# ADD THIS for Clerk testing
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_test_key_here

# Existing variables (keep these)
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 2. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm start

# Terminal 3 - E-Systems Mode (port 3001)
cd frontend
npm run esystems
```

## 🧪 Test Scenarios

### Test Case 1: New User Registration (Clerk Only)

**Objective:** Verify new users can register via Clerk and complete profile setup.

**Steps:**
1. Navigate to `http://localhost:3000/sign-up`
2. Register with new email
3. Verify email (if required by Clerk config)
4. Complete profile setup:
   - Select role (VA or Business)
   - Enter referral code (optional)
5. Verify redirect to appropriate dashboard

**Expected Results:**
- ✅ Clerk signup form appears
- ✅ Email verification works (if enabled)
- ✅ Profile setup form appears
- ✅ User record created in MongoDB with `clerkUserId`
- ✅ Correct redirect based on role selection

### Test Case 2: Existing User Migration

**Objective:** Verify existing JWT users can login and be migrated to Clerk.

**Steps:**
1. Create a test user with legacy JWT auth (via API or database)
2. Navigate to `http://localhost:3000/sign-in`
3. Login with existing credentials
4. Check database for Clerk linkage

**Expected Results:**
- ✅ Legacy user can still login
- ✅ User prompted to migrate to Clerk (future feature)
- ✅ VA/Business profiles preserved
- ✅ User relationships maintained

### Test Case 3: Authentication Flows

**Objective:** Test all authentication scenarios.

#### 3.1 Protected Routes
1. Try accessing `/dashboard` without login
2. Verify redirect to sign-in page
3. Login and verify access granted

#### 3.2 Role-Based Access
1. Register as VA user
2. Try accessing business-only routes (`/vas` hiring page)
3. Verify appropriate permissions

#### 3.3 Admin Access
1. Set user as admin in database:
   ```javascript
   db.users.updateOne(
     { clerkUserId: "user_xxx" }, 
     { $set: { admin: true } }
   )
   ```
2. Test admin routes (`/admin`)

### Test Case 4: E-Systems Mode

**Objective:** Verify Clerk works in E-Systems deployment mode.

**Steps:**
1. Set `ESYSTEMS_MODE=true` in backend
2. Start frontend on port 3001: `npm run esystems`
3. Test authentication flows
4. Verify E-Systems branding [[memory:5160459]]

**Expected Results:**
- ✅ E-Systems branding appears
- ✅ Clerk authentication works
- ✅ Business-focused features available

### Test Case 5: API Integration

**Objective:** Test API calls with Clerk tokens.

**Steps:**
1. Login via Clerk
2. Open browser dev tools
3. Check API calls include `Authorization: Bearer <clerk_token>`
4. Test API endpoints:
   - `GET /api/vas` (public)
   - `GET /api/conversations` (protected)
   - `POST /api/businesses` (role-based)

### Test Case 6: Real-time Features

**Objective:** Verify Socket.io works with Clerk authentication.

**Steps:**
1. Login with two different users
2. Start a conversation
3. Send messages
4. Verify real-time updates

### Test Case 7: File Uploads

**Objective:** Test file uploads with Clerk authentication.

**Steps:**
1. Login as VA user
2. Upload profile avatar
3. Verify file saved and accessible

## 🐛 Common Issues & Troubleshooting

### Issue 1: "Missing Clerk Publishable Key"
**Fix:** Ensure `REACT_APP_CLERK_PUBLISHABLE_KEY` is set in frontend `.env`

### Issue 2: Clerk Routes Not Found
**Fix:** Check if `CLERK_SECRET_KEY` is set in backend `.env`

### Issue 3: User Not Found in Database
**Fix:** Check webhook configuration or manual user sync

### Issue 4: Permission Denied
**Fix:** Verify user roles and MongoDB relationships

## 📊 Test Data Setup

### Create Test Users

```javascript
// Test VA User
{
  email: "va-test@example.com",
  name: "Test VA User",
  role: "va",
  provider: "clerk",
  clerkUserId: "user_test_va_123"
}

// Test Business User  
{
  email: "business-test@example.com",
  name: "Test Business User", 
  role: "business",
  provider: "clerk",
  clerkUserId: "user_test_business_123"
}

// Test Admin User
{
  email: "admin-test@example.com",
  name: "Test Admin User",
  admin: true,
  provider: "clerk", 
  clerkUserId: "user_test_admin_123"
}
```

## 🔍 Database Validation Queries

```javascript
// Check migration progress
db.users.countDocuments({ provider: "clerk" })
db.users.countDocuments({ provider: "local" })
db.users.countDocuments({ provider: "linkedin" })

// Find users with Clerk IDs
db.users.find({ clerkUserId: { $exists: true } })

// Check user-profile relationships
db.users.aggregate([
  { $lookup: { from: "vas", localField: "va", foreignField: "_id", as: "vaProfile" } },
  { $lookup: { from: "businesses", localField: "business", foreignField: "_id", as: "businessProfile" } },
  { $match: { clerkUserId: { $exists: true } } }
])
```

## ✅ Testing Checklist

- [ ] New user registration via Clerk
- [ ] Email verification (if enabled)
- [ ] Profile setup completion
- [ ] VA dashboard access
- [ ] Business dashboard access  
- [ ] Admin panel access
- [ ] Protected route handling
- [ ] Role-based permissions
- [ ] API authentication
- [ ] File upload functionality
- [ ] Real-time messaging
- [ ] E-Systems mode
- [ ] Production environment variables
- [ ] Database user migration
- [ ] Rollback capability

## 🚀 Production Testing

Before deploying to production:

1. **Test with production Clerk keys** (in staging environment)
2. **Verify OAuth providers** (Google, LinkedIn if configured)
3. **Test webhook endpoints** (for user management)
4. **Check performance** (Clerk API response times)
5. **Monitor error rates** in development

---

**Ready to test?** Start with Test Case 1 and work through each scenario! 🧪