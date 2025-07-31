const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const VA = require('../models/VA');
const Location = require('../models/Location');
const Specialty = require('../models/Specialty');
const RoleType = require('../models/RoleType');
const RoleLevel = require('../models/RoleLevel');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Unsplash avatar IDs from Rails seed
const avatarIds = [
  'photo-1570295999919-56ceb5ecca61',
  'photo-1580489944761-15a19d654956',
  'photo-1633332755192-727a05c4013d',
  'photo-1607746882042-944635dfe10e',
  'photo-1438761681033-6461ffad8d80',
  'photo-1507003211169-0a1dd7228f2d',
  'photo-1628890923662-2cb23c2e0cfe',
  'photo-1472099645785-5658abf4ff4e',
  'photo-1628890920690-9e29d0019b9b',
  'photo-1544725176-7c40e5a71c5e',
  'photo-1568602471122-7832951cc4c5',
  'photo-1629467057571-42d22d8f0cbd',
  'photo-1628157588553-5eeea00af15c',
  'photo-1535713875002-d1d0cf377fde',
  'photo-1566492031773-4f4e44671857',
  'photo-1543610892-0b1f7e6d8ac1',
  'photo-1527980965255-d3b416303d12',
  'photo-1639149888905-fb39731f2e6c',
  'photo-1608889175123-8ee362201f81',
  'photo-1634896941598-b6b500a502a7',
  'photo-1569913486515-b74bf7751574',
  'photo-1640951613773-54706e06851d',
  'photo-1608889825205-eebdb9fc5806',
  'photo-1568822617270-2c1579f8dfe2',
  'photo-1558898479-33c0057a5d12'
];

// Cover image Unsplash IDs
const coverImageIds = [
  'photo-1497032628192-86f99bcd76bc', // workspace
  'photo-1498050108023-c5249f4df085', // code laptop
  'photo-1519389950473-47ba0277781c', // office tech
  'photo-1460925895917-afdab827c52f', // analytics
  'photo-1454165804606-c3d57bc86b40', // business desk
  'photo-1551434678-e076c223a692', // office team
  'photo-1556761175-5973dc0f32e7', // marketing
  'photo-1522071820081-009f0129c71c', // teamwork
  'photo-1553877522-43269d4ea984', // planning
  'photo-1517245386807-bb43f82c33c4', // meeting
  'photo-1497215728101-856f4ea42174', // office space
  'photo-1486312338219-ce68d2c6f44d', // working laptop
  'photo-1504384308090-c894fdcc538d', // office workspace
  'photo-1521737604893-d14cc237f11d', // team collaboration
  'photo-1505373877841-8d25f7d46678', // business meeting
  'photo-1542744094-3a31f272c490', // clean desk
  'photo-1517048676732-d65bc937f952', // conference
  'photo-1497366216548-37526070297c', // modern office
  'photo-1497366754035-f200581a8d4b', // minimal workspace
  'photo-1497366811353-6870744d04b2', // office interior
  'photo-1486406146926-c627a92ad1ab', // business building
  'photo-1497366412874-3415097a27e7', // workspace setup
  'photo-1498049860654-af1a5c566876', // creative office
  'photo-1504384764586-bb4cdc1707b0', // productivity
  'photo-1523240795612-9a054b0db644' // team work
];

