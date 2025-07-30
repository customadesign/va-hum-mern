#!/usr/bin/env node

/**
 * MongoDB Atlas Connection String Generator
 * 
 * This script helps you generate the complete MongoDB connection string
 * using your Atlas credentials.
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔗 MongoDB Atlas Connection String Generator');
console.log('==========================================\n');

console.log('Your credentials:');
console.log('✅ Cluster: LinkageVAhub');
console.log('✅ Project ID: 688a9f6ecb134566970a7765');
console.log('✅ Username: marketing');
console.log('✅ Password: TaNN6bttM920rEjL\n');

console.log('To get your complete connection string:');
console.log('1. Go to MongoDB Atlas dashboard');
console.log('2. Click "Connect" on your LinkageVAhub cluster');
console.log('3. Choose "Connect your application"');
console.log('4. Copy the connection string\n');

rl.question('Enter your cluster URL (e.g., linkagevahub.abc123.mongodb.net): ', (clusterUrl) => {
  if (!clusterUrl) {
    console.log('\n❌ Please provide the cluster URL');
    rl.close();
    return;
  }

  const connectionString = `mongodb+srv://marketing:TaNN6bttM920rEjL@${clusterUrl}/linkagevahub?retryWrites=true&w=majority`;
  
  console.log('\n🎉 Your MongoDB Connection String:');
  console.log('================================');
  console.log(connectionString);
  console.log('\n📝 Next steps:');
  console.log('1. Copy this connection string');
  console.log('2. Create a .env file in the backend directory');
  console.log('3. Add: MONGODB_URI=' + connectionString);
  console.log('4. Add other required environment variables');
  
  rl.close();
}); 