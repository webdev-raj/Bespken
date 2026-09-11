"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getSupabase } from "@/lib/supabase";
import { signOutBespken } from "@/lib/signOut";

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="13" y="11" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="3" y="14" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function IconMeetings({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path d="M16 10l5-2v8l-5-2" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  );
}

function IconProposals({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3h7l5 5v13a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path d="M14 3v5h5M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: IconDashboard },
  { href: "/meetings", label: "Meetings", icon: IconMeetings },
  { href: "/proposals", label: "Proposals", icon: IconProposals },
  { href: "/settings", label: "Settings", icon: IconSettings },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  if (href === "/meetings") {
    return pathname === "/meetings" || pathname.startsWith("/meetings/");
  }
  if (href === "/proposals") {
    return pathname === "/proposals" || pathname.startsWith("/documents/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({
  email: initialEmail,
  children,
}: {
  email: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(initialEmail);
  const [busy, setBusy] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setEmail(initialEmail);
    const supabase = getSupabase();
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, [initialEmail]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function disconnect() {
    setBusy(true);
    await signOutBespken();
    setEmail(null);
    setBusy(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white print:bg-white print:text-black">
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden print:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`print:hidden fixed inset-y-0 left-0 z-40 w-60 border-r border-white/8 bg-[#111111] flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-16 px-5 flex items-center border-b border-white/8">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center group-hover:bg-amber-400 transition-colors">
              <svg width="15" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 2h5a3 3 0 010 6H2V2z" fill="#0a0a0a" />
                <path d="M2 8h6a3 3 0 010 6H2V8z" fill="#0a0a0a" opacity="0.55" />
              </svg>
            </div>
            <span className="text-[17px] font-bold tracking-tight">Bespken</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-amber-500/12 text-amber-400"
                    : "text-stone-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={active ? "text-amber-400" : "text-stone-500"} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-60 min-h-screen flex flex-col">
        <header className="print:hidden sticky top-0 z-20 h-16 border-b border-white/8 bg-[#0a0a0a]/90 backdrop-blur-md">
          <div className="h-full px-4 sm:px-8 flex items-center justify-between gap-4">
            <button
              type="button"
              className="lg:hidden p-2 -ml-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/5"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
            <div className="flex-1" />
            {email ? (
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm text-stone-400 truncate max-w-[240px]">{email}</span>
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
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
