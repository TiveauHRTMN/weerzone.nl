import type { Metadata } from "next";
import Link from "next/link";
import ReedExtended from "@/components/ReedExtended";
import PremiumGate from "@/components/PremiumGate";

export const metadata: Metadata = {
  title: "Reed — extreem weer alerts",
  description:
    "Reed van WEERZONE waarschuwt voor storm, onweer, hitte, vorst en zware neerslag. Alleen als er echt iets op komst is — geen ruis.",
  alternates: { canonical: "https://weerzone.nl/reed" },
};

export default function ReedPage() {
  return (
    <main className="min-h-screen bg-[#4a9ee8] text-white px-4 py-8 pb-20">
      <div className="max-w-2xl mx-auto">
        <nav className="text-xs text-white/50 mb-5">
          <Link href="/" className="hover:text-white">WEERZONE</Link>
          <span className="mx-2">/</span>
          <span className="text-white/80">Reed</span>
        </nav>

        <header className="mb-6">
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-3 flex items-center gap-3">
            <span>⚠️</span> Reed
          </h1>
          <p className="text-white/70 text-base leading-relaxed">
            Reed stuurt alleen een mail als er écht iets op komst is: storm, onweer, extreme hitte,
            strenge vorst, zware neerslag of gevaarlijke UV. Geen ruis, wel attitude. Hieronder zie
            je de live status voor jouw locatie.
          </p>
        </header>

        <PremiumGate>
          <ReedExtended />
        </PremiumGate>
      </div>
    </main>
  );
}
