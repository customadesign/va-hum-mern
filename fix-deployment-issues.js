#!/usr/bin/env node

/**
 * Deployment Fix Script for Linkage VA Hub
 * 
 * This script fixes common deployment issues:
 * 1. Seeds VAs and related data
 * 2. Fixes authentication issues
 * 3. Validates database connections
 * 4. Updates environment configurations
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./backend/models/User');
const VA = require('./backend/models/VA');
const Location = require('./backend/models/Location');
const Specialty = require('./backend/models/Specialty');
const RoleType = require('./backend/models/RoleType');
const RoleLevel = require('./backend/models/RoleLevel');

console.log('🔧 Linkage VA Hub Deployment Fix Script');
console.log('=====================================');

async function connectToDatabase() {
  try {
    console.log('\n📡 Connecting to MongoDB...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

async function seedSpecialties() {
  try {
    console.log('\n🏷️ Seeding specialties...');
    
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
        console.log(`  ✅ Created specialty: ${name}`);
      } else {
        console.log(`  ⏭️ Specialty exists: ${name}`);
      }
      specialtyMap[name] = specialty._id;
    }
    
    console.log(`✅ Specialties seeded: ${await Specialty.countDocuments()}`);
    return specialtyMap;
  } catch (error) {
    console.error('❌ Error seeding specialties:', error.message);
    throw error;
  }
}

async function seedLocations() {
  try {
    console.log('\n📍 Seeding locations...');
    
    const locations = [
      { city: 'Manila', state: 'NCR', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 },
      { city: 'Cebu City', state: 'Cebu', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 },
      { city: 'Makati', state: 'NCR', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 },
      { city: 'Quezon City', state: 'NCR', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 },
      { city: 'Davao City', state: 'Davao del Sur', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 },
      { city: 'Iloilo City', state: 'Iloilo', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 },
      { city: 'Baguio', state: 'Benguet', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 },
      { city: 'Cagayan de Oro', state: 'Misamis Oriental', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 },
      { city: 'Zamboanga City', state: 'Zamboanga del Sur', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 },
      { city: 'Bacolod', state: 'Negros Occidental', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 },
      { city: 'Las Piñas', state: 'NCR', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 },
      { city: 'Taguig', state: 'NCR', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 },
      { city: 'Pasig', state: 'NCR', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 },
      { city: 'Antipolo', state: 'Rizal', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 },
      { city: 'Caloocan', state: 'NCR', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 },
      { city: 'Marikina', state: 'NCR', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 },
      { city: 'Parañaque', state: 'NCR', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 },
      { city: 'Muntinlupa', state: 'NCR', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 },
      { city: 'Valenzuela', state: 'NCR', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 },
      { city: 'San Juan', state: 'NCR', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 },
      { city: 'Malabon', state: 'NCR', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 },
      { city: 'Navotas', state: 'NCR', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 },
      { city: 'Pateros', state: 'NCR', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 },
      { city: 'Pasay', state: 'NCR', country: 'Philippines', countryCode: 'PH', timeZone: 'Asia/Manila', utcOffset: 8 }
    ];
    
    const locationMap = {};
    
    for (const locationData of locations) {
      let location = await Location.findOne({ city: locationData.city });
      if (!location) {
        location = await Location.create(locationData);
        console.log(`  ✅ Created location: ${locationData.city}`);
      } else {
        console.log(`  ⏭️ Location exists: ${locationData.city}`);
      }
      locationMap[locationData.city] = location._id;
    }
    
    console.log(`✅ Locations seeded: ${await Location.countDocuments()}`);
    return locationMap;
  } catch (error) {
    console.error('❌ Error seeding locations:', error.message);
    throw error;
  }
}

async function seedTestVA(specialtyMap, locationMap) {
  try {
    console.log('\n👥 Seeding test VA...');
    
    const testVA = {
      name: "Maria Clara Santos",
      email: "va@murphyconsulting.us",
      password: "va123456",
      hero: "Expert E-commerce VA specializing in Shopify and Amazon FBA",
      bio: "I'm a dedicated virtual assistant with 5+ years of experience helping e-commerce businesses scale their operations. I specialize in Shopify store management, Amazon FBA operations, inventory tracking, and customer service.",
      specialties: ["E-commerce Management", "Customer Service", "Inventory Management", "Product Listing"],
      location: "Manila",
      searchStatus: 'actively_looking',
      responseRate: 95
    };
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: testVA.email });
    if (existingUser) {
      console.log(`  ⏭️ Test VA already exists: ${testVA.email}`);
      return existingUser;
    }
    
    // Create user
    const user = await User.create({
      email: testVA.email,
      password: testVA.password,
      role: 'va',
      isEmailVerified: true,
      confirmedAt: new Date()
    });
    
    // Get location
    const locationId = locationMap[testVA.location];
    if (!locationId) {
      throw new Error(`Location not found: ${testVA.location}`);
    }
    
    // Create VA record
    const va = await VA.create({
      user: user._id,
      name: testVA.name,
      hero: testVA.hero,
      bio: testVA.bio,
      email: testVA.email,
      phone: `+63 9${Math.floor(Math.random() * 900000000) + 100000000}`,
      searchStatus: testVA.searchStatus,
      responseRate: testVA.responseRate,
      location: locationId,
      specialties: testVA.specialties.map(s => specialtyMap[s]).filter(Boolean),
      avatar: `https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`,
      coverImage: `https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=400&q=80`,
      conversationsCount: 0,
      featuredAt: new Date()
    });
    
    // Create role type
    const roleType = await RoleType.create({
      va: va._id,
      partTimeContract: true,
      fullTimeContract: true,
      fullTimeEmployment: false
    });
    
    // Create role level
    const roleLevel = await RoleLevel.create({
      va: va._id,
      mid: true,
      junior: false,
      senior: false,
      principal: false,
      cLevel: false
    });
    
    // Update VA with role references
    va.roleType = roleType._id;
    va.roleLevel = roleLevel._id;
    await va.save();
    
    console.log(`  ✅ Created test VA: ${va.name} (${va.email})`);
    console.log(`  🔑 Login credentials: ${va.email} / ${testVA.password}`);
    
    return user;
  } catch (error) {
    console.error('❌ Error creating test VA:', error.message);
    throw error;
  }
}

async function validateAuthentication() {
  try {
    console.log('\n🔐 Validating authentication setup...');
    
    // Check if test VA can authenticate
    const testVA = await User.findOne({ email: 'va@murphyconsulting.us' }).populate('va');
    if (!testVA) {
      console.log('  ❌ Test VA not found');
      return false;
    }
    
    // Test password matching
    const isPasswordValid = await testVA.matchPassword('va123456');
    if (!isPasswordValid) {
      console.log('  ❌ Test VA password validation failed');
      return false;
    }
    
    // Test JWT token generation
    const token = testVA.getSignedJwtToken();
    if (!token) {
      console.log('  ❌ JWT token generation failed');
      return false;
    }
    
    console.log('  ✅ Authentication validation passed');
    console.log(`  📧 Test VA: ${testVA.email}`);
    console.log(`  🎯 VA Profile: ${testVA.va?.name || 'Not found'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Authentication validation failed:', error.message);
    return false;
  }
}

async function checkDatabaseHealth() {
  try {
    console.log('\n🏥 Checking database health...');
    
    const stats = {
      users: await User.countDocuments(),
      vas: await VA.countDocuments(),
      locations: await Location.countDocuments(),
      specialties: await Specialty.countDocuments(),
      roleTypes: await RoleType.countDocuments(),
      roleLevels: await RoleLevel.countDocuments()
    };
    
    console.log('  📊 Database Statistics:');
    console.log(`    Users: ${stats.users}`);
    console.log(`    VAs: ${stats.vas}`);
    console.log(`    Locations: ${stats.locations}`);
    console.log(`    Specialties: ${stats.specialties}`);
    console.log(`    Role Types: ${stats.roleTypes}`);
    console.log(`    Role Levels: ${stats.roleLevels}`);
    
    const healthScore = Object.values(stats).reduce((sum, count) => sum + (count > 0 ? 1 : 0), 0);
    const totalChecks = Object.keys(stats).length;
    
    console.log(`  🏆 Database Health: ${healthScore}/${totalChecks} collections populated`);
    
    return healthScore === totalChecks;
  } catch (error) {
    console.error('❌ Database health check failed:', error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('Starting deployment fix process...\n');
    
    // Connect to database
    const connected = await connectToDatabase();
    if (!connected) {
      console.log('\n❌ Cannot proceed without database connection');
      process.exit(1);
    }
    
    // Seed essential data
    const specialtyMap = await seedSpecialties();
    const locationMap = await seedLocations();
    
    // Create test VA
    await seedTestVA(specialtyMap, locationMap);
    
    // Validate authentication
    const authValid = await validateAuthentication();
    
    // Check database health
    const dbHealthy = await checkDatabaseHealth();
    
    console.log('\n🎉 Deployment fix completed!');
    console.log('=====================================');
    
    if (authValid && dbHealthy) {
      console.log('✅ All fixes applied successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Restart your backend server');
      console.log('2. Test login with: va@murphyconsulting.us / va123456');
      console.log('3. Verify VA profiles are loading');
      console.log('4. Check frontend API connectivity');
    } else {
      console.log('⚠️ Some issues may still exist. Please check the logs above.');
    }
    
  } catch (error) {
    console.error('\n❌ Deployment fix failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, seedSpecialties, seedLocations, seedTestVA };