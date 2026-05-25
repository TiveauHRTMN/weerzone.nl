import type { Metadata } from "next";
import Link from "next/link";
import WeatherDashboard from "@/components/WeatherDashboard";
import { FRENCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";
import { PERSONAS, PERSONA_ORDER } from "@/lib/personas";
import { hreflangLanguages } from "@/lib/hreflang";

export const metadata: Metadata = {
  title: "Météo France aujourd'hui | Prévisions locales à 48h",
  description:
    "Météo actuelle pour la France. Prévisions météo locales précises, températures, probabilité de pluie, vent et alertes pour les 48 prochaines heures.",
  alternates: {
    canonical: "https://weerzone.nl/fr",
    languages: hreflangLanguages("/"),
  },
  openGraph: {
    title: "Météo France | WEERZONE",
    description: "Hyperlocal, précis, 48 heures à l'avance.",
    url: "https://weerzone.nl/fr",
    locale: "fr_FR",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "WEERZONE France",
  description: "Prévisions météo hyperlocales pour tous les départements et villes de France.",
  url: "https://weerzone.nl/fr",
  inLanguage: "fr-FR",
};

const paris = FRENCH_CITIES.find((place) => place.name === "Paris") ?? FRENCH_CITIES[0];

const FR_PERSONA_COPY: Record<string, { name: string; label: string; tagline: string; description: string; cta: string }> = {
  piet: {
    name: "Luc",
    label: "Base",
    tagline: "Votre assistant météo local pour la France.",
    description:
      "Luc vous envoie un court e-mail tous les matins avant 7h : ce que fait la météo aujourd'hui et demain à votre adresse précise.",
    cta: "Découvrir la Base",
  },
  reed: {
    name: "Reed",
    label: "Alertes",
    tagline: "Alerte lorsque la météo dépasse vos limites.",
    description:
      "Reed ne vous contacte que lorsque la météo franchit votre seuil. Pour le reste, il vous laisse tranquille.",
    cta: "Découvrir Reed",
  },
  steve: {
    name: "Steve",
    label: "Professionnel",
    tagline: "La météo traduite en décision commerciale.",
    description:
      "Steve lit la météo 48h à l'avance et la traduit : ouvrir, fermer, acheter ou annuler.",
    cta: "Découvrir Steve",
  },
};

const TRUST_TIERS = [
  {
    range: "0-48 Heures",
    label: "Précision",
    desc: "Prévisions à court terme axées sur des décisions exploitables.",
    emoji: "🎯",
    accent: "#10b981",
    tint: "rgba(16,185,129,0.10)",
    border: "rgba(16,185,129,0.25)",
    pct: "92-98%",
  },
  {
    range: "3-7 Jours",
    label: "Fiabilité Limitée",
    desc: "La situation peut encore changer considérablement. La vue à 48 heures reste préférable pour les plans importants.",
    emoji: "🎲",
    accent: "#f59e0b",
    tint: "rgba(245,158,11,0.09)",
    border: "rgba(245,158,11,0.22)",
    pct: "45-75%",
  },
  {
    range: "10+ Jours",
    label: "Indicatif",
    desc: "Bon pour une impression générale de la saison, pas pour la planification quotidienne.",
    emoji: "🔮",
    accent: "rgba(255,255,255,0.35)",
    tint: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.10)",
    pct: "<20%",
  },
];

const ACCURACY_BARS = [
  { day: "Jour 1", val: 98, color: "#10b981" },
  { day: "Jour 2", val: 92, color: "#34d399" },
  { day: "Jour 3", val: 70, color: "#fbbf24" },
  { day: "Jour 4", val: 48, color: "#f59e0b" },
  { day: "Jour 5", val: 28, color: "rgba(255,255,255,0.22)" },
  { day: "Jour 6", val: 14, color: "rgba(255,255,255,0.13)" },
  { day: "Jour 7", val: 6, color: "rgba(255,255,255,0.07)" },
];

export default async function FranceHomepage() {
  const initialWeather = await fetchWeatherData(paris.lat, paris.lon, false, false, undefined, "fr").catch(() => undefined);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <WeatherDashboard
          initialCity={paris}
          initialWeather={initialWeather}
          locale="fr"
          titleOverride="WEERZONE — Météo hyperlocale pour la France, à 48 heures"
          beforeFooter={
            <>
              {/* TrustSection */}
              <section className="px-4 py-20">
                <div className="max-w-5xl mx-auto">
                  <div className="text-center mb-12">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-4">
                      Transparence et précision
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
                      Conçu pour les heures
                      <br />
                      que vous planifiez vraiment.
                    </h2>
                    <p className="text-white/65 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                      WEERZONE se concentre sur la période où les prévisions sont les plus utiles :
                      aujourd'hui, cette nuit et demain. Au-delà, cela donne une orientation,
                      mais aucune précision horaire réelle.
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
                        Précision par jour
                      </p>
                      <p className="text-white/35 text-[10px] font-bold mb-6">
                        Fiabilite typique pour la France
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
                          WEERZONE se concentre sur les jours 1 et 2
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* HomePitch */}
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
                    La météo pour décider.
                    <br />
                    Pas pour défiler sans fin.
                  </h2>
                  <p className="text-white/85 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                    WEERZONE traduit les prochaines 48 heures en moments concrets :
                    quand pédaler au sec, travailler dehors ou s'il vaut mieux attendre.
                    Nos assistants rendent ces décisions personnelles.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                  {PERSONA_ORDER.map((tier) => {
                    const p = PERSONAS[tier];
                    const fr = FR_PERSONA_COPY[tier];
                    return (
                      <Link
                        key={tier}
                        href={`/app/signup?tier=${tier}&lang=fr`}
                        className="card group p-6 sm:p-8"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <span className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                          <span className="text-xs font-black uppercase tracking-widest" style={{ color: p.color }}>
                            {fr.name} · {fr.label}
                          </span>
                        </div>
                        <h3 className="font-black text-slate-900 text-xl leading-snug mb-3">{fr.tagline}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed mb-6">{fr.description}</p>

                        <div className="pt-4 border-t border-slate-100">
                          <div className="text-2xl font-black text-slate-900">S'abonner</div>
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                            Gratuit pendant la bêta
                          </p>
                        </div>

                        <div
                          className="mt-6 text-center rounded-2xl py-3 text-white font-black text-sm group-hover:brightness-110 shadow-lg shadow-black/5"
                          style={{ background: p.color }}
                        >
                          {fr.cta} →
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <div className="text-center">
                  <Link
                    href="/fr/tarifs"
                    className="inline-block px-8 py-4 rounded-full bg-white text-slate-900 font-black text-sm shadow-2xl hover:bg-accent-orange hover:text-white transition-all transform hover:scale-105"
                  >
                    Comparer les tarifs →
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
