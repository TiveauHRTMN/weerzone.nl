import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

import "./globals.css";

const geist = Geist({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tripfit.travel"),
  title: {
    default: "TripFit | Caribbean Live Travel Intelligence",
    template: "%s | TripFit",
  },
  description:
    "Open één levende reisomgeving met de keuzes en lokale context die voor jouw reis naar de Caribbean nú relevant zijn.",
  applicationName: "TripFit",
  category: "travel",
  creator: "TripFit",
  openGraph: {
    title: "TripFit | Caribbean Live Travel Intelligence",
    description:
      "Niet wat er te doen is. Wat voor jouw reis nú het beste is.",
    locale: "nl_NL",
    siteName: "TripFit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TripFit | Caribbean Live Travel Intelligence",
    description:
      "Niet wat er te doen is. Wat voor jouw reis nú het beste is.",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f7f3eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={geist.variable} data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">
          Ga naar de inhoud
        </a>
        <div className="site-shell">
          <SiteHeader />
          <main id="main-content" className="min-w-0 flex-1">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
