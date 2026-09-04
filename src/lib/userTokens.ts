import type { Session, SupabaseClient } from "@supabase/supabase-js";

export type UserTokensRow = {
  user_id: string;
  google_access_token: string | null;
  google_refresh_token: string | null;
  token_expires_at: string | null;
  updated_at: string;
};

/**
 * Persist Google OAuth tokens from the Supabase session.
 * Session fields (auth-js Session): provider_token, provider_refresh_token, expires_at.
 * These Google tokens are only present immediately after OAuth (exchangeCodeForSession).
 */
export async function persistGoogleTokens(
  supabase: SupabaseClient,
  session: Session,
): Promise<{ storedAccessToken: boolean; storedRefreshToken: boolean; error: string | null }> {
  const accessToken = session.provider_token ?? null;
  const refreshToken = session.provider_refresh_token ?? null;

  if (!accessToken && !refreshToken) {
    console.warn(
      "[user_tokens] Session has no provider_token or provider_refresh_token. Check Google consent (access_type=offline, prompt=consent).",
    );
  }

  const { data: existing } = await supabase
    .from("user_tokens")
    .select("google_refresh_token")
    .eq("user_id", session.user.id)
    .maybeSingle();

  const existingRefresh =
    existing && typeof existing.google_refresh_token === "string"
      ? existing.google_refresh_token
      : null;

  const tokenExpiresAt = session.expires_at
    ? new Date(session.expires_at * 1000).toISOString()
    : new Date(Date.now() + 3600 * 1000).toISOString();

  const row: UserTokensRow = {
    user_id: session.user.id,
    google_access_token: accessToken,
    google_refresh_token: refreshToken ?? existingRefresh,
    token_expires_at: tokenExpiresAt,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("user_tokens").upsert(row, {
    onConflict: "user_id",
  });

  if (error) {
    console.error("[user_tokens] upsert failed", error);
    return {
      storedAccessToken: false,
      storedRefreshToken: false,
      error: error.message,
    };
  }

  if (!row.google_refresh_token) {
    console.warn(
      "[user_tokens] Access token stored, but Google did not return a refresh token.",
    );
  }

  return {
    storedAccessToken: Boolean(row.google_access_token),
    storedRefreshToken: Boolean(row.google_refresh_token),
    error: null,
  };
}
