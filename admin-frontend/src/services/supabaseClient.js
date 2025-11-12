/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js';

// Read env (CRA-style)
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

export let supabase = null;

try {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[Supabase] Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY. Client uploads will be disabled.');
  } else {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
    console.log('[Supabase] Client initialized');
  }
} catch (e) {
  console.error('[Supabase] Initialization error:', e?.message || e);
  supabase = null;
}

/**
 * Returns current Supabase auth user if available.
 * Note: Our app uses its own auth; in most cases this will be null.
 */
export async function getSupabaseUser() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.warn('[Supabase] getUser error:', error.message);
      return null;
    }
    return data?.user || null;
  } catch (e) {
    console.warn('[Supabase] getUser exception:', e?.message || e);
    return null;
  }
}

/**
 * Returns current Supabase session if available.
 */
export async function getSupabaseSession() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('[Supabase] getSession error:', error.message);
      return null;
    }
    return data?.session || null;
  } catch (e) {
    console.warn('[Supabase] getSession exception:', e?.message || e);
    return null;
  }
}

export default supabase;