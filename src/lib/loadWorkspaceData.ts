import type { DashboardDocument, DashboardMeeting } from "@/lib/dashboardTypes";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function loadWorkspaceData() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let meetings: DashboardMeeting[] = [];
  let documents: DashboardDocument[] = [];
  const email = user?.email ?? null;

  if (user) {
    const [{ data: meetingRows }, { data: documentRows }] = await Promise.all([
      supabase
        .from("meetings")
        .select("id, meeting_title, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("documents")
        .select("id, title, type, created_at, meeting_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    const latestDocByMeeting = new Map<string, string>();
    for (const doc of documentRows ?? []) {
      if (doc.meeting_id && !latestDocByMeeting.has(doc.meeting_id)) {
        latestDocByMeeting.set(doc.meeting_id, doc.id);
      }
    }

    meetings = (meetingRows ?? []).map((row) => ({
      id: row.id,
      meeting_title: row.meeting_title,
      status: row.status,
      created_at: row.created_at,
      documentId: latestDocByMeeting.get(row.id) ?? null,
    }));

    documents = (documentRows ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      type: row.type,
      created_at: row.created_at,
    }));
  }

  return { email, meetings, documents };
}
