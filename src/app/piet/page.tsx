import type { Metadata } from "next";
import Link from "next/link";
import PietExtended from "@/components/PietExtended";

export const metadata: Metadata = {
  title: "Piet — 48 uur weer-update",
  description:
    "Piet van WeerZone — de uitgebreide 48 uur weer-update voor jouw locatie. Elke ochtend vers in je mailbox. Hier lees je de webversie.",
  alternates: { canonical: "https://weerzone.nl/piet" },
};

export default function PietPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4 py-8 pb-20">
      <div className="max-w-2xl mx-auto">
        <nav className="text-xs text-white/50 mb-5">
          <Link href="/" className="hover:text-white">WeerZone</Link>
          <span className="mx-2">/</span>
          <span className="text-white/80">Piet</span>
        </nav>

        <header className="mb-6">
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-3 flex items-center gap-3">
            <span>💬</span> Piet
          </h1>
          <p className="text-white/70 text-base leading-relaxed">
            De uitgebreide 48-uurs weer-update voor jouw locatie. Elke ochtend om 08:00 stuurt Piet
            dit ook per mail — wil je hem in je inbox? Aanmelden kan op de{" "}
            <Link href="/" className="text-accent-orange hover:underline">homepage</Link>.
          </p>
        </header>

        <PietExtended />
      </div>
    </main>
  );
}
