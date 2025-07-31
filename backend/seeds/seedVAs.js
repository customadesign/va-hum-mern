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

// Filipino names and cities
const filipinoFirstNames = ['Maria', 'Juan', 'Ana', 'Jose', 'Rosa', 'Pedro', 'Carmen', 'Manuel', 'Teresa', 'Francisco', 
  'Isabel', 'Antonio', 'Lucia', 'Miguel', 'Elena', 'Carlos', 'Sofia', 'Luis', 'Patricia', 'Roberto',
  'Angelica', 'Ricardo', 'Cristina', 'Eduardo', 'Beatriz'];

const filipinoLastNames = ['Santos', 'Reyes', 'Cruz', 'Garcia', 'Mendoza', 'Torres', 'Flores', 'Gonzales', 'Bautista', 'Villanueva',
  'Fernandez', 'Lopez', 'Hernandez', 'Castillo', 'Francisco', 'Ramos', 'Mercado', 'Aquino', 'Navarro', 'Salazar',
  'Gutierrez', 'Padilla', 'Santiago', 'Rivera', 'Morales'];

const philippineCities = ['Manila', 'Quezon City', 'Makati', 'Cebu City', 'Davao City', 'Caloocan', 'Taguig', 'Pasig', 
  'Parañaque', 'Las Piñas', 'Antipolo', 'Valenzuela', 'Marikina', 'Muntinlupa', 'Pasay',
  'Bacoor', 'San Jose del Monte', 'Cagayan de Oro', 'Dasmarinas', 'Iloilo City'];

// Industries and specialties by category
const industriesData = {
  ecommerce: ['E-commerce Management', 'Product Listing', 'Inventory Management', 'Shopify Management', 'Amazon FBA Support'],
  marketing: ['Social Media Management', 'Content Writing', 'Email Marketing', 'SEO Writing', 'Digital Marketing'],
  finance: ['Bookkeeping', 'Accounting', 'Financial Analysis', 'QuickBooks', 'Payroll Processing'],
  administrative: ['Executive Assistant', 'Calendar Management', 'Travel Planning', 'Data Entry', 'Document Management'],
  technology: ['WordPress Management', 'Basic Web Development', 'Technical Support', 'Database Management', 'API Integration'],
  customerservice: ['Customer Support', 'Live Chat Support', 'Help Desk', 'Order Processing', 'Complaint Resolution'],
  creative: ['Graphic Design', 'Video Editing', 'Logo Design', 'Branding', 'Photo Editing'],
  sales: ['Lead Generation', 'Sales Support', 'CRM Management', 'Cold Calling', 'Sales Reporting']
};

// VA profile templates
const profileTemplates = [
  {
    heroTemplate: "Expert {industry} VA with {years}+ years helping businesses scale",
    bioTemplate: "I'm a dedicated virtual assistant specializing in {specialties}. With over {years} years of experience, I've helped {clients}+ businesses improve their operations and increase efficiency. My expertise includes {skills}, and I'm passionate about delivering high-quality results that exceed expectations.",
    hourlyRate: { min: 5, max: 15 }
  },
  {
    heroTemplate: "Professional {industry} specialist focused on growth and efficiency",
    bioTemplate: "Experienced VA with a strong background in {specialties}. I've successfully managed {projects}+ projects for clients across various industries. My approach combines {skills} to deliver comprehensive solutions that drive real business results. I pride myself on being detail-oriented and proactive.",
    hourlyRate: { min: 8, max: 20 }
  },
  {
    heroTemplate: "Results-driven {industry} VA helping businesses succeed online",
    bioTemplate: "As a skilled virtual assistant, I specialize in {specialties}. Throughout my {years}-year career, I've helped businesses streamline their processes and achieve their goals. I'm proficient in {skills} and committed to providing exceptional service that makes a real difference.",
    hourlyRate: { min: 10, max: 25 }
  }
];

// Random avatar URLs (using placeholder service)
const getRandomAvatar = (name, index) => {
  const avatarServices = [
    `https://i.pravatar.cc/400?img=${index % 70}`, // pravatar has 70 images
    `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'women' : 'men'}/${index % 100}.jpg`
  ];
  return avatarServices[index % 2];
};

// Skills by industry
const skillsByIndustry = {
  ecommerce: ['Shopify', 'WooCommerce', 'Product Research', 'Inventory Software', 'Order Fulfillment'],
  marketing: ['Canva', 'Hootsuite', 'Buffer', 'Google Analytics', 'Facebook Ads Manager'],
  finance: ['QuickBooks', 'Xero', 'Excel', 'Financial Reporting', 'Tax Preparation'],
  administrative: ['Microsoft Office', 'Google Workspace', 'Calendly', 'Slack', 'Asana'],
  technology: ['WordPress', 'HTML/CSS', 'cPanel', 'MySQL', 'JavaScript basics'],
  customerservice: ['Zendesk', 'Freshdesk', 'LiveChat', 'Intercom', 'HelpScout'],
  creative: ['Adobe Photoshop', 'Illustrator', 'Premiere Pro', 'Figma', 'After Effects'],
  sales: ['Salesforce', 'HubSpot', 'Pipedrive', 'LinkedIn Sales Navigator', 'Cold Email Tools']
};

// Certifications
const certifications = [
  'Google Analytics Certified',
  'QuickBooks ProAdvisor',
  'HubSpot Content Marketing',
  'Facebook Blueprint',
  'Microsoft Office Specialist',
  'Adobe Certified Associate',
  'Project Management Professional',
  'Six Sigma Yellow Belt'
];

