
import { createClient } from '@supabase/supabase-js';

// Helper to safely access process.env in browser environments
const getEnv = (key: string) => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore reference errors
  }
  return undefined;
};

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------

const SUPABASE_URL = getEnv('REACT_APP_SUPABASE_URL') || 'https://kvovxbfsfmsmbpapmiyh.supabase.co'; 
const SUPABASE_ANON_KEY = getEnv('REACT_APP_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2b3Z4YmZzZm1zbWJwYXBtaXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MTc4NDMsImV4cCI6MjA3OTQ5Mzg0M30.I8zOhU3cbH5DmbmdzRADyjwTrYGOA5qlWcZmY0FJoGk';

// Check if user forced Dev Mode via LocalStorage
const forceDevMode = typeof window !== 'undefined' && localStorage.getItem('qura_force_dev_mode') === 'true';

// We export a client only if keys are present AND Dev Mode is NOT forced.
// Casting to 'any' to avoid TypeScript errors with v2 methods.
export const supabase = (!forceDevMode && SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) as any
  : null;

export const isSupabaseConfigured = !!supabase;
