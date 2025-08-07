const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('=== Clerk Configuration Verification ===\n');

// Check Clerk environment variables
const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const clerkPublishableKey = process.env.CLERK_PUBLISHABLE_KEY || process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

console.log('1. Backend Configuration:');
console.log(`   - CLERK_SECRET_KEY: ${clerkSecretKey ? '✓ Set' : '✗ Missing'}`);
if (clerkSecretKey) {
  console.log(`     Length: ${clerkSecretKey.length} characters`);
  console.log(`     Starts with: ${clerkSecretKey.substring(0, 8)}...`);
  console.log(`     Ends with: ...${clerkSecretKey.substring(clerkSecretKey.length - 4)}`);
}

console.log('\n2. Frontend Configuration:');
console.log(`   - CLERK_PUBLISHABLE_KEY: ${clerkPublishableKey ? '✓ Set' : '✗ Missing'}`);
if (clerkPublishableKey) {
  console.log(`     Length: ${clerkPublishableKey.length} characters`);
  console.log(`     Full key: ${clerkPublishableKey}`);
  
  // Check for common issues
  if (clerkPublishableKey.endsWith('$')) {
    console.log('     ⚠️  WARNING: Key ends with "$" character - this may cause authentication errors!');
    console.log('     Suggested fix: Remove the trailing "$" from the environment variable');
    console.log(`     Corrected key: ${clerkPublishableKey.slice(0, -1)}`);
  }
  
  if (!clerkPublishableKey.startsWith('pk_')) {
    console.log('     ⚠️  WARNING: Key should start with "pk_" for publishable keys');
  }
  
  if (clerkPublishableKey.includes(' ')) {
    console.log('     ⚠️  WARNING: Key contains spaces - this will cause authentication errors!');
  }
}

console.log('\n3. Environment Mode:');
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   - PORT: ${process.env.PORT || 5000}`);

console.log('\n4. Recommendations:');
if (!clerkSecretKey) {
  console.log('   • Add CLERK_SECRET_KEY to your backend .env file');
}
if (!clerkPublishableKey) {
  console.log('   • Add REACT_APP_CLERK_PUBLISHABLE_KEY to your frontend .env file');
}
if (clerkPublishableKey && clerkPublishableKey.endsWith('$')) {
  console.log('   • Remove the trailing "$" from REACT_APP_CLERK_PUBLISHABLE_KEY');
  console.log('   • Update on Render.com: Environment > Edit Variables');
}

console.log('\n=== End of Verification ===');