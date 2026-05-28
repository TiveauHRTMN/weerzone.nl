import type { Metadata } from "next";

// Magnolia is een intern trading-agent dashboard, niet voor publieke index.
// Een 'use client'-page kan zelf geen metadata exporteren — daarom hier
// via een aparte layout-laag.
export const metadata: Metadata = {
  title: "Magnolia (intern)",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, "max-snippet": -1, "max-image-preview": "none", "max-video-preview": -1 },
  },
};

export default function MagnoliaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
