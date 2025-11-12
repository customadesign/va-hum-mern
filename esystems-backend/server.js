// E-Systems Management Hub Backend
// This is a wrapper that sets E-Systems mode and runs the main server

process.env.ESYSTEMS_MODE = 'true';

// Import and run the main server
require('../backend/server.js');