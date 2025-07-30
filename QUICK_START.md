# Quick Start Guide - Linkage VA Hub MERN Stack

## ✅ Installation Complete!

All dependencies have been installed. Here's how to run the application:

## 🚀 Starting the Application

### Step 1: Start MongoDB

You need MongoDB running first. Try one of these:

**On macOS (with Homebrew):**
```bash
brew services start mongodb-community
```

**On macOS (manual):**
```bash
mongod --dbpath /usr/local/var/mongodb
```

**On Linux:**
```bash
sudo systemctl start mongod
```

**On Windows:**
MongoDB should start automatically as a service.

### Step 2: Start the Backend Server

Open a new terminal and run:
```bash
cd backend
npm run dev
```

The backend will start on **http://localhost:5001**

You should see:
```
Server running in development mode on port 5001
MongoDB connected successfully
```

If you see "MongoDB connection error", make sure MongoDB is running.

### Step 3: Start the Frontend Server

Open another terminal and run:
```bash
cd frontend
PORT=3001 npm start
```

The frontend will start on **http://localhost:3001**

## 🎉 Access the Application

Once both servers are running:

1. Open your browser to **http://localhost:3001**
2. Click "Get started" to create an account
3. Choose whether you're a VA or Business
4. Complete your profile

## 🔧 Troubleshooting

### MongoDB Connection Error
```
MongoDB connection error: MongoServerError: connect ECONNREFUSED
```
**Solution:** MongoDB is not running. See Step 1 above.

### Port Already in Use
```
Something is already running on port 3001
```
**Solution:** 
- Kill the process: `lsof -ti:3001 | xargs kill -9`
- Or use a different port: `PORT=3002 npm start`

### Module Not Found
```
Error: Cannot find module 'express'
```
**Solution:** Run `npm install` in the appropriate directory

## 📱 Features Available

- ✅ User Registration & Login
- ✅ VA Profile Creation
- ✅ Business Profile Creation
- ✅ Browse VAs
- ✅ Search & Filter
- ✅ Messaging System
- ✅ Real-time Chat
- ✅ Profile Management
- ✅ Responsive Design

## 🛠️ Development Ports

- Backend API: **http://localhost:5001**
- Frontend: **http://localhost:3001**
- MongoDB: **mongodb://localhost:27017/linkage-va-hub**

## 📝 Environment Variables

Already configured in:
- `backend/.env` 
- `frontend/.env`

No changes needed for local development!

## 🎯 Next Steps

1. Create test accounts (VA and Business)
2. Upload profile pictures
3. Start conversations
4. Explore the features

Enjoy using Linkage VA Hub!