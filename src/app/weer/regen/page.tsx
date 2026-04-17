import type { Metadata } from "next";
import Link from "next/link";
import { DUTCH_CITIES } from "@/lib/types";

export const metadata: Metadata = {
  title: "Regen vandaag in Nederland — wanneer wordt het droog? | WeerZone",
  description:
    "Regen vandaag in Nederland? Bekijk per uur, per stad, wanneer de bui stopt en wanneer het weer droog is. KNMI HARMONIE + DWD ICON, messcherp op de vierkante meter.",
  keywords: [
    "regen vandaag",
    "regen morgen",
    "regen nederland",
    "wanneer stopt de regen",
    "regenverwachting",
    "buienradar alternatief",
    "neerslag per uur",
    "regen knmi",
    "gaat het regenen",
  ],
  alternates: { canonical: "https://weerzone.nl/weer/regen" },
  openGraph: {
    title: "Regen vandaag — WeerZone",
    description: "Per uur zien wanneer het stopt met regenen, per Nederlandse stad.",
    url: "https://weerzone.nl/weer/regen",
    type: "website",
    locale: "nl_NL",
    siteName: "WeerZone",
  },
};

export default function RegenPage() {
  const topCities = DUTCH_CITIES.slice(0, 12);

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Gaat het vandaag regenen in Nederland?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Kies je stad op WeerZone en je ziet per uur of er neerslag verwacht wordt, hoeveel millimeter, en of HARMONIE en ICON het eens zijn. Eens = hoge zekerheid. Oneens = onzeker weer.",
        },
      },
      {
        "@type": "Question",
        name: "Wanneer stopt de regen?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "De uurlijkse neerslagverwachting op elke stad-pagina laat exact zien wanneer de buien eindigen. De minutely-precipitation (eerste uur) is messcherp, daarna per uur tot 48 uur vooruit.",
        },
      },
      {
        "@type": "Question",
        name: "Hoeveel regen valt er vandaag?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "WeerZone toont de neerslagsom per dag (mm) en per uur. Onder 1 mm = motregen. 1-5 mm = normale bui. 5-15 mm = flinke bui. Boven 15 mm per uur = hoosbui of onweer.",
        },
      },
    ],
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "WeerZone", item: "https://weerzone.nl" },
      { "@type": "ListItem", position: 2, name: "Weer", item: "https://weerzone.nl/weer" },
      { "@type": "ListItem", position: 3, name: "Regen", item: "https://weerzone.nl/weer/regen" },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <nav className="text-xs text-white/50 mb-6">
            <Link href="/" className="hover:text-white">WeerZone</Link>
            <span className="mx-2">/</span>
            <Link href="/weer" className="hover:text-white">Weer</Link>
            <span className="mx-2">/</span>
            <span className="text-white/80">Regen</span>
          </nav>

          <header className="mb-10">
            <div className="text-5xl mb-4">🌧️</div>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
              Regen vandaag — wanneer wordt het droog?
            </h1>
            <p className="text-white/70 text-lg leading-relaxed">
              Je staat op het punt om te gaan fietsen, of de was buiten te hangen, of gewoon naar de
              supermarkt. De vraag is simpel: <strong className="text-white">hoe lang duurt deze bui?</strong>
              {" "}WeerZone laat het je per minuut (eerste uur) en per uur (tot 48 uur vooruit) zien.
            </p>
          </header>

          <section className="mb-10 space-y-4 text-white/75 leading-relaxed">
            <h2 className="text-2xl font-bold text-white">Hoeveel is &ldquo;veel&rdquo; regen?</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-6">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                <div className="text-xs font-bold text-white">&lt; 1 mm</div>
                <div className="text-[11px] text-white/60">Motregen</div>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-center">
                <div className="text-xs font-bold text-blue-300">1–5 mm</div>
                <div className="text-[11px] text-white/60">Normale bui</div>
              </div>
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-center">
                <div className="text-xs font-bold text-cyan-300">5–15 mm</div>
                <div className="text-[11px] text-white/60">Flinke bui</div>
              </div>
              <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-center">
                <div className="text-xs font-bold text-indigo-300">&gt; 15 mm</div>
                <div className="text-[11px] text-white/60">Hoosbui</div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">Waarom twee modellen?</h2>
            <p>
              Eén model is een mening. Twee modellen is een peiling. WeerZone draait HARMONIE (KNMI) én
              ICON (Duitse Weerdienst) naast elkaar. Zijn ze het eens over de regen? Dan kun je je
              planning erop bouwen. Zijn ze het oneens? Dan weet je dat je een paraplu moet meenemen,
              voor de zekerheid.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Regenverwachting per stad</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {topCities.map((c) => {
                const slug = c.name.toLowerCase().replace(/\s+/g, "-");
                return (
                  <Link
                    key={c.name}
                    href={`/weer/${slug}`}
                    className="block px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-accent-orange/60 text-sm font-semibold transition-all"
                  >
                    Regen {c.name}
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 text-center">
              <Link href="/weer" className="text-sm text-accent-orange hover:underline">
                → Alle Nederlandse steden
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
