const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function checkPassword() {
  try {
    await mongoose.connect('mongodb+srv://marketing:TaNN6bttM920rEjL@linkagevahub.0g6dji.mongodb.net/linkagevahub');

    const email = 'pat@murphyconsulting.us';
    const testPassword = 'B5tccpbx';

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    console.log('User found:', email);
    console.log('Password hash:', user.password);
    console.log('Hash length:', user.password?.length);
    console.log('Has password:', !!user.password);

    // Test bcrypt compare directly
    const match = await bcrypt.compare(testPassword, user.password);
    console.log('\nDirect bcrypt.compare result:', match);

    // Test with user method
    const matchMethod = await user.matchPassword(testPassword);
    console.log('user.matchPassword result:', matchMethod);

    // Create a fresh hash to compare
    const salt = await bcrypt.genSalt(10);
    const freshHash = await bcrypt.hash(testPassword, salt);
    console.log('\nFresh hash for comparison:', freshHash);
    const freshMatch = await bcrypt.compare(testPassword, freshHash);
    console.log('Fresh hash matches:', freshMatch);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPassword();