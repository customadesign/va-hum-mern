const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function setPassword() {
  try {
    await mongoose.connect('mongodb+srv://marketing:TaNN6bttM920rEjL@linkagevahub.0g6dji.mongodb.net/linkagevahub');

    const email = 'pat@murphyconsulting.us';
    const newPassword = 'B5tccpbx';

    const User = mongoose.connection.collection('users');
    const user = await User.findOne({ email });

    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update directly in database
    await User.updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );

    console.log('Password updated successfully for', email);

    // Verify it works
    const updatedUser = await User.findOne({ email });
    const isMatch = await bcrypt.compare(newPassword, updatedUser.password);
    console.log('Password verification:', isMatch ? '✅ SUCCESS' : '❌ FAILED');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setPassword();