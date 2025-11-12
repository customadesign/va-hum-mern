const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function resetPassword() {
  try {
    await mongoose.connect('mongodb+srv://marketing:TaNN6bttM920rEjL@linkagevahub.0g6dji.mongodb.net/linkagevahub');

    const email = 'pat@murphyconsulting.us';
    const newPassword = 'B5tccpbx';

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    console.log('Password reset successfully for', email);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetPassword();