# HitPay Payment Integration Setup - MERN Stack

## Quick Setup Guide

### 1. Configure Backend Environment Variables

Navigate to the backend directory:
```bash
cd "Linkage VA Hub MERN Stack/backend"
```

Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` and add your HitPay credentials:
```env
# HitPay Payment Integration
HITPAY_API_KEY=your_hitpay_api_key_here
HITPAY_API_SALT=your_hitpay_api_salt_here
HITPAY_ENV=sandbox
APP_BASE_URL=http://localhost:3000

# ... other existing variables
```

**Where to get HitPay credentials:**
1. Log into your HitPay Dashboard
2. Go to Settings > API Keys
3. Copy your sandbox API Key and API Salt
4. Paste them into the `.env` file

### 2. Start the Backend Server

From the backend directory:
```bash
npm start
# or
node server.js
```

**Verify the backend is running:**
- You should see: "Server running in development mode on port 5000"
- Check http://localhost:5000/health should return `{"status":"ok"}`

### 3. Start the Frontend

Open a new terminal and navigate to the frontend directory:
```bash
cd "Linkage VA Hub MERN Stack/frontend"
npm start
```

**Verify the frontend is running:**
- Frontend should be available at http://localhost:3000
- You should see the Linkage VA Hub homepage

### 4. Test the Payment Flow

1. **Navigate to Community Page:**
   - Go to http://localhost:3000/community
   - You should see the webinar registration form

2. **Fill Out the Form:**
   - Enter your details (all fields marked with * are required)
   - Click "Proceed to Payment (₱999)"

3. **Expected Behavior:**
   - Browser should redirect to HitPay hosted checkout page
   - You should see payment method options (credit card, bank transfer, etc.)
   - Complete the payment using HitPay's sandbox test data

4. **After Payment:**
   - You'll be redirected to `/community/payment/return`
   - You should see payment status and HMAC verification details

## Troubleshooting

### Problem: Form submits but no redirect to HitPay

**Check browser console:**
1. Open browser dev tools (F12) → Console tab
2. Try the payment flow again
3. Look for error messages

**Common issues:**

#### 1. Backend not configured
- Error: "Missing required environment variables"
- **Fix:** Configure HITPAY_API_KEY and HITPAY_API_SALT in backend/.env

#### 2. Backend not running
- Error: "fetch failed" or network error
- **Fix:** Start the backend server (`npm start` in backend directory)

#### 3. Wrong API endpoint
- Error: 404 on `/api/payments/hitpay/create`
- **Fix:** Ensure backend server.js includes the hitpay routes (should be automatic)

#### 4. Invalid HitPay credentials
- Error: "HitPay API error" with 401/403 status
- **Fix:** Verify your API key and salt are correct for sandbox environment

### Check Backend Logs

The backend console should show:
```
[HitPay] Creating payment request...
[HitPay] Payment payload: { amount: "999.00", currency: "PHP", ... }
[HitPay] Payment created successfully: { id: "...", reference: "...", url: "..." }
```

### Check Frontend Console

The browser console should show:
```
[Community] Creating HitPay payment...
[Community] Payment API response: 200 OK
[Community] Redirecting to HitPay checkout: https://secure.sandbox.hit-pay.com/...
```

## API Endpoints Created

- **POST** `/api/payments/hitpay/create` - Create payment request
- **POST** `/api/hitpay/webhook` - Handle payment webhooks  
- **GET** `/api/hitpay/payments/:id` - Get payment status (debug)

## Files Modified/Created

### Backend:
- `routes/hitpay.js` - Express.js routes for payment processing
- `server.js` - Added hitpay routes to Express app
- `.env.example` - Added HitPay environment variables

### Frontend:
- `pages/Community.js` - Enhanced form with HitPay payment integration
- `pages/PaymentReturn.js` - Payment return handler with verification
- `App.js` - Added payment return route

## Webhook Testing (Optional)

For webhook testing in development:

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Expose localhost:**
   ```bash
   ngrok http 3000
   ```

3. **Update environment:**
   ```env
   APP_BASE_URL=https://abc123.ngrok.io
   ```

4. **Restart backend server** to pick up the new APP_BASE_URL

## Production Deployment Notes

- Replace in-memory payment store with persistent database
- Set `HITPAY_ENV=live` and use production HitPay credentials
- Ensure `APP_BASE_URL` points to your production domain
- Configure webhook URL in HitPay dashboard to point to your production API

## Support

If you encounter issues:
1. Check both backend and frontend console logs
2. Verify all environment variables are set correctly
3. Ensure both servers (backend on :5000, frontend on :3000) are running
4. Test the `/health` endpoint: http://localhost:5000/health