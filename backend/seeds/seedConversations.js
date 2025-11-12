const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const VA = require('../models/VA');
const Business = require('../models/Business');
require('dotenv').config({ path: '.env' });

// Sample conversation scenarios to demonstrate UI/UX features
const conversationScenarios = [
  {
    name: 'Active Project Discussion',
    description: 'VA and business actively discussing an ongoing project',
    messageCount: 15,
    unreadForVA: 2,
    unreadForBusiness: 0,
    status: 'active'
  },
  {
    name: 'Initial Contact',
    description: 'Business reaching out to VA for the first time',
    messageCount: 3,
    unreadForVA: 1,
    unreadForBusiness: 0,
    status: 'active'
  },
  {
    name: 'Negotiation Phase',
    description: 'VA and business negotiating terms and rates',
    messageCount: 8,
    unreadForVA: 0,
    unreadForBusiness: 1,
    status: 'active'
  },
  {
    name: 'Long Conversation',
    description: 'Extended conversation with multiple topics',
    messageCount: 25,
    unreadForVA: 0,
    unreadForBusiness: 0,
    status: 'active'
  },
  {
    name: 'Archived Project',
    description: 'Completed project conversation',
    messageCount: 12,
    unreadForVA: 0,
    unreadForBusiness: 0,
    status: 'archived'
  },
  {
    name: 'Quick Exchange',
    description: 'Brief Q&A session',
    messageCount: 4,
    unreadForVA: 0,
    unreadForBusiness: 0,
    status: 'active'
  }
];

// Sample VAs
const sampleVAs = [
  {
    email: 'sarah.martinez@example.com',
    password: 'Test123!',
    profile: {
      name: 'Sarah Martinez',
      hero: 'Experienced Virtual Assistant specializing in Social Media Management & Content Creation',
      bio: 'With 5+ years of experience, I help businesses grow their online presence through strategic social media management and engaging content creation.',
      hourlyRate: 35,
      availability: 'fullTime',
      skills: ['Social Media Management', 'Content Writing', 'Graphic Design', 'Email Marketing'],
      industries: ['Technology', 'E-commerce', 'Healthcare']
    }
  },
  {
    email: 'david.chen@example.com',
    password: 'Test123!',
    profile: {
      name: 'David Chen',
      hero: 'Administrative Expert & Project Manager',
      bio: 'Dedicated VA with strong organizational skills and expertise in project management tools. I help streamline your business operations.',
      hourlyRate: 40,
      availability: 'partTime',
      skills: ['Project Management', 'Calendar Management', 'Data Entry', 'Customer Support'],
      industries: ['Finance', 'Real Estate', 'Professional Services']
    }
  },
  {
    email: 'emily.thompson@example.com',
    password: 'Test123!',
    profile: {
      name: 'Emily Thompson',
      hero: 'E-commerce Specialist & Customer Service Pro',
      bio: 'I help online businesses manage their stores, handle customer inquiries, and optimize their product listings for maximum sales.',
      hourlyRate: 30,
      availability: 'fullTime',
      skills: ['E-commerce Management', 'Customer Service', 'Product Research', 'Inventory Management'],
      industries: ['E-commerce', 'Retail', 'Fashion']
    }
  }
];

// Sample Businesses
const sampleBusinesses = [
  {
    email: 'techstartup@example.com',
    password: 'Test123!',
    profile: {
      company: 'TechStartup Inc.',
      name: 'Alex Johnson',
      website: 'https://techstartup.example.com',
      description: 'Fast-growing SaaS company looking for virtual assistance',
      industry: 'Technology'
    }
  },
  {
    email: 'creativestudio@example.com',
    password: 'Test123!',
    profile: {
      company: 'Creative Studio Co.',
      name: 'Maria Rodriguez',
      website: 'https://creativestudio.example.com',
      description: 'Digital marketing agency specializing in brand development',
      industry: 'Marketing'
    }
  },
  {
    email: 'ecommercebrand@example.com',
    password: 'Test123!',
    profile: {
      company: 'E-Commerce Brand LLC',
      name: 'James Wilson',
      website: 'https://ecommercebrand.example.com',
      description: 'Online retailer selling sustainable products',
      industry: 'E-commerce'
    }
  }
];

