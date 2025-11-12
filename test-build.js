const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Testing TypeScript dependency resolution fix...');

// Remove existing package-lock.json files
const lockFiles = [
  'package-lock.json',
  'frontend/package-lock.json'
];

lockFiles.forEach(file => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`✅ Removed ${file}`);
  }
});

try {
  console.log('📦 Installing dependencies with legacy peer deps...');
  execSync('cd frontend && npm install --legacy-peer-deps', { stdio: 'inherit' });
  
  console.log('🔍 Checking TypeScript version...');
  const tsVersion = execSync('cd frontend && npm list typescript', { encoding: 'utf-8' });
  console.log('TypeScript version:', tsVersion);
  
  console.log('🏗️ Testing build...');
  execSync('cd frontend && npm run build', { stdio: 'inherit' });
  
  console.log('✅ Build successful! TypeScript dependency conflict resolved.');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}