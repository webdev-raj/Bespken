import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { runExtraction } from "@/lib/geminiExtraction";

/**
 * Extracts concatenated or full transcript string from transcription JSON.
 */
function extractTranscriptText(payload: unknown): string {
  if (typeof payload === "string") {
    return payload.trim();
  }

  if (typeof payload !== "object" || payload === null) {
    return "";
  }

  const record = payload as Record<string, unknown>;

  // Check top-level or nested full_transcript
  if (typeof record.full_transcript === "string" && record.full_transcript.trim()) {
    return record.full_transcript.trim();
  }

  const resultObj =
    typeof record.result === "object" && record.result !== null
      ? (record.result as Record<string, unknown>)
      : null;

  const transcriptionObj =
    typeof record.transcription === "object" && record.transcription !== null
      ? (record.transcription as Record<string, unknown>)
      : typeof resultObj?.transcription === "object" && resultObj?.transcription !== null
        ? (resultObj.transcription as Record<string, unknown>)
        : null;

  if (
    transcriptionObj &&
    typeof transcriptionObj.full_transcript === "string" &&
    transcriptionObj.full_transcript.trim()
  ) {
    return transcriptionObj.full_transcript.trim();
  }

  // Check utterances / segments arrays
  const utterances =
    Array.isArray(record.utterances)
      ? record.utterances
      : Array.isArray(transcriptionObj?.utterances)
        ? transcriptionObj.utterances
        : Array.isArray(record.segments)
          ? record.segments
          : Array.isArray(record.sentences)
            ? record.sentences
            : null;

  if (utterances && utterances.length > 0) {
    const lines = utterances
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item !== "object" || item === null) return "";

        const u = item as Record<string, unknown>;
        const speaker =
          typeof u.speaker === "string" || typeof u.speaker === "number"
            ? `Speaker ${u.speaker}`
            : typeof u.speaker_name === "string"
              ? u.speaker_name
              : "";

        const text =
          typeof u.text === "string"
            ? u.text.trim()
            : typeof u.transcript === "string"
              ? u.transcript.trim()
              : Array.isArray(u.words)
                ? u.words
                    .map((w) => (typeof w === "object" && w && "word" in w ? String((w as { word: unknown }).word) : ""))
                    .join(" ")
                    .trim()
                : "";

        if (!text) return "";
        return speaker ? `${speaker}: ${text}` : text;
      })
      .filter((line) => line.length > 0);

    if (lines.length > 0) {
      return lines.join("\n");
    }
  }

  if (typeof record.text === "string" && record.text.trim()) {
    return record.text.trim();
  }

  return JSON.stringify(payload, null, 2);
}

/**
 * Receives Meeting BaaS callbacks.
 * Handles bot.completed and bot.failed events.
 */
export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  console.log("[Meeting BaaS webhook received]", JSON.stringify(payload, null, 2));

  if (typeof payload !== "object" || payload === null) {
    return Response.json({ received: true }, { status: 200 });
  }

  const body = payload as Record<string, unknown>;
  const data =
    typeof body.data === "object" && body.data !== null
      ? (body.data as Record<string, unknown>)
      : body;

  const eventType = String(body.event || data.event || body.type || data.type || "");
  const botId = String(
    data.bot_id ||
      body.bot_id ||
      data.id ||
      body.id ||
      (typeof data.bot === "object" && data.bot !== null ? (data.bot as Record<string, unknown>).id : "") ||
      "",
  );

  if (!botId) {
    console.warn("[Meeting BaaS webhook] No bot_id found in webhook payload:", payload);
    return Response.json({ received: true, warning: "missing_bot_id" }, { status: 200 });
  }

  const supabase = getSupabaseAdmin();

  // Handle bot.failed
  if (eventType === "bot.failed" || eventType.includes("failed")) {
    console.log(`[Meeting BaaS webhook] Bot ${botId} failed.`);
    const { error: updateError } = await supabase
      .from("meetings")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("bot_id", botId);

    if (updateError) {
      console.error("[Meeting BaaS webhook] Failed to update meeting status to failed:", updateError);
    }

    return Response.json({ received: true, status: "failed_recorded" }, { status: 200 });
  }

  // Handle bot.completed
  if (eventType === "bot.completed" || eventType.includes("completed")) {
    console.log(`[Meeting BaaS webhook] Bot ${botId} completed. Processing transcript...`);

    // 1. Find matching row in "meetings"
    const { data: meeting, error: findError } = await supabase
      .from("meetings")
      .select("id, status")
      .eq("bot_id", botId)
      .maybeSingle();

    if (findError) {
      console.error("[Meeting BaaS webhook] Error finding meeting by bot_id:", findError);
      return Response.json({ received: true, error: "lookup_error" }, { status: 200 });
    }

    if (!meeting) {
      console.warn(`[Meeting BaaS webhook] No meeting record found for bot_id ${botId}`);
      return Response.json({ received: true, warning: "meeting_not_found" }, { status: 200 });
    }

    // 2. Fetch transcript from presigned URL
    const transcriptionUrl =
      typeof data.transcription === "string" && data.transcription
        ? data.transcription
        : typeof body.transcription === "string" && body.transcription
          ? body.transcription
          : typeof data.raw_transcription === "string" && data.raw_transcription
            ? data.raw_transcription
            : typeof body.raw_transcription === "string" && body.raw_transcription
              ? body.raw_transcription
              : null;

    let transcriptText = "";

    if (transcriptionUrl) {
      try {
        const transcriptRes = await fetch(transcriptionUrl);
        if (transcriptRes.ok) {
          const transcriptJson: unknown = await transcriptRes.json();
          transcriptText = extractTranscriptText(transcriptJson);
        } else {
          console.error(
            `[Meeting BaaS webhook] Failed to fetch transcription file (${transcriptRes.status}) from ${transcriptionUrl}`,
          );
        }
      } catch (err) {
        console.error("[Meeting BaaS webhook] Error fetching/parsing transcription URL:", err);
      }
    } else {
      // If transcription is directly in the payload
      transcriptText = extractTranscriptText(data);
    }

    if (!transcriptText) {
      console.warn(`[Meeting BaaS webhook] Empty transcript for bot_id ${botId}`);
      transcriptText = "(No spoken transcript detected in this call)";
    }

    // 3. Update meeting row: transcript_text and status: 'completed'
    const { error: completedError } = await supabase
      .from("meetings")
      .update({
        transcript_text: transcriptText,
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", meeting.id);

    if (completedError) {
      console.error("[Meeting BaaS webhook] Error updating meeting to completed:", completedError);
    }

    // 4. Run Gemini extraction
    try {
      console.log(`[Meeting BaaS webhook] Running Gemini extraction for meeting ${meeting.id}...`);
      const extraction = await runExtraction(transcriptText);

      const { error: extractedError } = await supabase
        .from("meetings")
        .update({
          extracted_client: extraction.client,
          extracted_scope: extraction.scope,
          extracted_price: extraction.price,
          extracted_timeline: extraction.timeline,
          extracted_notes: extraction.notes,
          status: "extracted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", meeting.id);

      if (extractedError) {
        console.error("[Meeting BaaS webhook] Error saving extracted data:", extractedError);
      } else {
        console.log(`[Meeting BaaS webhook] Successfully saved extraction for meeting ${meeting.id}`);
      }
    } catch (extractError) {
      console.error("[Meeting BaaS webhook] Gemini extraction failed:", extractError);
      // Keep completed status or save error note
    }

    return Response.json({ received: true, processed: true }, { status: 200 });
  }

  return Response.json({ received: true, event: eventType }, { status: 200 });
}
