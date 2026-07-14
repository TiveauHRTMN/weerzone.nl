import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

import "./globals.css";

const inter = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://calortravel.nl"),
  title: {
    default: "Calor | Caribbean Live Travel Intelligence",
    template: "%s | Calor",
  },
  description:
    "Open één levende reisomgeving met de keuzes en lokale context die voor jouw reis naar de Caribbean nú relevant zijn.",
  applicationName: "Calor",
  category: "travel",
  creator: "Calor",
  openGraph: {
    title: "Calor | Caribbean Live Travel Intelligence",
    description:
      "Niet wat er te doen is. Wat voor jouw reis nú het beste is.",
    locale: "nl_NL",
    siteName: "Calor",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Calor | Caribbean Live Travel Intelligence",
    description:
      "Niet wat er te doen is. Wat voor jouw reis nú het beste is.",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={inter.variable} data-scroll-behavior="smooth">
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
