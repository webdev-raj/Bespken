import { createClient } from "@supabase/supabase-js";
import { requirePublicEnv } from "@/lib/supabaseEnv";

/**
 * Supabase client for background tasks, server webhooks, or admin operations.
 * Uses SUPABASE_SERVICE_ROLE_KEY if available, falling back to NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function getSupabaseAdmin() {
  const { url } = requirePublicEnv();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error(
      "Missing Supabase key. Please set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
