const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const VA = require('../models/VA');
const Business = require('../models/Business');
require('dotenv').config({ path: '.env' });

// Enhanced conversation scenarios with richer content
const conversationScenarios = [
  {
    name: 'Contract Negotiation with Attachments',
    description: 'VA and business exchanging contracts and documents',
    messages: [
      {
        fromVA: false,
        content: 'Hi Sarah! I\'ve reviewed your profile and I think you\'d be perfect for our social media management needs. I\'ve attached our standard contractor agreement for your review.',
        hasAttachment: true,
        attachment: {
          filename: 'Contractor_Agreement_2024.pdf',
          url: 'https://example.com/files/contract.pdf',
          size: 245000,
          contentType: 'application/pdf'
        },
        hiringFeeAcknowledged: true
      },
      {
        fromVA: true,
        content: 'Thank you for sending over the agreement! I\'ve reviewed it and everything looks good. I just have a few questions about the payment terms in section 3.2.',
        hasAttachment: false
      },
      {
        fromVA: false,
        content: 'Great questions! We typically process payments on a NET-30 basis. I\'ve also attached our onboarding checklist to help you get started.',
        hasAttachment: true,
        attachment: {
          filename: 'Onboarding_Checklist.docx',
          url: 'https://example.com/files/onboarding.docx',
          size: 125000,
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
      },
      {
        fromVA: true,
        content: 'Perfect! I\'ve signed the agreement and attached it here. Looking forward to getting started on Monday!',
        hasAttachment: true,
        attachment: {
          filename: 'Signed_Contract_SarahM.pdf',
          url: 'https://example.com/files/signed_contract.pdf',
          size: 280000,
          contentType: 'application/pdf'
        }
      }
    ]
  },
  {
    name: 'Project Deliverables Exchange',
    description: 'VA submitting work and receiving feedback',
    messages: [
      {
        fromVA: true,
        content: 'Hi Team! I\'ve completed the social media content calendar for next month. Please find it attached along with the graphics for the first week.',
        hasAttachment: true,
        attachment: {
          filename: 'Social_Media_Calendar_March2024.xlsx',
          url: 'https://example.com/files/calendar.xlsx',
          size: 450000,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      },
      {
        fromVA: false,
        content: 'Excellent work on the calendar! The graphics look amazing. Could you also create Instagram story templates using the same design theme?',
        hasAttachment: false
      },
      {
        fromVA: true,
        content: 'Absolutely! I\'ve created 5 story templates. Here\'s a ZIP file with all the templates in both Canva and PNG formats.',
        hasAttachment: true,
        attachment: {
          filename: 'Instagram_Story_Templates.zip',
          url: 'https://example.com/files/templates.zip',
          size: 3200000,
          contentType: 'application/zip'
        }
      }
    ]
  },
  {
    name: 'Rich Text Formatting Demo',
    description: 'Messages with various formatting styles',
    messages: [
      {
        fromVA: false,
        content: 'Welcome to the team! Here are your **main responsibilities**:\n\n1. Social Media Management\n2. Content Creation\n3. Email Marketing\n\nPlease review and let me know if you have any questions.',
        bodyHtml: 'Welcome to the team! Here are your <strong>main responsibilities</strong>:<br><br>1. Social Media Management<br>2. Content Creation<br>3. Email Marketing<br><br>Please review and let me know if you have any questions.'
      },
      {
        fromVA: true,
        content: 'Thank you! I\'m excited to get started. I have experience with:\n\n**Social Media Platforms:**\n- Facebook & Instagram\n- LinkedIn\n- Twitter/X\n- TikTok\n\n*Looking forward to contributing to your team!*',
        bodyHtml: 'Thank you! I\'m excited to get started. I have experience with:<br><br><strong>Social Media Platforms:</strong><br>- Facebook & Instagram<br>- LinkedIn<br>- Twitter/X<br>- TikTok<br><br><em>Looking forward to contributing to your team!</em>'
      }
    ]
  },
  {
    name: 'Urgent Task Discussion',
    description: 'Time-sensitive project with quick responses',
    messages: [
      {
        fromVA: false,
        content: '🚨 URGENT: We need to respond to a PR situation on social media. Are you available to help craft responses?',
        bodyHtml: '🚨 <strong>URGENT</strong>: We need to respond to a PR situation on social media. Are you available to help craft responses?'
      },
      {
        fromVA: true,
        content: 'Yes, I\'m online now! I can help immediately. What\'s the situation?',
        responseTime: 2 // minutes
      },
      {
        fromVA: false,
        content: 'A customer posted a negative review that\'s gaining traction. I\'ve attached screenshots of the posts and our draft response.',
        hasAttachment: true,
        attachment: {
          filename: 'Social_Media_Crisis_Screenshots.pdf',
          url: 'https://example.com/files/screenshots.pdf',
          size: 890000,
          contentType: 'application/pdf'
        },
        responseTime: 3
      },
      {
        fromVA: true,
        content: 'I\'ve reviewed everything. Here\'s my suggested response that addresses their concerns while maintaining our brand voice. I\'ve also included a follow-up strategy.',
        hasAttachment: true,
        attachment: {
          filename: 'Crisis_Response_Strategy.docx',
          url: 'https://example.com/files/response.docx',
          size: 125000,
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        },
        responseTime: 15
      }
    ]
  },
  {
    name: 'Long-term Project Updates',
    description: 'Weekly check-ins and progress reports',
    messages: [
      {
        fromVA: true,
        content: '**Weekly Report - Week 1**\n\n✅ Completed:\n- Set up social media scheduling tool\n- Created 15 posts for next week\n- Responded to 47 customer inquiries\n\n📊 Metrics:\n- Engagement up 23%\n- Response time: < 2 hours avg\n\n🎯 Next Week:\n- Launch Instagram contest\n- Create email newsletter',
        bodyHtml: '<strong>Weekly Report - Week 1</strong><br><br>✅ Completed:<br>- Set up social media scheduling tool<br>- Created 15 posts for next week<br>- Responded to 47 customer inquiries<br><br>📊 Metrics:<br>- Engagement up 23%<br>- Response time: < 2 hours avg<br><br>🎯 Next Week:<br>- Launch Instagram contest<br>- Create email newsletter'
      },
      {
        fromVA: false,
        content: 'Fantastic progress! The engagement metrics are impressive. For the Instagram contest, please coordinate with our design team for the graphics.',
        responseTime: 180 // 3 hours later
      }
    ]
  }
];

// Sample VAs with enhanced profiles - FIXED availability values to match enum
const sampleVAs = [
  {
    email: 'sarah.martinez.va@example.com',
    password: 'Test123!',
    profile: {
      name: 'Sarah Martinez',
      hero: 'Social Media Expert | Content Creator | 5+ Years Experience',
      bio: 'I help businesses build engaging online communities and create content that converts. Specialized in Instagram, TikTok, and LinkedIn strategies.',
      hourlyRate: 45,
      availability: 'immediately', // Fixed to match enum values
      skills: ['Social Media Management', 'Content Creation', 'Copywriting', 'Graphic Design', 'Video Editing'],
      industries: ['E-commerce', 'Technology', 'Fashion', 'Health & Wellness']
    }
  },
  {
    email: 'michael.chang.va@example.com',
    password: 'Test123!',
    profile: {
      name: 'Michael Chang',
      hero: 'Executive Assistant | Project Manager | Systems Optimizer',
      bio: 'Former corporate EA with 10 years experience supporting C-level executives. Expert in calendar management, travel coordination, and process optimization.',
      hourlyRate: 55,
      availability: 'immediately', // Fixed to match enum values
      skills: ['Executive Support', 'Project Management', 'Calendar Management', 'Travel Planning', 'Event Coordination'],
      industries: ['Finance', 'Technology', 'Consulting', 'Real Estate']
    }
  },
  {
    email: 'jessica.taylor.va@example.com',
    password: 'Test123!',
    profile: {
      name: 'Jessica Taylor',
      hero: 'E-commerce Specialist | Customer Success Manager',
      bio: 'I help online stores increase sales through excellent customer service, product optimization, and inventory management. Shopify & Amazon expert.',
      hourlyRate: 35,
      availability: 'within_week', // Fixed to match enum values
      skills: ['E-commerce Management', 'Customer Service', 'Product Listings', 'Inventory Management', 'Email Support'],
      industries: ['E-commerce', 'Retail', 'Fashion', 'Beauty']
    }
  }
];

// Sample Businesses with enhanced profiles - FIXED to include required fields
const sampleBusinesses = [
  {
    email: 'innovate.tech@example.com',
    password: 'Test123!',
    profile: {
      company: 'InnovateTech Solutions',
      contactName: 'Alexandra Chen', // Added required field
      bio: 'AI-powered SaaS platform revolutionizing business analytics. Series B startup with 50+ employees.', // Added required field
      website: 'https://innovatetech.example.com',
      description: 'AI-powered SaaS platform revolutionizing business analytics. Series B startup with 50+ employees.',
      industry: 'Technology'
    }
  },
  {
    email: 'luxe.fashion@example.com',
    password: 'Test123!',
    profile: {
      company: 'Luxe Fashion House',
      contactName: 'Marcus Thompson', // Added required field
      bio: 'Premium sustainable fashion brand with global reach. Featured in Vogue and Forbes.', // Added required field
      website: 'https://luxefashion.example.com',
      description: 'Premium sustainable fashion brand with global reach. Featured in Vogue and Forbes.',
      industry: 'Fashion'
    }
  },
  {
    email: 'growth.marketing@example.com',
    password: 'Test123!',
    profile: {
      company: 'Growth Marketing Agency',
      contactName: 'Sofia Rodriguez', // Added required field
      bio: 'Full-service digital marketing agency helping brands scale through data-driven strategies.', // Added required field
      website: 'https://growthmarketing.example.com',
      description: 'Full-service digital marketing agency helping brands scale through data-driven strategies.',
      industry: 'Marketing'
    }
  }
];

async function seedMessagesAdvanced() {
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
    await Message.deleteMany({ sender: { $in: testUserIds } });
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
    console.log('Creating enhanced VA profiles...');
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
      
      vaUsers.push({ user, va });
      console.log(`Created VA: ${vaData.profile.name} (${vaData.email})`);
    }

    // Create Business users
    console.log('Creating enhanced business profiles...');
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
      
      businessUsers.push({ user, business });
      console.log(`Created Business: ${businessData.profile.company} (${businessData.email})`);
    }

    // Create conversations with messages using the Message model
    console.log('Creating conversations with rich messages...');
    let scenarioIndex = 0;
    const createdConversations = [];
    
    for (let i = 0; i < vaUsers.length && scenarioIndex < conversationScenarios.length; i++) {
      for (let j = 0; j < businessUsers.length && scenarioIndex < conversationScenarios.length; j++) {
        const va = vaUsers[i];
        const business = businessUsers[j];
        const scenario = conversationScenarios[scenarioIndex];
        
        // Create conversation first
        const conversation = await Conversation.create({
          participants: [va.user._id, business.user._id],
          va: va.user._id,
          business: business.user._id,
          messages: [], // We'll use the Message model instead
          status: 'active'
        });
        
        console.log(`\nCreating conversation: ${scenario.name}`);
        console.log(`Between ${va.user.email} and ${business.user.email}`);
        
        // Create messages for this conversation
        let currentTime = new Date(Date.now() - (scenarioIndex + 1) * 24 * 60 * 60 * 1000);
        
        for (const msgData of scenario.messages) {
          const isFromVA = msgData.fromVA;
          const sender = isFromVA ? va : business;
          const senderModel = isFromVA ? 'VA' : 'Business';
          
          // Create message object
          const messageData = {
            conversation: conversation._id,
            sender: sender.user._id,
            senderModel: senderModel,
            body: msgData.content,
            bodyHtml: msgData.bodyHtml || msgData.content.replace(/\n/g, '<br>'),
            hiringFeeAcknowledged: msgData.hiringFeeAcknowledged || false,
            createdAt: currentTime
          };
          
          // Add attachment if present
          if (msgData.hasAttachment && msgData.attachment) {
            messageData.attachments = [msgData.attachment];
          }
          
          // Create the message
          const message = await Message.create(messageData);
          
          // Update conversation with message reference
          conversation.messages.push({
            sender: sender.user._id,
            content: msgData.content,
            read: Math.random() > 0.3, // 70% messages are read
            createdAt: currentTime
          });
          
          // Update conversation's last message info
          conversation.lastMessage = msgData.content;
          conversation.lastMessageAt = currentTime;
          
          // Increment time for next message
          const responseTime = msgData.responseTime || Math.floor(Math.random() * 120 + 10); // 10-130 minutes
          currentTime = new Date(currentTime.getTime() + responseTime * 60 * 1000);
          
          console.log(`  - Message ${isFromVA ? 'from VA' : 'from Business'}: "${msgData.content.substring(0, 50)}..."`);
          if (msgData.hasAttachment) {
            console.log(`    + Attachment: ${msgData.attachment.filename}`);
          }
        }
        
        // Update unread counts
        const unreadForVA = Math.floor(Math.random() * 3);
        const unreadForBusiness = Math.floor(Math.random() * 2);
        conversation.unreadCount = {
          va: unreadForVA,
          business: unreadForBusiness
        };
        
        await conversation.save();
        createdConversations.push(conversation);
        scenarioIndex++;
      }
    }

    // Create one power user with multiple conversations
    console.log('\nCreating power user scenario...');
    const powerUser = await User.create({
      email: 'power.user@example.com',
      password: 'Test123!',
      confirmedAt: new Date()
    });
    
    const powerBusiness = await Business.create({
      user: powerUser._id,
      company: 'MegaCorp Enterprises',
      contactName: 'Richard Sterling',
      bio: 'Fortune 500 company with diverse VA needs across multiple departments',
      website: 'https://megacorp.example.com',
      description: 'Fortune 500 company with diverse VA needs across multiple departments',
      industry: 'Enterprise'
    });
    
    powerUser.business = powerBusiness._id;
    await powerUser.save();
    
    // Create conversations with all VAs for the power user
    for (const va of vaUsers) {
      const conversation = await Conversation.create({
        participants: [va.user._id, powerUser._id],
        va: va.user._id,
        business: powerUser._id,
        messages: [{
          sender: powerUser._id,
          content: `Hi ${va.va.name}! We have multiple projects that could use your expertise. Let's discuss how we can work together.`,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        }],
        lastMessage: `Hi ${va.va.name}! We have multiple projects that could use your expertise. Let's discuss how we can work together.`,
        lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        unreadCount: { va: 1, business: 0 },
        status: 'active'
      });
      
      console.log(`Created conversation between Power User and ${va.user.email}`);
    }

    // Create admin user
    console.log('\nCreating admin user...');
    await User.create({
      email: 'admin@vahub.com',
      password: 'Admin123!',
      admin: true,
      confirmedAt: new Date()
    });

    // Print summary
    console.log('\n=== Advanced Seed Complete ===');
    console.log(`Created ${vaUsers.length} VAs with enhanced profiles`);
    console.log(`Created ${businessUsers.length} Businesses with detailed info`);
    console.log(`Created ${createdConversations.length} conversations with rich messages`);
    console.log(`Created 1 power user with multiple conversations`);
    console.log(`Created 1 admin user`);
    
    console.log('\n📧 Test Accounts:');
    console.log('\n🧑‍💼 Virtual Assistants:');
    sampleVAs.forEach(va => {
      console.log(`  ${va.email} / ${va.password} - ${va.profile.hero}`);
    });
    
    console.log('\n🏢 Businesses:');
    sampleBusinesses.forEach(business => {
      console.log(`  ${business.email} / ${business.password} - ${business.profile.company}`);
    });
    
    console.log('\n💪 Power User:');
    console.log('  power.user@example.com / Test123! - Has conversations with all VAs');
    
    console.log('\n👨‍💼 Admin:');
    console.log('  admin@vahub.com / Admin123! - Can view all conversations');
    
    console.log('\n✨ Features Demonstrated:');
    console.log('  - File attachments (PDFs, DOCs, Images, ZIP files)');
    console.log('  - Rich text formatting (bold, italic, line breaks)');
    console.log('  - Hiring fee acknowledgment');
    console.log('  - Various conversation lengths and types');
    console.log('  - Read/unread status');
    console.log('  - Time-based message flow');
    console.log('\n🚀 Visit https://linkage-va-hub.onrender.com/conversations to see the results!');

  } catch (error) {
    console.error('Error seeding advanced messages:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the seed script
seedMessagesAdvanced();