#!/usr/bin/env node

/**
 * MongoDB Atlas Setup Script
 * 
 * This script helps you set up MongoDB Atlas connection for your MERN stack app.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 MongoDB Atlas Setup for Linkage VA Hub');
console.log('=========================================\n');

// Your credentials
const credentials = {
  cluster: 'LinkageVAhub',
  projectId: '688a9f6ecb134566970a7765',
  username: 'marketing',
  password: 'TaNN6bttM920rEjL'
};

console.log('📋 Your MongoDB Atlas Credentials:');
console.log(`   Cluster: ${credentials.cluster}`);
console.log(`   Project ID: ${credentials.projectId}`);
console.log(`   Username: ${credentials.username}`);
console.log(`   Password: ${credentials.password}\n`);

console.log('🔗 To get your connection string:');
console.log('1. Go to https://cloud.mongodb.com');
console.log('2. Sign in to your account');
console.log('3. Click on your "LinkageVAhub" cluster');
console.log('4. Click "Connect" button');
console.log('5. Choose "Connect your application"');
console.log('6. Copy the connection string\n');

rl.question('Enter your cluster URL (e.g., linkagevahub.abc123.mongodb.net): ', (clusterUrl) => {
  if (!clusterUrl) {
    console.log('\n❌ Please provide the cluster URL');
    rl.close();
    return;
  }

  // Generate connection string
  const connectionString = `mongodb+srv://${credentials.username}:${credentials.password}@${clusterUrl}/linkagevahub?retryWrites=true&w=majority`;
  
  console.log('\n✅ Generated Connection String:');
  console.log(connectionString);
  
  // Generate JWT secret
  const jwtSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // Create .env content
  const envContent = `# MongoDB Configuration
MONGODB_URI=${connectionString}

# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=${jwtSecret}
JWT_EXPIRE=30d

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Email Configuration (Optional - for email features)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
EMAIL_FROM=your_email@gmail.com
EMAIL_FROM_NAME=Linkage VA Hub

# Cloudinary Configuration (Optional - for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
`;

  // Write .env file
  const envPath = path.join(__dirname, 'backend', '.env');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Created .env file in backend directory');
    console.log(`📁 Location: ${envPath}`);
    
    console.log('\n🎉 Setup Complete!');
    console.log('================');
    console.log('✅ MongoDB connection string configured');
    console.log('✅ JWT secret generated');
    console.log('✅ Environment variables set up');
    
    console.log('\n📝 Next steps:');
    console.log('1. Install dependencies: npm run install-all');
    console.log('2. Start the development server: npm run dev');
    console.log('3. Test the connection by visiting: http://localhost:5000/health');
    
  } catch (error) {
    console.error('\n❌ Error creating .env file:', error.message);
  }
  
  rl.close();
}); 