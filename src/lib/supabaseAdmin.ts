import { createClient } from "@supabase/supabase-js";
import { requirePublicEnv } from "@/lib/supabaseEnv";

/**
 * Service-role client for webhooks. RLS is bypassed only with this key.
 * Do not fall back to the anon key — webhook requests have no user JWT,
 * so SELECT/UPDATE on `meetings` would silently return zero rows.
 */
export function getSupabaseAdmin() {
  const { url } = requirePublicEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. The meetings webhook cannot read or update rows under RLS without the service role key.",
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