// VA profiles data matching Rails seed
const vaProfiles = [
  {
    name: "Maria Santos",
    email: "maria.santos@example.com",
    hero: "Expert E-commerce VA specializing in Shopify and Amazon FBA",
    bio: "I'm a dedicated virtual assistant with 5+ years of experience helping e-commerce businesses scale their operations. I specialize in Shopify store management, Amazon FBA operations, inventory tracking, and customer service. I've helped over 50+ businesses increase their sales by 30% through efficient store management and customer support.",
    specialties: ["E-commerce Management", "Customer Service", "Inventory Management", "Product Listing"],
    location: {city: "Manila", country: "Philippines"},
    searchStatus: 'actively_looking',
    responseRate: 95
  },
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    hero: "Social Media Marketing Specialist & Content Creator",
    bio: "Creative social media manager with expertise in growing Instagram, Facebook, and TikTok accounts. I create engaging content, manage posting schedules, and develop social media strategies that drive engagement and conversions. My clients have seen 200% average follower growth in 6 months.",
    specialties: ["Social Media Management", "Content Writing", "Digital Marketing", "Graphic Design"],
    location: {city: "Cebu City", country: "Philippines"},
    searchStatus: 'actively_looking',
    responseRate: 92
  },
  {
    name: "David Chen",
    email: "david.chen@example.com",
    hero: "Financial & Bookkeeping Expert for Small Businesses",
    bio: "Certified QuickBooks ProAdvisor with 7+ years in accounting and bookkeeping. I help small businesses maintain accurate financial records, process invoices, reconcile accounts, and prepare financial reports. I'm experienced with QuickBooks, Xero, and Excel for financial analysis.",
    specialties: ["Bookkeeping", "Accounting", "Financial Analysis", "Data Entry"],
    location: {city: "Makati", country: "Philippines"},
    searchStatus: 'open',
    responseRate: 98
  },
  {
    name: "Jennifer Lopez",
    email: "jennifer.lopez@example.com",
    hero: "Executive Assistant & Project Management Professional",
    bio: "Highly organized executive assistant with expertise in calendar management, travel planning, and project coordination. I support C-level executives and entrepreneurs by streamlining their operations and ensuring nothing falls through the cracks. Proficient in Asana, Trello, and Microsoft Office.",
    specialties: ["Executive Assistant", "Project Management", "Calendar Management", "Travel Planning"],
    location: {city: "Quezon City", country: "Philippines"},
    searchStatus: 'actively_looking',
    responseRate: 96
  },
  {
    name: "Michael Rodriguez",
    email: "michael.rodriguez@example.com",
    hero: "WordPress Developer & Website Maintenance Specialist",
    bio: "Full-stack WordPress developer specializing in custom themes, plugin development, and website optimization. I help businesses maintain their online presence with regular updates, security monitoring, and performance optimization. Expert in PHP, HTML, CSS, and JavaScript.",
    specialties: ["WordPress Management", "Web Design", "Website Maintenance", "Basic Web Development"],
    location: {city: "Davao City", country: "Philippines"},
    searchStatus: 'actively_looking',
    responseRate: 89
  },
  {
    name: "Lisa Wang",
    email: "lisa.wang@example.com",
    hero: "Content Writer & SEO Specialist",
    bio: "Professional content writer with expertise in SEO writing, blog posts, and copywriting. I've written over 1000+ articles for various niches including tech, health, finance, and e-commerce. My content consistently ranks on the first page of Google and drives organic traffic growth.",
    specialties: ["Content Writing", "SEO Writing", "Blog Writing", "Copywriting"],
    location: {city: "Iloilo City", country: "Philippines"},
    searchStatus: 'open',
    responseRate: 94
  },
  {
    name: "Robert Anderson",
    email: "robert.anderson@example.com",
    hero: "Lead Generation & Sales Support Specialist",
    bio: "Results-driven lead generation expert with a proven track record of helping B2B companies build robust sales pipelines. I specialize in LinkedIn outreach, email marketing, and CRM management. My lead generation campaigns have helped clients achieve 40% increase in qualified leads.",
    specialties: ["Lead Generation", "Sales Support", "CRM Management", "Email Marketing"],
    location: {city: "Baguio", country: "Philippines"},
    searchStatus: 'actively_looking',
    responseRate: 91
  },
  {
    name: "Emily Davis",
    email: "emily.davis@example.com",
    hero: "Graphic Designer & Brand Identity Expert",
    bio: "Creative graphic designer specializing in brand identity, logo design, and marketing materials. I help businesses establish strong visual identities that resonate with their target audience. Proficient in Adobe Creative Suite, Canva, and Figma.",
    specialties: ["Graphic Design", "Logo Design", "Branding", "Video Editing"],
    location: {city: "Cagayan de Oro", country: "Philippines"},
    searchStatus: 'actively_looking',
    responseRate: 87
  },
  {
    name: "James Wilson",
    email: "james.wilson@example.com",
    hero: "Customer Support & Live Chat Specialist",
    bio: "Experienced customer support representative with expertise in live chat, email support, and help desk management. I provide exceptional customer service that builds loyalty and drives positive reviews. Skilled in Zendesk, Intercom, and various CRM platforms.",
    specialties: ["Customer Support", "Live Chat Support", "Help Desk", "Technical Support"],
    location: {city: "Zamboanga City", country: "Philippines"},
    searchStatus: 'open',
    responseRate: 93
  },
  {
    name: "Amanda Thompson",
    email: "amanda.thompson@example.com",
    hero: "Data Analysis & Research Professional",
    bio: "Detail-oriented data analyst with expertise in market research, data entry, and business intelligence. I help companies make data-driven decisions by providing comprehensive analysis and actionable insights. Proficient in Excel, Google Sheets, and various research tools.",
    specialties: ["Data Analysis", "Market Research", "Data Entry", "Research"],
    location: {city: "Bacolod", country: "Philippines"},
    searchStatus: 'actively_looking',
    responseRate: 90
  },
  {
    name: "Carlos Mendoza",
    email: "carlos.mendoza@example.com",
    hero: "Real Estate VA & Transaction Coordinator",
    bio: "Specialized real estate virtual assistant with experience in transaction coordination, lead management, and property research. I help real estate agents and brokers streamline their operations and close more deals efficiently.",
    specialties: ["Real Estate Support", "Lead Generation", "Administrative Support", "CRM Management"],
    location: {city: "Las Piñas", country: "Philippines"},
    searchStatus: 'actively_looking',
    responseRate: 88
  },
  {
    name: "Rachel Green",
    email: "rachel.green@example.com",
    hero: "Human Resources & Recruitment Specialist",
    bio: "HR professional with expertise in recruitment, employee onboarding, and training coordination. I help growing companies build strong teams by streamlining their hiring processes and improving employee experience.",
    specialties: ["Human Resources", "Recruitment", "Training & Development", "Administrative Support"],
    location: {city: "Taguig", country: "Philippines"},
    searchStatus: 'open',
    responseRate: 95
  },
  {
    name: "Antonio Silva",
    email: "antonio.silva@example.com",
    hero: "Email Marketing & Automation Expert",
    bio: "Email marketing specialist with expertise in campaign creation, automation setup, and list management. I help businesses nurture leads and drive conversions through strategic email marketing campaigns. Expert in Mailchimp, ConvertKit, and ActiveCampaign.",
    specialties: ["Email Marketing", "Digital Marketing", "Lead Generation", "Content Writing"],
    location: {city: "Pasig", country: "Philippines"},
    searchStatus: 'actively_looking',
    responseRate: 92
  },
  {
    name: "Sophie Turner",
    email: "sophie.turner@example.com",
    hero: "Event Planning & Virtual Assistant",
    bio: "Creative event planner specializing in virtual and hybrid events. I coordinate all aspects of event management from planning to execution, ensuring seamless experiences for attendees. Experienced with Zoom, Teams, and various event platforms.",
    specialties: ["Event Planning", "Project Management", "Administrative Support", "Calendar Management"],
    location: {city: "Antipolo", country: "Philippines"},
    searchStatus: 'actively_looking',
    responseRate: 89
  },
  {
    name: "Thomas Kim",
    email: "thomas.kim@example.com",
    hero: "Technical Support & QA Specialist",
    bio: "Technical support professional with expertise in software testing, quality assurance, and customer technical support. I help SaaS companies maintain high-quality products and provide excellent technical support to their users.",
    specialties: ["Technical Support", "Quality Assurance", "App Testing", "Customer Support"],
    location: {city: "Caloocan", country: "Philippines"},
    searchStatus: 'open',
    responseRate: 94
  },
  {
    name: "Isabella Martinez",
    email: "isabella.martinez@example.com",
    hero: "Translation & Content Localization Expert",
    bio: "Professional translator fluent in English, Spanish, and Filipino. I help businesses expand globally by providing accurate translation and content localization services. Specialized in marketing materials, websites, and business documents.",
    specialties: ["Translation Services", "Content Writing", "Transcription", "Content Moderation"],
    location: {city: "Marikina", country: "Philippines"},
    searchStatus: 'actively_looking',
    responseRate: 96
  },
  {
    name: "Kevin Brown",
    email: "kevin.brown@example.com",
    hero: "Video Editing & Content Production Specialist",
    bio: "Creative video editor specializing in YouTube content, social media videos, and promotional materials. I help content creators and businesses produce engaging videos that drive views and conversions. Expert in Adobe Premiere Pro, After Effects, and DaVinci Resolve.",
    specialties: ["Video Editing", "Photo Editing", "Content Writing", "Social Media Management"],
    location: {city: "Parañaque", country: "Philippines"},
    searchStatus: 'actively_looking',
    responseRate: 86
  },
  {
    name: "Olivia Johnson",
    email: "olivia.johnson@example.com",
    hero: "Legal Virtual Assistant & Document Management",
    bio: "Experienced legal assistant providing comprehensive support to law firms and legal departments. I handle document preparation, case management, legal research, and client communication. Proficient in legal terminology and various case management software.",
    specialties: ["Legal Support", "Document Management", "Research", "Administrative Support"],
    location: {city: "Muntinlupa", country: "Philippines"},
    searchStatus: 'open',
    responseRate: 93
  },
  {
    name: "Daniel Lee",
    email: "daniel.lee@example.com",
    hero: "E-learning & Course Creation Specialist",
    bio: "E-learning specialist helping educators and businesses create engaging online courses. I manage LMS platforms, create course content, and provide technical support for online learning programs. Expert in Teachable, Thinkific, and Moodle.",
    specialties: ["E-learning Support", "Content Writing", "Video Editing", "Administrative Support"],
    location: {city: "Valenzuela", country: "Philippines"},
    searchStatus: 'actively_looking',
    responseRate: 88
  },
  {
    name: "Grace Taylor",
    email: "grace.taylor@example.com",
    hero: "Healthcare VA & Medical Administrative Support",
    bio: "Healthcare virtual assistant with experience in medical billing, appointment scheduling, and patient communication. I help medical practices improve their administrative efficiency while maintaining HIPAA compliance. Knowledgeable in medical terminology and EHR systems.",
    specialties: ["Healthcare Administration", "Data Entry", "Customer Service", "Administrative Support"],
    location: {city: "San Juan", country: "Philippines"},
    searchStatus: 'actively_looking',
    responseRate: 91
  },
  {
    name: "Alex Rivera",
    email: "alex.rivera@example.com",
    hero: "Podcast Manager & Audio Content Specialist",
    bio: "Podcast production specialist managing all aspects of podcast creation from editing to distribution. I help podcasters grow their audience through strategic content planning and technical excellence. Proficient in Audacity, Adobe Audition, and podcast hosting platforms.",
    specialties: ["Podcast Management", "Audio Editing", "Content Writing", "Social Media Management"],
    location: {city: "Malabon", country: "Philippines"},
    searchStatus: 'open',
    responseRate: 87
  },
  {
    name: "Natalie Foster",
    email: "natalie.foster@example.com",
    hero: "Amazon FBA & E-commerce Operations Expert",
    bio: "Amazon FBA specialist helping sellers optimize their product listings, manage inventory, and increase sales. I handle product research, listing optimization, PPC campaigns, and customer communication. Experienced with Helium 10, Jungle Scout, and Seller Central.",
    specialties: ["Amazon FBA", "E-commerce Management", "Product Research", "Customer Service"],
    location: {city: "Navotas", country: "Philippines"},
    searchStatus: 'actively_looking',
    responseRate: 94
  },
  {
    name: "Ryan Cooper",
    email: "ryan.cooper@example.com",
    hero: "Cryptocurrency & Blockchain Support Specialist",
    bio: "Crypto-savvy virtual assistant providing support for blockchain projects and cryptocurrency businesses. I manage community engagement, create educational content, and provide technical support for crypto platforms. Well-versed in DeFi, NFTs, and blockchain technology.",
    specialties: ["Cryptocurrency Support", "Community Management", "Content Writing", "Technical Support"],
    location: {city: "Pateros", country: "Philippines"},
    searchStatus: 'actively_looking',
    responseRate: 85
  },
  {
    name: "Maya Patel",
    email: "maya.patel@example.com",
    hero: "Travel Planning & Hospitality VA",
    bio: "Travel specialist helping busy professionals and businesses manage their travel arrangements. I handle flight bookings, hotel reservations, itinerary planning, and expense tracking. Expert in travel booking platforms and expense management tools.",
    specialties: ["Travel Planning", "Administrative Support", "Calendar Management", "Research"],
    location: {city: "Taguig", country: "Philippines"},
    searchStatus: 'open',
    responseRate: 92
  },
  {
    name: "Harper Wilson",
    email: "harper.wilson@example.com",
    hero: "Pinterest Marketing & Visual Content Strategist",
    bio: "Pinterest marketing expert helping businesses drive traffic and sales through strategic pin creation and board management. I create eye-catching graphics, optimize pin descriptions, and develop Pinterest SEO strategies that increase visibility and engagement.",
    specialties: ["Pinterest Marketing", "Graphic Design", "Content Writing", "Social Media Management"],
    location: {city: "Pasay", country: "Philippines"},
    searchStatus: 'actively_looking',
    responseRate: 86
  }
];

