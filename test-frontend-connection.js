// Test script to verify frontend API configuration
const axios = require('axios');

// Test the exact same logic as the frontend
function inferApiBase() {
  try {
    if (typeof window !== 'undefined') {
      const { hostname, protocol } = window.location;

      // 1) Explicit domain mappings take precedence over env to avoid misconfigured REACT_APP_API_URL
      if (hostname.includes('esystems-management-hub.onrender.com')) {
        return 'https://esystems-backend.onrender.com/api';
      }
      if (hostname.includes('linkage-va-hub.onrender.com')) {
        return 'https://linkage-va-hub-api.onrender.com/api';
      }

      // 2) Same-origin reverse proxy (e.g., Nginx -> /api)
      // Only use same-origin for production, not for localhost development
      if ((protocol === 'https:' || protocol === 'http:') && !hostname.includes('localhost')) {
        return '/api';
      }
    }

    // 3) Server-side or unknown host: use env var then local fallback
    if (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim()) {
      return process.env.REACT_APP_API_URL.trim();
    }
    // For esystems development, use port 8000 (from esystems-backend/.env)
    // For linkage development, use port 5000 (from backend/.env)
    return process.env.SERVER_API_URL || 'http://localhost:8000/api';
  } catch {
    return process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  }
}

// Simulate different environments
console.log('🔍 Testing API URL inference logic...\n');

// Test 1: Production esystems
console.log('1. Production E-Systems (esystems-management-hub.onrender.com):');
const mockWindow1 = {
  location: { hostname: 'esystems-management-hub.onrender.com', protocol: 'https:' }
};
global.window = mockWindow1;
console.log('   URL:', inferApiBase());

// Test 2: Local development with env var
console.log('\n2. Local development with REACT_APP_API_URL:');
process.env.REACT_APP_API_URL = 'http://localhost:8000/api';
global.window = { location: { hostname: 'localhost:3001', protocol: 'http:' } };
console.log('   URL:', inferApiBase());

// Test 3: Local development without env var
console.log('\n3. Local development without REACT_APP_API_URL:');
delete process.env.REACT_APP_API_URL;
global.window = { location: { hostname: 'localhost:3001', protocol: 'http:' } };
console.log('   URL:', inferApiBase());

// Test 4: Test actual connection
console.log('\n4. Testing actual connection to inferred URL:');
const apiBase = inferApiBase();
console.log('   Connecting to:', apiBase);

const api = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
    'x-frontend-platform': 'esystems'
  },
  withCredentials: true
});

api.get('/auth/test-cors')
  .then(response => {
    console.log('   ✅ Connection successful!');
    console.log('   Response:', response.data);
  })
  .catch(error => {
    console.log('   ❌ Connection failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('   💡 Make sure esystems-backend is running on port 8000');
    }
  });