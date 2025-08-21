const express = require('express');
const dotenv = require('dotenv');
const passport = require('passport');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const responseTime = require('response-time');
const statusMonitor = require('express-status-monitor');
const { isESystemsMode } = require('./utils/esystems');

// Load env vars
dotenv.config();

// Import monitoring configuration
const {
  initSentry,
  initNewRelic,
  PerformanceMetrics,
  monitorDatabasePerformance,
  performanceMiddleware,
  errorTrackingMiddleware,
  Sentry
} = require('./config/monitoring');

// Debug environment variables on startup
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', process.env.PORT || 5000);
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);

// Import routes
const authRoutes = require('./routes/auth');
const authOAuthRoutes = require('./routes/auth-oauth');
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
const courseRoutes = require('./routes/courses');
const videosdkRoutes = require('./routes/videosdk');
const analyticsRoutes = require('./routes/analytics');
const fileRoutes = require('./routes/files');
const profileRoutes = require('./routes/profile');
const systemRoutes = require('./routes/system');
const adminModerationRoutes = require('./routes/adminModeration');
const monitoringRoutes = require('./routes/monitoring');
const adminNotificationRoutes = require('./routes/adminNotifications');
const adminInvitationRoutes = require('./routes/adminInvitations');
const healthRoutes = require('./routes/health');

// CLERK authentication routes (replaces LinkedIn OAuth)
let clerkAuthRoutes = null;
if (process.env.CLERK_SECRET_KEY) {
  try {
    clerkAuthRoutes = require('./routes/clerkAuth');
    console.log('Clerk authentication routes loaded successfully');
  } catch (error) {
    console.log('Clerk routes not available yet:', error.message);
  }
}

// Dynamic LinkedIn credentials based on mode (same logic as passport.js)
const getLinkedInCredentials = () => {
  if (isESystemsMode()) {
    return {
      clientId: process.env.LINKEDIN_ESYSTEMS_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_ESYSTEMS_CLIENT_SECRET
    };
  }
  return {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET
  };
};

// LinkedIn auth routes (DEPRECATED - available for both deployments if configured)
// TODO: Remove after Clerk migration is complete
let linkedinAuthRoutes = null;
const credentials = getLinkedInCredentials();
if (credentials.clientId && credentials.clientSecret) {
  try {
    // First try to load from backend/routes
    linkedinAuthRoutes = require('./routes/linkedinAuth');
    console.log('LinkedIn routes loaded successfully (DEPRECATED)');
  } catch (error) {
    // Fallback to esystems-backend if exists
    try {
      linkedinAuthRoutes = require('../esystems-backend/routes/linkedinAuth');
      console.log('LinkedIn routes loaded from esystems-backend (DEPRECATED)');
    } catch (fallbackError) {
      console.log('LinkedIn routes not found in either location, skipping...');
    }
  }
}

// Import middleware
const errorHandler = require('./middleware/error');
const { validateLinkedInConfig, logLinkedInRequest } = require('./middleware/linkedinValidation');



// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, allow specified CLIENT_URLs
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = [
        process.env.CLIENT_URL,
        process.env.ESYSTEMS_CLIENT_URL,
        'https://linkage-va-hub.onrender.com',
        'https://esystems-management-hub.onrender.com',
        'https://linkage-va-hub-api.onrender.com',
        'https://esystems-management-hub-api.onrender.com'
      ].filter(Boolean); // Remove undefined values
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development, allow localhost origins
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: corsOptions
});

// Initialize APM and monitoring
initNewRelic(); // Initialize New Relic if configured
initSentry(app); // Initialize Sentry if configured

// Create performance metrics instance
const performanceMetrics = new PerformanceMetrics();

// Monitor database performance
monitorDatabasePerformance(mongoose, performanceMetrics);

// Sentry request handler (must be first)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// Status monitor (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use(statusMonitor({
    title: 'Linkage VA Hub Status',
    path: '/status',
    spans: [{
      interval: 1,
      retention: 60
    }, {
      interval: 5,
      retention: 60
    }, {
      interval: 15,
      retention: 60
    }]
  }));
}

