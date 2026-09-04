import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requirePublicEnv } from "@/lib/supabaseEnv";

let _client: SupabaseClient | null = null;

/** Browser client (PKCE + cookie session). Use from Client Components only. */
export function getSupabase() {
  if (!_client) {
    const { url, key } = requirePublicEnv();
    _client = createBrowserClient(url, key);
  }

  return _client;
}
