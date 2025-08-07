# Clerk Migration Guide for Linkage VA Hub

## 🔐 Step 1: Set up your Clerk Account

1. **Sign up at https://clerk.com** (if you haven't already)

2. **Create a new application:**
   - Application Name: `Linkage VA Hub`
   - Choose your sign-in options:
     - ✅ Email
     - ✅ Username (optional)
     - ✅ Google OAuth (to replace LinkedIn)
     - ✅ LinkedIn OAuth (if you still want it)
     - ✅ Password

3. **Configure your application settings:**
   - In the Clerk dashboard, go to "User & Authentication" → "Social Connections"
   - Enable Google and/or LinkedIn OAuth
   - Set up redirect URLs (we'll configure these below)

## 🔑 Step 2: Get Your API Keys

From your Clerk dashboard:

1. Go to "Developers" → "API Keys"
2. Copy your:
   - **Publishable Key** (starts with `pk_`)
   - **Secret Key** (starts with `sk_`)

## 🔧 Step 3: Environment Variables

### Backend (.env)
```env
# Existing variables...
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_uri_here

# CLERK CONFIGURATION (ADD THESE)
CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Replace JWT_SECRET with Clerk (we'll remove this later)
# JWT_SECRET=your_old_jwt_secret

# Remove LinkedIn OAuth (we'll use Clerk's LinkedIn instead)
# LINKEDIN_CLIENT_ID=your_old_linkedin_client_id
# LINKEDIN_CLIENT_SECRET=your_old_linkedin_client_secret
```

### Frontend (.env)
```env
# CLERK CONFIGURATION (ADD THESE)
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Existing variables...
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_NAME=Linkage VA Hub
```

## 🎯 Step 4: Clerk Application Configuration

In your Clerk dashboard:

### Allowed Origins
- `http://localhost:3000` (development)
- `http://localhost:3001` (E-systems development)
- Your production URLs

### Redirect URLs
- `http://localhost:3000/*` (development)
- `http://localhost:3001/*` (E-systems development)  
- Your production URLs with `/*`

### User Roles (Important!)
1. In Clerk dashboard, go to "Organizations" → "Roles"
2. Create these roles to match your current system:
   - `va` (Virtual Assistant)
   - `business` (Business User)
   - `admin` (Administrator)

## 🔄 Migration Strategy

We'll preserve your existing user data by:

1. **Mapping Clerk User IDs to existing users** - New field `clerkUserId` in your User model
2. **Preserving VA and Business profiles** - Keep all existing relationships
3. **Migrating authentication gradually** - Both systems can work side-by-side during transition
4. **Role-based access control** - Integrate Clerk roles with your existing authorization logic

## 📝 Next Steps

After setting up environment variables, we'll:

1. ✅ Update User model to include Clerk user ID
2. ✅ Replace authentication middleware  
3. ✅ Update frontend with Clerk components
4. ✅ Remove old OAuth routes
5. ✅ Test all authentication flows
6. ✅ Clean up old authentication code

## 🚨 Important Notes

- **Don't delete old authentication code yet** - we'll run both systems in parallel during migration
- **Backup your database** before making User model changes
- **Test thoroughly** in development before deploying to production
- **Your existing VA and Business data will be preserved**

## 🔗 Helpful Resources

- [Clerk React Quickstart](https://clerk.com/docs/quickstarts/react)
- [Clerk Express Backend](https://clerk.com/docs/references/backend/overview)
- [Clerk User Management](https://clerk.com/docs/users/overview)