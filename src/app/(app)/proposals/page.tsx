import type { Metadata } from "next";
import DocumentList from "@/components/DocumentList";
import { loadWorkspaceData } from "@/lib/loadWorkspaceData";

export const metadata: Metadata = {
  title: "Proposals — Bespken",
};

export default async function ProposalsPage() {
  const { documents } = await loadWorkspaceData();

  return (
    <div className="px-4 sm:px-8 py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Proposals</h1>
        <p className="mt-1 text-sm text-stone-400">Documents generated from extracted meetings.</p>
      </div>
      <section className="rounded-xl border border-white/8 bg-[#141414] p-4">
        <DocumentList
          documents={documents}
          empty="No documents yet — extract a meeting and generate a proposal."
        />
      </section>
    </div>
  );
}
