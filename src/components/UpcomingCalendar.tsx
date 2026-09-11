"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import MeetingPlatformIcon from "@/components/MeetingPlatformIcon";
import { errorFromPayload, formatEventWhen } from "@/lib/dashboardUi";
import type { CalendarEvent } from "@/lib/googleCalendar";
import { getSupabase } from "@/lib/supabase";

const CALENDAR_READONLY_SCOPE =
  "https://www.googleapis.com/auth/calendar.readonly";

type JoinState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; meetingId?: string }
  | { status: "error"; message: string };

export default function UpcomingCalendar() {
  const router = useRouter();
  const [sessionLoading, setSessionLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [hasCalendar, setHasCalendar] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [joinById, setJoinById] = useState<Record<string, JoinState>>({});
  const joinInFlight = useRef<Set<string>>(new Set());

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

    const supabase = getSupabase();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setEmail(null);
        setHasCalendar(false);
        setEvents([]);
        setJoinById({});
      }
    });

    return () => subscription.unsubscribe();
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

  async function joinEvent(event: CalendarEvent, options?: { force?: boolean }) {
    const currentState = joinById[event.id];
    if (!options?.force) {
      if (
        joinInFlight.current.has(event.id) ||
        currentState?.status === "loading" ||
        currentState?.status === "success"
      ) {
        return;
      }
    }

    joinInFlight.current.add(event.id);
    setJoinById((current) => ({
      ...current,
      [event.id]: { status: "loading" },
    }));

    try {
      const response = await fetch("/api/meetings/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingUrl: event.meetingUrl,
          meetingTitle: event.summary,
          calendarEventId: event.id,
        }),
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        joinInFlight.current.delete(event.id);
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

      const data =
        typeof payload === "object" && payload !== null && "data" in payload
          ? (payload as { data?: { id?: string; meeting_id?: string } }).data
          : undefined;

      const meetingId = data?.id || data?.meeting_id;

      setJoinById((current) => ({
        ...current,
        [event.id]: {
          status: "success",
          meetingId,
        },
      }));
      router.refresh();
    } catch {
      joinInFlight.current.delete(event.id);
      setJoinById((current) => ({
        ...current,
        [event.id]: {
          status: "error",
          message: "Could not reach /api/meetings/join.",
        },
      }));
    }
  }

  const signedIn = Boolean(email);

  return (
    <div id="upcoming" className="rounded-xl border border-white/8 bg-[#141414] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/8">
        <h2 className="text-sm font-semibold tracking-tight">Upcoming meetings</h2>
        <p className="text-xs text-stone-500 mt-0.5">Video calls from Google Calendar, next 7 days</p>
      </div>
      <div className="p-4">
        {error ? (
          <p className="text-sm text-red-400 mb-3" role="alert">
            {error}
          </p>
        ) : null}

        {sessionLoading || eventsLoading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading upcoming calls">
            {[0, 1, 2].map((key) => (
              <div key={key} className="h-16 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : !email || !hasCalendar ? (
          <div className="py-8 px-2 text-center space-y-3">
            <p className="text-sm text-stone-400 max-w-sm mx-auto">
              {signedIn
                ? "Calendar access is missing or expired. Reconnect so Bespken can see your upcoming Zoom and Google Meet calls."
                : "Sign in with Google to pull upcoming Zoom and Google Meet calls from your calendar."}
            </p>
            <button
              type="button"
              onClick={() => void connectGoogleCalendar()}
              disabled={oauthBusy}
              className="px-5 py-2.5 rounded-lg bg-amber-500 text-stone-950 font-semibold text-sm hover:bg-amber-400 active:scale-[0.98] transition-all duration-150 disabled:opacity-60"
            >
              {oauthBusy ? "Redirecting…" : "Connect Google Calendar"}
            </button>
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-stone-500 py-8 text-center">
            No upcoming calls with a video link found in the next 7 days.
          </p>
        ) : (
          <ul className="divide-y divide-white/6">
            {events.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                joinState={joinById[event.id] ?? { status: "idle" }}
                onJoin={() => void joinEvent(event)}
                onJoinAgain={() => void joinEvent(event, { force: true })}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EventRow({
  event,
  joinState,
  onJoin,
  onJoinAgain,
}: {
  event: CalendarEvent;
  joinState: JoinState;
  onJoin: () => void;
  onJoinAgain: () => void;
}) {
  const loading = joinState.status === "loading";
  const joined = joinState.status === "success";
  const meetingId = joinState.status === "success" ? joinState.meetingId : undefined;

  return (
    <li className="py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <MeetingPlatformIcon url={event.meetingUrl} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{event.summary}</p>
            <p className="text-xs text-stone-500 mt-0.5">{formatEventWhen(event.start)}</p>
          </div>
        </div>
        {joined ? (
          <div className="flex items-center gap-2 shrink-0">
            {meetingId ? (
              <Link
                href={`/meetings/${meetingId}`}
                className="text-xs font-medium text-amber-400 hover:text-amber-300"
              >
                View
              </Link>
            ) : null}
            <span className="text-xs font-medium text-emerald-400">Joined</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onJoin}
            disabled={loading}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-semibold text-xs hover:bg-amber-400 disabled:opacity-60"
          >
            {loading ? "Joining…" : "Join with Bespken"}
          </button>
        )}
      </div>
      {joined ? (
        <div className="mt-2 pl-11 flex items-center justify-between gap-2">
          <p className="text-xs text-stone-400">Bespken has joined this call.</p>
          <button
            type="button"
            onClick={onJoinAgain}
            className="text-xs text-stone-500 hover:text-stone-300"
          >
            Send bot again
          </button>
        </div>
      ) : null}
      {joinState.status === "error" ? (
        <p className="mt-2 pl-11 text-xs text-red-400" role="alert">
          {joinState.message}
        </p>
      ) : null}
    </li>
  );
}
