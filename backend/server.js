const express = require('express');
const dotenv = require('dotenv');
const passport = require('passport');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
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
const analyticsRoutes = require('./routes/analytics');
const fileRoutes = require('./routes/files');
const profileRoutes = require('./routes/profile');
const systemRoutes = require('./routes/system');
const adminModerationRoutes = require('./routes/adminModeration');
const monitoringRoutes = require('./routes/monitoring');
const adminNotificationRoutes = require('./routes/adminNotifications');
const adminInvitationRoutes = require('./routes/adminInvitations');
const adminInterceptRoutes = require('./routes/adminIntercept');
const healthRoutes = require('./routes/health');
const announcementRoutes = require('./routes/announcements');
const billingRoutes = require('./routes/billing');
const settingsRoutes = require('./routes/settings');
const universalSearchRoutes = require('./routes/universalSearch');
const emailTestRoutes = require('./routes/emailTest');
const passwordResetRoutes = require('./routes/passwordReset');
const discordRoutes = require('./routes/discord');
const webinarRoutes = require('./routes/webinar');


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

// LinkedIn auth routes (available for both deployments if configured)
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
const { attachNotificationHelper, trackNotificationInteraction } = require('./middleware/notificationMiddleware');



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
        process.env.ADMIN_CLIENT_URL,
        'https://linkage-va-hub.onrender.com',
        'https://esystems-management-hub.onrender.com',
        'https://linkage-va-hub-api.onrender.com',
        'https://esystems-management-hub-api.onrender.com',
        'https://admin-3pxa.onrender.com',  // Old admin frontend URL
        'https://admin-frontend-zbi8.onrender.com'  // New admin frontend URL
      ].filter(Boolean); // Remove undefined values
      
      console.log('CORS check - Origin:', origin, 'Allowed origins:', allowedOrigins);
      
      if (allowedOrigins.includes(origin)) {
        console.log('CORS allowed for origin:', origin);
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-CSRF-Token'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200,
  maxAge: 86400 // Cache preflight for 24 hours
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

// Sentry request handler (must be first) - Disabled due to compatibility issues
// if (process.env.SENTRY_DSN) {
//   app.use(Sentry.Handlers.requestHandler());
//   app.use(Sentry.Handlers.tracingHandler());
// }

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

// Initialize Passport configuration
require('./config/passport');
app.use(passport.initialize());

// Security middleware with relaxed CSP for development
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:*", "https://images.unsplash.com"],
      mediaSrc: ["'self'", "http://localhost:*"],
      connectSrc: ["'self'", "http://localhost:*"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: null, // Disable for localhost
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow cross-origin access to uploads
}));
app.use(cors(corsOptions));
app.use(compression());

// Trust proxy for rate limiting (required for X-Forwarded-For header handling)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true);
} else {
  // In development, only trust localhost proxy
  app.set('trust proxy', 'loopback');
}

// Rate limiting with safe defaults to avoid NaN/undefined crashes when env vars are missing
const windowMinutes = parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10);
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '300', 10);
console.log('Rate limit config:', { windowMinutes, maxRequests });

const limiter = rateLimit({
  windowMs: windowMinutes * 60 * 1000,
  max: maxRequests
});
app.use('/api/', limiter);

// Body parser and cookie parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// LinkedIn OAuth validation middleware
app.use(validateLinkedInConfig);
app.use(logLinkedInRequest);

// Notification middleware - attach helpers to all requests
app.use(attachNotificationHelper);
app.use(trackNotificationInteraction);


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
app.use('/api/analytics', analyticsRoutes);
app.use('/api/files', fileRoutes); // File management routes
app.use('/api/profile', profileRoutes); // User profile management routes
app.use('/api/system', systemRoutes); // System status and health
app.use('/api/admin/moderation', adminModerationRoutes); // Admin moderation tools
app.use('/api/admin/notifications', adminNotificationRoutes); // Admin notification control
app.use('/api/admin/invitations', adminInvitationRoutes); // Admin invitation system
app.use('/api/admin/intercept', adminInterceptRoutes); // Admin intercept messaging system
app.use('/api/announcements', announcementRoutes); // Announcement system
app.use('/api/billing', billingRoutes); // Billing and trial management
app.use('/api/settings', settingsRoutes); // Business settings management
app.use('/api/admin/search', universalSearchRoutes); // Universal search for admin panel
app.use('/api/admin/settings', settingsRoutes); // Admin panel settings management
app.use('/api/email-test', emailTestRoutes); // Email configuration testing (admin only)
app.use('/api/password-reset', passwordResetRoutes); // Password reset system
app.use('/api/discord', discordRoutes); // Discord integration for notifications
app.use('/api/webinar', webinarRoutes); // Webinar registration system

