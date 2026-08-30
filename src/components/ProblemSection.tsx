export default function ProblemSection() {
  return (
    <section
      id="problem"
      className="relative w-full overflow-hidden px-6 py-24 sm:py-32"
      aria-label="The problem"
    >
      <div className="max-w-3xl mx-auto text-center">
        <span className="inline-block mb-6 text-xs font-semibold tracking-widest text-stone-500 uppercase">
          Sound familiar?
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-8">
          You just got off a great call.
        </h2>
        <div className="space-y-5 text-lg sm:text-xl text-stone-400 leading-relaxed max-w-2xl mx-auto">
          <p>
            Now you have to sit down, piece together everything you discussed, figure out how you
            priced it in the moment, and write it all up in a document that looks professional
            enough to actually send.
          </p>
          <p>
            By the time you&apos;re done, you&apos;ve spent another hour on a call that was
            supposed to save you time — and the client is still waiting.
          </p>
        </div>

        {/* Visual time stat */}
        <div className="mt-14 inline-flex flex-row items-center justify-center gap-4 sm:gap-6 px-4 sm:px-8 py-4 sm:py-5 rounded-2xl border border-white/8 bg-white/3 max-w-full">
          <div className="text-left">
            <div className="text-4xl font-bold text-white">90<span className="text-amber-400">min</span></div>
            <div className="text-xs text-stone-500 mt-1">avg. time writing proposals after calls</div>
          </div>
          <div className="w-px h-12 bg-white/8" aria-hidden="true" />
          <div className="text-left">
            <div className="text-4xl font-bold text-white">3<span className="text-amber-400">min</span></div>
            <div className="text-xs text-stone-500 mt-1">with Bespken</div>
          </div>
        </div>
      </div>
    </section>
  );
}
