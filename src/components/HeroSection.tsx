import WaitlistForm from '@/components/WaitlistForm';

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden"
      aria-label="Hero"
    >
      {/* Subtle radial gradient accent */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-10 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #F2A84D 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Badge */}
      <div className="relative z-10 mb-8 flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-400/25 bg-amber-400/5 text-amber-400 text-xs font-medium tracking-wide">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
        Now accepting early access applications
      </div>

      {/* Headline */}
      <div className="relative z-10 text-center max-w-3xl mx-auto">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-white mb-6">
          Your next proposal{' '}
          <span className="text-amber-400">writes itself.</span>
        </h1>
        <p className="text-lg sm:text-xl text-stone-400 max-w-2xl mx-auto leading-relaxed mb-10">
          Bespken joins your client calls, listens for what matters, and drafts a ready-to-send
          proposal or invoice before you&apos;ve even opened a new tab.
        </p>

        {/* Waitlist form */}
        <div className="flex justify-center">
          <WaitlistForm id="hero-waitlist" variant="hero" />
        </div>

        <p className="mt-4 text-xs text-stone-600">
          No credit card required &middot; Free during beta
        </p>
      </div>

      {/* Visual mockup */}
      <div className="relative z-10 mt-20 w-full max-w-4xl mx-auto">
        <MockupVisual />
      </div>
    </section>
  );
}

function MockupVisual() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
      {/* Transcript panel */}
      <div className="flex-1 max-w-sm w-full rounded-xl border border-white/8 bg-white/3 backdrop-blur-sm p-5 text-left">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
          <div className="w-2 h-2 rounded-full bg-yellow-500" aria-hidden="true" />
          <div className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
          <span className="ml-2 text-xs text-stone-500 font-mono">Call transcript · 28 min</span>
        </div>

        <div className="space-y-3">
          <TranscriptLine speaker="Client" text="We need the full branding package — logo, type, colour palette." />
          <TranscriptLine speaker="You" text="I'd scope that at around four weeks. Could start mid-October." />
          <TranscriptLine speaker="Client" text="What's the budget for something like that?" />
          <TranscriptLine speaker="You" text="Typically £4,200 all in, with a 50% deposit to kick things off." />
          <TranscriptLine speaker="Client" text="That works. Can you send something over today?" />
        </div>

        <div className="mt-4 pt-4 border-t border-white/6">
          <div className="flex items-center gap-1.5 text-xs text-amber-400/80">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <circle cx="6" cy="6" r="5" stroke="#F2A84D" strokeWidth="1" strokeOpacity="0.8" />
              <path d="M4 6l1.5 1.5L8 4" stroke="#F2A84D" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.8" />
            </svg>
            Scope, pricing &amp; timeline extracted
          </div>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex flex-col items-center gap-2 text-stone-600" aria-hidden="true">
        <div className="hidden sm:block">
          <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
            <path d="M2 12h40M36 6l6 6-6 6" stroke="#F2A84D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.6" />
          </svg>
        </div>
        <div className="block sm:hidden rotate-90">
          <svg width="24" height="48" viewBox="0 0 24 48" fill="none">
            <path d="M12 2v40M6 36l6 6 6-6" stroke="#F2A84D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.6" />
          </svg>
        </div>
        <span className="text-[10px] font-medium text-stone-500 tracking-widest uppercase">Bespken</span>
      </div>

      {/* Proposal panel */}
      <div className="flex-1 max-w-sm w-full rounded-xl border border-amber-400/15 bg-white/3 backdrop-blur-sm p-5 text-left">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-amber-400 font-semibold tracking-wide uppercase">Draft Proposal</span>
          <span className="text-xs text-stone-500 font-mono">Ready to send</span>
        </div>

        <div className="space-y-3">
          <ProposalLine label="Project" value="Full Branding Package" />
          <ProposalLine label="Scope" value="Logo, typography, colour palette" />
          <ProposalLine label="Timeline" value="4 weeks · Start mid-October" />
          <ProposalLine label="Total" value="£4,200" highlight />
          <ProposalLine label="Deposit" value="£2,100 (50%) on signing" />
        </div>

        <div className="mt-4 flex gap-2">
          <button className="flex-1 px-3 py-2 rounded-lg bg-amber-400 text-stone-900 text-xs font-semibold hover:bg-amber-300 transition-colors" aria-label="Send proposal">
            Send proposal
          </button>
          <button className="px-3 py-2 rounded-lg border border-white/10 text-stone-400 text-xs hover:border-white/20 transition-colors" aria-label="Edit proposal">
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

function TranscriptLine({ speaker, text }: { speaker: string; text: string }) {
  const isClient = speaker === 'Client';
  return (
    <div className="space-y-0.5">
      <span className={`text-[10px] font-semibold tracking-wide ${isClient ? 'text-stone-500' : 'text-amber-400/70'}`}>
        {speaker}
      </span>
      <p className="text-xs text-stone-300 leading-relaxed">{text}</p>
    </div>
  );
}

function ProposalLine({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-xs text-stone-500 shrink-0">{label}</span>
      <span className={`text-xs text-right ${highlight ? 'text-amber-400 font-semibold' : 'text-stone-300'}`}>
        {value}
      </span>
    </div>
  );
}
