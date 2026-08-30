export default function Navbar() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      role="banner"
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <a href="#hero" className="flex items-center gap-2.5 group" aria-label="Bespken home">
          {/* Logo mark */}
          <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center group-hover:bg-amber-300 transition-colors duration-200">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 2h5a3 3 0 010 6H2V2z" fill="#0B0B0F" />
              <path d="M2 8h6a3 3 0 010 6H2V8z" fill="#0B0B0F" opacity="0.6" />
            </svg>
          </div>
          <span className="text-base font-bold text-white tracking-tight">Bespken</span>
        </a>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Main navigation">
          {[
            { href: '#how-it-works', label: 'How it works' },
            { href: '#what-makes-this-different', label: 'Why Bespken' },
            { href: '#who-its-for', label: 'Who it\'s for' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-stone-400 hover:text-white transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <a
          href="#waitlist"
          className="px-4 py-2 rounded-lg border border-amber-400/30 bg-amber-400/8 text-amber-400 text-sm font-medium hover:bg-amber-400/15 hover:border-amber-400/50 transition-all duration-200"
        >
          Join waitlist
        </a>
      </div>
    </header>
  );
}
