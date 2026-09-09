"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import AppNav from "@/components/AppNav";
import type { DashboardDocument, DashboardMeeting } from "@/lib/dashboardTypes";
import type { CalendarEvent } from "@/lib/googleCalendar";
import { getSupabase } from "@/lib/supabase";

const CALENDAR_READONLY_SCOPE =
  "https://www.googleapis.com/auth/calendar.readonly";

type JoinState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; meetingId?: string }
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

function formatCreatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

function statusLabel(status: string): string {
  if (status === "joining") return "Joining";
  if (status === "completed") return "Completed";
  if (status === "extracted") return "Extracted";
  if (status === "failed") return "Failed";
  return status;
}

function statusBadgeClass(status: string): string {
  if (status === "joining") {
    return "bg-amber-400/12 text-amber-400 border-amber-400/25";
  }
  if (status === "completed") {
    return "bg-sky-500/12 text-sky-400 border-sky-400/25";
  }
  if (status === "extracted") {
    return "bg-emerald-500/12 text-emerald-400 border-emerald-500/25";
  }
  if (status === "failed") {
    return "bg-red-500/12 text-red-400 border-red-500/25";
  }
  return "bg-white/8 text-stone-300 border-white/12";
}

export default function DashboardView({
  initialEmail,
  meetings,
  documents,
}: {
  initialEmail: string | null;
  meetings: DashboardMeeting[];
  documents: DashboardDocument[];
}) {
  const router = useRouter();
  const [sessionLoading, setSessionLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(initialEmail);
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
    <main className="relative min-h-screen bg-[#0B0B0F] text-white">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] max-w-full h-[360px] rounded-full opacity-25 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, #F2A84D 0%, rgba(242, 168, 77, 0.14) 40%, transparent 75%)",
        }}
        aria-hidden="true"
      />

      <AppNav initialEmail={email} />

      <section className="relative z-10 max-w-4xl mx-auto px-6 py-10 space-y-12">
        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="space-y-6">
          {sessionLoading ? (
            <EventsSkeleton />
          ) : !email || !hasCalendar ? (
            <ConnectCard
              busy={oauthBusy}
              signedIn={signedIn}
              onConnect={connectGoogleCalendar}
            />
          ) : (
            <>
              <SectionHeader
                title="Upcoming calls"
                subtitle="Video meetings from your Google Calendar over the next 7 days."
              />

              {eventsLoading ? (
                <EventsSkeleton compact />
              ) : events.length === 0 ? (
                <EmptyState>
                  No upcoming calls with a video link found in the next 7 days.
                </EmptyState>
              ) : (
                <ul className="space-y-3">
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      joinState={joinById[event.id] ?? { status: "idle" }}
                      onJoin={() => void joinEvent(event)}
                      onJoinAgain={() => void joinEvent(event, { force: true })}
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        {signedIn ? (
          <>
            <section className="space-y-4">
              <SectionHeader
                title="Your meetings"
                subtitle="Calls Bespken has joined, newest first."
              />
              {meetings.length === 0 ? (
                <EmptyState>
                  No meetings yet — join a call to get started.
                </EmptyState>
              ) : (
                <ul className="space-y-3">
                  {meetings.map((meeting) => (
                    <MeetingRow key={meeting.id} meeting={meeting} />
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-4">
              <SectionHeader
                title="Your documents"
                subtitle="Generated proposals and follow-ups."
              />
              {documents.length === 0 ? (
                <EmptyState>
                  No documents yet — extract a meeting and generate a proposal.
                </EmptyState>
              ) : (
                <ul className="space-y-3">
                  {documents.map((doc) => (
                    <DocumentRow key={doc.id} document={doc} />
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-stone-400">{subtitle}</p>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="glass-panel rounded-2xl px-6 py-12 text-center">
      <p className="text-sm text-stone-400">{children}</p>
    </div>
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
    <div className="glass-panel rounded-2xl p-8 text-center space-y-4">
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

function EventsSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading upcoming calls">
      {compact ? null : (
        <>
          <div className="h-8 w-48 rounded-lg bg-white/8 animate-pulse" />
          <div className="h-4 w-72 rounded bg-white/5 animate-pulse" />
        </>
      )}
      {[0, 1, 2].map((key) => (
        <div
          key={key}
          className="glass-panel rounded-2xl p-5 flex items-center justify-between gap-4"
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
    <li className="glass-panel rounded-2xl p-5 hover:border-amber-400/25 hover:bg-white/[0.06] transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="min-w-0">
          <p className="font-medium text-white truncate">{event.summary}</p>
          <p className="text-sm text-stone-400 mt-1">{formatEventWhen(event.start)}</p>
        </div>
        {joined ? (
          <div className="flex items-center gap-2.5">
            {meetingId ? (
              <a
                href={`/meetings/${meetingId}`}
                className="shrink-0 px-3.5 py-2 rounded-lg bg-white/8 hover:bg-white/12 border border-white/12 text-white font-medium text-sm transition-all duration-150 inline-flex items-center gap-1.5"
              >
                <span>Review page</span>
                <span aria-hidden="true">→</span>
              </a>
            ) : null}
            <span className="shrink-0 inline-flex items-center px-3.5 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium text-sm">
              Joined
            </span>
          </div>
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
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-stone-300">
          <p>
            ✅ Bespken has joined this call. You&apos;ll be notified when the transcript is ready.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onJoinAgain}
              className="text-stone-500 hover:text-stone-300 font-medium text-xs transition-colors"
            >
              Send bot again
            </button>
            {meetingId ? (
              <a
                href={`/meetings/${meetingId}`}
                className="text-amber-400 hover:text-amber-300 font-medium text-xs inline-flex items-center gap-1 transition-colors"
              >
                Open review screen &rarr;
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
      {joinState.status === "error" ? (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {joinState.message}
        </p>
      ) : null}
    </li>
  );
}

function MeetingRow({ meeting }: { meeting: DashboardMeeting }) {
  const canView = meeting.status === "extracted" || meeting.status === "completed";
  const title = meeting.meeting_title?.trim() || "Untitled meeting";

  return (
    <li className="glass-panel rounded-2xl p-5 hover:border-amber-400/20 transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="font-medium text-white truncate">{title}</p>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadgeClass(meeting.status)}`}
            >
              {statusLabel(meeting.status)}
            </span>
          </div>
          <p className="text-sm text-stone-400">{formatCreatedAt(meeting.created_at)}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {meeting.documentId ? (
            <Link
              href={`/documents/${meeting.documentId}`}
              className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
            >
              Document ready
            </Link>
          ) : null}
          {canView ? (
            <Link
              href={`/meetings/${meeting.id}`}
              className="px-4 py-2 rounded-lg bg-white/8 hover:bg-white/12 border border-white/12 text-white font-medium text-sm transition-all duration-150"
            >
              View
            </Link>
          ) : meeting.status === "joining" ? (
            <span className="text-sm text-amber-400/90">Joining…</span>
          ) : meeting.status === "failed" ? (
            <Link
              href={`/meetings/${meeting.id}`}
              className="px-4 py-2 rounded-lg bg-white/8 hover:bg-white/12 border border-white/12 text-white font-medium text-sm transition-all duration-150"
            >
              View
            </Link>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function DocumentRow({ document }: { document: DashboardDocument }) {
  const typeLabel = document.type
    ? document.type.charAt(0).toUpperCase() + document.type.slice(1)
    : "Document";
  const title = document.title?.trim() || typeLabel;

  return (
    <li className="glass-panel rounded-2xl p-5 hover:border-amber-400/20 transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-stone-500">{typeLabel}</p>
          <p className="font-medium text-white truncate mt-1">{title}</p>
          <p className="text-sm text-stone-400 mt-1">{formatCreatedAt(document.created_at)}</p>
        </div>
        <Link
          href={`/documents/${document.id}`}
          className="shrink-0 px-4 py-2 rounded-lg bg-white/8 hover:bg-white/12 border border-white/12 text-white font-medium text-sm transition-all duration-150"
        >
          View
        </Link>
      </div>
    </li>
  );
}
