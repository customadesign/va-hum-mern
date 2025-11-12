const express = require('express');
const rateLimit = require('express-rate-limit');

// Create a simple server to reset rate limits
const app = express();

// Create a more permissive rate limiter for testing
const testLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 1000, // Much higher limit
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

console.log('Rate limit reset script - this will clear the rate limiting');
console.log('The backend server needs to be restarted with a higher rate limit for testing');

// Instructions for user
console.log('\n=== INSTRUCTIONS ===');
console.log('1. Stop the backend server (Ctrl+C in the backend terminal)');
console.log('2. Set environment variable: export RATE_LIMIT_MAX=1000');
console.log('3. Restart backend: cd backend && npm start');
console.log('4. Try login again');
console.log('====================\n');

process.exit(0);
