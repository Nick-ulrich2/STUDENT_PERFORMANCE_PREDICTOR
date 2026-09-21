import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Surface a clear configuration error in dev instead of crashing later.
  // eslint-disable-next-line no-console
  console.warn('[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

export const supabase = createBrowserClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
