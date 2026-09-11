import Link from "next/link";
import type { DashboardDocument } from "@/lib/dashboardTypes";
import { formatCreatedAt } from "@/lib/dashboardUi";

export default function DocumentList({
  documents,
  empty,
}: {
  documents: DashboardDocument[];
  empty: string;
}) {
  if (documents.length === 0) {
    return <p className="text-sm text-stone-500 py-8 text-center">{empty}</p>;
  }

  return (
    <ul className="divide-y divide-white/6">
      {documents.map((doc) => {
        const typeLabel = doc.type
          ? doc.type.charAt(0).toUpperCase() + doc.type.slice(1)
          : "Proposal";
        const title = doc.title?.trim() || typeLabel;
        return (
          <li key={doc.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{title}</p>
              <p className="text-xs text-stone-500 mt-1">{formatCreatedAt(doc.created_at)}</p>
            </div>
            <Link
              href={`/documents/${doc.id}`}
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
