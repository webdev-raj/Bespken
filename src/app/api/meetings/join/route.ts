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

  const meetingUrl =
    typeof body === "object" &&
    body !== null &&
    "meetingUrl" in body &&
    typeof body.meetingUrl === "string"
      ? body.meetingUrl.trim()
      : "";

  const meetingTitle =
    typeof body === "object" &&
    body !== null &&
    "meetingTitle" in body &&
    typeof body.meetingTitle === "string"
      ? body.meetingTitle.trim()
      : null;

  if (!meetingUrl) {
    return Response.json(
      { success: false, error: "meetingUrl is required" },
      { status: 400 },
    );
  }

  try {
    const result = await joinMeeting(meetingUrl, webhookUrlFromEnv());

    const { data: meetingRow, error: insertError } = await supabase
      .from("meetings")
      .insert({
        user_id: user.id,
        bot_id: result.data.bot_id,
        meeting_title: meetingTitle,
        status: "joining",
      })
      .select("id, bot_id, status, meeting_title")
      .single();

    if (insertError) {
      console.error("[meetings/join] Error inserting meeting row:", insertError);
      return Response.json(
        {
          success: false,
          error: "failed_to_save_meeting",
          message: insertError.message,
        },
        { status: 500 },
      );
    }

    return Response.json(
      {
        success: true,
        data: {
          id: meetingRow.id,
          bot_id: result.data.bot_id,
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
