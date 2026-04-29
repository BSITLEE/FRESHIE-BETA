import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { debugLog } from './debugLog';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// #region agent log
debugLog({
  runId: 'pre-fix',
  hypothesisId: 'H1',
  location: 'src/app/utils/supabaseClient.ts:10',
  message: 'supabase env detected',
  data: {
    isSupabaseConfigured,
    hasUrl: Boolean(supabaseUrl),
    hasAnonKey: Boolean(supabaseAnonKey),
    urlHost: supabaseUrl
      ? (() => {
          try {
            return new URL(supabaseUrl).host;
          } catch {
            return 'invalid-url';
          }
        })()
      : null,
  },
});
// #endregion

let _client: SupabaseClient | null = null;

export const supabase: SupabaseClient | null = (() => {
  if (!isSupabaseConfigured) return null;
  if (_client) return _client;
  _client = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return _client;
})();