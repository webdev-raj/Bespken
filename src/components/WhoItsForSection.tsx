const personas = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="8" height="8" rx="1.5" stroke="#F2A84D" strokeWidth="1.4" strokeOpacity="0.8" />
        <rect x="12" y="2" width="8" height="8" rx="1.5" stroke="#F2A84D" strokeWidth="1.4" strokeOpacity="0.4" />
        <rect x="2" y="12" width="8" height="8" rx="1.5" stroke="#F2A84D" strokeWidth="1.4" strokeOpacity="0.4" />
        <rect x="12" y="12" width="8" height="8" rx="1.5" stroke="#F2A84D" strokeWidth="1.4" strokeOpacity="0.4" />
      </svg>
    ),
    title: 'Freelance designers & developers',
    description:
      'Quote a project on a discovery call on Monday. Have a signed proposal in your inbox by Monday afternoon.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M11 2L3 7v8l8 5 8-5V7L11 2z" stroke="#F2A84D" strokeWidth="1.4" strokeOpacity="0.8" strokeLinejoin="round" />
        <path d="M11 2v18M3 7l8 5 8-5" stroke="#F2A84D" strokeWidth="1.4" strokeOpacity="0.4" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Independent consultants',
    description:
      'Stop losing revenue to poorly recalled scopes. Every engagement starts with a document that reflects exactly what was agreed.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <circle cx="8" cy="7" r="3.5" stroke="#F2A84D" strokeWidth="1.4" strokeOpacity="0.8" />
        <circle cx="15" cy="7" r="3.5" stroke="#F2A84D" strokeWidth="1.4" strokeOpacity="0.4" />
        <path d="M2 19c0-3.314 2.686-6 6-6h0c3.314 0 6 2.686 6 6" stroke="#F2A84D" strokeWidth="1.4" strokeOpacity="0.8" strokeLinecap="round" />
        <path d="M15 13c2.761 0 5 2.239 5 5" stroke="#F2A84D" strokeWidth="1.4" strokeOpacity="0.4" strokeLinecap="round" />
      </svg>
    ),
    title: 'Agencies & small studios',
    description:
      'Roll out a consistent proposal process across your team without adding another tool to manage — or another PM to supervise it.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M11 3C7.134 3 4 6.134 4 10c0 2.5 1.29 4.694 3.236 5.992L6 19h10l-1.236-3.008A7 7 0 0011 3z" stroke="#F2A84D" strokeWidth="1.4" strokeOpacity="0.8" strokeLinejoin="round" />
        <path d="M8 19h6" stroke="#F2A84D" strokeWidth="1.4" strokeOpacity="0.4" strokeLinecap="round" />
      </svg>
    ),
    title: 'Coaches & service providers',
    description:
      'For anyone who quotes pricing on calls: turn that number from a verbal promise into a written agreement before the momentum fades.',
  },
];

export default function WhoItsForSection() {
  return (
    <section
      id="who-its-for"
      className="relative w-full overflow-hidden px-6 py-24 sm:py-32"
      aria-label="Who it's for"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block mb-4 text-xs font-semibold tracking-widest text-stone-500 uppercase">
            Built for
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Who Bespken is for
          </h2>
          <p className="mt-5 text-stone-400 text-lg max-w-lg mx-auto">
            If you sell your time or expertise and close work on calls, Bespken removes the step
            you dread most.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {personas.map((persona) => (
            <PersonaCard key={persona.title} {...persona} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PersonaCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group flex gap-5 p-6 rounded-2xl border border-white/8 bg-white/2 hover:border-amber-400/20 hover:bg-white/4 transition-all duration-300 cursor-default">
      <div className="shrink-0 w-10 h-10 rounded-xl border border-white/8 bg-white/4 flex items-center justify-center group-hover:border-amber-400/20 transition-colors duration-300">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-amber-50 transition-colors duration-200">
          {title}
        </h3>
        <p className="text-sm text-stone-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