// Sample message templates for different conversation types
const messageTemplates = {
  initialContact: [
    "Hi {vaName}! I came across your profile and I'm impressed with your experience in {skill}. We're looking for someone to help with {task}.",
    "Thank you for reaching out! I'd be happy to discuss how I can help with your {task} needs. Could you tell me more about the scope of work?",
    "Sure! We need someone for approximately {hours} hours per week. The main tasks would include {tasks}. What's your availability like?",
  ],
  projectDiscussion: [
    "I've completed the first draft of the {deliverable}. Please find it attached. Let me know if you need any revisions.",
    "Great work! I've reviewed the {deliverable} and it looks fantastic. Just a few minor changes needed in the {section} section.",
    "Thanks for the feedback! I'll make those changes right away. Should have the updated version to you within the hour.",
    "Perfect! Also, could you start working on the {nextTask} next? We're aiming to launch by {date}.",
    "Absolutely! I'll start on that as soon as I finish the revisions. Do you have any specific requirements for the {nextTask}?",
  ],
  negotiation: [
    "Your profile looks great! What are your rates for {service}?",
    "My standard rate for {service} is ${rate}/hour. For long-term projects (3+ months), I offer a 10% discount.",
    "That sounds reasonable. How many hours per week could you commit to our project?",
    "I currently have {hours} hours available per week. I could start as early as {date}.",
    "Excellent! Let's schedule a video call to discuss the project details. Are you available {day} at {time}?",
  ],
  quickExchange: [
    "Quick question - do you have experience with {tool}?",
    "Yes, I've been using {tool} for {years} years. I'm quite proficient with it.",
    "Perfect! That's exactly what we need. I'll send over the project details shortly.",
    "Looking forward to it! Feel free to reach out if you have any other questions.",
  ]
};

// Helper function to generate messages
function generateMessages(scenario, va, business, startTime) {
  const messages = [];
  let currentTime = new Date(startTime);
  
  // Select appropriate template based on scenario
  let templates;
  if (scenario.name.includes('Initial Contact')) {
    templates = messageTemplates.initialContact;
  } else if (scenario.name.includes('Project Discussion')) {
    templates = messageTemplates.projectDiscussion;
  } else if (scenario.name.includes('Negotiation')) {
    templates = messageTemplates.negotiation;
  } else if (scenario.name.includes('Quick Exchange')) {
    templates = messageTemplates.quickExchange;
  } else {
    // Mix different types for long conversations
    templates = [
      ...messageTemplates.projectDiscussion,
      ...messageTemplates.negotiation,
      ...messageTemplates.initialContact
    ];
  }
  
  // Generate messages
  for (let i = 0; i < scenario.messageCount; i++) {
    const isFromVA = i % 2 === 1; // Alternate between business and VA
    const sender = isFromVA ? va : business;
    const template = templates[i % templates.length];
    
    // Replace placeholders in template
    let content = template
      .replace(/{vaName}/g, va.profile.name)
      .replace(/{skill}/g, va.profile.skills[0])
      .replace(/{task}/g, 'social media management')
      .replace(/{hours}/g, '20')
      .replace(/{tasks}/g, 'content creation, scheduling posts, and engagement')
      .replace(/{deliverable}/g, 'social media content calendar')
      .replace(/{section}/g, 'Instagram posts')
      .replace(/{nextTask}/g, 'email newsletter template')
      .replace(/{date}/g, 'next Friday')
      .replace(/{service}/g, va.profile.skills[0])
      .replace(/{rate}/g, va.profile.hourlyRate)
      .replace(/{day}/g, 'Tuesday')
      .replace(/{time}/g, '2 PM EST')
      .replace(/{tool}/g, 'Hootsuite')
      .replace(/{years}/g, '3');
    
    // Determine if message is read
    let isRead = true;
    if (i >= scenario.messageCount - scenario.unreadForVA && !isFromVA) {
      isRead = false; // Unread message for VA
    } else if (i >= scenario.messageCount - scenario.unreadForBusiness && isFromVA) {
      isRead = false; // Unread message for business
    }
    
    messages.push({
      sender: sender._id,
      content: content,
      read: isRead,
      createdAt: currentTime
    });
    
    // Increment time for next message (random interval between 5 minutes and 2 hours)
    const timeIncrement = Math.floor(Math.random() * 115 + 5) * 60 * 1000;
    currentTime = new Date(currentTime.getTime() + timeIncrement);
  }
  
  return messages;
}

