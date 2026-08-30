const comparisons = [
  {
    them: {
      label: 'Transcript',
      desc: 'A long document of everything said on the call — useful if you have time to re-read it.',
    },
    us: {
      label: 'Sendable proposal',
      desc: 'A polished, client-ready document with your scope, pricing, and timeline already filled in.',
    },
  },
  {
    them: {
      label: 'Generic summary',
      desc: '"You discussed a project. Budget and timeline were mentioned." No structure, no context.',
    },
    us: {
      label: 'Structured extraction',
      desc: 'Scope, deliverables, price, deposit, and deadlines — pulled out as discrete, editable fields.',
    },
  },
  {
    them: {
      label: 'Manual formatting',
      desc: 'You still open a template, paste in your notes, and spend 45 minutes making it look right.',
    },
    us: {
      label: 'Ready-to-send output',
      desc: 'Formatted, professional, and in your inbox before the client has even hung up the call.',
    },
  },
];

export default function DifferentiatorSection() {
  return (
    <section
      id="what-makes-this-different"
      className="relative w-full overflow-hidden px-6 py-24 sm:py-32"
      aria-label="What makes this different"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <span className="inline-block mb-4 text-xs font-semibold tracking-widest text-stone-500 uppercase">
            Why not just use Otter or Fireflies?
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white max-w-2xl mx-auto leading-tight">
            They give you a transcript.{' '}
            <span className="text-amber-400">We give you the document.</span>
          </h2>
          <p className="mt-6 text-stone-400 text-lg max-w-xl mx-auto">
            Otter and Fireflies are built for teams who want meeting notes. Bespken is built for
            freelancers who need to bill — fast.
          </p>
        </div>

        {/* Comparison table */}
        <div className="mt-14 rounded-2xl border border-white/8 overflow-hidden">
          {/* Header */}
          <div className="hidden sm:grid sm:grid-cols-2 border-b border-white/8">
            <div className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Other tools
            </div>
            <div className="px-6 py-4 bg-amber-400/5 border-l border-amber-400/15">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Bespken</span>
            </div>
          </div>

          {/* Rows */}
          {comparisons.map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-1 sm:grid-cols-2 ${i < comparisons.length - 1 ? 'border-b border-white/6' : ''}`}
            >
              {/* Them */}
              <div className="px-6 py-5 border-b sm:border-b-0 border-white/6">
                <div className="flex items-start gap-2">
                  <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="6" stroke="#52525b" strokeWidth="1" />
                    <path d="M4.5 7h5" stroke="#52525b" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-stone-400 mb-1">{row.them.label}</p>
                    <p className="text-xs text-stone-600 leading-relaxed">{row.them.desc}</p>
                  </div>
                </div>
              </div>

              {/* Us */}
              <div className="px-6 py-5 bg-amber-400/3 sm:border-l border-amber-400/10">
                <div className="flex items-start gap-2">
                  <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="6" stroke="#F2A84D" strokeWidth="1" strokeOpacity="0.7" />
                    <path d="M4.5 7l2 2L9.5 5" stroke="#F2A84D" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-100 mb-1">{row.us.label}</p>
                    <p className="text-xs text-stone-400 leading-relaxed">{row.us.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
