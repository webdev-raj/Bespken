import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Analytics } from "@vercel/analytics/next"

const generalSans = localFont({
  src: '../../public/fonts/GeneralSans-Regular.otf',
  variable: '--font-general-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Bespken — Proposals & Invoices from Your Client Calls',
  description:
    'Bespken joins your Zoom or Google Meet calls, transcribes the conversation, and drafts a ready-to-send proposal or invoice — automatically. Built for freelancers and consultants.',
  metadataBase: new URL('https://bespken.com'),
  openGraph: {
    title: 'Bespken — Proposals & Invoices from Your Client Calls',
    description:
      "Stop reconstructing proposals from memory. Bespken listens to your client calls and sends you a draft before you've even opened a new tab.",
    type: 'website',
    url: 'https://bespken.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bespken — Your next proposal writes itself.',
    description:
      "Stop reconstructing proposals from memory. Bespken listens to your client calls and sends you a draft before you've even opened a new tab.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${generalSans.variable}`}>
      <body className="antialiased bg-[#0B0B0F] text-white w-full max-w-full overflow-x-hidden">{children}</body>
      <Analytics />
    </html>
  );
}

