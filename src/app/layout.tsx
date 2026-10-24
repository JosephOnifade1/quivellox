import type { Metadata } from "next";
import { DM_Sans, Geist, IBM_Plex_Mono, Newsreader } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quivellox — The Evidence Desk",
  description:
    "AI Knowledge Workspace Powered by Retrieval-Augmented Generation. Answers grounded in evidence.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${geistSans.variable} ${ibmPlexMono.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] font-sans"
      >
        {children}
      </body>
    </html>
  );
}
