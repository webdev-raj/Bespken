import { joinMeeting, MeetingBaasError } from "@/lib/meetingBaas";

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

  if (!meetingUrl) {
    return Response.json(
      { success: false, error: "meetingUrl is required" },
      { status: 400 },
    );
  }

  try {
    const result = await joinMeeting(meetingUrl, webhookUrlFromEnv());
    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof MeetingBaasError) {
      return Response.json(
        error.body ?? { success: false, error: error.message },
        { status: error.status },
      );
    }

    return Response.json(
      { success: false, error: "Failed to send bot to meeting" },
      { status: 502 },
    );
  }
}
