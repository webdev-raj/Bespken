import { joinMeeting, MeetingBaasError } from "@/lib/meetingBaas";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

function webhookUrlFromEnv(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");

  if (!siteUrl) {
    throw new MeetingBaasError(
      "NEXT_PUBLIC_SITE_URL is not set",
      500,
      { success: false, error: "missing_site_url" },
    );
  }

  return `${siteUrl}/api/meetings/webhook`;
}

function stringField(body: unknown, key: string): string | null {
  if (
    typeof body === "object" &&
    body !== null &&
    key in body &&
    typeof (body as Record<string, unknown>)[key] === "string"
  ) {
    const value = ((body as Record<string, unknown>)[key] as string).trim();
    return value || null;
  }
  return null;
}

export async function POST(request: Request) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const meetingUrl = stringField(body, "meetingUrl") ?? "";
  const meetingTitle = stringField(body, "meetingTitle");
  const calendarEventId = stringField(body, "calendarEventId");

  if (!meetingUrl) {
    return Response.json(
      { success: false, error: "meetingUrl is required" },
      { status: 400 },
    );
  }

  try {
    // Only reuse a join that started seconds ago (double-click). A leftover
    // `joining` row from a finished/failed bot must not block a new bot.
    const JOIN_REUSE_WINDOW_MS = 2 * 60 * 1000;

    if (calendarEventId) {
      const { data: existing } = await supabase
        .from("meetings")
        .select("id, bot_id, status, meeting_title, created_at")
        .eq("user_id", user.id)
        .eq("calendar_event_id", calendarEventId)
        .eq("status", "joining")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        const createdAt = existing.created_at
          ? new Date(existing.created_at).getTime()
          : 0;
        const isFresh = Date.now() - createdAt < JOIN_REUSE_WINDOW_MS;

        if (isFresh) {
          console.log("[meetings/join] Reusing in-flight meeting (idempotent)", {
            meeting_id: existing.id,
            bot_id: existing.bot_id,
            calendar_event_id: calendarEventId,
          });
          return Response.json(
            {
              success: true,
              data: {
                id: existing.id,
                bot_id: existing.bot_id,
                meeting_id: existing.id,
                status: existing.status,
                meeting_title: existing.meeting_title,
              },
            },
            { status: 200 },
          );
        }

        console.log("[meetings/join] Stale joining row — marking failed and sending a new bot", {
          meeting_id: existing.id,
          bot_id: existing.bot_id,
          calendar_event_id: calendarEventId,
          created_at: existing.created_at,
        });

        const { error: failError } = await supabase
          .from("meetings")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .eq("status", "joining");

        if (failError) {
          console.error("[meetings/join] Could not clear stale joining row:", failError);
          return Response.json(
            {
              success: false,
              error: "stale_join_locked",
              message: failError.message,
            },
            { status: 409 },
          );
        }
      }
    }

    const meetingId = crypto.randomUUID();

    console.log("[meetings/join] Creating bot then persisting meeting", {
      meeting_id: meetingId,
      user_id: user.id,
      meeting_url: meetingUrl,
      calendar_event_id: calendarEventId,
    });

    const result = await joinMeeting(meetingUrl, webhookUrlFromEnv(), {
      extra: {
        bespken_meeting_id: meetingId,
        ...(calendarEventId ? { calendar_event_id: calendarEventId } : {}),
      },
    });

    const botId = result.data.bot_id;

    console.log("[meetings/join] Persisting bot_id onto meeting row", {
      meeting_id: meetingId,
      bot_id: botId,
    });

    const { data: meetingRow, error: insertError } = await supabase
      .from("meetings")
      .insert({
        id: meetingId,
        user_id: user.id,
        bot_id: botId,
        meeting_title: meetingTitle,
        calendar_event_id: calendarEventId,
        status: "joining",
      })
      .select("id, bot_id, status, meeting_title")
      .single();

    if (insertError) {
      console.error("[meetings/join] Error inserting meeting row:", {
        meeting_id: meetingId,
        bot_id: botId,
        insertError,
      });
      return Response.json(
        {
          success: false,
          error: "failed_to_save_meeting",
          message: insertError.message,
        },
        { status: 500 },
      );
    }

    if (meetingRow.bot_id !== botId) {
      console.error("[meetings/join] Persisted bot_id does not match create-bot response", {
        meeting_id: meetingRow.id,
        created_bot_id: botId,
        stored_bot_id: meetingRow.bot_id,
      });
    }

    console.log("[meetings/join] Meeting saved", {
      meeting_id: meetingRow.id,
      bot_id: meetingRow.bot_id,
    });

    return Response.json(
      {
        success: true,
        data: {
          id: meetingRow.id,
          bot_id: meetingRow.bot_id,
          meeting_id: meetingRow.id,
          status: meetingRow.status,
          meeting_title: meetingRow.meeting_title,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof MeetingBaasError) {
      return Response.json(
        error.body ?? { success: false, error: error.message },
        { status: error.status },
      );
    }

    console.error("[meetings/join] Unexpected error:", error);
    return Response.json(
      { success: false, error: "Failed to send bot to meeting" },
      { status: 502 },
    );
  }
}
