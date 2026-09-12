"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import {
  buildEditLog,
  normalizeExtractedValue,
  type EditLogEntry,
} from "@/lib/editLog";

export type MeetingRecord = {
  id: string;
  user_id: string;
  bot_id: string;
  meeting_title: string | null;
  status: "joining" | "completed" | "extracted" | "failed" | string;
  transcript_text: string | null;
  extracted_client: string | null;
  extracted_scope: string | null;
  extracted_price: string | null;
  extracted_timeline: string | null;
  extracted_notes: string | null;
  original_extracted_client: string | null;
  original_extracted_scope: string | null;
  original_extracted_price: string | null;
  original_extracted_timeline: string | null;
  original_extracted_notes: string | null;
  edit_log: EditLogEntry[] | null;
  created_at: string;
  updated_at: string;
};

export default function MeetingReviewClient({ meetingId }: { meetingId: string }) {
  const [meeting, setMeeting] = useState<MeetingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form edit state
  const [client, setClient] = useState("");
  const [scope, setScope] = useState("");
  const [price, setPrice] = useState("");
  const [timeline, setTimeline] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const router = useRouter();

  const fetchMeeting = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data, error: dbError } = await supabase
        .from("meetings")
        .select("*")
        .eq("id", meetingId)
        .maybeSingle();

      if (dbError) {
        setError(dbError.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setError("Meeting not found");
        setLoading(false);
        return;
      }

      const rec = data as MeetingRecord;
      setMeeting(rec);
      setLoading(false);

      // Pre-fill editable fields if they haven't been modified yet
      setClient((prev) => (prev ? prev : rec.extracted_client || ""));
      setScope((prev) => (prev ? prev : rec.extracted_scope || ""));
      setPrice((prev) => (prev ? prev : rec.extracted_price || ""));
      setTimeline((prev) => (prev ? prev : rec.extracted_timeline || ""));
      setNotes((prev) => (prev ? prev : rec.extracted_notes || ""));
    } catch {
      setError("Failed to load meeting details.");
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    void fetchMeeting();
  }, [fetchMeeting]);

  // Polling when meeting is in progress
  useEffect(() => {
    if (!meeting) return;
    if (meeting.status !== "joining" && meeting.status !== "completed") return;

    const interval = setInterval(() => {
      void fetchMeeting();
    }, 3000);

    return () => clearInterval(interval);
  }, [meeting, fetchMeeting]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!meeting) return;

    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const supabase = getSupabase();
      const editedAt = new Date().toISOString();
      const nextClient = normalizeExtractedValue(client);
      const nextScope = normalizeExtractedValue(scope);
      const nextPrice = normalizeExtractedValue(price);
      const nextTimeline = normalizeExtractedValue(timeline);
      const nextNotes = normalizeExtractedValue(notes);
      const nextEditLog = buildEditLog({
        originals: {
          client: meeting.original_extracted_client,
          scope: meeting.original_extracted_scope,
          price: meeting.original_extracted_price,
          timeline: meeting.original_extracted_timeline,
          notes: meeting.original_extracted_notes,
        },
        current: {
          client: nextClient,
          scope: nextScope,
          price: nextPrice,
          timeline: nextTimeline,
          notes: nextNotes,
        },
        previousSaved: {
          client: meeting.extracted_client,
          scope: meeting.extracted_scope,
          price: meeting.extracted_price,
          timeline: meeting.extracted_timeline,
          notes: meeting.extracted_notes,
        },
        existingLog: meeting.edit_log,
        editedAt,
      });

      const { error: updateError } = await supabase
        .from("meetings")
        .update({
          extracted_client: nextClient,
          extracted_scope: nextScope,
          extracted_price: nextPrice,
          extracted_timeline: nextTimeline,
          extracted_notes: nextNotes,
          edit_log: nextEditLog,
          updated_at: editedAt,
        })
        .eq("id", meeting.id);

      if (updateError) {
        setSaveError(updateError.message);
      } else {
        setMeeting((current) =>
          current
            ? {
                ...current,
                extracted_client: nextClient,
                extracted_scope: nextScope,
                extracted_price: nextPrice,
                extracted_timeline: nextTimeline,
                extracted_notes: nextNotes,
                edit_log: nextEditLog,
                updated_at: editedAt,
              }
            : current,
        );
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch {
      setSaveError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateProposal() {
    if (!meeting || meeting.status !== "extracted") return;

    setGenerating(true);
    setGenerateError(null);
    setSaveError(null);

    try {
      const supabase = getSupabase();
      const { error: updateError } = await supabase
        .from("meetings")
        .update({
          extracted_client: client.trim() || null,
          extracted_scope: scope.trim() || null,
          extracted_price: price.trim() || null,
          extracted_timeline: timeline.trim() || null,
          extracted_notes: notes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", meeting.id);

      if (updateError) {
        setGenerateError(updateError.message);
        return;
      }

      const response = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: meeting.id, type: "proposal" }),
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "message" in payload &&
          typeof (payload as { message?: unknown }).message === "string"
            ? (payload as { message: string }).message
            : "Could not generate proposal.";
        setGenerateError(message);
        return;
      }

      const documentId =
        typeof payload === "object" &&
        payload !== null &&
        "data" in payload &&
        typeof (payload as { data?: { id?: unknown } }).data?.id === "string"
          ? (payload as { data: { id: string } }).data.id
          : null;

      if (!documentId) {
        setGenerateError("Proposal was created but no document id was returned.");
        return;
      }

      router.push(`/documents/${documentId}`);
    } catch {
      setGenerateError("Could not generate the proposal. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  const isProcessing =
    meeting?.status === "joining" || meeting?.status === "completed";
  const isExtracted = meeting?.status === "extracted";
  const isFailed = meeting?.status === "failed";

  return (
    <main className="relative text-white">
      {meeting ? (
        <div className="relative z-10 border-b border-white/8 bg-white/[0.02]">
          <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-end gap-2">
            <span className="text-xs text-stone-400">Status:</span>
            {meeting.status === "joining" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-400/10 text-amber-400 border border-amber-400/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                Joining call
              </span>
            ) : meeting.status === "completed" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-400/20">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                Extracting details
              </span>
            ) : meeting.status === "extracted" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Extracted
              </span>
            ) : meeting.status === "failed" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                Failed
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Main Content Area */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-10 space-y-6">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-8 w-64 bg-white/10 rounded-lg" />
            <div className="h-4 w-96 bg-white/5 rounded" />
            <div className="h-64 bg-white/2 border border-white/8 rounded-2xl" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto text-xl">
              ⚠️
            </div>
            <h1 className="text-xl font-semibold text-white">Unable to load meeting</h1>
            <p className="text-sm text-stone-400">{error}</p>
            <Link
              href="/dashboard"
              className="inline-block px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : isProcessing ? (
          /* Processing / Loading State */
          <div className="rounded-2xl border border-white/8 bg-white/2 p-10 text-center space-y-6">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-amber-400/20" />
              <div className="absolute inset-0 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <span className="text-2xl">🎙️</span>
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h1 className="text-2xl font-bold tracking-tight">Processing your call…</h1>
              <p className="text-sm text-stone-400 leading-relaxed">
                {meeting?.status === "joining"
                  ? "Bespken is participating in the call. As soon as the meeting wraps up, we will transcribe and extract your project scope, pricing, and timeline."
                  : "Call completed! Transcribing and extracting structured proposal details using Gemini AI…"}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-stone-400">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Auto-refreshing live when extraction completes
            </div>

            {meeting?.meeting_title ? (
              <div className="inline-block px-3.5 py-1.5 rounded-lg bg-white/4 border border-white/8 text-xs text-stone-300">
                Meeting: <span className="text-white font-medium">{meeting.meeting_title}</span>
              </div>
            ) : null}
          </div>
        ) : isFailed ? (
          /* Failed State */
          <div className="rounded-2xl border border-red-500/20 bg-white/2 p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto text-2xl">
              ❌
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h1 className="text-2xl font-bold tracking-tight">Call Processing Failed</h1>
              <p className="text-sm text-stone-400 leading-relaxed">
                We couldn&apos;t process this meeting or obtain a transcript from the bot. Please check if the meeting link was valid or try joining your next call.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="inline-block px-5 py-2.5 rounded-lg bg-amber-400 text-stone-900 font-semibold text-sm hover:bg-amber-300 transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        ) : (
          /* Extracted Review State */
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {meeting?.meeting_title ? meeting.meeting_title : "Meeting Review & Extraction"}
              </h1>
              <p className="mt-1 text-sm text-stone-400">
                AI-extracted project details from your call. Review and edit the fields below.
              </p>
            </div>

            {/* Prominent Accuracy Warning */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4.5 flex items-start gap-3.5 shadow-lg shadow-amber-950/20">
              <div className="shrink-0 text-xl leading-none pt-0.5">⚠️</div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-300">
                  Review carefully before using
                </p>
                <p className="text-xs sm:text-sm text-amber-200/80 leading-relaxed">
                  AI-extracted numbers and details may be inaccurate. Always verify pricing and scope against your actual conversation.
                </p>
              </div>
            </div>

            {/* Editable Form */}
            <form onSubmit={handleSave} className="space-y-6">
              <div className="rounded-2xl border border-white/8 bg-white/2 p-6 sm:p-8 space-y-6">
                {/* Client / Business Name */}
                <div className="space-y-2">
                  <label htmlFor="client-name" className="block text-sm font-medium text-stone-200">
                    Client / Business Name
                  </label>
                  <input
                    id="client-name"
                    type="text"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder="e.g. Acme Corp, Jane Doe"
                    className="w-full rounded-xl border border-white/12 bg-[#121218] px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
                  />
                  <p className="text-xs text-stone-400">
                    The name or organization of the prospective client.
                  </p>
                </div>

                {/* Project Scope & Deliverables */}
                <div className="space-y-2">
                  <label htmlFor="scope-desc" className="block text-sm font-medium text-stone-200">
                    Project Scope & Deliverables
                  </label>
                  <textarea
                    id="scope-desc"
                    rows={4}
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    placeholder="Description of deliverables, technical requirements, and core features discussed…"
                    className="w-full rounded-xl border border-white/12 bg-[#121218] px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors leading-relaxed"
                  />
                  <p className="text-xs text-stone-400">
                    Summary of work, features, or consulting deliverables.
                  </p>
                </div>

                {/* Price & Budget Figures */}
                <div className="space-y-2">
                  <label htmlFor="price-figures" className="block text-sm font-medium text-stone-200">
                    Price & Budget Discussed
                  </label>
                  <textarea
                    id="price-figures"
                    rows={3}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. $5,000 fixed milestone / $120/hr, budget cap mentioned…"
                    className="w-full rounded-xl border border-white/12 bg-[#121218] px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors leading-relaxed"
                  />
                  <p className="text-xs text-stone-400">
                    Includes all pricing, budget quotes, or rate figures mentioned during the conversation.
                  </p>
                </div>

                {/* Timeline & Deadlines */}
                <div className="space-y-2">
                  <label htmlFor="timeline-deadlines" className="block text-sm font-medium text-stone-200">
                    Timeline & Deadlines
                  </label>
                  <input
                    id="timeline-deadlines"
                    type="text"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="e.g. 4-6 weeks, Launch by end of Q3"
                    className="w-full rounded-xl border border-white/12 bg-[#121218] px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
                  />
                  <p className="text-xs text-stone-400">
                    Expected project duration, milestone targets, or hard deadlines.
                  </p>
                </div>

                {/* Important Notes */}
                <div className="space-y-2">
                  <label htmlFor="important-notes" className="block text-sm font-medium text-stone-200">
                    Additional Important Notes
                  </label>
                  <textarea
                    id="important-notes"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Key constraints, follow-up items, client preferences, or tech stack mentions…"
                    className="w-full rounded-xl border border-white/12 bg-[#121218] px-4 py-3 text-sm text-white placeholder:text-stone-600 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors leading-relaxed"
                  />
                  <p className="text-xs text-stone-400">
                    Other critical discussion points to keep in mind.
                  </p>
                </div>
              </div>

              {/* Feedback messages */}
              {saveError ? (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {saveError}
                </div>
              ) : null}

              {saveSuccess ? (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
                  <span>✅</span> Changes saved successfully.
                </div>
              ) : null}

              {generateError ? (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {generateError}
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="text-xs text-stone-400 hover:text-stone-200 transition-colors"
                >
                  {showTranscript ? "Hide raw transcript" : "View raw transcript"}
                </button>

                <div className="flex flex-wrap items-center justify-end gap-3">
                  <Link
                    href="/dashboard"
                    className="px-4 py-2.5 rounded-lg border border-white/10 text-stone-300 text-sm font-medium hover:bg-white/5 transition-colors"
                  >
                    Back to Dashboard
                  </Link>

                  <button
                    type="submit"
                    disabled={saving || generating}
                    className="px-6 py-2.5 rounded-lg bg-amber-400 text-stone-900 font-semibold text-sm hover:bg-amber-300 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-[#0B0B0F]"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleGenerateProposal()}
                    disabled={!isExtracted || generating || saving}
                    className="px-6 py-2.5 rounded-lg border border-amber-400/40 bg-amber-400/10 text-amber-300 font-semibold text-sm hover:bg-amber-400/15 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-[#0B0B0F]"
                  >
                    {generating ? "Generating…" : "Generate Proposal"}
                  </button>
                </div>
              </div>
            </form>

            {/* Optional Collapsible Transcript View */}
            {showTranscript ? (
              <div className="rounded-2xl border border-white/8 bg-white/2 p-6 space-y-3">
                <h2 className="text-sm font-medium text-stone-300">Raw Call Transcript</h2>
                <div className="max-h-80 overflow-y-auto rounded-xl bg-[#09090D] p-4 text-xs font-mono text-stone-300 whitespace-pre-wrap leading-relaxed border border-white/5">
                  {meeting?.transcript_text || "(No transcript available)"}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
