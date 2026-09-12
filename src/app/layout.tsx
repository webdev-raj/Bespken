import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const generalSans = localFont({
  src: "../../public/fonts/GeneralSans-Regular.otf",
  variable: "--font-general-sans",
  display: "swap",
});

const title = "Bespken – Turn Client Calls Into Proposals Automatically";
const description =
  "Turn a client call into a proposal. Bespken joins Zoom or Google Meet, transcribes the conversation, and drafts a ready-to-send proposal or invoice.";

export const metadata: Metadata = {
  metadataBase: new URL("https://bespken.com"),
  title,
  description,
  keywords: [
    "client proposal generator",
    "freelance invoice from call",
    "AI meeting to proposal",
    "automatic proposal writer",
    "freelancer call transcription tool",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "Bespken",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Bespken — turn client calls into ready-to-send proposals",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.png"],
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
    <html lang="en" className={generalSans.variable}>
      <body className="antialiased bg-[#0a0a0a] text-white w-full max-w-full overflow-x-hidden">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
