import type { Metadata } from "next";
import Link from "next/link";
import WeatherDashboard from "@/components/WeatherDashboard";

export const metadata: Metadata = {
  title: "Over WEERZONE — Eerlijk weer voor elke straat",
  description:
    "WEERZONE levert de nauwkeurigste 48-uurs weersvoorspelling van Nederland. Op 1 bij 1 kilometer, zonder reclame, zonder gokwerk over twee weken vooruit.",
  alternates: { canonical: "https://weerzone.nl/over" },
};

export default function OverPage() {
  return (
    <main>
      <WeatherDashboard
        beforeFooter={
          <div className="space-y-6 pb-6">

            {/* Header */}
            <div className="card p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-text-muted mb-2">
                Over WEERZONE
              </p>
              <h1 className="text-3xl font-black text-text-primary leading-tight mb-4">
                Eerlijk weer voor elke straat.
              </h1>
              <p className="text-text-secondary text-sm leading-relaxed">
                WEERZONE is gebouwd op één overtuiging: een weersvoorspelling moet kloppen.
                Niet voor een provincie, niet voor de stad — maar voor jouw straat, voor de
                komende 48 uur.
              </p>
            </div>

            {/* Waarom 48 uur */}
            <div className="card p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-text-muted mb-2">
                Waarom maar 48 uur?
              </p>
              <p className="text-text-primary font-black text-lg mb-2">
                Omdat verder kijken gokken is.
              </p>
              <p className="text-text-secondary text-sm leading-relaxed">
                Na drie dagen loopt de nauwkeurigheid van elke weersvoorspelling sterk terug.
                Wij tonen geen 14-daagse alsof die even betrouwbaar is als vandaag — dat doen
                andere diensten wel, wij niet. Binnen 48 uur zijn wij de meest precieze
                weersvoorspelling van Nederland.
              </p>
            </div>

            {/* De drie persona's */}
            <div>
              <h2 className="text-2xl font-black text-white text-center mb-1">De drie gezichten van WEERZONE</h2>
              <p className="text-white/50 text-center mb-6 text-xs font-bold uppercase tracking-widest">
                Elk voor een ander doel
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    href: "/jouwweer",
                    name: "Piet",
                    tag: "48-uurs weerbericht",
                    desc: "Een dagelijks, eerlijk weerbericht voor jouw locatie. In gewone taal, zonder reclame.",
                    color: "#10b981",
                  },
                  {
                    href: "/waarschuwingen",
                    name: "Reed",
                    tag: "Extreem weer alerts",
                    desc: "Alleen een melding als het er echt om gaat: storm, onweer, hitte of strenge vorst.",
                    color: "#ef4444",
                  },
                  {
                    href: "/zakelijk",
                    name: "Steve",
                    tag: "Zakelijk weer",
                    desc: "48 uur vooruit voor uw bedrijfsadres. Elke ochtend in de inbox — alleen als het telt.",
                    color: "#0ea5e9",
                  },
                ].map(p => (
                  <Link
                    key={p.name}
                    href={p.href}
                    className="card p-5 hover:scale-[1.01] transition-transform"
                    style={{ borderBottom: `3px solid ${p.color}` }}
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: p.color }}>
                      {p.name} · {p.tag}
                    </p>
                    <p className="text-text-secondary text-sm leading-relaxed">{p.desc}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Techniek */}
            <div className="card p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-text-muted mb-2">
                Hoe het werkt
              </p>
              <p className="text-text-primary font-black text-base mb-2">
                Drie modellen. Eén synthese.
              </p>
              <p className="text-text-secondary text-sm leading-relaxed">
                WEERZONE combineert drie numerieke weermodellen — KNMI Harmonie, DWD ICON-D2
                en Météo-France AROME — op een resolutie van 1 bij 1 kilometer. Een AI-laag
                vergelijkt de modellen, detecteert onzekerheid en schrijft een eerlijke samenvatting.
                Geen marketingpraat. Wel het echte verhaal.
              </p>
            </div>

            {/* CTA */}
            <div className="card p-6 text-center">
              <p className="text-text-muted text-xs font-bold uppercase tracking-widest mb-4">
                Klaar om te beginnen?
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/app/signup"
                  className="px-6 py-3 rounded-2xl text-white font-black text-sm transition-opacity hover:opacity-90"
                  style={{ background: "var(--wz-brand)" }}
                >
                  Gratis aanmelden
                </Link>
                <Link
                  href="/contact"
                  className="px-6 py-3 rounded-2xl text-text-primary font-black text-sm transition-all hover:brightness-95"
                  style={{
                    background: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(255,255,255,0.8)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  Neem contact op
                </Link>
              </div>
            </div>

          </div>
        }
      />
    </main>
  );
}
