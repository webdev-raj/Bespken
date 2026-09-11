import type { Metadata } from "next";
import MeetingList from "@/components/MeetingList";
import { loadWorkspaceData } from "@/lib/loadWorkspaceData";

export const metadata: Metadata = {
  title: "Meetings — Bespken",
};

export default async function MeetingsPage() {
  const { meetings } = await loadWorkspaceData();

  return (
    <div className="px-4 sm:px-8 py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
        <p className="mt-1 text-sm text-stone-400">Every call Bespken has joined, newest first.</p>
      </div>
      <section className="rounded-xl border border-white/8 bg-[#141414] p-4">
        <MeetingList
          meetings={meetings}
          empty="No meetings yet — join a call to get started"
        />
      </section>
    </div>
  );
}
