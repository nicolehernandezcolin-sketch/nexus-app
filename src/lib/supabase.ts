import './storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// While the web build is pre-rendered there is no window, and so no session to keep.
const onServer = typeof window === 'undefined';

/**
 * The Supabase client, or null when no project is configured. Without one the app
 * runs as the public demo with sample content, so the shared link keeps working.
 */
export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: onServer ? undefined : localStorage,
          autoRefreshToken: !onServer,
          persistSession: !onServer,
          detectSessionInUrl: false,
        },
      })
    : null;

export const live = supabase !== null;

if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** The client, for code that only runs in live mode. */
export function db(): SupabaseClient {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}