async function seedConversations() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clean up existing test data
    console.log('Cleaning up existing test data...');
    const testEmails = [...sampleVAs.map(va => va.email), ...sampleBusinesses.map(b => b.email)];
    const testUsers = await User.find({ email: { $in: testEmails } });
    const testUserIds = testUsers.map(u => u._id);
    
    // Delete related data
    await Conversation.deleteMany({ 
      $or: [
        { participants: { $in: testUserIds } },
        { va: { $in: testUserIds } },
        { business: { $in: testUserIds } }
      ]
    });
    await VA.deleteMany({ user: { $in: testUserIds } });
    await Business.deleteMany({ user: { $in: testUserIds } });
    await User.deleteMany({ email: { $in: testEmails } });
    
    console.log('Cleaned up existing test data');

    // Create VA users
    console.log('Creating sample VA users...');
    const vaUsers = [];
    for (const vaData of sampleVAs) {
      const user = await User.create({
        email: vaData.email,
        password: vaData.password,
        confirmedAt: new Date()
      });
      
      const va = await VA.create({
        user: user._id,
        ...vaData.profile
      });
      
      user.va = va._id;
      await user.save();
      
      vaUsers.push(user);
      console.log(`Created VA: ${vaData.profile.name}`);
    }

    // Create Business users
    console.log('Creating sample business users...');
    const businessUsers = [];
    for (const businessData of sampleBusinesses) {
      const user = await User.create({
        email: businessData.email,
        password: businessData.password,
        confirmedAt: new Date()
      });
      
      const business = await Business.create({
        user: user._id,
        ...businessData.profile
      });
      
      user.business = business._id;
      await user.save();
      
      businessUsers.push(user);
      console.log(`Created Business: ${businessData.profile.company}`);
    }

    // Create conversations with different scenarios
    console.log('Creating sample conversations...');
    let conversationIndex = 0;
    
    for (const va of vaUsers) {
      for (const business of businessUsers) {
        if (conversationIndex >= conversationScenarios.length) break;
        
        const scenario = conversationScenarios[conversationIndex];
        const startTime = new Date(Date.now() - (conversationIndex + 1) * 24 * 60 * 60 * 1000); // Start time varies by days
        
        // Generate messages for this conversation
        const messages = generateMessages(scenario, va, business, startTime);
        
        // Calculate unread counts
        const unreadCount = {
          va: scenario.unreadForVA,
          business: scenario.unreadForBusiness
        };
        
        // Create conversation
        const conversation = await Conversation.create({
          participants: [va._id, business._id],
          va: va._id,
          business: business._id,
          messages: messages,
          lastMessage: messages[messages.length - 1].content,
          lastMessageAt: messages[messages.length - 1].createdAt,
          unreadCount: unreadCount,
          status: scenario.status
        });
        
        console.log(`Created conversation: ${scenario.name} between ${va.email} and ${business.email}`);
        conversationIndex++;
      }
      if (conversationIndex >= conversationScenarios.length) break;
    }

    // Create one admin user for testing
    console.log('Creating admin user...');
    const adminUser = await User.create({
      email: 'admin@example.com',
      password: 'Admin123!',
      admin: true,
      confirmedAt: new Date()
    });
    console.log('Created admin user: admin@example.com (password: Admin123!)');

    // Print summary
    console.log('\n=== Seed Complete ===');
    console.log(`Created ${vaUsers.length} VA users`);
    console.log(`Created ${businessUsers.length} Business users`);
    console.log(`Created ${conversationIndex} conversations`);
    console.log('\nTest Accounts:');
    console.log('VAs:');
    sampleVAs.forEach(va => {
      console.log(`  ${va.email} / ${va.password}`);
    });
    console.log('\nBusinesses:');
    sampleBusinesses.forEach(business => {
      console.log(`  ${business.email} / ${business.password}`);
    });
    console.log('\nAdmin:');
    console.log('  admin@example.com / Admin123!');
    console.log('\nYou can now log in to the application and view the conversations!');

  } catch (error) {
    console.error('Error seeding conversations:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed script
seedConversations();