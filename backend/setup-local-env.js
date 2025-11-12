// Script to verify and set up local environment variables
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

console.log('Checking local environment setup...\n');

// Check if .env exists
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found! Please create one based on .env.example');
  process.exit(1);
}

// Read current .env
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

// Check for ESYSTEMS_FRONTEND_URL
const hasESystemsUrl = envLines.some(line => line.startsWith('ESYSTEMS_FRONTEND_URL'));

if (!hasESystemsUrl) {
  console.log('⚠️  ESYSTEMS_FRONTEND_URL not found in .env');
  console.log('Adding ESYSTEMS_FRONTEND_URL=http://localhost:3002\n');
  
  // Add the variable
  const updatedContent = envContent + '\n# E-Systems Frontend URL for registration redirects\nESYSTEMS_FRONTEND_URL=http://localhost:3002\n';
  fs.writeFileSync(envPath, updatedContent);
  console.log('✅ Added ESYSTEMS_FRONTEND_URL to .env');
} else {
  const urlLine = envLines.find(line => line.startsWith('ESYSTEMS_FRONTEND_URL'));
  console.log('✅ ESYSTEMS_FRONTEND_URL found:', urlLine);
}

// Check other required variables
const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'CLIENT_URL'
];

console.log('\nChecking other required variables:');
requiredVars.forEach(varName => {
  const exists = envLines.some(line => line.startsWith(varName + '='));
  if (exists) {
    console.log(`✅ ${varName} is set`);
  } else {
    console.log(`❌ ${varName} is missing`);
  }
});

console.log('\n📝 For local development, make sure:');
console.log('1. Backend is running on port 5000: npm run dev');
console.log('2. Frontend is running on port 3000: npm start');
console.log('3. E-Systems frontend on port 3002 (if needed)');
console.log('\n✅ Local environment check complete!');