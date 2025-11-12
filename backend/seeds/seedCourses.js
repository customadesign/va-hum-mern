require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const VA = require('../models/VA');
const User = require('../models/User');

const demoCoursesData = [
  {
    title: 'Virtual Assistant Fundamentals',
    description: 'Master the essential skills needed to become a successful virtual assistant. This comprehensive course covers communication, time management, project management tools, and client relationship building.',
    shortDescription: 'Learn the core skills every successful virtual assistant needs',
    category: 'business-management',
    level: 'beginner',
    price: 0,
    thumbnail: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=450&fit=crop',
    requirements: [
      'Basic computer skills',
      'Reliable internet connection',
      'Desire to learn and grow'
    ],
    whatYouWillLearn: [
      'Effective communication strategies for remote work',
      'Time management and productivity techniques',
      'Essential tools and software for VAs',
      'Client onboarding and relationship management',
      'Setting rates and managing invoices'
    ],
    tags: ['virtual-assistant', 'basics', 'remote-work', 'productivity'],
    isPublished: true,
    features: {
      certificateOffered: true,
      liveSessionsIncluded: true,
      downloadableResources: true,
      lifetimeAccess: true
    },
    lessons: [
      {
        title: 'Introduction to Virtual Assistance',
        description: 'Understanding the role and responsibilities of a virtual assistant',
        order: 1,
        duration: 1200, // 20 minutes
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoId: 'dQw4w9WgXcQ',
          resources: [
            {
              title: 'VA Checklist PDF',
              url: '/resources/va-checklist.pdf',
              type: 'pdf'
            }
          ]
        },
        isFree: true,
        isPublished: true
      },
      {
        title: 'Setting Up Your Virtual Office',
        description: 'Essential tools and workspace setup for maximum productivity',
        order: 2,
        duration: 1800, // 30 minutes
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoId: 'dQw4w9WgXcQ'
        },
        isPublished: true
      },
      {
        title: 'Communication Best Practices',
        description: 'Master professional communication in a remote environment',
        order: 3,
        duration: 1500, // 25 minutes
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoId: 'dQw4w9WgXcQ'
        },
        isPublished: true
      },
      {
        title: 'Live Q&A Session',
        description: 'Join our live session to ask questions and network with other VAs',
        order: 4,
        duration: 3600, // 60 minutes
        type: 'live',
        content: {
          liveSessionDetails: {
            scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
          }
        },
        isPublished: true
      },
      {
        title: 'Knowledge Check Quiz',
        description: 'Test your understanding of VA fundamentals',
        order: 5,
        duration: 600, // 10 minutes
        type: 'quiz',
        quiz: {
          questions: [
            {
              question: 'What is the most important skill for a virtual assistant?',
              options: ['Technical skills', 'Communication', 'Speed typing', 'Multitasking'],
              correctAnswer: 1,
              explanation: 'While all skills are important, effective communication is fundamental for remote work success.'
            },
            {
              question: 'Which tool is NOT commonly used by virtual assistants?',
              options: ['Slack', 'Trello', 'AutoCAD', 'Zoom'],
              correctAnswer: 2,
              explanation: 'AutoCAD is specialized software for design and engineering, not typically used by VAs.'
            }
          ],
          passingScore: 70
        },
        isPublished: true
      }
    ]
  },
  {
    title: 'Advanced Project Management for VAs',
    description: 'Take your project management skills to the next level with advanced techniques, tools, and strategies specifically designed for virtual assistants managing multiple clients and complex projects.',
    shortDescription: 'Master advanced project management techniques for virtual work',
    category: 'productivity',
    level: 'advanced',
    price: 49.99,
    thumbnail: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=450&fit=crop',
    requirements: [
      'Basic understanding of project management',
      'Experience as a VA (6+ months recommended)',
      'Familiarity with common PM tools'
    ],
    whatYouWillLearn: [
      'Advanced project planning and scheduling techniques',
      'Managing multiple clients and projects simultaneously',
      'Risk management and contingency planning',
      'Advanced features of Asana, Monday.com, and ClickUp',
      'Creating SOPs and process documentation'
    ],
    tags: ['project-management', 'advanced', 'productivity', 'tools'],
    isPublished: true,
    features: {
      certificateOffered: true,
      liveSessionsIncluded: false,
      downloadableResources: true,
      lifetimeAccess: true
    },
    lessons: [
      {
        title: 'Advanced Project Planning Strategies',
        description: 'Learn sophisticated planning techniques for complex projects',
        order: 1,
        duration: 2400, // 40 minutes
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoId: 'dQw4w9WgXcQ'
        },
        isPublished: true
      },
      {
        title: 'Multi-Client Project Management',
        description: 'Strategies for juggling multiple clients without dropping the ball',
        order: 2,
        duration: 2100, // 35 minutes
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoId: 'dQw4w9WgXcQ'
        },
        isPublished: true
      },
      {
        title: 'Creating Effective SOPs',
        description: 'Document your processes for consistency and scalability',
        order: 3,
        duration: 1800, // 30 minutes
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoId: 'dQw4w9WgXcQ',
          resources: [
            {
              title: 'SOP Template Pack',
              url: '/resources/sop-templates.zip',
              type: 'other'
            }
          ]
        },
        isPublished: true
      }
    ]
  },
  {
    title: 'Social Media Management Mastery',
    description: 'Become a social media expert and offer high-value services to your clients. Learn content creation, scheduling, analytics, and strategy development across all major platforms.',
    shortDescription: 'Master social media management for business growth',
    category: 'marketing',
    level: 'intermediate',
    price: 79.99,
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=450&fit=crop',
    requirements: [
      'Basic understanding of major social media platforms',
      'Creative mindset',
      'Basic graphic design knowledge helpful'
    ],
    whatYouWillLearn: [
      'Content strategy development for different platforms',
      'Creating engaging visual content with Canva',
      'Social media scheduling and automation',
      'Analytics and reporting for client success',
      'Community management best practices',
      'Paid advertising basics'
    ],
    tags: ['social-media', 'marketing', 'content-creation', 'analytics'],
    isPublished: true,
    features: {
      certificateOffered: true,
      liveSessionsIncluded: true,
      downloadableResources: true,
      lifetimeAccess: true
    },
    lessons: [
      {
        title: 'Platform Deep Dive: Instagram & Facebook',
        description: 'Master the nuances of Meta\'s platforms for business growth',
        order: 1,
        duration: 3000, // 50 minutes
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoId: 'dQw4w9WgXcQ'
        },
        isFree: true,
        isPublished: true
      },
      {
        title: 'Content Creation Workshop',
        description: 'Hands-on training in creating compelling social content',
        order: 2,
        duration: 2700, // 45 minutes
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoId: 'dQw4w9WgXcQ'
        },
        isPublished: true
      },
      {
        title: 'Analytics and Reporting',
        description: 'Turn data into insights your clients will love',
        order: 3,
        duration: 2400, // 40 minutes
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoId: 'dQw4w9WgXcQ',
          resources: [
            {
              title: 'Analytics Report Template',
              url: '/resources/analytics-template.xlsx',
              type: 'other'
            }
          ]
        },
        isPublished: true
      },
      {
        title: 'Final Project: Create a Social Media Strategy',
        description: 'Apply your knowledge to create a complete social media strategy',
        order: 4,
        duration: 3600, // 60 minutes estimate
        type: 'assignment',
        assignment: {
          instructions: 'Create a comprehensive 30-day social media strategy for a mock client. Include content calendar, posting schedule, and KPIs.',
          dueInDays: 7,
          attachmentRequired: true,
          maxScore: 100
        },
        isPublished: true
      }
    ]
  }
];

