// Supabase is used for DATABASE ONLY. All auth goes through FastAPI JWT via useAuthStore.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Running in mock mode. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

const supabaseClient = createClient<Database>(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key'
);

export const supabase = {
  from: supabaseClient.from.bind(supabaseClient),
  rpc: supabaseClient.rpc.bind(supabaseClient),
  storage: supabaseClient.storage,
} as any;

export type { Database };
