import type { Metadata } from "next";
import Link from "next/link";
import WeatherDashboard from "@/components/WeatherDashboard";
import { ALL_PLACES } from "@/lib/places-data";
import { fetchWeatherData } from "@/lib/weather";
import { getJuanWeatherVerdict } from "@/app/actions";
import { hreflangLanguages } from "@/lib/hreflang";

export const metadata: Metadata = {
  title: "Tiempo Espana hoy | Prevision local 48 horas",
  description:
    "Tiempo actual para Espana. Previsiones locales de 48 horas con temperatura, lluvia, viento y alertas para ciudades, pueblos, costas e islas.",
  alternates: {
    canonical: "https://weerzone.nl/es",
    languages: hreflangLanguages("/"),
  },
  openGraph: {
    title: "Tiempo Espana | WEERZONE",
    description: "Hiperlocal, preciso y centrado en las proximas 48 horas.",
    url: "https://weerzone.nl/es",
    locale: "es_ES",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "WEERZONE Espana",
  description: "Prevision local para ciudades, pueblos, costas e islas de Espana.",
  url: "https://weerzone.nl/es",
  inLanguage: "es-ES",
};

const madrid = ALL_PLACES.find((place) => place.province === "spanje" && place.name === "Madrid")
  ?? ALL_PLACES.find((place) => place.province === "spanje")
  ?? ALL_PLACES[0];

const TRUST_TIERS = [
  {
    range: "0-48 horas",
    label: "Precision",
    desc: "Prediccion corta, centrada en decisiones que puedes tomar hoy y manana.",
    pct: "92-98%",
    emoji: "🎯",
    accent: "#10b981",
    tint: "rgba(16,185,129,0.10)",
    border: "rgba(16,185,129,0.25)",
  },
  {
    range: "3-7 dias",
    label: "Seguridad limitada",
    desc: "La situacion puede cambiar. Para planes concretos, el marco de 48 horas sigue siendo mejor.",
    pct: "45-75%",
    emoji: "🎲",
    accent: "#f59e0b",
    tint: "rgba(245,158,11,0.09)",
    border: "rgba(245,158,11,0.22)",
  },
  {
    range: "10+ dias",
    label: "Orientativo",
    desc: "Util para una sensacion general, no para decidir hora por hora.",
    pct: "<20%",
    emoji: "🔮",
    accent: "rgba(255,255,255,0.35)",
    tint: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.10)",
  },
];

const ACCURACY_BARS = [
  { day: "Dia 1", val: 98, color: "#10b981" },
  { day: "Dia 2", val: 92, color: "#34d399" },
  { day: "Dia 3", val: 70, color: "#fbbf24" },
  { day: "Dia 4", val: 48, color: "#f59e0b" },
  { day: "Dia 5", val: 28, color: "rgba(255,255,255,0.22)" },
  { day: "Dia 6", val: 14, color: "rgba(255,255,255,0.13)" },
  { day: "Dia 7", val: 6, color: "rgba(255,255,255,0.07)" },
];

export default async function EspanaHomepage() {
  const initialWeather = await fetchWeatherData(madrid.lat, madrid.lon, false, false, madrid, "es").catch(() => undefined);
  const juan = initialWeather
    ? await getJuanWeatherVerdict(initialWeather, madrid.name, "Espana", madrid.character).catch(() => null)
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main>
        <WeatherDashboard
          initialCity={madrid}
          initialWeather={initialWeather}
          locale="es"
          initialNarrative={juan}
          titleOverride="WEERZONE — Tiempo hiperlocal en España, 48 horas por delante"
          beforeFooter={
            <>
              <section className="px-4 py-20">
                <div className="max-w-5xl mx-auto">
                  <div className="text-center mb-12">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-4">
                      Transparencia y precision
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
                      Pensado para las horas
                      <br />
                      que realmente planificas.
                    </h2>
                    <p className="text-white/65 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                      WEERZONE se centra en hoy, esta noche y manana. Mas alla de eso sirve para orientarse, pero no para decidir con precision.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="flex flex-col gap-3">
                      {TRUST_TIERS.map((tier) => (
                        <div key={tier.range} className="flex gap-4 rounded-3xl p-5 border transition-all duration-300 hover:scale-[1.01]" style={{ background: tier.tint, borderColor: tier.border, backdropFilter: "blur(12px)" }}>
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border" style={{ background: tier.tint, borderColor: tier.border }}>
                            {tier.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: tier.accent }}>{tier.range}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: tier.accent }}>{tier.pct}</span>
                            </div>
                            <p className="font-black text-white text-sm mb-1">{tier.label}</p>
                            <p className="text-white/50 text-xs leading-relaxed">{tier.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-3xl border p-6 flex flex-col" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.10)", backdropFilter: "blur(12px)" }}>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: "#ffd60a" }}>Precision por dia</p>
                      <p className="text-white/35 text-[10px] font-bold mb-6">Precision tipica de la prevision para Espana</p>
                      <div className="flex flex-col gap-3 flex-1">
                        {ACCURACY_BARS.map((bar, i) => (
                          <div key={bar.day} className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-white/35 w-10 text-right shrink-0">{bar.day}</span>
                            <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                              <div className="h-full rounded-full" style={{ width: `${bar.val}%`, background: bar.color }} />
                            </div>
                            <span className="text-[10px] font-black w-9 text-right shrink-0" style={{ color: i < 2 ? "#10b981" : i < 4 ? "#f59e0b" : "rgba(255,255,255,0.2)" }}>{bar.val}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="px-4 py-14 sm:py-20 max-w-5xl mx-auto">
                <div className="text-center mb-10">
                  <h2 className="text-3xl sm:text-5xl font-black leading-[1.05] mb-5" style={{ background: "linear-gradient(135deg, #ff5400 0%, #ffd200 50%, #ff5400 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    Tiempo para decidir.
                    <br />
                    No para hacer scroll sin fin.
                  </h2>
                  <p className="text-white/85 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                    Juan, Reed y Steve traducen la prevision a decisiones: salir, esperar, abrir, cerrar o cambiar el plan.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                  {[
                    { title: "Juan", href: "/es/mi-tiempo", text: "Tu parte del tiempo cada manana, escrito por alguien que conoce tu calle y tu costa." },
                    { title: "Reed", href: "/es/alertas", text: "Alertas cuando el tiempo cruza tus limites: lluvia, viento, tormenta o calor." },
                    { title: "Steve", href: "/es/precios", text: "La prevision traducida a una decision comercial para las proximas 48 horas." },
                  ].map((item) => (
                    <Link key={item.title} href={item.href} className="card group p-6 sm:p-8">
                      <h3 className="text-2xl font-black text-text-primary mb-2">{item.title}</h3>
                      <p className="text-sm text-text-secondary leading-relaxed">{item.text}</p>
                    </Link>
                  ))}
                </div>
              </section>
            </>
          }
        />
      </main>
    </>
  );
}
