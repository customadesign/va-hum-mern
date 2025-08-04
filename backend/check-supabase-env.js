require('dotenv').config();

console.log('=== Supabase Environment Check ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_BUCKET:', process.env.SUPABASE_BUCKET || 'linkage-va-hub (default)');

if (process.env.SUPABASE_URL) {
  console.log('URL starts with:', process.env.SUPABASE_URL.substring(0, 30) + '...');
}

// Check if Supabase client can be initialized
try {
  const supabase = require('./config/supabase');
  console.log('\nSupabase client:', supabase ? '✅ Initialized' : '❌ Not initialized');
} catch (error) {
  console.error('\n❌ Error loading Supabase:', error.message);
}

console.log('\n=== File Upload Configuration ===');
const isProduction = process.env.NODE_ENV === 'production';
const useSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;
console.log('Production mode:', isProduction ? '✅ Yes' : '❌ No');
console.log('Use Supabase for uploads:', useSupabase ? '✅ Yes' : '❌ No (using local storage)');