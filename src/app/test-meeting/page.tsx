"use client";

import { useState } from "react";

function errorMessageFromPayload(payload: unknown, fallback: string): string {
  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
  }

  return fallback;
}

export default function TestMeetingPage() {
  const [meetingUrl, setMeetingUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [botId, setBotId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    const url = meetingUrl.trim();
    if (!url) {
      setError("Paste a Zoom or Google Meet URL first.");
      setBotId(null);
      return;
    }

    setLoading(true);
    setError(null);
    setBotId(null);

    try {
      const response = await fetch("/api/meetings/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingUrl: url }),
      });

      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          errorMessageFromPayload(
            payload,
            `Request failed (${response.status})`,
          ),
        );
        return;
      }

      const data =
        typeof payload === "object" && payload !== null && "data" in payload
          ? (payload as { data?: { bot_id?: unknown } }).data
          : undefined;
      const returnedBotId =
        typeof data?.bot_id === "string" ? data.bot_id : null;

      if (!returnedBotId) {
        setError("Join succeeded but no bot_id was returned.");
        return;
      }

      setBotId(returnedBotId);
    } catch {
      setError("Could not reach /api/meetings/join.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white p-8">
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-xl font-medium">Test meeting join</h1>
        <p className="text-sm text-white/60">
          Internal tool. Paste a Zoom or Google Meet URL and send a bot.
        </p>

        <label className="block text-sm text-white/70" htmlFor="meeting-url">
          Meeting URL
        </label>
        <input
          id="meeting-url"
          type="url"
          value={meetingUrl}
          onChange={(event) => setMeetingUrl(event.target.value)}
          placeholder="https://meet.google.com/abc-defg-hij"
          disabled={loading}
          className="w-full rounded border border-white/15 bg-[#121218] px-3 py-2 text-sm text-white outline-none placeholder:text-white/30"
        />

        <button
          type="button"
          onClick={handleJoin}
          disabled={loading}
          className="rounded bg-white/10 px-4 py-2 text-sm disabled:opacity-50"
        >
          {loading ? "Joining…" : "Join Meeting"}
        </button>

        {botId ? (
          <div className="space-y-1 text-sm">
            <p>
              bot_id: <span className="font-mono text-white/90">{botId}</span>
            </p>
            <p className="text-white/70">
              Bot is joining the call. Once the call ends, check the webhook
              logs for the transcript.
            </p>
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
