import type { Metadata } from "next";
import Link from "next/link";
import WeatherDashboard from "@/components/WeatherDashboard";

export const metadata: Metadata = {
  title: "Over WEERZONE",
  description:
    "Lees waar WEERZONE voor staat: hyperlokale 48-uurs weersverwachting voor Nederland, zonder ruis en gericht op keuzes voor vandaag en morgen.",
  keywords: [
    "WEERZONE",
    "over weerzone",
    "hyperlokaal weer",
    "48 uur weer",
    "persoonlijk weerbericht",
    "weerdienst nederland",
  ],
  alternates: { canonical: "https://weerzone.nl/over" },
  openGraph: {
    title: "Over WEERZONE",
    description:
      "Hyperlokale 48-uurs weersverwachting voor Nederland, gericht op keuzes voor vandaag en morgen.",
    type: "website",
    locale: "nl_NL",
    url: "https://weerzone.nl/over",
    siteName: "WEERZONE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Over WEERZONE",
    description:
      "Hyperlokale 48-uurs weersverwachting voor Nederland, gericht op keuzes voor vandaag en morgen.",
  },
};

const PERSONAS = [
  {
    name: "Piet",
    href: "/mijnweer",
    color: "#10b981",
    role: "Dagelijks weerbericht",
    desc: "Piet vertaalt de komende 48 uur naar gewone taal: droogte, regen, wind en wat dat vandaag en morgen voor jou betekent.",
  },
  {
    name: "Reed",
    href: "/waarschuwingen",
    color: "#ef4444",
    role: "Waarschuwingen",
    desc: "Reed meldt alleen als er echt iets op komst is, zoals onweer, storm, hitte of zware neerslag.",
  },
  {
    name: "Steve",
    href: "/zakelijk",
    color: "#0ea5e9",
    role: "Zakelijk",
    desc: "Steve vertaalt weerdata naar operationele keuzes voor bedrijven die buiten werken of op bezoek, drukte en planning draaien.",
  },
];

export default function OverPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "Over WEERZONE",
    description:
      "WEERZONE richt zich op hyperlokale weersverwachtingen voor de komende 48 uur.",
    url: "https://weerzone.nl/over",
    inLanguage: "nl-NL",
    mainEntity: [
      {
        "@type": "Question",
        name: "Waarom kijkt WEERZONE maar 48 uur vooruit?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Omdat die periode het meest bruikbaar is voor concrete keuzes en planning per uur.",
        },
      },
      {
        "@type": "Question",
        name: "Wat maakt WEERZONE anders?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "De combinatie van hyperlokale data, modelvergelijking en een vertaallaag naar praktische gevolgen voor thuis en werk.",
        },
      },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <WeatherDashboard
        hideWeatherInfo
        beforeFooter={
          <div className="space-y-6">
            <div className="rounded-3xl bg-white/95 backdrop-blur p-6 sm:p-8 shadow-xl border-b-4 border-b-sky-500">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-3 rounded-full bg-sky-500" />
                <span className="text-xs font-black uppercase tracking-widest text-sky-600">
                  Over · Weerzone
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-2">
                Weerzone maakt weer bruikbaar.
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                WEERZONE is gebouwd voor mensen die iets met het weer moeten beslissen. Niet om eindeloos te scrollen door
                lange verwachtingen, maar om te weten wat er vandaag en morgen op jouw plek gebeurt.
              </p>
            </div>

            <div className="rounded-3xl bg-white/95 backdrop-blur p-6 shadow-xl border border-white/70">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                Waar we voor staan
              </p>
              <p className="text-slate-900 font-black text-lg mb-2">
                Hyperlokaal, kort op de bal en bruikbaar.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                WEERZONE focust op de komende 48 uur, omdat dat de periode is waarin weersverwachtingen het meest bruikbaar
                zijn voor planning per uur. Verder vooruit kan richting geven, maar is minder geschikt voor concrete keuzes.
              </p>
            </div>

            <div className="rounded-3xl bg-white/95 backdrop-blur p-6 shadow-xl border border-white/70">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                Hoe het werkt
              </p>
              <p className="text-slate-900 font-black text-lg mb-2">
                Meerdere modellen, één vertaalslag.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                WEERZONE gebruikt hyperlokale weerdata en modelvergelijking om temperatuur, regen, wind en risico&apos;s zo
                relevant mogelijk per locatie te tonen. Daarna vertalen we dat naar momenten en gevolgen: kun je droog
                fietsen, buiten werken, of moet je rekening houden met een omslag in het weer.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-white text-center mb-1">De onderdelen van WEERZONE</h2>
              <p className="text-white/50 text-center mb-6 text-xs font-bold uppercase tracking-widest">
                Voor thuis, waarschuwingen en zakelijk gebruik
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PERSONAS.map((persona) => (
                  <Link
                    key={persona.name}
                    href={persona.href}
                    className="card p-5 hover:scale-[1.01] transition-transform"
                    style={{ borderBottom: `3px solid ${persona.color}` }}
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: persona.color }}>
                      {persona.name} · {persona.role}
                    </p>
                    <p className="text-text-secondary text-sm leading-relaxed">{persona.desc}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white/95 backdrop-blur p-6 shadow-xl border border-white/70">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                Contact
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Voor vragen, feedback of samenwerking loopt contact via{" "}
                <a href="mailto:info@weerzone.nl" className="text-sky-600 font-semibold hover:underline">
                  info@weerzone.nl
                </a>.
              </p>
            </div>

            <div className="rounded-3xl bg-white/95 backdrop-blur p-6 text-center shadow-xl border border-white/70">
              <p className="text-slate-900 font-black text-lg mb-2">Meer weten of beginnen?</p>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">
                Bekijk het actuele weer, lees meer over de abonnementen of stuur direct een bericht naar info@weerzone.nl.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/homepage"
                  className="px-6 py-3 rounded-2xl text-white font-black text-sm transition-opacity hover:opacity-90"
                  style={{ background: "var(--wz-brand)" }}
                >
                  Naar homepage
                </Link>
                <Link
                  href="/prijzen"
                  className="px-6 py-3 rounded-2xl text-text-primary font-black text-sm transition-all hover:brightness-95"
                  style={{
                    background: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(255,255,255,0.8)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  Bekijk prijzen
                </Link>
              </div>
            </div>
          </div>
        }
      />
    </main>
  );
}
