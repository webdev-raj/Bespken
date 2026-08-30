export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative w-full overflow-hidden px-6 py-12 border-t border-white/6"
      role="contentinfo"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Logo & tagline */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-amber-400 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 2h5a3 3 0 010 6H2V2z" fill="#0B0B0F" />
                <path d="M2 8h6a3 3 0 010 6H2V8z" fill="#0B0B0F" opacity="0.6" />
              </svg>
            </div>
            <span className="text-sm font-bold text-white">Bespken</span>
          </div>
          <span className="hidden sm:block text-white/15" aria-hidden="true">·</span>
          <span className="text-xs text-stone-500 text-center sm:text-left">
            Proposals & invoices from your client calls — automatically.
          </span>
        </div>

        {/* Copyright */}
        <p className="text-xs text-stone-600" suppressHydrationWarning>
          &copy; {year} Bespken. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
