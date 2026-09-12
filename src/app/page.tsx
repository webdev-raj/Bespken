import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import ProblemSection from '@/components/ProblemSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import DifferentiatorSection from '@/components/DifferentiatorSection';
import WhoItsForSection from '@/components/WhoItsForSection';
import TrustSection from '@/components/TrustSection';
import CtaSection from '@/components/CtaSection';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://bespken.vercel.app',
  },
  openGraph: {
    url: 'https://bespken.vercel.app',
  },
};

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="w-full max-w-full overflow-x-hidden">
        <HeroSection />

        {/* Divider */}
        <div className="max-w-5xl mx-auto px-6">
          <div className="h-px bg-white/6" aria-hidden="true" />
        </div>

        <ProblemSection />

        <div className="max-w-5xl mx-auto px-6">
          <div className="h-px bg-white/6" aria-hidden="true" />
        </div>

        <HowItWorksSection />

        <div className="max-w-5xl mx-auto px-6">
          <div className="h-px bg-white/6" aria-hidden="true" />
        </div>

        <DifferentiatorSection />

        <div className="max-w-5xl mx-auto px-6">
          <div className="h-px bg-white/6" aria-hidden="true" />
        </div>

        <WhoItsForSection />

        <div className="max-w-5xl mx-auto px-6">
          <div className="h-px bg-white/6" aria-hidden="true" />
        </div>

        <TrustSection />

        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
