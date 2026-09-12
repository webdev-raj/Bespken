import type { Metadata } from "next";
import { EDIT_LOG_FIELDS, parseEditLog } from "@/lib/editLog";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const metadata: Metadata = {
  title: "Edit stats — Bespken",
  robots: {
    index: false,
    follow: false,
  },
};

const FIELD_LABELS: Record<(typeof EDIT_LOG_FIELDS)[number], string> = {
  client: "Client",
  scope: "Scope",
  price: "Price",
  timeline: "Timeline",
  notes: "Notes",
};

export default async function EditStatsPage() {
  let counts: Record<(typeof EDIT_LOG_FIELDS)[number], number> = {
    client: 0,
    scope: 0,
    price: 0,
    timeline: 0,
    notes: 0,
  };
  let meetingCount = 0;
  let loadError: string | null = null;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("meetings")
      .select("id, edit_log")
      .not("edit_log", "eq", "[]");

    if (error) {
      loadError = error.message;
    } else {
      meetingCount = data?.length ?? 0;
      for (const row of data ?? []) {
        for (const entry of parseEditLog(row.edit_log)) {
          counts[entry.field] += 1;
        }
      }
    }
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Could not load edit stats.";
  }

  const maxCount = Math.max(1, ...EDIT_LOG_FIELDS.map((field) => counts[field]));

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white px-6 py-12">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight">Extraction edit stats</h1>
        <p className="mt-2 text-sm text-stone-400">
          How often each AI-extracted field was corrected on save. {meetingCount} meeting
          {meetingCount === 1 ? "" : "s"} with edits.
        </p>

        {loadError ? (
          <p className="mt-6 text-sm text-red-400" role="alert">
            {loadError}
          </p>
        ) : (
          <ul className="mt-8 space-y-4">
            {EDIT_LOG_FIELDS.map((field) => {
              const count = counts[field];
              const label = count === 1 ? "edit" : "edits";
              return (
                <li key={field}>
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="font-medium">{FIELD_LABELS[field]}</span>
                    <span className="text-stone-400 tabular-nums">
                      {count} {label}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/8 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
