const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const VA = require('./models/VA');
const Business = require('./models/Business');
const User = require('./models/User');
const Message = require('./models/Message');
const Course = require('./models/Course');
const Lesson = require('./models/Lesson');

const updateUploadUrls = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let updatedCount = 0;

    // Update VA profiles
    const vas = await VA.find({
      $or: [
        { avatar: { $regex: 'localhost:8000' } },
        { coverImage: { $regex: 'localhost:8000' } },
        { portfolio: { $elemMatch: { url: { $regex: 'localhost:8000' } } } }
      ]
    });

    for (const va of vas) {
      let updated = false;
      
      if (va.avatar && va.avatar.includes('localhost:8000')) {
        va.avatar = va.avatar.replace('localhost:8000', 'localhost:5000');
        updated = true;
      }
      
      if (va.coverImage && va.coverImage.includes('localhost:8000')) {
        va.coverImage = va.coverImage.replace('localhost:8000', 'localhost:5000');
        updated = true;
      }
      
      if (va.portfolio && Array.isArray(va.portfolio)) {
        va.portfolio.forEach(item => {
          if (item.url && item.url.includes('localhost:8000')) {
            item.url = item.url.replace('localhost:8000', 'localhost:5000');
            updated = true;
          }
        });
      }
      
      if (updated) {
        await va.save();
        updatedCount++;
        console.log(`Updated VA profile: ${va._id}`);
      }
    }

    // Update Business profiles
    const businesses = await Business.find({
      avatar: { $regex: 'localhost:8000' }
    });

    for (const business of businesses) {
      if (business.avatar && business.avatar.includes('localhost:8000')) {
        business.avatar = business.avatar.replace('localhost:8000', 'localhost:5000');
        await business.save();
        updatedCount++;
        console.log(`Updated Business profile: ${business._id}`);
      }
    }

    // Update User profiles
    const users = await User.find({
      avatar: { $regex: 'localhost:8000' }
    });

    for (const user of users) {
      if (user.avatar && user.avatar.includes('localhost:8000')) {
        user.avatar = user.avatar.replace('localhost:8000', 'localhost:5000');
        await user.save();
        updatedCount++;
        console.log(`Updated User profile: ${user._id}`);
      }
    }

    // Update Message attachments
    const messages = await Message.find({
      'attachments.url': { $regex: 'localhost:8000' }
    });

    for (const message of messages) {
      let updated = false;
      
      if (message.attachments && Array.isArray(message.attachments)) {
        message.attachments.forEach(attachment => {
          if (attachment.url && attachment.url.includes('localhost:8000')) {
            attachment.url = attachment.url.replace('localhost:8000', 'localhost:5000');
            updated = true;
          }
        });
      }
      
      if (updated) {
        await message.save();
        updatedCount++;
        console.log(`Updated Message attachments: ${message._id}`);
      }
    }

    // Update Course thumbnails and preview videos
    const courses = await Course.find({
      $or: [
        { thumbnail: { $regex: 'localhost:8000' } },
        { previewVideo: { $regex: 'localhost:8000' } }
      ]
    });

    for (const course of courses) {
      let updated = false;
      
      if (course.thumbnail && course.thumbnail.includes('localhost:8000')) {
        course.thumbnail = course.thumbnail.replace('localhost:8000', 'localhost:5000');
        updated = true;
      }
      
      if (course.previewVideo && course.previewVideo.includes('localhost:8000')) {
        course.previewVideo = course.previewVideo.replace('localhost:8000', 'localhost:5000');
        updated = true;
      }
      
      if (updated) {
        await course.save();
        updatedCount++;
        console.log(`Updated Course: ${course._id}`);
      }
    }

    // Update Lesson content URLs
    const lessons = await Lesson.find({
      $or: [
        { 'content.videoUrl': { $regex: 'localhost:8000' } },
        { 'content.resources.url': { $regex: 'localhost:8000' } }
      ]
    });

    for (const lesson of lessons) {
      let updated = false;
      
      if (lesson.content && lesson.content.videoUrl && lesson.content.videoUrl.includes('localhost:8000')) {
        lesson.content.videoUrl = lesson.content.videoUrl.replace('localhost:8000', 'localhost:5000');
        updated = true;
      }
      
      if (lesson.content && lesson.content.resources && Array.isArray(lesson.content.resources)) {
        lesson.content.resources.forEach(resource => {
          if (resource.url && resource.url.includes('localhost:8000')) {
            resource.url = resource.url.replace('localhost:8000', 'localhost:5000');
            updated = true;
          }
        });
      }
      
      if (updated) {
        await lesson.save();
        updatedCount++;
        console.log(`Updated Lesson: ${lesson._id}`);
      }
    }

    console.log(`\n✅ Migration completed! Updated ${updatedCount} records.`);
    
    // Show some examples of what was updated
    const sampleVA = await VA.findOne({ avatar: { $regex: 'localhost:5000' } });
    if (sampleVA) {
      console.log('\nExample updated VA avatar URL:', sampleVA.avatar);
    }

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the migration
updateUploadUrls();