async function seedCourses() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing courses and lessons
    await Course.deleteMany({});
    await Lesson.deleteMany({});
    console.log('Cleared existing courses and lessons');

    // Get a VA to be the instructor (or create one)
    let instructor = await VA.findOne({});
    
    if (!instructor) {
      // Create a demo instructor
      const demoUser = await User.create({
        email: 'demo.instructor@linkage.com',
        password: 'DemoPass123!',
        confirmedAt: new Date(),
        admin: false
      });

      instructor = await VA.create({
        user: demoUser._id,
        name: 'Sarah Johnson',
        hero: 'Expert Virtual Assistant & Course Creator',
        bio: 'With over 10 years of experience as a virtual assistant and business consultant, I help VAs build successful careers through comprehensive training and mentorship.',
        website: 'https://linkage-va-hub.com',
        linkedin: 'https://linkedin.com/in/sarah-johnson-va'
      });

      console.log('Created demo instructor');
    }

    // Create courses
    for (const courseData of demoCoursesData) {
      const { lessons, ...courseInfo } = courseData;
      
      // Create the course
      const course = await Course.create({
        ...courseInfo,
        instructor: instructor._id
      });

      console.log(`Created course: ${course.title}`);

      // Create lessons for the course
      for (const lessonData of lessons) {
        const lesson = await Lesson.create({
          ...lessonData,
          course: course._id
        });
        console.log(`  - Added lesson: ${lesson.title}`);
      }
    }

    console.log('\nSeed data created successfully!');
    console.log(`Created ${demoCoursesData.length} courses with their lessons`);

  } catch (error) {
    console.error('Error seeding courses:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
if (require.main === module) {
  seedCourses();
}

module.exports = seedCourses;