// Create specialties mapping
const specialtyCategories = {
  'E-commerce Management': 'technical',
  'Customer Service': 'customer_service',
  'Inventory Management': 'administrative',
  'Product Listing': 'technical',
  'Social Media Management': 'marketing',
  'Content Writing': 'creative',
  'Digital Marketing': 'marketing',
  'Graphic Design': 'creative',
  'Bookkeeping': 'administrative',
  'Accounting': 'administrative',
  'Financial Analysis': 'administrative',
  'Data Entry': 'administrative',
  'Executive Assistant': 'administrative',
  'Project Management': 'administrative',
  'Calendar Management': 'administrative',
  'Travel Planning': 'administrative',
  'WordPress Management': 'technical',
  'Web Design': 'creative',
  'Website Maintenance': 'technical',
  'Basic Web Development': 'technical',
  'SEO Writing': 'marketing',
  'Blog Writing': 'creative',
  'Copywriting': 'creative',
  'Lead Generation': 'sales',
  'Sales Support': 'sales',
  'CRM Management': 'technical',
  'Email Marketing': 'marketing',
  'Logo Design': 'creative',
  'Branding': 'creative',
  'Video Editing': 'creative',
  'Customer Support': 'customer_service',
  'Live Chat Support': 'customer_service',
  'Help Desk': 'customer_service',
  'Technical Support': 'technical',
  'Data Analysis': 'technical',
  'Market Research': 'administrative',
  'Research': 'administrative',
  'Real Estate Support': 'administrative',
  'Administrative Support': 'administrative',
  'Human Resources': 'administrative',
  'Recruitment': 'administrative',
  'Training & Development': 'administrative',
  'Event Planning': 'administrative',
  'Quality Assurance': 'technical',
  'App Testing': 'technical',
  'Translation Services': 'creative',
  'Transcription': 'administrative',
  'Content Moderation': 'administrative',
  'Photo Editing': 'creative',
  'Legal Support': 'administrative',
  'Document Management': 'administrative',
  'E-learning Support': 'technical',
  'Healthcare Administration': 'administrative',
  'Podcast Management': 'creative',
  'Audio Editing': 'creative',
  'Amazon FBA': 'technical',
  'Product Research': 'administrative',
  'Cryptocurrency Support': 'technical',
  'Community Management': 'marketing',
  'Pinterest Marketing': 'marketing'
};

