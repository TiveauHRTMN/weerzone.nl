import type { Metadata } from "next";
import Link from "next/link";
import { DUTCH_CITIES } from "@/lib/types";

export const metadata: Metadata = {
  title: "48 uur weer — waarom langer voorspellen onzin is | WEERZONE",
  description:
    "Waarom WEERZONE maximaal 48 uur vooruit voorspelt en geen 14-daagse toont. De wetenschap achter weersvoorspelling, chaostheorie, en waarom twee dagen vooruit de harde grens is.",
  keywords: [
    "48 uur weer",
    "48 uur weerbericht",
    "waarom geen 14 daagse",
    "hoe nauwkeurig is weerbericht",
    "weermodel harmonie",
    "dwd icon",
    "chaostheorie weer",
    "weer 2 dagen vooruit",
    "betrouwbaar weerbericht",
  ],
  alternates: { canonical: "https://weerzone.nl/weer/48-uur" },
  openGraph: {
    title: "48 uur weer — de enige eerlijke horizon | WEERZONE",
    description: "Waarom wij geen 14-daagse tonen. Dit is de wetenschap achter de 48-uurs horizon.",
    url: "https://weerzone.nl/weer/48-uur",
    type: "website",
    locale: "nl_NL",
    siteName: "WEERZONE",
  },
};

export default function FortyEightPage() {
  const topCities = DUTCH_CITIES.slice(0, 12);

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Waarom toont WEERZONE maximaal 48 uur?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Voorbij 48 uur daalt de nauwkeurigheid van elk hoge-resolutie weermodel drastisch. De atmosfeer is chaotisch — kleine meetfouten groeien exponentieel. Wij tonen liever 48 uur messcherp dan 14 dagen onzin.",
        },
      },
      {
        "@type": "Question",
        name: "Hoe nauwkeurig is een 48-uurs voorspelling?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Voor temperatuur en wind: 85-95% accuraat. Voor neerslag-timing: 70-85%. Voor onweer-locatie: lastiger (onweer is inherent lokaal). De combinatie HARMONIE + ICON verhoogt de betrouwbaarheid verder.",
        },
      },
      {
        "@type": "Question",
        name: "Wat is het verschil met een 14-daagse voorspelling?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Een 14-daagse is geen voorspelling — het is een gemiddelde van klimaatdata met een snufje actuele trend. Het is informatie, geen verwachting. Wij noemen dat eerlijk wat het is: ruis.",
        },
      },
      {
        "@type": "Question",
        name: "Welke modellen gebruikt WEERZONE?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "KNMI HARMONIE (Nederlands, 2.5 km resolutie) en DWD ICON (Duits, 6.5 km). Beide zijn hoge-resolutie regiomodellen, optimaal voor Noordwest-Europa. We tonen de consensus én de afwijking.",
        },
      },
    ],
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "WEERZONE", item: "https://weerzone.nl" },
      { "@type": "ListItem", position: 2, name: "Weer", item: "https://weerzone.nl/weer" },
      { "@type": "ListItem", position: 3, name: "48 uur", item: "https://weerzone.nl/weer/48-uur" },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <nav className="text-xs text-white/50 mb-6">
            <Link href="/" className="hover:text-white">WEERZONE</Link>
            <span className="mx-2">/</span>
            <Link href="/weer" className="hover:text-white">Weer</Link>
            <span className="mx-2">/</span>
            <span className="text-white/80">48 uur</span>
          </nav>

          <header className="mb-10">
            <div className="text-5xl mb-4">⏱️</div>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
              48 uur weer — de enige eerlijke horizon.
            </h1>
            <p className="text-white/70 text-lg leading-relaxed">
              Elke weer-app belooft je 14 dagen vooruit. Dat is <strong className="text-white">niet
              mogelijk</strong>. Wij tonen 48 uur, en we leggen uit waarom dat alles is wat je nodig
              hebt — en alles wat wetenschappelijk te rechtvaardigen is.
            </p>
          </header>

          <section className="mb-10 space-y-4 text-white/75 leading-relaxed">
            <h2 className="text-2xl font-bold text-white">De wetenschap (kort)</h2>
            <p>
              In 1961 ontdekte Edward Lorenz per ongeluk het vlindereffect: piepkleine verschillen in
              beginwaarden groeien binnen dagen uit tot totaal andere uitkomsten. De atmosfeer is
              daar hét voorbeeld van. Weermodellen werken met metingen — en metingen hebben altijd
              een foutmarge. Na ongeveer 2 dagen is die foutmarge zó groot geworden dat het model
              niet meer de werkelijkheid voorspelt, maar een plausibel scenario.
            </p>
            <h2 className="text-2xl font-bold text-white">Waarom dan wel een 14-daagse?</h2>
            <p>
              Die 14-daagse in je weer-app is meestal het GFS-model (Amerikaans, lage resolutie) of een
              ensemble-gemiddelde. Handig voor een indruk — &ldquo;het wordt ergens volgende week warmer&rdquo;
              — maar <em>niet</em> geschikt om een barbecue op in te plannen. Sterker: de exacte
              cijfers die je ziet (17°, 40% kans op regen) zijn een illusie van precisie.
            </p>
            <h2 className="text-2xl font-bold text-white">Wat krijg je wél bij 48 uur?</h2>
            <p>
              Per uur: temperatuur, gevoelstemperatuur, neerslag (mm), windsnelheid + richting,
              windstoten, UV-index, en CAPE (onweersenergie). Plus de consensus tussen HARMONIE en
              ICON per uur. Zo weet je niet alleen wát er verwacht wordt, maar ook <em>hoe zeker</em>
              de modellen daarvan zijn.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Bekijk 48-uurs weer per stad</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {topCities.map((c) => {
                const slug = c.name.toLowerCase().replace(/\s+/g, "-");
                return (
                  <Link
                    key={c.name}
                    href={`/weer/${slug}`}
                    className="block px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-accent-orange/60 text-sm font-semibold transition-all"
                  >
                    48u {c.name}
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
