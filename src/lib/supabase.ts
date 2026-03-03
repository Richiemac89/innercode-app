import type { SupabaseClient } from '@supabase/supabase-js';
import { getSafeLocalStorage } from '../utils/helpers';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

let supabaseClientPromise: Promise<SupabaseClient<any, 'public', any>> | null = null;

async function createSupabaseClient(): Promise<SupabaseClient<any, 'public', any>> {
  const { createClient } = await import('@supabase/supabase-js');
  const storage = getSafeLocalStorage();

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: !!storage,
      detectSessionInUrl: true,
      storage: storage ?? undefined,
    },
  });
}

export function getSupabaseClient(): Promise<SupabaseClient<any, 'public', any>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Supabase client is only available in the browser environment.'));
  }

  if (!supabaseClientPromise) {
    supabaseClientPromise = createSupabaseClient();
  }

  return supabaseClientPromise;
}

export type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  country: string;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type UserResults = {
  id: string;
  user_id: string;
  results_data: any;
  created_at: string;
};

export type UserJournalEntry = {
  id: string;
  user_id: string;
  entry_data: any;
  created_at: string;
};

