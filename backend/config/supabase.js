const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('Supabase URL configured:', !!supabaseUrl);
console.log('Supabase Key configured:', !!supabaseKey);
if (supabaseUrl) console.log('Supabase URL:', supabaseUrl.substring(0, 30) + '...');

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found. File uploads will use local storage.');
}

let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    // Ensure URL doesn't contain credentials
    const url = new URL(supabaseUrl);
    if (url.username || url.password) {
      console.error('ERROR: Supabase URL contains credentials. Please use only the base URL.');
      console.error('Example: https://your-project.supabase.co');
    } else {
      supabase = createClient(supabaseUrl, supabaseKey);
      console.log('Supabase client initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing Supabase client:', error.message);
  }
}

module.exports = supabase;