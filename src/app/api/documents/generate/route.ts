import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { generateDocumentHtml, isDocumentType } from "@/lib/documents";

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

  const meetingId =
    typeof body === "object" &&
    body !== null &&
    "meetingId" in body &&
    typeof body.meetingId === "string"
      ? body.meetingId.trim()
      : "";

  const typeRaw =
    typeof body === "object" &&
    body !== null &&
    "type" in body &&
    typeof body.type === "string"
      ? body.type.trim()
      : "proposal";

  if (!meetingId) {
    return Response.json(
      { success: false, error: "meetingId is required" },
      { status: 400 },
    );
  }

  if (!isDocumentType(typeRaw)) {
    return Response.json(
      { success: false, error: "unsupported_document_type" },
      { status: 400 },
    );
  }

  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .select(
      "id, user_id, status, meeting_title, extracted_client, extracted_scope, extracted_price, extracted_timeline, extracted_notes",
    )
    .eq("id", meetingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (meetingError) {
    return Response.json(
      { success: false, error: "meeting_lookup_failed", message: meetingError.message },
      { status: 500 },
    );
  }

  if (!meeting) {
    return Response.json(
      { success: false, error: "meeting_not_found" },
      { status: 404 },
    );
  }

  if (meeting.status !== "extracted") {
    return Response.json(
      { success: false, error: "meeting_not_ready" },
      { status: 409 },
    );
  }

  const generated = generateDocumentHtml(typeRaw, {
    meetingTitle: meeting.meeting_title,
    client: meeting.extracted_client,
    scope: meeting.extracted_scope,
    price: meeting.extracted_price,
    timeline: meeting.extracted_timeline,
    notes: meeting.extracted_notes,
  });

  const { data: document, error: insertError } = await supabase
    .from("documents")
    .insert({
      meeting_id: meeting.id,
      user_id: user.id,
      type: typeRaw,
      title: generated.title,
      content_html: generated.html,
    })
    .select("id")
    .single();

  if (insertError || !document) {
    console.error("[documents/generate] Insert failed:", insertError);
    return Response.json(
      {
        success: false,
        error: "failed_to_save_document",
        message: insertError?.message ?? "Could not save document",
      },
      { status: 500 },
    );
  }

  return Response.json(
    { success: true, data: { id: document.id } },
    { status: 201 },
  );
}
