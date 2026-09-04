import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

export const supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : (new Proxy(
      {},
      {
        get: () => {
          return () => {
            console.warn(
              '[Shadow Realm] Supabase credentials not set. Operating in offline local-only mode.'
            );
            return {
              data: null,
              error: new Error('Supabase not configured. Using local offline storage.'),
              subscribe: () => ({ unsubscribe: () => {} }),
              channel: () => ({
                on: () => ({ subscribe: () => {} }),
                subscribe: () => {},
                send: () => {},
                track: () => {},
              }),
            };
          };
        },
      }
    ) as unknown as SupabaseClient);
