import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
  const errorMsg = 'CRITICAL: VITE_SUPABASE_URL is missing or set to a placeholder. Supabase client initialization failed.';
  console.error(errorMsg);
  throw new Error(errorMsg);
}

if (!supabaseAnonKey || supabaseAnonKey === 'placeholder-anon-key') {
  const errorMsg = 'CRITICAL: VITE_SUPABASE_ANON_KEY is missing or set to a placeholder. Supabase client initialization failed.';
  console.error(errorMsg);
  throw new Error(errorMsg);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
