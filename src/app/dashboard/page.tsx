"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

const CALENDAR_READONLY_SCOPE =
  "https://www.googleapis.com/auth/calendar.readonly";

type TokenStatus = {
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [tokens, setTokens] = useState<TokenStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackError = params.get("error");
    const tokenError = params.get("token_error");
    const tokenWarning = params.get("token_warning");

    if (callbackError) {
      setError("Google sign-in failed. Check the redirect URL and Google provider settings.");
    } else if (tokenError) {
      setError(`Signed in, but tokens were not saved: ${tokenError}`);
    } else if (tokenWarning === "missing_refresh_token") {
      setError(
        "Signed in, but Google did not return a refresh token. Reconnect and make sure prompt=consent is sent.",
      );
    }

    void loadSession();
  }, []);

  async function loadSession() {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) {
      setEmail(null);
      setTokens(null);
      setLoading(false);
      return;
    }

    setEmail(session.user.email ?? session.user.id);

    const { data: row, error: tokenError } = await supabase
      .from("user_tokens")
      .select("google_access_token, google_refresh_token")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (tokenError) {
      setTokens(null);
      setError((current) => current ?? tokenError.message);
    } else {
      setTokens({
        hasAccessToken: Boolean(row?.google_access_token),
        hasRefreshToken: Boolean(row?.google_refresh_token),
      });
    }

    setLoading(false);
  }

  async function connectGoogleCalendar() {
    setBusy(true);
    setError(null);

    const supabase = getSupabase();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: CALENDAR_READONLY_SCOPE,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (oauthError) {
      setBusy(false);
      setError(oauthError.message);
    }
  }

  async function disconnect() {
    setBusy(true);
    setError(null);
    const supabase = getSupabase();
    const { error: signOutError } = await supabase.auth.signOut();
    setBusy(false);

    if (signOutError) {
      setError(signOutError.message);
      return;
    }

    setEmail(null);
    setTokens(null);
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white p-8">
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-xl font-medium">Dashboard</h1>
        <p className="text-sm text-white/60">
          Connect Google Calendar. This does not fetch events yet — it only
          confirms OAuth and that access/refresh tokens are stored.
        </p>

        {loading ? (
          <p className="text-sm text-white/50">Loading…</p>
        ) : email ? (
          <>
            <p className="text-sm">Connected as {email}</p>
            {tokens ? (
              <ul className="text-sm text-white/70 space-y-1">
                <li>
                  Google access token stored:{" "}
                  {tokens.hasAccessToken ? "yes" : "no"}
                </li>
                <li>
                  Google refresh token stored:{" "}
                  {tokens.hasRefreshToken ? "yes" : "no"}
                </li>
              </ul>
            ) : (
              <p className="text-sm text-white/50">
                Could not read user_tokens. Run the SQL migration if the table
                does not exist yet.
              </p>
            )}
            <button
              type="button"
              onClick={disconnect}
              disabled={busy}
              className="rounded bg-white/10 px-4 py-2 text-sm disabled:opacity-50"
            >
              {busy ? "Working…" : "Disconnect"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={connectGoogleCalendar}
            disabled={busy}
            className="rounded bg-white/10 px-4 py-2 text-sm disabled:opacity-50"
          >
            {busy ? "Redirecting…" : "Connect Google Calendar"}
          </button>
        )}

        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
