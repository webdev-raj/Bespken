import { createClient } from '@supabase/supabase-js';

// Lazy singleton — only created client-side when first needed
let _client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error(
        'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
      );
    }

    _client = createClient(url, key);
  }

  return _client;
}
