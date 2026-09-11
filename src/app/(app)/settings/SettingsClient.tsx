"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOutBespken } from "@/lib/signOut";

export default function SettingsClient() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function disconnect() {
    setBusy(true);
    await signOutBespken();
    setBusy(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="px-4 sm:px-8 py-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-stone-400">Account and calendar connection.</p>
      </div>
      <section className="rounded-xl border border-white/8 bg-[#141414] px-5 py-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Google Calendar</h2>
          <p className="text-sm text-stone-400 mt-1">
            Disconnecting signs you out of Bespken and removes this session&apos;s Google Calendar access. You can reconnect from the dashboard.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void disconnect()}
          disabled={busy}
          className="px-4 py-2.5 rounded-lg border border-white/12 text-sm font-medium text-stone-200 hover:bg-white/5 disabled:opacity-50"
        >
          {busy ? "Disconnecting…" : "Disconnect Google Calendar"}
        </button>
      </section>
    </div>
  );
}