// Response time tracking
app.use(responseTime());

// Performance monitoring middleware
app.use(performanceMiddleware(performanceMetrics));

// Initialize Passport configuration (DEPRECATED - will be removed after Clerk migration)
require('./config/passport');
app.use(passport.initialize());

// Initialize Clerk (NEW)
if (process.env.CLERK_SECRET_KEY) {
  const { ClerkExpressWithAuth, clerkClient } = require('@clerk/clerk-sdk-node');
  
  // Configure Clerk client - the secret key is automatically used from environment
  console.log('Clerk authentication initialized');

  // Global Clerk middleware to populate req.auth for all requests
  app.use(ClerkExpressWithAuth());
} else {
  console.log('Clerk not configured - using legacy authentication');
}

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());

// Rate limiting with safe defaults to avoid NaN/undefined crashes when env vars are missing
const windowMinutes = parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10);
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '300', 10);
console.log('Rate limit config:', { windowMinutes, maxRequests });

const limiter = rateLimit({
  windowMs: windowMinutes * 60 * 1000,
  max: maxRequests
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// LinkedIn OAuth validation middleware
app.use(validateLinkedInConfig);
app.use(logLinkedInRequest);

// Test Clerk middleware
if (process.env.CLERK_SECRET_KEY) {
  const { testClerk } = require('./middleware/clerkAuth');
  app.use('/test-clerk', testClerk);
  console.log('Clerk test middleware added at /test-clerk');
}

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
app.use('/api/auth', authOAuthRoutes);
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
app.use('/api/courses', courseRoutes);
app.use('/api/videosdk', videosdkRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/files', fileRoutes); // File management routes
app.use('/api/profile', profileRoutes); // User profile management routes
app.use('/api/system', systemRoutes); // System status and health
app.use('/api/admin/moderation', adminModerationRoutes); // Admin moderation tools
app.use('/api/admin/notifications', adminNotificationRoutes); // Admin notification control
app.use('/api/admin/invitations', adminInvitationRoutes); // Admin invitation system

// Health and monitoring routes
app.use('/api/health', healthRoutes); // Health check endpoints
monitoringRoutes.setMetrics(performanceMetrics);
app.use('/api/monitoring', monitoringRoutes); // Performance monitoring

// Clerk authentication routes (NEW - replaces LinkedIn OAuth)
if (clerkAuthRoutes) {
  app.use('/api/clerk', clerkAuthRoutes);
  const deployment = process.env.ESYSTEMS_MODE === 'true' ? 'E Systems' : 'Linkage';
  console.log(`Clerk authentication routes enabled for ${deployment}`);
}

// LinkedIn integration routes (DEPRECATED - available for both deployments if configured)
// TODO: Remove after Clerk migration is complete
if (linkedinAuthRoutes) {
  app.use('/api/auth/linkedin', linkedinAuthRoutes);
  app.use('/api/linkedin', linkedinAuthRoutes);
  
  // Add diagnostics routes for debugging LinkedIn OAuth issues
  try {
    const linkedinDiagnostics = require('./routes/linkedinDiagnostics');
    app.use('/api/auth/linkedin', linkedinDiagnostics);
    console.log('LinkedIn diagnostics endpoints enabled');
  } catch (error) {
    console.log('LinkedIn diagnostics not available:', error.message);
  }
  
  const deployment = process.env.ESYSTEMS_MODE === 'true' ? 'E Systems' : 'Linkage';
  console.log(`LinkedIn authentication routes enabled for ${deployment} (DEPRECATED)`);
}

// Static files for uploads with CORS
app.use('/uploads', cors(corsOptions), express.static(path.join(__dirname, 'uploads')));

// Sentry error handler (must be before any other error middleware)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// Performance error tracking middleware
app.use(errorTrackingMiddleware(performanceMetrics));

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
