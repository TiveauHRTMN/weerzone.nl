import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./hartmanwk.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--wkp-font",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hartman WK Poule 2026",
  description: "Besloten WK 2026 poule voor familie & vrienden — voorspel wedstrijden, kies je wereldkampioen en fantasy-spelers en strijd op de ranglijst.",
  robots: { index: false, follow: false },
};

// Stand-alone: deze route draait bovenop weerzone.nl maar zonder de globale
// WEERZONE-chrome. GlobalNav + Footer worden verborgen op /hartmanwk2026
// (zie src/components/wz/GlobalNav.tsx HIDDEN_PATHS en src/components/Footer.tsx).
export default function HartmanWkLayout({ children }: { children: React.ReactNode }) {
  return <div className={inter.variable}>{children}</div>;
}
