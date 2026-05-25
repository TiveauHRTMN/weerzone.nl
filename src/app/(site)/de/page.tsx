import type { Metadata } from "next";
import Link from "next/link";
import WeatherDashboard from "@/components/WeatherDashboard";
import { ALL_PLACES } from "@/lib/places-data";
import { fetchWeatherData } from "@/lib/weather";
import { PERSONAS, PERSONA_ORDER_DE } from "@/lib/personas";
import { hreflangLanguages } from "@/lib/hreflang";

export const metadata: Metadata = {
  title: "Wetter Deutschland heute | Lokale 48-Stunden-Wettervorhersage",
  description:
    "Aktuelles Wetter für Deutschland. Präzise lokale Wettervorhersagen, Temperaturen, Regenwahrscheinlichkeit, Wind und Warnungen für die nächsten 48 Stunden.",
  alternates: {
    canonical: "https://weerzone.nl/de",
    languages: hreflangLanguages("/"),
  },
  openGraph: {
    title: "Wetter Deutschland | WEERZONE",
    description: "Hyperlokal, präzise, 48 Stunden voraus.",
    url: "https://weerzone.nl/de",
    locale: "de_DE",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "WEERZONE Deutschland",
  description: "Hyperlokale Wettervorhersage für alle Bundesländer und Orte in Deutschland.",
  url: "https://weerzone.nl/de",
  inLanguage: "de-DE",
};

const berlin = ALL_PLACES.find((place) => place.name === "Berlin") ?? ALL_PLACES[0];

// Duitse copy voor persona's — Karl is DE-equivalent van Piet, Reed/Steve krijgen
// hier hun DE-vertaling omdat de centrale PERSONAS-config nog NL-copy heeft.
const DE_PERSONA_COPY: Record<string, { name: string; label: string; tagline: string; description: string; cta: string }> = {
  karl: {
    name: "Karl",
    label: "Basis",
    tagline: "Dein lokaler Wetterassistent für Deutschland.",
    description:
      "Karl schickt dir jeden Morgen vor 7 Uhr eine kurze Mail: Was das Wetter heute und morgen an deiner genauen Adresse macht.",
    cta: "Karl ansehen",
  },
  reed: {
    name: "Reed",
    label: "Warnungen",
    tagline: "Warnung, wenn das Wetter deine Grenze überschreitet.",
    description:
      "Reed meldet sich nur, wenn das Wetter durch deine Schwelle geht. Bei allem anderen lässt er dich in Ruhe.",
    cta: "Reed ansehen",
  },
  steve: {
    name: "Steve",
    label: "Business",
    tagline: "Wetter, übersetzt in eine Geschäftsentscheidung.",
    description:
      "Steve liest das Wetter 48 Stunden voraus und übersetzt es: öffnen, schließen, einkaufen oder absagen.",
    cta: "Steve ansehen",
  },
};

const TRUST_TIERS = [
  {
    range: "0-48 Stunden",
    label: "Präzision",
    desc: "Kurzfristige Vorhersagen mit klarem Fokus auf brauchbare Entscheidungen.",
    emoji: "🎯",
    accent: "#10b981",
    tint: "rgba(16,185,129,0.10)",
    border: "rgba(16,185,129,0.25)",
    pct: "92-98%",
  },
  {
    range: "3-7 Tage",
    label: "Begrenzte Sicherheit",
    desc: "Die Lage kann sich noch deutlich ändern. Für größere Pläne bleibt der 48-Stunden-Blick besser.",
    emoji: "🎲",
    accent: "#f59e0b",
    tint: "rgba(245,158,11,0.09)",
    border: "rgba(245,158,11,0.22)",
    pct: "45-75%",
  },
  {
    range: "10+ Tage",
    label: "Richtungsweisend",
    desc: "Gut für ein grobes Saisongefühl, nicht für die Tagesplanung.",
    emoji: "🔮",
    accent: "rgba(255,255,255,0.35)",
    tint: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.10)",
    pct: "<20%",
  },
];

const ACCURACY_BARS = [
  { day: "Tag 1", val: 98, color: "#10b981" },
  { day: "Tag 2", val: 92, color: "#34d399" },
  { day: "Tag 3", val: 70, color: "#fbbf24" },
  { day: "Tag 4", val: 48, color: "#f59e0b" },
  { day: "Tag 5", val: 28, color: "rgba(255,255,255,0.22)" },
  { day: "Tag 6", val: 14, color: "rgba(255,255,255,0.13)" },
  { day: "Tag 7", val: 6, color: "rgba(255,255,255,0.07)" },
];

