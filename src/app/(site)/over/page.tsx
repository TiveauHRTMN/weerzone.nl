import type { Metadata } from "next";
import Link from "next/link";
import WeatherDashboard from "@/components/WeatherDashboard";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";
import { getSavedLocationServer } from "@/lib/location-cookies";

export const metadata: Metadata = {
  title: "Over ons",
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
      "WEERZONE maakt weer bruikbaar: hyperlokaal, reclamevrij en gericht op beslissingen voor vandaag en morgen.",
    type: "website",
    locale: "nl_NL",
    url: "https://weerzone.nl/over",
    siteName: "WEERZONE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Over WEERZONE",
    description:
      "Waarom WEERZONE focust op 48 uur vooruit en hyperlokaal weeradvies.",
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

export default async function OverPage() {
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc = loc || DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0];
  const initialWeather = await fetchWeatherData(activeLoc.lat, activeLoc.lon).catch(() => undefined);
  const faqItems = [
    {
      q: "Waarom kijkt WEERZONE maar 48 uur vooruit?",
      a: "Weersverwachtingen worden exponentieel onnauwkeuriger naarmate de tijd vordert. De atmosfeer is een chaotisch systeem: kleine afwijkingen in de begintoestand leiden na 48 à 72 uur tot grote onzekerheden. WEERZONE focust bewust op de komende 48 uur omdat dit de periode is waarin modellen als HARMONIE, ICON-D2 en AROME nog uur-voor-uur betrouwbare uitkomsten geven. Verder vooruit geeft hoogstens een grove tendens — nuttig voor planning, maar niet voor concrete keuzes als 'ga ik fietsen' of 'plan ik buiten werk in'. Wij kiezen voor bruikbaarheid boven indruk.",
    },
    {
      q: "Wat maakt WEERZONE anders dan Buienradar of Weerplaza?",
      a: "WEERZONE combineert drie weermodellen tegelijk — HARMONIE (KNMI), ICON-D2 (DWD) en AROME — en vertaalt die ruwe modeldata naar één helder antwoord per locatie. Buienradar en Weerplaza tonen de data, WEERZONE interpreteert hem. Bovendien is WEERZONE reclamevrij en werkt het op 1×1 kilometer resolutie, waardoor een gehucht andere data kan krijgen dan de dichtstbijzijnde stad. De nadruk ligt op de vraag die iedereen eigenlijk stelt: wat betekent dit voor mij vandaag en morgen?",
    },
    {
      q: "Hoe werkt de locatiebepaling?",
      a: "WEERZONE vraagt je eenmalig om een plaatsnaam of postcode. Die locatie wordt opgeslagen in een cookie zodat je bij elk volgend bezoek direct de juiste weersverwachting ziet zonder opnieuw te zoeken. Je kunt de locatie altijd aanpassen via de locatieknop bovenin de pagina. De database bevat meer dan 14.000 plaatsen in Nederland en Vlaanderen — van grote steden tot kleine gehuchten en buurtschappen — zodat zelfs de meest afgelegen locatie eigen, hyperlokale data krijgt.",
    },
    {
      q: "Is WEERZONE gratis?",
      a: "WEERZONE is tijdelijk gratis te proberen tijdens de bètaperiode. Na de bèta worden de basisfuncties (weersverwachting per locatie) gratis gehouden. Uitgebreide functies zoals persoonlijke weerberichten van Piet, extreme-weerwaarschuwingen van Reed en zakelijke integraties via Steve vallen onder een betaald abonnement. De exacte tarieven en wat je per plan krijgt staan op de prijzenpagina. Er zijn geen verborgen kosten — je ziet altijd vooraf wat je betaalt.",
    },
    {
      q: "Kan ik meerdere locaties opslaan?",
      a: "Op dit moment volgt WEERZONE één actieve locatie tegelijk. Je kunt die locatie op elk moment wisselen via de locatieknop. De mogelijkheid om meerdere locaties op te slaan en snel te schakelen — handig als je op twee adressen woont of regelmatig ergens anders werkt — staat gepland voor een latere versie. Gebruikers van het betaalde plan krijgen dit als eerste. Als je je wilt aanmelden voor updates over nieuwe functies, kun je je registreren via de aanmeldpagina.",
    },
    {
      q: "Hoe kan ik contact opnemen?",
      a: "Je kunt WEERZONE bereiken via info@weerzone.nl of via het contactformulier op de contactpagina. Op werkdagen antwoorden we doorgaans binnen 24 uur. Voor technische vragen over de app, ontbrekende locaties of dataproblemen is e-mail de snelste weg. Voor zakelijke vragen — partnerships, API-integraties of B2B-abonnementen — kun je direct mailen met als onderwerp 'Zakelijk' zodat je bericht bij de juiste persoon terechtkomt.",
    },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "Over WEERZONE",
      description:
        "WEERZONE richt zich op hyperlokale weersverwachtingen voor de komende 48 uur.",
      url: "https://weerzone.nl/over",
      inLanguage: "nl-NL",
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", ".wz-about-intro", ".wz-about-philosophy"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ];

  return (
    <main>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <WeatherDashboard
        hideWeatherInfo
        initialCity={activeLoc}
        initialWeather={initialWeather}
        beforeFooter={
          <div className="space-y-6">
            <div className="card p-6 sm:p-8">
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

            <div className="card p-6">
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

            <div className="card p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                Onze filosofie
              </p>
              <p className="text-slate-900 font-black text-lg mb-2">
                Eerlijke data, zonder poespas.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                WEERZONE gebruikt de meest nauwkeurige bronnen om temperatuur, regen, wind en risico&apos;s zo
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
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: persona.color }}>
                      {persona.name} · {persona.role}
                    </p>
                    <p className="text-text-secondary text-sm leading-relaxed">{persona.desc}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div id="faq">
              <h2 className="text-2xl font-black text-white text-center mb-1">Veelgestelde vragen</h2>
              <p className="text-white/50 text-center mb-6 text-xs font-bold uppercase tracking-widest">
                Alles wat je wil weten over WEERZONE
              </p>
              <div className="space-y-2">
                {[
                  ["Waarom maar 48 uur vooruit?", "Omdat die periode het meest bruikbaar is voor concrete keuzes per uur. Verder vooruit geeft richting, maar voorspellingen worden snel onbetrouwbaar — wij houden ons aan wat de data accuraat kan zeggen."],
                  ["Wat maakt WEERZONE anders dan Buienradar of Weerplaza?", "WEERZONE is reclamevrij en afgestemd op jouw situatie: postcode en de voorkeuren die je hebt doorgegeven. Geen eindeloze grafieken, maar één duidelijk antwoord op wat het weer vandaag en morgen voor jou betekent."],
                  ["Hoe werkt de locatiebepaling?", "WEERZONE vraagt je eenmalig om een postcode of plaatsnaam. Je kunt dit altijd aanpassen via de locatieknop bovenin de pagina."],
                  ["Is WEERZONE gratis?", "Tijdelijk gratis te proberen. Bekijk de abonnementspagina voor de tarieven na de bètaperiode."],
                  ["Kan ik meerdere locaties opslaan?", "Op dit moment volgt WEERZONE één locatie tegelijk. Meerdere locaties is gepland voor een latere versie."],
                  ["Hoe kan ik contact opnemen?", "Via info@weerzone.nl of via het contactformulier op de contactpagina. We antwoorden op werkdagen meestal binnen 24 uur."],
                ].map(([q, a]) => (
                  <details key={q} className="card group" style={{ padding: 0 }}>
                    <summary
                      className="flex justify-between items-center gap-3 cursor-pointer select-none list-none px-5 py-4"
                      style={{ WebkitUserSelect: "none" }}
                    >
                      <span className="font-black text-text-primary text-sm">{q}</span>
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-black text-text-muted shrink-0 transition-transform group-open:rotate-45" style={{ background: "rgba(0,0,0,0.06)" }}>+</span>
                    </summary>
                    <div className="text-sm text-text-muted leading-relaxed px-5 pb-4">{a}</div>
                  </details>
                ))}
              </div>
            </div>

            <div className="card p-6 text-center">
              <p className="text-slate-900 font-black text-lg mb-2">Meer weten of beginnen?</p>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">
                Bekijk het actuele weer, lees meer over de abonnementen of stuur direct een bericht naar info@weerzone.nl.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/"
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