async function seedVAs() {
  try {
    console.log('🌱 Starting VA seeding process...');
    
    // Create specialties if they don't exist
    console.log('📌 Creating specialties...');
    const specialtyMap = {};
    
    for (const [name, category] of Object.entries(specialtyCategories)) {
      let specialty = await Specialty.findOne({ name });
      if (!specialty) {
        const slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();
        specialty = await Specialty.create({
          name,
          slug,
          category,
          description: `Specialization in ${name}`,
          isActive: true
        });
      }
      specialtyMap[name] = specialty._id;
    }
    
    // Create VAs
    console.log(`👥 Creating ${vaProfiles.length} test VAs...`);
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    for (let i = 0; i < vaProfiles.length; i++) {
      const profile = vaProfiles[i];
      
      try {
        console.log(`Creating VA ${i + 1}/${vaProfiles.length}: ${profile.name}`);
        
        // Skip if user already exists
        const existingUser = await User.findOne({ email: profile.email });
        if (existingUser) {
          console.log(`  ⏭️ Skipping - already exists`);
          continue;
        }
        
        // Create user
        const user = await User.create({
          email: profile.email,
          password: hashedPassword,
          role: 'va',
          isEmailVerified: true
        });
        
        // Create location
        const location = await Location.create({
          city: profile.location.city,
          state: 'NCR',
          country: profile.location.country,
          countryCode: 'PH',
          timeZone: 'Asia/Manila',
          utcOffset: 8
        });
        
        // Create VA record first
        const va = await VA.create({
          user: user._id,
          name: profile.name,
          hero: profile.hero,
          bio: profile.bio,
          email: profile.email,
          phone: `+63 9${Math.floor(Math.random() * 900000000) + 100000000}`,
          searchStatus: profile.searchStatus,
          responseRate: profile.responseRate,
          location: location._id,
          specialties: profile.specialties.map(s => specialtyMap[s]).filter(Boolean),
          avatar: `https://images.unsplash.com/${avatarIds[i % avatarIds.length]}?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`,
          coverImage: `https://images.unsplash.com/${coverImageIds[i % coverImageIds.length]}?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=400&q=80`,
          conversationsCount: Math.floor(Math.random() * 20),
          featuredAt: i < 4 ? new Date() : null // Feature first 4 VAs
        });
        
        // Create role type after VA
        const roleType = await RoleType.create({
          va: va._id,
          partTimeContract: Math.random() > 0.3,
          fullTimeContract: Math.random() > 0.2,
          fullTimeEmployment: Math.random() > 0.4
        });
        
        // Create role level after VA
        const roleLevel = await RoleLevel.create({
          va: va._id,
          junior: i % 3 === 0,
          mid: i % 3 === 1,
          senior: i % 3 === 2,
          principal: i % 5 === 0,
          cLevel: i % 10 === 0
        });
        
        // Update VA with roleType and roleLevel references
        va.roleType = roleType._id;
        va.roleLevel = roleLevel._id;
        await va.save();
        
        console.log(`  ✅ Created: ${va.name} with ${va.specialties.length} specialties`);
        
      } catch (error) {
        console.log(`  ❌ Error creating ${profile.name}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 VA seeding completed successfully!');
    console.log(`Total VAs in database: ${await VA.countDocuments()}`);
    console.log(`Total Specialties: ${await Specialty.countDocuments()}`);
    
  } catch (error) {
    console.error('❌ Error seeding VAs:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the seed function
seedVAs();