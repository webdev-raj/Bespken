const steps = [
  {
    number: '01',
    title: 'Connect your calendar',
    description:
      'Link your Google or Outlook calendar in under a minute. Bespken watches for upcoming client calls automatically — no manual setup per meeting.',
  },
  {
    number: '02',
    title: 'We join your call visibly',
    description:
      'Bespken joins as a named participant — visible to everyone in the room, just like Otter.ai or Fireflies. No hidden recordings. Your client always knows it\'s there.',
  },
  {
    number: '03',
    title: 'Scope, pricing & deadlines extracted',
    description:
      'We transcribe the conversation and pull out the details that matter: what you\'re building, what it costs, when it\'s due. Not just a wall of text — structured data you can act on.',
  },
  {
    number: '04',
    title: 'Review and send in minutes',
    description:
      'The draft proposal or invoice lands in your dashboard while the call is still wrapping up. Tweak a line, hit send. Done before your client gets back to their desk.',
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative w-full overflow-hidden px-6 py-24 sm:py-32"
      aria-label="How it works"
    >
      {/* Section divider line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-transparent to-white/10" aria-hidden="true" />

      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block mb-4 text-xs font-semibold tracking-widest text-stone-500 uppercase">
            The process
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            How it works
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <StepCard key={step.number} step={step} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({
  step,
  index,
}: {
  step: (typeof steps)[number];
  index: number;
}) {
  const isLast = index === steps.length - 1;
  return (
    <div
      className={`group relative p-7 rounded-2xl border border-white/8 bg-white/2 hover:border-amber-400/20 hover:bg-white/4 transition-all duration-300 ${
        isLast ? 'sm:col-span-1' : ''
      }`}
    >
      {/* Step number */}
      <div className="flex items-start justify-between mb-5">
        <span className="text-5xl font-bold text-white/6 group-hover:text-amber-400/12 transition-colors duration-300 select-none">
          {step.number}
        </span>
        <div className="w-8 h-8 rounded-full border border-amber-400/30 flex items-center justify-center flex-shrink-0 mt-1">
          <div className="w-2 h-2 rounded-full bg-amber-400/50 group-hover:bg-amber-400 transition-colors duration-300" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-amber-50 transition-colors duration-200">
        {step.title}
      </h3>
      <p className="text-stone-400 text-sm leading-relaxed">{step.description}</p>
    </div>
  );
}
