"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

export default function AppNav({ initialEmail }: { initialEmail?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(initialEmail ?? null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialEmail !== undefined) {
      setEmail(initialEmail ?? null);
    }

    const supabase = getSupabase();
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, [initialEmail]);

  async function disconnect() {
    setBusy(true);
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setEmail(null);
    setBusy(false);
    router.push("/dashboard");
    router.refresh();
  }

  const onDashboard = pathname === "/dashboard";

  return (
    <header className="glass-nav z-20 sticky top-0">
      <div className="max-w-4xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 group" aria-label="Bespken dashboard">
          <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center group-hover:bg-amber-300 transition-colors duration-200">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 2h5a3 3 0 010 6H2V2z" fill="#0B0B0F" />
              <path d="M2 8h6a3 3 0 010 6H2V8z" fill="#0B0B0F" opacity="0.6" />
            </svg>
          </div>
          <span className="text-base font-bold text-white tracking-tight">Bespken</span>
        </Link>

        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/dashboard"
            className={`text-sm font-medium transition-colors ${
              onDashboard ? "text-amber-400" : "text-stone-400 hover:text-white"
            }`}
          >
            Dashboard
          </Link>
          {email ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="hidden sm:inline text-sm text-stone-400 truncate max-w-[220px]">
                {email}
              </span>
              <button
                type="button"
                onClick={() => void disconnect()}
                disabled={busy}
                className="shrink-0 text-xs text-stone-500 hover:text-stone-300 transition-colors disabled:opacity-50"
              >
                Disconnect
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
