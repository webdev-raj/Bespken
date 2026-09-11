import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import type { DashboardMeeting } from "@/lib/dashboardTypes";
import { formatCreatedAt } from "@/lib/dashboardUi";

export default function MeetingList({
  meetings,
  empty,
}: {
  meetings: DashboardMeeting[];
  empty: string;
}) {
  if (meetings.length === 0) {
    return <p className="text-sm text-stone-500 py-8 text-center">{empty}</p>;
  }

  return (
    <ul className="divide-y divide-white/6">
      {meetings.map((meeting) => {
        const title = meeting.meeting_title?.trim() || "Untitled meeting";
        return (
          <li key={meeting.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-white truncate">{title}</p>
                <StatusBadge status={meeting.status} />
              </div>
              <p className="text-xs text-stone-500 mt-1">{formatCreatedAt(meeting.created_at)}</p>
            </div>
            <Link
              href={`/meetings/${meeting.id}`}
              className="shrink-0 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-white hover:bg-white/5"
            >
              View
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
