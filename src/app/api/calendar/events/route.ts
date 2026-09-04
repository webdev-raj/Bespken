import { createSupabaseServerClient } from "@/lib/supabaseServer";
import {
  fetchPrimaryCalendarEvents,
  refreshGoogleAccessToken,
} from "@/lib/googleCalendar";

type TokenRow = {
  google_access_token: string | null;
  google_refresh_token: string | null;
  token_expires_at: string | null;
};

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return Response.json(
      { success: false, error: "not_authenticated" },
      { status: 401 },
    );
  }

  const { data: tokenRow, error: tokenError } = await supabase
    .from("user_tokens")
    .select("google_access_token, google_refresh_token, token_expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (tokenError) {
    return Response.json(
      { success: false, error: "token_lookup_failed", message: tokenError.message },
      { status: 500 },
    );
  }

  const tokens = tokenRow as TokenRow | null;

  if (!tokens?.google_access_token && !tokens?.google_refresh_token) {
    return Response.json(
      { success: false, error: "calendar_not_connected" },
      { status: 404 },
    );
  }

  let accessToken = tokens.google_access_token;
  const expired =
    Boolean(tokens.token_expires_at) &&
    new Date(tokens.token_expires_at as string).getTime() <= Date.now() + 60_000;

  if ((!accessToken || expired) && tokens.google_refresh_token) {
    try {
      accessToken = await rotateAccessToken(
        supabase,
        user.id,
        tokens.google_refresh_token,
      );
    } catch (error) {
      return Response.json(
        {
          success: false,
          error: "token_refresh_failed",
          message: error instanceof Error ? error.message : "Could not refresh Google access token",
        },
        { status: 401 },
      );
    }
  }

  if (!accessToken) {
    return Response.json(
      { success: false, error: "calendar_not_connected" },
      { status: 404 },
    );
  }

  let result = await fetchPrimaryCalendarEvents(accessToken);

  if (result.ok === false && result.status === 401 && tokens.google_refresh_token) {
    try {
      accessToken = await rotateAccessToken(
        supabase,
        user.id,
        tokens.google_refresh_token,
      );
      result = await fetchPrimaryCalendarEvents(accessToken);
    } catch (error) {
      return Response.json(
        {
          success: false,
          error: "token_refresh_failed",
          message: error instanceof Error ? error.message : "Could not refresh Google access token",
        },
        { status: 401 },
      );
    }
  }

  if (result.ok === false) {
    return Response.json(
      { success: false, error: "google_calendar_failed", message: result.message },
      { status: result.status >= 400 && result.status < 600 ? result.status : 502 },
    );
  }

  return Response.json({ success: true, events: result.events });
}

async function rotateAccessToken(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  refreshToken: string,
) {
  const refreshed = await refreshGoogleAccessToken(refreshToken);
  const tokenExpiresAt = new Date(
    Date.now() + refreshed.expiresIn * 1000,
  ).toISOString();

  const { error } = await supabase
    .from("user_tokens")
    .update({
      google_access_token: refreshed.accessToken,
      google_refresh_token: refreshed.refreshToken ?? refreshToken,
      token_expires_at: tokenExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return refreshed.accessToken;
}
