import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { persistGoogleTokens } from "@/lib/userTokens";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/dashboard";
  if (!next.startsWith("/")) {
    next = "/dashboard";
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const persist = await persistGoogleTokens(supabase, data.session);
      const params = new URLSearchParams();
      if (persist.error) {
        params.set("token_error", persist.error);
      } else if (!persist.storedRefreshToken) {
        params.set("token_warning", "missing_refresh_token");
      }

      const query = params.toString();
      const path = query ? `${next}?${query}` : next;
      return redirectAfterAuth(request, origin, path);
    }
  }

  return NextResponse.redirect(`${origin}/dashboard?error=auth_callback_failed`);
}

function redirectAfterAuth(request: Request, origin: string, path: string) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${path}`);
  }

  if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${path}`);
  }

  return NextResponse.redirect(`${origin}${path}`);
}
