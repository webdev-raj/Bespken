import type { Metadata } from "next";
import { loadWorkspaceData } from "@/lib/loadWorkspaceData";
import DashboardView from "./DashboardView";

export const metadata: Metadata = {
  title: "Dashboard — Bespken",
};

export default async function DashboardPage() {
  const { email, meetings, documents } = await loadWorkspaceData();

  return (
    <DashboardView
      email={email}
      meetings={meetings}
      documents={documents}
    />
  );
}
