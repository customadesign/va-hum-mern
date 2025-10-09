require('dotenv').config();
const mongoose = require('mongoose');
const VA = require('./models/VA');

async function checkVAStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const vaId = '68b0a91656fc851327f11c32';
    const va = await VA.findById(vaId);
    
    if (va) {
      console.log('VA found:');
      console.log('  Name:', va.name);
      console.log('  Search Status:', va.searchStatus);
      console.log('  Public Profile Key:', va.publicProfileKey);
    } else {
      console.log('VA not found with ID:', vaId);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkVAStatus();