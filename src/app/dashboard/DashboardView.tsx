"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { CalendarEvent } from "@/lib/googleCalendar";

const CALENDAR_READONLY_SCOPE =
  "https://www.googleapis.com/auth/calendar.readonly";

type JoinState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success" }
  | { status: "error"; message: string };

function formatEventWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfEvent = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfEvent.getTime() - startOfToday.getTime()) / 86_400_000,
  );

  if (diffDays === 0) {
    return `Today, ${time}`;
  }
  if (diffDays === 1) {
    return `Tomorrow, ${time}`;
  }

  const day = date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${day}, ${time}`;
}

function errorFromPayload(payload: unknown, fallback: string): string {
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

export default function DashboardView() {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [hasCalendar, setHasCalendar] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [joinById, setJoinById] = useState<Record<string, JoinState>>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) {
      setError(
        "Google sign-in failed. Check the redirect URL and Google provider settings.",
      );
    } else if (params.get("token_error")) {
      setError(`Signed in, but tokens were not saved: ${params.get("token_error")}`);
    } else if (params.get("token_warning") === "missing_refresh_token") {
      setError(
        "Signed in, but Google did not return a refresh token. Reconnect so Bespken can keep calendar access.",
      );
    }

    void bootstrap();
  }, []);

  async function bootstrap() {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) {
      setEmail(null);
      setHasCalendar(false);
      setSessionLoading(false);
      return;
    }

    setEmail(session.user.email ?? session.user.id);

    const { data: row } = await supabase
      .from("user_tokens")
      .select("google_access_token, google_refresh_token")
      .eq("user_id", session.user.id)
      .maybeSingle();

    const connected = Boolean(
      row?.google_access_token || row?.google_refresh_token,
    );
    setHasCalendar(connected);
    setSessionLoading(false);

    if (connected) {
      await loadEvents();
    }
  }

  async function loadEvents() {
    setEventsLoading(true);

    try {
      const response = await fetch("/api/calendar/events");
      const payload: unknown = await response.json().catch(() => null);

      if (response.status === 404) {
        setHasCalendar(false);
        setEvents([]);
        return;
      }

      if (response.status === 401) {
        const code =
          typeof payload === "object" && payload !== null && "error" in payload
            ? String((payload as { error?: unknown }).error ?? "")
            : "";
        if (code === "not_authenticated") {
          setEmail(null);
          setHasCalendar(false);
          setEvents([]);
          return;
        }
        setHasCalendar(false);
        setError(
          errorFromPayload(
            payload,
            "Calendar access expired. Reconnect Google Calendar.",
          ),
        );
        return;
      }

      if (!response.ok) {
        setError(errorFromPayload(payload, "Could not load calendar events."));
        return;
      }

      const list =
        typeof payload === "object" &&
        payload !== null &&
        "events" in payload &&
        Array.isArray((payload as { events?: unknown }).events)
          ? ((payload as { events: CalendarEvent[] }).events)
          : [];

      setHasCalendar(true);
      setEvents(list);
    } catch {
      setError("Could not reach the calendar API.");
    } finally {
      setEventsLoading(false);
    }
  }

  async function connectGoogleCalendar() {
    setOauthBusy(true);
    setError(null);
    const supabase = getSupabase();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: CALENDAR_READONLY_SCOPE,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (oauthError) {
      setOauthBusy(false);
      setError(oauthError.message);
    }
  }

  async function disconnect() {
    setOauthBusy(true);
    setError(null);
    const supabase = getSupabase();
    const { error: signOutError } = await supabase.auth.signOut();
    setOauthBusy(false);

    if (signOutError) {
      setError(signOutError.message);
      return;
    }

    setEmail(null);
    setHasCalendar(false);
    setEvents([]);
    setJoinById({});
  }

  async function joinEvent(event: CalendarEvent) {
    setJoinById((current) => ({
      ...current,
      [event.id]: { status: "loading" },
    }));

    try {
      const response = await fetch("/api/meetings/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingUrl: event.meetingUrl }),
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setJoinById((current) => ({
          ...current,
          [event.id]: {
            status: "error",
            message: errorFromPayload(
              payload,
              `Could not send Bespken to this call (${response.status})`,
            ),
          },
        }));
        return;
      }

      setJoinById((current) => ({
        ...current,
        [event.id]: { status: "success" },
      }));
    } catch {
      setJoinById((current) => ({
        ...current,
        [event.id]: {
          status: "error",
          message: "Could not reach /api/meetings/join.",
        },
      }));
    }
  }

  return (
    <main className="relative min-h-screen bg-[#0B0B0F] text-white">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] max-w-full h-[280px] rounded-full opacity-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, #F2A84D 0%, rgba(242, 168, 77, 0.12) 45%, transparent 75%)",
        }}
        aria-hidden="true"
      />

      <header className="relative z-10 px-6 py-5 border-b border-white/8">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2.5 group" aria-label="Bespken home">
            <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center group-hover:bg-amber-300 transition-colors duration-200">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 2h5a3 3 0 010 6H2V2z" fill="#0B0B0F" />
                <path d="M2 8h6a3 3 0 010 6H2V8z" fill="#0B0B0F" opacity="0.6" />
              </svg>
            </div>
            <span className="text-base font-bold text-white tracking-tight">Bespken</span>
          </a>

          {email ? (
            <div className="flex items-center gap-3 text-sm min-w-0">
              <p className="text-stone-400 truncate">
                Connected as <span className="text-stone-200">{email}</span>
              </p>
              <button
                type="button"
                onClick={disconnect}
                disabled={oauthBusy}
                className="shrink-0 text-stone-500 hover:text-stone-300 transition-colors duration-200 disabled:opacity-50"
              >
                Disconnect
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <section className="relative z-10 max-w-3xl mx-auto px-6 py-10 space-y-6">
        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        {sessionLoading ? (
          <EventsSkeleton />
        ) : !email || !hasCalendar ? (
          <ConnectCard
            busy={oauthBusy}
            signedIn={Boolean(email)}
            onConnect={connectGoogleCalendar}
          />
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Upcoming calls</h1>
              <p className="mt-1 text-sm text-stone-400">
                Video meetings from your Google Calendar over the next 7 days.
              </p>
            </div>

            {eventsLoading ? (
              <EventsSkeleton />
            ) : events.length === 0 ? (
              <div className="rounded-2xl border border-white/8 bg-white/2 px-6 py-12 text-center">
                <p className="text-sm text-stone-400">
                  No upcoming calls with a video link found in the next 7 days.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    joinState={joinById[event.id] ?? { status: "idle" }}
                    onJoin={() => void joinEvent(event)}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function ConnectCard({
  busy,
  signedIn,
  onConnect,
}: {
  busy: boolean;
  signedIn: boolean;
  onConnect: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/2 p-8 text-center space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Connect Google Calendar</h1>
      <p className="text-sm text-stone-400 max-w-md mx-auto">
        {signedIn
          ? "Calendar access is missing or expired. Reconnect so Bespken can see your upcoming Zoom and Google Meet calls."
          : "Sign in with Google to pull upcoming Zoom and Google Meet calls from your calendar."}
      </p>
      <button
        type="button"
        onClick={onConnect}
        disabled={busy}
        className="px-6 py-3 rounded-lg bg-amber-400 text-stone-900 font-semibold text-sm hover:bg-amber-300 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-[#0B0B0F]"
      >
        {busy ? "Redirecting…" : "Connect Google Calendar"}
      </button>
    </div>
  );
}

function EventsSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading upcoming calls">
      <div className="h-8 w-48 rounded-lg bg-white/8 animate-pulse" />
      <div className="h-4 w-72 rounded bg-white/5 animate-pulse" />
      {[0, 1, 2].map((key) => (
        <div
          key={key}
          className="rounded-2xl border border-white/8 bg-white/2 p-5 flex items-center justify-between gap-4"
        >
          <div className="space-y-2 flex-1">
            <div className="h-4 w-2/3 rounded bg-white/10 animate-pulse" />
            <div className="h-3 w-32 rounded bg-white/6 animate-pulse" />
          </div>
          <div className="h-9 w-36 rounded-lg bg-amber-400/20 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function EventCard({
  event,
  joinState,
  onJoin,
}: {
  event: CalendarEvent;
  joinState: JoinState;
  onJoin: () => void;
}) {
  const loading = joinState.status === "loading";
  const joined = joinState.status === "success";

  return (
    <li className="rounded-2xl border border-white/8 bg-white/2 p-5 hover:border-amber-400/20 hover:bg-white/4 transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="min-w-0">
          <p className="font-medium text-white truncate">{event.summary}</p>
          <p className="text-sm text-stone-400 mt-1">{formatEventWhen(event.start)}</p>
        </div>
        {joined ? (
          <span className="shrink-0 inline-flex items-center px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium text-sm">
            Joined
          </span>
        ) : (
          <button
            type="button"
            onClick={onJoin}
            disabled={loading}
            className="shrink-0 px-4 py-2.5 rounded-lg bg-amber-400 text-stone-900 font-semibold text-sm hover:bg-amber-300 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-[#0B0B0F]"
          >
            {loading ? "Joining…" : "Join with Bespken"}
          </button>
        )}
      </div>
      {joined ? (
        <p className="mt-3 text-sm text-stone-300">
          ✅ Bespken has joined this call. You&apos;ll be notified when the transcript is ready.
        </p>
      ) : null}
      {joinState.status === "error" ? (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {joinState.message}
        </p>
      ) : null}
    </li>
  );
}