async function seedVAs() {
  try {
    console.log('🌱 Starting VA seeding process...');
    
    // Create specialties if they don't exist
    console.log('📌 Creating specialties...');
    const specialtyMap = {};
    for (const [industry, specs] of Object.entries(industriesData)) {
      for (const specName of specs) {
        let specialty = await Specialty.findOne({ name: specName });
        if (!specialty) {
          specialty = await Specialty.create({
            name: specName,
            slug: specName.toLowerCase().replace(/\s+/g, '-'),
            category: industry === 'technology' ? 'technical' : 
                     industry === 'administrative' ? 'administrative' :
                     industry === 'creative' ? 'creative' :
                     industry === 'marketing' ? 'marketing' :
                     industry === 'sales' ? 'sales' :
                     industry === 'customerservice' ? 'customer_service' : 'other',
            description: `Specialization in ${specName}`,
            isActive: true
          });
        }
        specialtyMap[specName] = specialty._id;
      }
    }
    
    // Create 25 VAs
    console.log('👥 Creating 25 test VAs...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    for (let i = 0; i < 25; i++) {
      const firstName = filipinoFirstNames[i % filipinoFirstNames.length];
      const lastName = filipinoLastNames[i % filipinoLastNames.length];
      const fullName = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
      
      // Skip if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log(`⏭️  Skipping ${fullName} - already exists`);
        continue;
      }
      
      // Select random industry
      const industries = Object.keys(industriesData);
      const industry = industries[i % industries.length];
      const industrySpecialties = industriesData[industry];
      
      // Create user
      const user = await User.create({
        email,
        password: hashedPassword,
        role: 'va',
        isEmailVerified: true
      });
      
      // Create location
      const location = await Location.create({
        city: philippineCities[i % philippineCities.length],
        state: 'NCR', // National Capital Region
        country: 'Philippines',
        countryCode: 'PH',
        timeZone: 'Asia/Manila',
        utcOffset: 8
      });
      
      // Create role type
      const roleType = await RoleType.create({
        fullTime: Math.random() > 0.3,
        partTime: Math.random() > 0.2,
        contract: Math.random() > 0.4,
        freelance: Math.random() > 0.3
      });
      
      // Create role level
      const roleLevel = await RoleLevel.create({
        junior: i % 3 === 0,
        mid: i % 3 === 1,
        senior: i % 3 === 2,
        lead: i % 5 === 0
      });
      
      // Generate profile content
      const template = profileTemplates[i % profileTemplates.length];
      const yearsExp = Math.floor(Math.random() * 10) + 1;
      const clientCount = Math.floor(Math.random() * 50) + 10;
      const projectCount = Math.floor(Math.random() * 100) + 20;
      
      const hero = template.heroTemplate
        .replace('{industry}', industry.charAt(0).toUpperCase() + industry.slice(1))
        .replace('{years}', yearsExp);
      
      const selectedSpecialties = industrySpecialties.slice(0, Math.floor(Math.random() * 3) + 2);
      const selectedSkills = skillsByIndustry[industry].slice(0, Math.floor(Math.random() * 3) + 2);
      
      const bio = template.bioTemplate
        .replace(/\{specialties\}/g, selectedSpecialties.join(', '))
        .replace(/\{years\}/g, yearsExp)
        .replace('{clients}', clientCount)
        .replace('{projects}', projectCount)
        .replace(/\{skills\}/g, selectedSkills.join(', '));
      
      // Create VA profile
      const va = await VA.create({
        user: user._id,
        name: fullName,
        hero,
        bio,
        email: email,
        phone: `+63 9${Math.floor(Math.random() * 900000000) + 100000000}`,
        whatsapp: Math.random() > 0.5 ? `+63 9${Math.floor(Math.random() * 900000000) + 100000000}` : null,
        viber: Math.random() > 0.7 ? `+63 9${Math.floor(Math.random() * 900000000) + 100000000}` : null,
        website: Math.random() > 0.6 ? `https://${firstName.toLowerCase()}${lastName.toLowerCase()}.com` : null,
        linkedin: Math.random() > 0.8 ? `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}` : null,
        github: industry === 'technology' && Math.random() > 0.5 ? `https://github.com/${firstName.toLowerCase()}${lastName.toLowerCase()}` : null,
        searchStatus: ['actively_looking', 'open', 'open', 'actively_looking'][i % 4],
        preferredMinHourlyRate: template.hourlyRate.min,
        preferredMaxHourlyRate: template.hourlyRate.max,
        responseRate: Math.floor(Math.random() * 30) + 70,
        location: location._id,
        roleType: roleType._id,
        roleLevel: roleLevel._id,
        specialties: selectedSpecialties.map(s => specialtyMap[s]),
        avatar: getRandomAvatar(fullName, i),
        industry: industry,
        yearsOfExperience: yearsExp,
        skills: selectedSkills,
        certifications: Math.random() > 0.5 ? certifications.slice(0, Math.floor(Math.random() * 3) + 1) : [],
        languages: [
          { language: 'English', proficiency: 'fluent' },
          { language: 'Filipino', proficiency: 'native' },
          ...(Math.random() > 0.7 ? [{ language: 'Spanish', proficiency: 'basic' }] : [])
        ],
        availability: ['immediately', 'within_week', 'immediately'][i % 3],
        workingHours: {
          timezone: 'Asia/Manila',
          preferredHours: ['9AM-6PM PHT', '8PM-5AM PHT (US Hours)', 'Flexible'][i % 3]
        },
        featuredAt: i < 5 ? new Date() : null,
        conversationsCount: Math.floor(Math.random() * 20)
      });
      
      console.log(`✅ Created VA ${i + 1}/25: ${fullName} (${industry})`);
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