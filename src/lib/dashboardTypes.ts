export type DashboardMeeting = {
  id: string;
  meeting_title: string | null;
  status: string;
  created_at: string;
  documentId: string | null;
};

export type DashboardDocument = {
  id: string;
  title: string | null;
  type: string;
  created_at: string;
};
