import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { runExtraction } from "@/lib/geminiExtraction";
import { parseWebhookIdentifiers } from "@/lib/meetingBaas";
import type { SupabaseClient } from "@supabase/supabase-js";

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

  const ids = parseWebhookIdentifiers(payload);
  const eventType = ids.eventType;
  const botId = ids.botId;

  console.log("[Meeting BaaS webhook] Parsed identifiers", {
    eventType,
    bot_id: botId,
    generic_id: ids.genericId,
    bespken_meeting_id: ids.bespkenMeetingId,
    calendar_event_id: ids.calendarEventId,
  });

  if (!botId && !ids.bespkenMeetingId) {
    console.warn("[Meeting BaaS webhook] No bot_id or bespken_meeting_id in payload:", payload);
    return Response.json({ received: true, warning: "missing_bot_id" }, { status: 200 });
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (error) {
    console.error("[Meeting BaaS webhook] Cannot access meetings table:", error);
    return Response.json(
      {
        received: false,
        error: "missing_service_role_key",
        message:
          "Set SUPABASE_SERVICE_ROLE_KEY so the webhook can read/update meetings (anon key is blocked by RLS).",
      },
      { status: 500 },
    );
  }
  const meeting = await findMeetingRow(supabase, ids);

  // Handle bot.failed
  if (eventType === "bot.failed" || eventType.includes("failed")) {
    console.log(`[Meeting BaaS webhook] Bot ${botId} failed.`);
    if (!meeting) {
      console.warn("[Meeting BaaS webhook] No meeting record for failed bot", ids);
      return Response.json({ received: true, warning: "meeting_not_found" }, { status: 200 });
    }

    const { error: updateError } = await supabase
      .from("meetings")
      .update({
        status: "failed",
        bot_id: botId ?? meeting.bot_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", meeting.id);

    if (updateError) {
      console.error("[Meeting BaaS webhook] Failed to update meeting status to failed:", updateError);
    }

    return Response.json({ received: true, status: "failed_recorded" }, { status: 200 });
  }

  // Handle bot.completed
  if (eventType === "bot.completed" || eventType.includes("completed")) {
    console.log(`[Meeting BaaS webhook] Bot ${botId} completed. Processing transcript...`);

    if (!meeting) {
      console.warn("[Meeting BaaS webhook] No meeting record found", {
        bot_id: botId,
        generic_id: ids.genericId,
        bespken_meeting_id: ids.bespkenMeetingId,
        calendar_event_id: ids.calendarEventId,
      });
      return Response.json({ received: true, warning: "meeting_not_found" }, { status: 200 });
    }

    if (botId && meeting.bot_id !== botId) {
      console.warn("[Meeting BaaS webhook] bot_id mismatch — updating stored bot_id to webhook value", {
        meeting_id: meeting.id,
        stored_bot_id: meeting.bot_id,
        webhook_bot_id: botId,
      });
      const { error: syncError } = await supabase
        .from("meetings")
        .update({
          bot_id: botId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", meeting.id);
      if (syncError) {
        console.error("[Meeting BaaS webhook] Failed to sync webhook bot_id:", syncError);
      }
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

      const extractionUpdate: Record<string, unknown> = {
        extracted_client: extraction.client,
        extracted_scope: extraction.scope,
        extracted_price: extraction.price,
        extracted_timeline: extraction.timeline,
        extracted_notes: extraction.notes,
        status: "extracted",
        updated_at: new Date().toISOString(),
      };

      if (meeting.original_extracted_client == null) {
        extractionUpdate.original_extracted_client = extraction.client;
      }
      if (meeting.original_extracted_scope == null) {
        extractionUpdate.original_extracted_scope = extraction.scope;
      }
      if (meeting.original_extracted_price == null) {
        extractionUpdate.original_extracted_price = extraction.price;
      }
      if (meeting.original_extracted_timeline == null) {
        extractionUpdate.original_extracted_timeline = extraction.timeline;
      }
      if (meeting.original_extracted_notes == null) {
        extractionUpdate.original_extracted_notes = extraction.notes;
      }

      const { error: extractedError } = await supabase
        .from("meetings")
        .update(extractionUpdate)
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

async function findMeetingRow(
  supabase: SupabaseClient,
  ids: ReturnType<typeof parseWebhookIdentifiers>,
) {
  if (ids.bespkenMeetingId) {
    const { data, error } = await supabase
      .from("meetings")
      .select(
        "id, bot_id, status, original_extracted_client, original_extracted_scope, original_extracted_price, original_extracted_timeline, original_extracted_notes",
      )
      .eq("id", ids.bespkenMeetingId)
      .maybeSingle();

    if (error) {
      console.error("[Meeting BaaS webhook] Error finding meeting by id:", error);
    } else if (data) {
      console.log("[Meeting BaaS webhook] Matched meeting by bespken_meeting_id", {
        meeting_id: data.id,
        stored_bot_id: data.bot_id,
        webhook_bot_id: ids.botId,
      });
      return data;
    }
  }

  if (ids.botId) {
    const { data, error } = await supabase
      .from("meetings")
      .select(
        "id, bot_id, status, original_extracted_client, original_extracted_scope, original_extracted_price, original_extracted_timeline, original_extracted_notes",
      )
      .eq("bot_id", ids.botId)
      .maybeSingle();

    if (error) {
      console.error("[Meeting BaaS webhook] Error finding meeting by bot_id:", error);
      return null;
    }

    if (data) {
      console.log("[Meeting BaaS webhook] Matched meeting by bot_id", {
        meeting_id: data.id,
        bot_id: ids.botId,
      });
      return data;
    }
  }

  if (ids.calendarEventId) {
    const { data, error } = await supabase
      .from("meetings")
      .select(
        "id, bot_id, status, original_extracted_client, original_extracted_scope, original_extracted_price, original_extracted_timeline, original_extracted_notes",
      )
      .eq("calendar_event_id", ids.calendarEventId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[Meeting BaaS webhook] Error finding meeting by calendar_event_id:", error);
    } else if (data) {
      console.log("[Meeting BaaS webhook] Matched meeting by calendar_event_id", {
        meeting_id: data.id,
        stored_bot_id: data.bot_id,
        webhook_bot_id: ids.botId,
      });
      return data;
    }
  }

  return null;
}
