import WaitlistForm from '@/components/WaitlistForm';

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative w-full min-h-[90vh] flex flex-col items-center justify-center px-6 pt-28 pb-20 overflow-hidden"
      aria-label="Hero"
    >
      {/* Background ambient radial gradients & grid pattern */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] max-w-full h-[550px] rounded-full opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #F2A84D 0%, rgba(242, 168, 77, 0.15) 45%, transparent 75%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] max-w-full h-[350px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Subtle background grid pattern */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px] opacity-40 pointer-events-none"
        aria-hidden="true"
      />

      {/* Badge */}
      <div className="relative z-10 mb-8 inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-amber-400/30 bg-gradient-to-r from-amber-400/10 via-amber-400/5 to-amber-500/10 backdrop-blur-md text-amber-300 text-xs font-medium tracking-wide shadow-[0_0_15px_rgba(242,168,77,0.1)] transition-all hover:border-amber-400/50">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
        </span>
        Now accepting early access applications
      </div>

      {/* Headline */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] text-white mb-6">
          Your next proposal{' '}
          
          <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(242,168,77,0.25)]">
            writes itself.
          </span>
        </h1>
        <p className="text-stone-300 text-lg sm:text-xl max-w-2xl mx-auto leading-tighter mb-10">
          Bespken joins your client calls, transcribes what matters, and drafts a ready-to-send
          proposal or invoice before you&apos;ve even opened a new tab.
        </p>

        {/* Waitlist form */}
        <div className="flex justify-center">
          <WaitlistForm id="hero-waitlist" variant="hero" />
        </div>

        <p className="mt-4 text-xs text-stone-500 font-medium">
          No credit card required &middot; Free during beta
        </p>
      </div>

      {/* Visual mockup container */}
      <div className="relative z-10 mt-16 lg:mt-20 w-full max-w-5xl mx-auto">
        <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-stone-950/60 backdrop-blur-xl p-4 sm:p-6 lg:p-8 shadow-2xl shadow-black/80 ring-1 ring-white/5 relative overflow-hidden">
          {/* Subtle top glare effect */}
          <div 
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] max-w-full h-[100px] bg-amber-400/10 blur-2xl rounded-full pointer-events-none"
            aria-hidden="true" 
          />

          {/* Window header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/8 text-xs text-stone-400 font-mono">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" aria-hidden="true" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" aria-hidden="true" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" aria-hidden="true" />
              <span className="ml-3 hidden sm:inline text-stone-500">bespken.ai / call-assistant</span>
            </div>
            <div className="flex items-center gap-2 text-stone-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Assistant</span>
            </div>
          </div>

          <MockupVisual />
        </div>
      </div>
    </section>
  );
}

function MockupVisual() {
  return (
    <div className="flex flex-col lg:flex-row items-stretch justify-center gap-6 lg:gap-8">
      {/* Transcript panel */}
      <div className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 text-left flex flex-col justify-between shadow-lg">
        <div>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
              <span className="text-xs font-semibold text-stone-300">Call Transcript</span>
            </div>
            <span className="text-[11px] text-stone-500 font-mono">Zoom Call &middot; 28m</span>
          </div>

          <div className="space-y-3.5">
            <TranscriptLine speaker="Client" text="We need the full branding package — logo, type, colour palette." />
            <TranscriptLine speaker="You" text="I'd scope that at around four weeks. Could start mid-October." />
            <TranscriptLine speaker="Client" text="What's the budget for something like that?" />
            <TranscriptLine speaker="You" text="Typically £4,200 all in, with a 50% deposit to kick things off." />
            <TranscriptLine speaker="Client" text="That works. Can you send something over today?" />
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-white/6">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-400/90">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6" stroke="#F2A84D" strokeWidth="1.2" strokeOpacity="0.9" />
              <path d="M4.5 7l2 2 3-3.5" stroke="#F2A84D" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9" />
            </svg>
            Key details &amp; pricing extracted
          </div>
        </div>
      </div>

      {/* AI Processing Bridge */}
      <div className="flex lg:flex-col items-center justify-center gap-2 text-stone-500 py-2 lg:py-0 shrink-0" aria-hidden="true">
        <div className="hidden lg:flex flex-col items-center gap-2">
          <div className="h-12 w-px bg-gradient-to-b from-amber-400/10 via-amber-400/60 to-amber-400/10" />
          <div className="px-3 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-[11px] font-medium tracking-wide flex items-center gap-1.5 shadow-[0_0_12px_rgba(242,168,77,0.15)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <span>Bespken AI</span>
          </div>
          <div className="h-12 w-px bg-gradient-to-b from-amber-400/10 via-amber-400/60 to-amber-400/10" />
        </div>

        {/* Mobile View Indicator */}
        <div className="flex lg:hidden items-center gap-2 py-1">
          <div className="w-8 h-px bg-amber-400/40" />
          <span className="px-2.5 py-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-[10px] font-medium uppercase tracking-wider">
            Bespken AI Draft
          </span>
          <div className="w-8 h-px bg-amber-400/40" />
        </div>
      </div>

      {/* Proposal panel */}
      <div className="flex-1 rounded-xl border border-amber-400/25 bg-amber-400/[0.03] backdrop-blur-md p-5 text-left flex flex-col justify-between shadow-lg shadow-amber-500/5">
        <div>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-400/15">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-amber-400 font-bold tracking-wide uppercase">Draft Proposal</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-medium">
              Ready to send
            </span>
          </div>

          <div className="space-y-3">
            <ProposalLine label="Project" value="Full Branding Package" />
            <ProposalLine label="Scope" value="Logo, typography, colour palette" />
            <ProposalLine label="Timeline" value="4 weeks &middot; Start mid-Oct" />
            <ProposalLine label="Total" value="£4,200" highlight />
            <ProposalLine label="Deposit" value="£2,100 (50%) on signing" />
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-amber-400/15 flex gap-2">
          <button
            className="flex-1 px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-semibold shadow-md shadow-amber-400/10 hover:shadow-amber-400/20 active:scale-[0.98] transition-all"
            aria-label="Send proposal"
          >
            Send proposal
          </button>
          <button
            className="px-3.5 py-2.5 rounded-lg border border-white/15 text-stone-300 text-xs font-medium hover:bg-white/5 hover:border-white/25 transition-all"
            aria-label="Edit proposal"
          >
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
      <span className={`text-[10px] font-bold tracking-wider uppercase ${isClient ? 'text-stone-400' : 'text-amber-400'}`}>
        {speaker}
      </span>
      <p className="text-xs text-stone-300 leading-relaxed font-normal">{text}</p>
    </div>
  );
}

function ProposalLine({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-xs text-stone-400 font-medium shrink-0">{label}</span>
      <span className={`text-xs text-right ${highlight ? 'text-amber-400 font-bold text-sm' : 'text-stone-200 font-medium'}`}>
        {value}
      </span>
    </div>
  );
}

