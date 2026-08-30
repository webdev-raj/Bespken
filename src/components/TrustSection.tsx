const trustPoints = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C17.5 22.15 21 17.25 21 12V6l-8-4z" stroke="#F2A84D" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="#F2A84D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Transparent presence, always',
    description:
      'Bespken joins your calls as a named, visible participant — the same way Otter.ai or Fireflies works. Your clients see it in the room. There are no hidden recordings, ever.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" stroke="#F2A84D" strokeWidth="1.4" />
        <path d="M7 11V7a5 5 0 0110 0v4" stroke="#F2A84D" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1.5" fill="#F2A84D" fillOpacity="0.7" />
      </svg>
    ),
    title: 'Your data stays yours',
    description:
      'Transcript data is used exclusively to generate your documents. It is never shared with third parties, sold, or used to train AI models. Full stop.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke="#F2A84D" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="12" cy="12" r="4" stroke="#F2A84D" strokeWidth="1.4" />
      </svg>
    ),
    title: 'Delete any time',
    description:
      'Request deletion of your call data at any point from your account settings. We store only what you need for active documents — nothing more.',
  },
];

export default function TrustSection() {
  return (
    <section
      id="privacy"
      className="relative px-6 py-24 sm:py-32"
      aria-label="Privacy and trust"
    >
      {/* Subtle ambient glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-8 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 100%, #F2A84D 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Badge */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-400/20 bg-amber-400/5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 1L2 3.5v3.5c0 3.25 2.167 6.3 5 7.1C9.833 13.3 12 10.25 12 7V3.5L7 1z" fill="#F2A84D" fillOpacity="0.2" stroke="#F2A84D" strokeWidth="1" strokeLinejoin="round" />
              <path d="M5 7l1.5 1.5L9 5.5" stroke="#F2A84D" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs font-semibold text-amber-400 tracking-wide">Privacy first</span>
          </div>
        </div>

        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5">
            Built on trust, by design
          </h2>
          <p className="text-stone-400 text-lg max-w-2xl mx-auto leading-relaxed">
            We know you&apos;re letting us into sensitive conversations. Here&apos;s exactly what
            we do — and what we don&apos;t — with that access.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {trustPoints.map((point) => (
            <TrustCard key={point.title} {...point} />
          ))}
        </div>

        {/* Legal note */}
        <p className="mt-10 text-center text-xs text-stone-600 max-w-lg mx-auto leading-relaxed">
          Bespken complies with applicable data protection regulations. We operate on EU-based
          infrastructure and will publish a full privacy policy before launch.
        </p>
      </div>
    </section>
  );
}

function TrustCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-2xl border border-white/8 bg-white/2 hover:border-amber-400/15 transition-all duration-300">
      <div className="w-11 h-11 rounded-xl border border-amber-400/20 bg-amber-400/5 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-white mb-3">{title}</h3>
      <p className="text-sm text-stone-400 leading-relaxed">{description}</p>
    </div>
  );
}
