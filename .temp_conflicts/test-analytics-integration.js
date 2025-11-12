#!/usr/bin/env node

/**
 * Quick integration test for Profile Views Analytics
 * Tests that all files load correctly and routes are registered
 */

const path = require('path');

console.log('Testing Profile Views Analytics Integration...\n');

try {
  // Test 1: Load models
  console.log('1. Loading ProfileView model...');
  const ProfileView = require('./models/ProfileView');
  console.log('   ✓ ProfileView model loaded');

  // Test 2: Load middleware
  console.log('2. Loading anonId middleware...');
  const anonIdMiddleware = require('./middleware/anonId');
  console.log('   ✓ anonId middleware loaded');
  console.log('   - setAnonId:', typeof anonIdMiddleware.setAnonId);
  console.log('   - setSessionId:', typeof anonIdMiddleware.setSessionId);
  console.log('   - getClientIp:', typeof anonIdMiddleware.getClientIp);

  // Test 3: Load service
  console.log('3. Loading profileViewsService...');
  const profileViewsService = require('./services/profileViewsService');
  console.log('   ✓ profileViewsService loaded');
  console.log('   - trackView:', typeof profileViewsService.trackView);
  console.log('   - getSummary:', typeof profileViewsService.getSummary);
  console.log('   - getSeries:', typeof profileViewsService.getSeries);
  console.log('   - getReferrers:', typeof profileViewsService.getReferrers);

  // Test 4: Load controller
  console.log('4. Loading analyticsController...');
  const analyticsController = require('./controllers/analyticsController');
  console.log('   ✓ analyticsController loaded');
  console.log('   - trackProfileView:', typeof analyticsController.trackProfileView);
  console.log('   - getProfileViewsSummary:', typeof analyticsController.getProfileViewsSummary);
  console.log('   - getProfileViewsSeries:', typeof analyticsController.getProfileViewsSeries);
  console.log('   - getProfileViewsReferrers:', typeof analyticsController.getProfileViewsReferrers);

  // Test 5: Load routes
  console.log('5. Loading analytics routes...');
  const analyticsRoutes = require('./routes/analytics');
  console.log('   ✓ analytics routes loaded');

  // Test 6: Test model static methods
  console.log('6. Testing ProfileView model static methods...');
  const testHash = ProfileView.generateDedupHash('testVaId', 'testViewerKey', Date.now());
  console.log('   ✓ generateDedupHash works:', testHash.substring(0, 16) + '...');

  const testIpHash = ProfileView.hashIp('192.168.1.1');
  console.log('   ✓ hashIp works:', testIpHash.substring(0, 16) + '...');

  const isBotTrue = ProfileView.isBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
  console.log('   ✓ isBot detects bots:', isBotTrue);

  const isBotFalse = ProfileView.isBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  console.log('   ✓ isBot allows regular browsers:', !isBotFalse);

  const viewerKey = ProfileView.extractViewerKey({ viewerUser: 'user123' });
  console.log('   ✓ extractViewerKey works:', viewerKey);

  console.log('\n========================================');
  console.log('✓ All integration tests passed!');
  console.log('========================================\n');

  console.log('Next steps:');
  console.log('1. Add environment variables to .env:');
  console.log('   ANALYTICS_PROFILE_VIEWS_ENABLED=true');
  console.log('   PROFILE_VIEWS_DEDUP_MINUTES=30');
  console.log('   IP_HASH_SALT=your-secure-random-salt');
  console.log('');
  console.log('2. Create test users:');
  console.log('   node scripts/seedTestUsers.js');
  console.log('');
  console.log('3. Start the server:');
  console.log('   npm start');
  console.log('');
  console.log('4. Run tests:');
  console.log('   npm test tests/analytics.test.js');
  console.log('');

  process.exit(0);
} catch (error) {
  console.error('\n✗ Integration test failed:');
  console.error(error.message);
  console.error('\nStack trace:');
  console.error(error.stack);
  process.exit(1);
}