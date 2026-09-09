"use client";

import Link from "next/link";
import { useRef } from "react";

export type DocumentRecord = {
  id: string;
  meeting_id: string;
  type: string;
  title: string | null;
  content_html: string | null;
};

export default function DocumentPreviewClient({
  document,
}: {
  document: DocumentRecord;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function handleDownloadPdf() {
    const frameWindow = iframeRef.current?.contentWindow;
    if (frameWindow) {
      frameWindow.focus();
      frameWindow.print();
      return;
    }
    window.print();
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white print:bg-white print:text-black">
      <header className="no-print px-6 py-5 border-b border-white/8">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-stone-500">
              {document.type}
            </p>
            <h1 className="text-lg font-semibold tracking-tight">
              {document.title || "Proposal"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/meetings/${document.meeting_id}`}
              className="px-4 py-2.5 rounded-lg border border-white/10 text-stone-300 text-sm font-medium hover:bg-white/5 transition-colors"
            >
              Back to meeting
            </Link>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-5 py-2.5 rounded-lg bg-amber-400 text-stone-900 font-semibold text-sm hover:bg-amber-300 active:scale-[0.98] transition-all duration-150"
            >
              Download as PDF
            </button>
          </div>
        </div>
      </header>

      <section className="no-print max-w-3xl mx-auto px-6 pt-6">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
          <div className="shrink-0 text-lg leading-none pt-0.5">⚠️</div>
          <p className="text-sm text-amber-200/90 leading-relaxed">
            Generated from AI-extracted data. Confirm all details are accurate
            before sending to your client.
          </p>
        </div>
      </section>

      <section className="px-6 py-8 print:p-0">
        <div className="max-w-[800px] mx-auto rounded-sm bg-white text-stone-900 shadow-[0_24px_60px_rgba(0,0,0,0.45)] border border-stone-200 overflow-hidden print:shadow-none print:border-0 print:max-w-none">
          <iframe
            ref={iframeRef}
            title={document.title || "Proposal preview"}
            srcDoc={document.content_html || "<p>No document content.</p>"}
            className="w-full min-h-[960px] border-0 bg-white"
          />
        </div>
      </section>
    </main>
  );
}
