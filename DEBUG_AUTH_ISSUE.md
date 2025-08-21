# Debugging Admin Authentication Issue

## What We've Fixed

### Backend (Already Deployed)
- ✅ Added `https://admin-3pxa.onrender.com` to CORS allowed origins
- ✅ Configured cookie-parser middleware
- ✅ Set secure cookies with `sameSite: 'none'` for production
- ✅ Auth middleware checks both headers and cookies
- ✅ Added debug endpoint `/api/auth/test-cors`

### Frontend (Needs Redeployment)
- ✅ Added `withCredentials: true` to axios
- ✅ Created `.env.production` with correct API URL
- ✅ Added debugging console logs
- ✅ Created build script with environment variables

## Test Steps

### 1. Test CORS Configuration
Open browser console at https://admin-3pxa.onrender.com and run:
```javascript
// Test CORS endpoint
fetch('https://linkage-va-hub-api.onrender.com/api/auth/test-cors', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('CORS Test:', data))
.catch(err => console.error('CORS Error:', err));
```

Expected: Should see `{success: true, message: 'CORS is working'}`

### 2. Test Login Flow
```javascript
// Test login directly
fetch('https://linkage-va-hub-api.onrender.com/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'pat@linkage.ph',  // or your admin email
    password: 'your-password'  // replace with actual password
  })
})
.then(r => r.json())
.then(data => {
  console.log('Login response:', data);
  if (data.token) {
    localStorage.setItem('authToken', data.token);
    console.log('Token saved to localStorage');
  }
})
.catch(err => console.error('Login Error:', err));
```

### 3. Test Auth Verification
After login, test the /me endpoint:
```javascript
// Test auth verification
const token = localStorage.getItem('authToken');
fetch('https://linkage-va-hub-api.onrender.com/api/auth/me', {
  credentials: 'include',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('Auth Me:', data))
.catch(err => console.error('Auth Error:', err));
```

## What to Look For

### In Browser Console:
1. **On page load**: Should see:
   - "Admin Frontend Starting..."
   - "API URL: https://linkage-va-hub-api.onrender.com/api"

2. **During login**: Should see:
   - "Logging in to: https://linkage-va-hub-api.onrender.com/api/auth/login"
   - "Auth response: {success: true, user: {...}}"

3. **After login**: Should see:
   - Token in localStorage
   - User object with `admin: true`

### In Network Tab:
1. **Login request**: 
   - Should have `Set-Cookie` in response headers
   - Should return token in response body

2. **Subsequent requests**:
   - Should include `Cookie` header
   - Should include `Authorization: Bearer ...` header

## Quick Fix if Still Not Working

### Option 1: Force Rebuild on Render
1. Go to Render dashboard
2. Go to "admin" service
3. Click "Manual Deploy" → "Clear build cache & deploy"

### Option 2: Update Environment Variables on Render
1. Go to Environment tab in Render
2. Add/verify these variables:
   - `REACT_APP_API_URL` = `https://linkage-va-hub-api.onrender.com/api`
   - `NODE_ENV` = `production`

### Option 3: Check Backend Logs
Look for these in Render backend logs:
- "Token decoded successfully for user: ..."
- "Auth middleware passed for user: ... Admin: true"
- "CORS test endpoint hit"

## Root Cause Analysis

The issue is likely one of:
1. **Environment variables not being embedded in build** - The React build process needs env vars at build time
2. **Cookies being blocked** - Browser security blocking third-party cookies
3. **Token not persisting** - localStorage being cleared or not accessible

## Manual Test with cURL

From terminal:
```bash
# Test login
curl -X POST https://linkage-va-hub-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://admin-3pxa.onrender.com" \
  -d '{"email":"pat@linkage.ph","password":"your-password"}' \
  -c cookies.txt -v

# Test with token from response
TOKEN="paste-token-here"
curl https://linkage-va-hub-api.onrender.com/api/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Origin: https://admin-3pxa.onrender.com" \
  -b cookies.txt -v
```

## If All Else Fails

The nuclear option - bypass the frontend auth check temporarily:
1. In App.js, temporarily comment out the admin check
2. This will let you verify if the rest of the app works
3. Then focus on fixing just the auth persistence issue