export default async function DeutschlandHomepage() {
  const initialWeather = await fetchWeatherData(berlin.lat, berlin.lon, false, false, undefined, "de").catch(() => undefined);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <WeatherDashboard
          initialCity={berlin}
          initialWeather={initialWeather}
          locale="de"
          titleOverride="WEERZONE — Wetter für Deutschland, 48 Stunden voraus"
          beforeFooter={
            <>
              {/* TrustSection — DE-equivalent van src/components/TrustSection.tsx */}
              <section className="px-4 py-20">
                <div className="max-w-5xl mx-auto">
                  <div className="text-center mb-12">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-4">
                      Transparenz bei der Genauigkeit
                    </p>
                    <h2
                      className="text-4xl sm:text-5xl font-black leading-tight mb-5"
                      style={{
                        background: "linear-gradient(135deg, #ff5400 0%, #ffd200 50%, #ff5400 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      Gemacht für die Stunden,
                      <br />
                      die du wirklich planst.
                    </h2>
                    <p className="text-white/65 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                      WEERZONE konzentriert sich auf den Zeitraum, in dem Vorhersagen am
                      nützlichsten sind: heute, heute Nacht und morgen. Weiter hinaus gibt
                      Orientierung, aber keine echte Stundengenauigkeit.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="flex flex-col gap-3">
                      {TRUST_TIERS.map((t) => (
                        <div
                          key={t.range}
                          className="flex gap-4 rounded-3xl p-5 border transition-all duration-300 hover:scale-[1.01]"
                          style={{ background: t.tint, borderColor: t.border, backdropFilter: "blur(12px)" }}
                        >
                          <div
                            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border"
                            style={{ background: `${t.tint}`, borderColor: t.border }}
                          >
                            {t.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: t.accent }}>
                                {t.range}
                              </span>
                              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: t.accent }}>
                                {t.pct}
                              </span>
                            </div>
                            <p className="font-black text-white text-sm mb-1">{t.label}</p>
                            <p className="text-white/50 text-xs leading-relaxed">{t.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      className="rounded-3xl border p-6 flex flex-col"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        borderColor: "rgba(255,255,255,0.10)",
                        backdropFilter: "blur(12px)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.08)",
                      }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: "#ffd60a" }}>
                        Genauigkeit pro Tag
                      </p>
                      <p className="text-white/35 text-[10px] font-bold mb-6">
                        Typische Zuverlaessigkeit fuer Deutschland
                      </p>

                      <div className="flex flex-col gap-3 flex-1">
                        {ACCURACY_BARS.map((b, i) => (
                          <div key={b.day} className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-white/35 w-10 text-right shrink-0">{b.day}</span>
                            <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${b.val}%`, background: b.color, transition: "width 1s ease" }}
                              />
                            </div>
                            <span
                              className="text-[10px] font-black w-9 text-right shrink-0"
                              style={{ color: i < 2 ? "#10b981" : i < 4 ? "#f59e0b" : "rgba(255,255,255,0.2)" }}
                            >
                              {b.val}%
                            </span>
                          </div>
                        ))}
                      </div>

                      <div
                        className="mt-5 pt-4 flex items-center gap-2"
                        style={{ borderTop: "1px dashed rgba(255,255,255,0.10)" }}
                      >
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                          WEERZONE fokussiert auf Tag 1-2
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* HomePitch — DE-equivalent van src/components/HomePitch.tsx */}
              <section className="px-4 py-14 sm:py-20 max-w-5xl mx-auto">
                <div className="text-center mb-10">
                  <h2
                    className="text-3xl sm:text-5xl font-black leading-[1.05] mb-5"
                    style={{
                      background: "linear-gradient(135deg, #ff5400 0%, #ffd200 50%, #ff5400 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Wetter für Entscheidungen.
                    <br />
                    Nicht für endloses Scrollen.
                  </h2>
                  <p className="text-white/85 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                    WEERZONE übersetzt die nächsten 48 Stunden in konkrete Momente:
                    wann du trocken radelst, draußen arbeiten kannst oder besser wartest.
                    Karl, Reed und Steve machen diese Entscheidungen persönlich.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                  {PERSONA_ORDER_DE.map((tier) => {
                    const p = PERSONAS[tier];
                    const de = DE_PERSONA_COPY[tier];
                    return (
                      <Link
                        key={tier}
                        href={`/app/signup?tier=${tier}&lang=de`}
                        className="card group p-6 sm:p-8"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <span className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                          <span className="text-xs font-black uppercase tracking-widest" style={{ color: p.color }}>
                            {de.name} · {de.label}
                          </span>
                        </div>
                        <h3 className="font-black text-slate-900 text-xl leading-snug mb-3">{de.tagline}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed mb-6">{de.description}</p>

                        <div className="pt-4 border-t border-slate-100">
                          <div className="text-2xl font-black text-slate-900">Abonnieren</div>
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                            In der Beta vorerst kostenlos
                          </p>
                        </div>

                        <div
                          className="mt-6 text-center rounded-2xl py-3 text-white font-black text-sm group-hover:brightness-110 shadow-lg shadow-black/5"
                          style={{ background: p.color }}
                        >
                          {de.cta} →
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <div className="text-center">
                  <Link
                    href="/de/preise"
                    className="inline-block px-8 py-4 rounded-full bg-white text-slate-900 font-black text-sm shadow-2xl hover:bg-accent-orange hover:text-white transition-all transform hover:scale-105"
                  >
                    Tarife vergleichen →
                  </Link>
                </div>
              </section>
            </>
          }
        />
      </main>
    </>
  );
}
