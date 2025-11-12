# Admin Login Setup - Complete

## ✅ Setup Summary

The admin user has been successfully created with the following credentials:

- **Email:** `admin@linkage.ph`
- **Password:** `admin123`
- **Admin Access:** ✅ Enabled
- **Email Verified:** ✅ Yes

## 🚀 How to Login

1. **Ensure both servers are running:**
   - Backend: http://localhost:8000 (Already running)
   - Admin Frontend: http://localhost:4000 (Already running)

2. **Access the Admin Panel:**
   - Open your browser and navigate to: http://localhost:4000/login

3. **Enter the credentials:**
   - Email: `admin@linkage.ph`
   - Password: `admin123`

4. **Click "Sign In" to access the admin dashboard**

## 🔧 Technical Details

### Backend Configuration
- MongoDB Connection: ✅ Connected to `linkagevahub` database
- Authentication Endpoint: `/api/auth/admin/login`
- Password Hashing: bcrypt with salt rounds (automatic)
- Admin Flag: Set to `true` for this user

### Frontend Configuration
- Running on Port: 4000
- API URL: http://localhost:8000/api
- Authentication: JWT tokens with refresh token support

### Files Created/Modified

1. **Setup Script:** `/backend/scripts/setupAdminUser.js`
   - Creates or updates admin user with specified credentials
   - Handles password hashing via User model pre-save hook
   - Verifies password after creation

2. **Test Script:** `/backend/scripts/testAdminLogin.js`
   - Tests admin login via API
   - Verifies token generation
   - Confirms admin privileges

## 🔒 Security Notes

- Password is hashed using bcrypt before storage
- JWT tokens are used for session management
- Refresh tokens are supported for extended sessions
- Admin privileges are verified on each protected route

## 🛠️ Troubleshooting

If you encounter any issues:

1. **Cannot login:**
   - Verify both servers are running
   - Check browser console for errors
   - Ensure you're using the exact credentials provided

2. **Re-run setup if needed:**
   ```bash
   cd backend/scripts
   node setupAdminUser.js
   ```

3. **Test login via API:**
   ```bash
   cd backend/scripts
   node testAdminLogin.js
   ```

## 📝 Additional Admin Users

To create additional admin users, you can:

1. Modify the credentials in `setupAdminUser.js`
2. Run the script again
3. Or use the existing admin account to create new admins through the UI

---

**Setup completed successfully!** You can now login to the admin panel.