const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.SUPABASE_URL;
// Use service role key for server uploads (bypasses RLS policies)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('Supabase URL configured:', !!supabaseUrl);
console.log('Supabase Service Role Key configured:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('Supabase Anon Key configured:', !!process.env.SUPABASE_ANON_KEY);
console.log('Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON');
if (supabaseUrl) console.log('Supabase URL:', supabaseUrl.substring(0, 30) + '...');

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found. File uploads will use local storage.');
  console.warn('Add SUPABASE_SERVICE_ROLE_KEY to environment variables for server uploads.');
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
      // Create client with service role for server operations
      supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      console.log('Supabase client initialized successfully for server operations');
    }
  } catch (error) {
    console.error('Error initializing Supabase client:', error.message);
  }
}

module.exports = supabase;