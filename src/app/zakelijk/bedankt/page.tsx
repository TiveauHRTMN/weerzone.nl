import Link from "next/link";

export const metadata = {
  title: "Bedankt — WEERZONE Zakelijk",
  robots: { index: false, follow: false },
};

export default function BedanktPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(160deg, #1e293b 0%, #0f172a 100%)" }}>
      <div className="max-w-lg w-full text-center">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-4xl font-black text-white mb-4">Bedankt!</h1>
        <p className="text-lg text-white/70 mb-2">Je betaling wordt verwerkt.</p>
        <p className="text-white/50 mb-8">
          Zodra het binnen is, krijg je een bevestigingsmail. Vanaf morgenochtend 08:00 staat je eerste 48-uurs weerrapport in je inbox.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left">
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Wat gebeurt er nu?</p>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">✓</div>
              <p className="text-sm text-white/70">Betaling ontvangen en verwerkt</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">2</div>
              <p className="text-sm text-white/70">Bevestigingsmail wordt verstuurd (binnen 1 minuut)</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/50 font-bold flex-shrink-0">3</div>
              <p className="text-sm text-white/70">Morgenochtend 08:00: eerste weerrapport in je inbox</p>
            </div>
          </div>
        </div>

        <Link href="/" className="inline-block px-8 py-3 rounded-full bg-accent-orange text-text-primary font-bold hover:brightness-90 transition-all">
          Terug naar WEERZONE →
        </Link>
      </div>
    </div>
  );
}
