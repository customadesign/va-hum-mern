const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');

// Load env vars
dotenv.config();

// Debug environment variables on startup
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', process.env.PORT || 5000);
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const vaRoutes = require('./routes/vas');
const businessRoutes = require('./routes/businesses');
const conversationRoutes = require('./routes/conversations');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const specialtyRoutes = require('./routes/specialties');
const locationRoutes = require('./routes/locations');
const adminRoutes = require('./routes/admin');
const shortUrlRoutes = require('./routes/shortUrls');

// Import middleware
const errorHandler = require('./middleware/error');

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, allow specified CLIENT_URLs
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = [
        process.env.CLIENT_URL,
        process.env.ESYSTEMS_CLIENT_URL
      ].filter(Boolean); // Remove undefined values
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development, allow localhost origins
      callback(null, true);
    }
  },
  credentials: true
};

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: corsOptions
});

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW * 60 * 1000, // minutes to ms
  max: process.env.RATE_LIMIT_MAX
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV 
  });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: process.env.ESYSTEMS_MODE === 'true' 
      ? 'E-Systems Management Hub API is running' 
      : 'Linkage VA Hub API is running',
    mode: process.env.ESYSTEMS_MODE === 'true' ? 'esystems' : 'linkage',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vas', vaRoutes);
app.use('/api/system', require('./routes/system'));
app.use('/api/businesses', businessRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/specialties', specialtyRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shorturls', shortUrlRoutes);
app.use('/s', shortUrlRoutes); // Public short URL redirects

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handler (must be last)
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New WebSocket connection');

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('leave', (userId) => {
    socket.leave(userId);
    console.log(`User ${userId} left their room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Make io accessible to routes
app.set('io', io);

// Import database connection
const connectDB = require('./config/database');

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});