import WaitlistForm from '@/components/WaitlistForm';

export default function CtaSection() {
  return (
    <section
      id="waitlist"
      className="relative px-6 py-24 sm:py-32"
      aria-label="Join the waitlist"
    >
      {/* Top border line */}
      <div className="absolute top-0 left-6 right-6 h-px bg-white/6" aria-hidden="true" />

      <div className="max-w-2xl mx-auto text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 rounded-full border border-white/10 bg-white/4">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
          <span className="text-xs font-medium text-stone-400">Limited early access spots</span>
        </div>

        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
          Be first to try it{' '}
          <br className="hidden sm:block" />
          when we launch.
        </h2>
        <p className="text-stone-400 text-lg mb-10 leading-relaxed">
          We&apos;re opening Bespken to a small group of freelancers and consultants before our
          public launch. Join the waitlist to get early access, provide feedback, and shape how
          the product works.
        </p>

        <WaitlistForm id="cta-waitlist" variant="cta" />

        <p className="mt-4 text-xs text-stone-600">
          No credit card &middot; No spam &middot; Unsubscribe any time
        </p>
      </div>
    </section>
  );
}