// Health and monitoring routes
app.use('/api/health', healthRoutes); // Health check endpoints
monitoringRoutes.setMetrics(performanceMetrics);
app.use('/api/monitoring', monitoringRoutes); // Performance monitoring

// LinkedIn integration routes (available for both deployments if configured)
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

// Sentry error handler (must be before any other error middleware) - Disabled due to compatibility issues
// if (process.env.SENTRY_DSN) {
//   app.use(Sentry.Handlers.errorHandler());
// }

// Performance error tracking middleware
app.use(errorTrackingMiddleware(performanceMetrics));

// Error handler (must be last)
app.use(errorHandler);

// Socket.io connection handling with enhanced admin support
io.on('connection', (socket) => {
  console.log('New WebSocket connection');

  // Handle user room join
  socket.on('join', async (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
    
    // Check if user is admin and join admin room
    try {
      const User = require('./models/User');
      const user = await User.findById(userId);
      if (user && user.admin) {
        socket.join('admin-notifications');
        console.log(`Admin ${userId} joined admin notification room`);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  });

  // Handle user room leave
  socket.on('leave', (userId) => {
    socket.leave(userId);
    socket.leave('admin-notifications');
    console.log(`User ${userId} left their rooms`);
  });
  
  // Handle admin-specific events
  socket.on('join-admin-room', (adminId) => {
    socket.join('admin-notifications');
    socket.join(`admin-${adminId}`);
    console.log(`Admin ${adminId} joined admin rooms`);
  });
  
  socket.on('leave-admin-room', (adminId) => {
    socket.leave('admin-notifications');
    socket.leave(`admin-${adminId}`);
    console.log(`Admin ${adminId} left admin rooms`);
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { conversationId, userId } = data;
    console.log(`User ${userId} started typing in conversation ${conversationId}`);
    
    // Emit to all other participants in the conversation
    socket.to(`conversation-${conversationId}`).emit('typing_status', {
      conversationId,
      userId,
      isTyping: true
    });
  });

  socket.on('typing_stop', (data) => {
    const { conversationId, userId } = data;
    console.log(`User ${userId} stopped typing in conversation ${conversationId}`);
    
    // Emit to all other participants in the conversation
    socket.to(`conversation-${conversationId}`).emit('typing_status', {
      conversationId,
      userId,
      isTyping: false
    });
  });

  // Handle joining conversation rooms for real-time updates
  socket.on('join-conversation', (conversationId) => {
    socket.join(`conversation-${conversationId}`);
    console.log(`Socket joined conversation room: ${conversationId}`);
  });

  socket.on('leave-conversation', (conversationId) => {
    socket.leave(`conversation-${conversationId}`);
    console.log(`Socket left conversation room: ${conversationId}`);
  });

  // Handle notification acknowledgment
  socket.on('notification-acknowledged', async (data) => {
    const { notificationId, userId } = data;
    console.log(`Notification ${notificationId} acknowledged by user ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Make io accessible to routes
app.set('io', io);

// Import database connection
const connectDB = require('./config/database');
const ensureAdminUser = require('./utils/ensureAdminUser');

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Ensure admin user exists
    await ensureAdminUser();
  } catch (error) {
    console.error('Warning: Database connection failed:', error.message);
    console.log('Server will start with limited functionality (webinar routes will work)');
  }

  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log('Webinar registration endpoint available at: POST /api/webinar/register');
  });
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
