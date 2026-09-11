"use client";

import Link from "next/link";
import { useMemo } from "react";
import DocumentList from "@/components/DocumentList";
import MeetingList from "@/components/MeetingList";
import UpcomingCalendar from "@/components/UpcomingCalendar";
import type { DashboardDocument, DashboardMeeting } from "@/lib/dashboardTypes";
import { firstNameFromEmail, greetingForHour } from "@/lib/dashboardUi";

export default function DashboardView({
  email,
  meetings,
  documents,
}: {
  email: string | null;
  meetings: DashboardMeeting[];
  documents: DashboardDocument[];
}) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return `${greetingForHour(hour)}, ${firstNameFromEmail(email)}`;
  }, [email]);

  const recentMeetings = meetings.slice(0, 6);
  const recentDocuments = documents.slice(0, 6);

  return (
    <div className="px-4 sm:px-8 py-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{greeting}</h1>
        <p className="mt-1.5 text-sm text-stone-400">
          Turn your client conversations into proposals, faster.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Total meetings" value={meetings.length} />
        <StatCard label="Proposals generated" value={documents.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UpcomingCalendar />

        <section className="rounded-xl border border-white/8 bg-[#141414] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Recent meetings</h2>
              <p className="text-xs text-stone-500 mt-0.5">Calls Bespken has joined</p>
            </div>
            <Link href="/meetings" className="text-xs font-medium text-amber-400 hover:text-amber-300">
              View all
            </Link>
          </div>
          <div className="p-4">
            <MeetingList
              meetings={recentMeetings}
              empty="No meetings yet — join a call to get started"
            />
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-white/8 bg-[#141414] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Recent proposals</h2>
            <p className="text-xs text-stone-500 mt-0.5">Documents generated from your calls</p>
          </div>
          <Link href="/proposals" className="text-xs font-medium text-amber-400 hover:text-amber-300">
            View all
          </Link>
        </div>
        <div className="p-4">
          <DocumentList
            documents={recentDocuments}
            empty="No documents yet — extract a meeting and generate a proposal."
          />
        </div>
      </section>

      <section className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-6 py-6 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Meeting → Proposal</h2>
          <p className="text-sm text-stone-400 mt-1 max-w-lg">
            Send Bespken into a call, review the extraction, then generate a proposal you can send.
          </p>
        </div>
        <a
          href="#upcoming"
          className="shrink-0 px-4 py-2.5 rounded-lg bg-amber-500 text-stone-950 font-semibold text-sm hover:bg-amber-400"
        >
          Go to upcoming meetings
        </a>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/8 bg-[#141414] px-5 py-5">
      <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-white">{value}</p>
    </div>
  );
}
