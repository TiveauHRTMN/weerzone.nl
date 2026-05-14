import { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";
import { notFound } from "next/navigation";
import { schemaWebPage, schemaBreadcrumb, schemaLd } from "@/lib/schema";
import Link from "next/link";

interface Theme {
  slug: string;
  title: string;
  description: string;
  metaDescription: string;
  intro: string;
  thresholds: { label: string; value: string; good: boolean }[];
  tips: string[];
  relatedPlaces: { name: string; province: string; slug: string }[];
}

const THEMES: Record<string, Theme> = {
  "bbq-weer": {
    slug: "bbq-weer",
    title: "BBQ Weer | Kunnen we vanavond barbecueën?",
    description: "De WeerZone BBQ-index: Wind, temperatuur en neerslag perfect geanalyseerd voor de ultieme grill-avond.",
    metaDescription: "Ontdek of het vandaag BBQ weer is in jouw regio. Wij checken de windkracht, neerslagkans en temperatuur van het KNMI Harmonie model.",
    intro: "Barbecueën vereist meer dan alleen geen regen. WeerZone analyseert drie factoren tegelijk: windkracht (boven 4 Bft waait je kolen uit), neerslagkans per uur (zelfs 10% kans om 19:00 is genoeg om je avond te verpesten) en de gevoelstemperatuur na zonsondergang. Het KNMI Harmonie model werkt op 1×1 kilometer — de tuin van je buurman kan ander weer hebben dan jij denkt.",
    thresholds: [
      { label: "Temperatuur", value: "≥18°C gevoelstemperatuur om 19:00", good: true },
      { label: "Neerslag", value: "<5% kans per uur tijdens avonduren", good: true },
      { label: "Wind", value: "<4 Bft (≈29 km/u)", good: true },
      { label: "Bewolking", value: "Minder dan 75% — anders koelt het snel af na zonsondergang", good: true },
    ],
    tips: [
      "Check de urenforecast voor 18:00–22:00, niet het daggemiddelde.",
      "Oostenwind = droog en warm. Westenwind = koud en onzeker, ook al is het overdag prima.",
      "Bewolking houdt warmte vast 's avonds — een bewolkte avond kan comfortabeler zijn dan een heldere.",
      "Controleer of er onweer op 100+ km afstand is. Buien verplaatsen zich snel in de zomer.",
    ],
    relatedPlaces: [
      { name: "Amsterdam", province: "noord-holland", slug: "amsterdam" },
      { name: "Rotterdam", province: "zuid-holland", slug: "rotterdam" },
      { name: "Eindhoven", province: "noord-brabant", slug: "eindhoven" },
      { name: "Utrecht", province: "utrecht", slug: "utrecht" },
      { name: "Arnhem", province: "gelderland", slug: "arnhem" },
      { name: "Breda", province: "noord-brabant", slug: "breda" },
    ],
  },
  "strandweer": {
    slug: "strandweer",
    title: "Strandweer Nederland | UV-index & Kustwind",
    description: "UV-index en wind aan de kust. Alles wat je moet weten voordat je naar Zandvoort of Scheveningen gaat.",
    metaDescription: "Actueel strandweer voor Nederland. UV-straling, watertemperatuur en windkracht aan de kust direct van het KNMI.",
    intro: "Goed strandweer is niet alleen zonnig — het is de combinatie van UV-index, windrichting en watertemperatuur. Een zuidwestenwind van 5 Bft maakt een dag van 24°C ongezellig. De Noordzeekust kent een eigen microklimaat: het kan in Zandvoort 6°C kouder voelen dan in Amsterdam, 25 kilometer verderop. WeerZone toont de kustspecifieke data, inclusief UV-straling voor SPF-advies en zeewatertemperatuur (gemiddeld 17–20°C in augustus).",
    thresholds: [
      { label: "Temperatuur", value: "≥21°C op het strand (gevoelstemperatuur kan lager zijn door wind)", good: true },
      { label: "Wind", value: "≤3 Bft (≈19 km/u) voor comfortabel strandzit-weer", good: true },
      { label: "UV-index", value: "3–6: geniet, bescherm je. 7+: SPF50, schaduw na 12:00", good: true },
      { label: "Zeewater", value: "≥16°C voor zwemmen. Onder 13°C: alleen voor echte Hollanders", good: true },
    ],
    tips: [
      "Noordwestenwind = koud zeewater plus opwaaiend zand. Kies een dag met zuidoostelijke wind voor de warmste kustervaring.",
      "UV-index piekt tussen 12:00 en 15:00 — ook op bewolkte dagen kan de index 4+ zijn.",
      "De watertemperatuur loopt 6–8 weken achter op de luchttemperatuur: juli voelt kouder in zee dan augustus.",
      "Check het hoogtij op de dag — bij vloed is het strand smaller en kunnen bruggen spuiten.",
    ],
    relatedPlaces: [
      { name: "Zandvoort", province: "noord-holland", slug: "zandvoort" },
      { name: "Scheveningen", province: "zuid-holland", slug: "scheveningen" },
      { name: "Vlissingen", province: "zeeland", slug: "vlissingen" },
      { name: "Katwijk", province: "zuid-holland", slug: "katwijk" },
      { name: "Bergen aan Zee", province: "noord-holland", slug: "bergen-aan-zee" },
      { name: "Domburg", province: "zeeland", slug: "domburg" },
    ],
  },
  "hardloopweer": {
    slug: "hardloopweer",
    title: "Hardloopweer | Ideale Loopcondities per Uur",
    description: "Niet te warm, niet te koud. Wij checken de luchtvochtigheid en wind voor jouw perfecte run.",
    metaDescription: "Is het goed hardloopweer vandaag? Check de hardloop-index op WeerZone: wind, vochtigheid en temperatuur.",
    intro: "Het ideale hardloopweer bestaat: 8–13°C, relatieve luchtvochtigheid onder 60%, weinig wind en geen neerslag. Bij hogere temperaturen stijgt je hartslag bij dezelfde inspanning doordat je lichaam warmte moet afvoeren. WeerZone berekent de 'voelbare belasting' per uur op basis van het KNMI Harmonie model — zodat je weet of je vroeg moet gaan, of beter 's avonds kunt lopen.",
    thresholds: [
      { label: "Temperatuur", value: "8–13°C optimaal. Boven 20°C: tempo verlagen of 's morgens lopen", good: true },
      { label: "Luchtvochtigheid", value: "<60% ideaal. Boven 80% zweet je lichaam minder effectief af", good: true },
      { label: "Wind", value: "Rugwind of windstil. Tegenwind van >20 km/u kost tot 8% extra energie", good: true },
      { label: "Neerslag", value: "Droog of lichte motregen — natte wegen verhogen blessurerisico bij intervallen", good: true },
    ],
    tips: [
      "Loop bij warmte maximaal 60–70% van je normale tempo — je hart werkt al harder om koeling te regelen.",
      "Regen van voren afkomstig (tegenwind) koelt je sneller af dan rugwind. Bij koud weer: regen met rugwind = snel onderkoeld.",
      "De gouden uren voor hardlopers: 06:00–09:00 of 19:00–21:00 in de zomer. Check de urenforecast.",
      "Na regen zijn asfaltpaden goed, maar modder- en grindpaden stukken riskanter. Filter op 'droog' als je blessure-gevoelig bent.",
    ],
    relatedPlaces: [
      { name: "Amsterdam", province: "noord-holland", slug: "amsterdam" },
      { name: "Utrecht", province: "utrecht", slug: "utrecht" },
      { name: "Den Haag", province: "zuid-holland", slug: "den-haag" },
      { name: "Nijmegen", province: "gelderland", slug: "nijmegen" },
      { name: "Groningen", province: "groningen", slug: "groningen" },
      { name: "Eindhoven", province: "noord-brabant", slug: "eindhoven" },
    ],
  },
  "hooikoorts": {
    slug: "hooikoorts",
    title: "Hooikoorts Radar | Pollenbelasting & Weersadvies",
    description: "Droge wind uit het oosten? Wij vertellen je precies wanneer je binnen moet blijven om die rode ogen te voorkomen.",
    metaDescription: "Actuele hooikoorts verwachting en pollenradar. WeerZone kijkt naar droogte en windrichting voor het beste advies.",
    intro: "Pollenconcentratie is direct afhankelijk van het weer. Graspollen pieken tussen april en augustus; berken gaan al los in maart. De twee gevaarlijkste weertypen voor hooikoortspatiënten: droge oostenwind (pollen uit Duitsland meegevoerd) en zonnige dagen met weinig wind na een regenachtige ochtend — dan spat de pollen als een wolk omhoog. WeerZone combineert windrichting, luchtvochtigheid en neerslaginformatie voor een eerlijk pollenrisico-oordeel.",
    thresholds: [
      { label: "Windrichting", value: "Oost of Zuidoost = hoog risico (droog continent-pollen). West = lager", good: false },
      { label: "Luchtvochtigheid", value: ">70%: pollen klitten samen, minder in de lucht. <40%: maximale verspreiding", good: false },
      { label: "Neerslag", value: "Regen wast pollen neer — ná een bui is de lucht 2–4 uur schoner", good: true },
      { label: "Temperatuur", value: "Boven 15°C + zon = actieve pollenproductie bij grassen en bomen", good: false },
    ],
    tips: [
      "Ventileer pas 's avonds laat na 22:00 — pollenconcentraties zijn dan het laagst.",
      "Na een regenbui is de lucht voor 2–4 uur aanzienlijk schoner. Gebruik die window.",
      "Oost- of zuidoostwind = pollen waait over vanuit Duitsland en België. Check de windrichting, niet alleen de windkracht.",
      "Bewaar je antihistamine 's morgens: pollen pieken tussen 08:00 en 12:00 op warme, droge dagen.",
    ],
    relatedPlaces: [
      { name: "Amsterdam", province: "noord-holland", slug: "amsterdam" },
      { name: "Arnhem", province: "gelderland", slug: "arnhem" },
      { name: "Nijmegen", province: "gelderland", slug: "nijmegen" },
      { name: "Breda", province: "noord-brabant", slug: "breda" },
      { name: "Tilburg", province: "noord-brabant", slug: "tilburg" },
      { name: "Den Haag", province: "zuid-holland", slug: "den-haag" },
    ],
  },
  "wintersport-nl": {
    slug: "wintersport-nl",
    title: "Wintersport Nederland | Schaatsweer & Kans op Ijs",
    description: "Komt de vorst eraan? Wij monitoren de watertemperatuur en sneeuwkansen voor de Nederlandse wintersporter.",
    metaDescription: "Check de kans op natuurijs en sneeuw in Nederland. WeerZone kijkt dieper in de kaarten dan de rest.",
    intro: "Natuurijs in Nederland vereist minimaal vijf opeenvolgende nachten met vorst, waarbij het daggemiddelde niet boven 0°C komt. In het Elfstedengebied (Friesland) zijn de normen strenger: het ijs moet minimaal 15 cm dik zijn op alle trajecten. WeerZone monitort de nachttemperaturen op postcodeniveau en berekent de cumulatieve vorstsom — de meest betrouwbare indicator voor schaatsrijpheid.",
    thresholds: [
      { label: "Nachtvorst", value: "Minimaal 5 opeenvolgende nachten ≤-5°C voor bruikbaar ijs", good: true },
      { label: "Dagtemperatuur", value: "Moet onder 0°C blijven — dooi overdag breekt het ijsvormingsproces", good: true },
      { label: "Sneeuwkans", value: "Sneeuw op bevroren water = isolatie = vertraagde ijsgroei. Niet altijd gunstig", good: false },
      { label: "Wind", value: "Wind versnelt afkoeling maar ruwe ijsvorming — kalm weer geeft gladder ijs", good: true },
    ],
    tips: [
      "De vorstsom (Celsius-dagen onder 0 opgeteld) moet boven de 15 komen voor verantwoord rijden op binnenwater.",
      "Stilstaand water (sloten, kanalen) bevriest sneller dan stromend water (rivieren, meren met stroming).",
      "Het IJsselmeer bevriest zelden volledig — de omliggende polders zijn eerder betrouwbaar.",
      "Check de minimumtemperatuur, niet het daggemiddelde. Eén warme dag van +4°C kan een week vorst tenietdoen.",
    ],
    relatedPlaces: [
      { name: "Leeuwarden", province: "friesland", slug: "leeuwarden" },
      { name: "Heerenveen", province: "friesland", slug: "heerenveen" },
      { name: "Assen", province: "drenthe", slug: "assen" },
      { name: "Zwolle", province: "overijssel", slug: "zwolle" },
      { name: "Groningen", province: "groningen", slug: "groningen" },
      { name: "Lelystad", province: "flevoland", slug: "lelystad" },
    ],
  },
};

export async function generateStaticParams() {
  return Object.keys(THEMES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const theme = THEMES[slug];
  if (!theme) return {};

  return {
    title: theme.title,
    description: theme.metaDescription,
    alternates: {
      canonical: `https://weerzone.nl/weer/themas/${theme.slug}`,
    },
  };
}

export default async function ThemePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const theme = THEMES[slug];
  if (!theme) notFound();

  // Gebruik De Bilt als landelijke referentie voor de themapagina
  const deBilt = DUTCH_CITIES.find(c => c.name === "De Bilt")!;
  const weather = await fetchWeatherData(deBilt.lat, deBilt.lon);

  if (!weather) {
    return <div>Data tijdelijk niet beschikbaar...</div>;
  }

  return (
    <>
      <script {...schemaLd([
        schemaWebPage({
          name: theme.title.split("|")[0].trim(),
          url: `https://weerzone.nl/weer/themas/${slug}`,
          description: theme.metaDescription,
          dateModified: "2025-05-01T00:00:00.000Z",
        }),
        schemaBreadcrumb([
          { name: "WEERZONE", item: "https://weerzone.nl" },
          { name: "Weer", item: "https://weerzone.nl/weer" },
          { name: theme.title.split("|")[0].trim(), item: `https://weerzone.nl/weer/themas/${slug}` },
        ]),
      ])} />
    <WeatherDashboard
      initialCity={deBilt}
      initialWeather={weather}
      titleOverride={theme.title.split("|")[0].trim()}
      beforeFooter={
        <div className="mt-12 mb-20 px-6 max-w-3xl mx-auto space-y-8">

          {/* Intro */}
          <div className="card p-8">
            <h2 className="text-xl font-black text-text-primary uppercase tracking-tighter mb-4">
              {theme.title.split("|")[0].trim()}: wat telt er echt?
            </h2>
            <p className="text-text-secondary leading-relaxed">
              {theme.intro}
            </p>
          </div>

          {/* Drempelwaarden */}
          <div className="card p-8">
            <h2 className="text-xl font-black text-text-primary uppercase tracking-tighter mb-5">
              Wanneer is het goed {slug.replace(/-/g, " ")}?
            </h2>
            <div className="space-y-3">
              {theme.thresholds.map((t) => (
                <div key={t.label} className="flex items-start gap-3">
                  <span className={`mt-0.5 text-base ${t.good ? "text-accent-cyan" : "text-accent-orange"}`}>
                    {t.good ? "✓" : "✗"}
                  </span>
                  <div>
                    <span className="font-bold text-text-primary text-sm">{t.label}: </span>
                    <span className="text-text-secondary text-sm">{t.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="card p-8">
            <h2 className="text-xl font-black text-text-primary uppercase tracking-tighter mb-5">
              WeerZone tips
            </h2>
            <ul className="space-y-3">
              {theme.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-text-secondary leading-relaxed">
                  <span className="text-accent-cyan font-black mt-0.5 shrink-0">{i + 1}.</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Related places */}
          <div className="card p-8">
            <h2 className="text-xl font-black text-text-primary uppercase tracking-tighter mb-5">
              Check het weer in relevante plaatsen
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {theme.relatedPlaces.map((p) => (
                <Link
                  key={p.slug}
                  href={`/weer/${p.province}/${p.slug}`}
                  className="card p-4 hover:scale-[1.02] transition-transform border border-white/5 text-sm font-bold text-text-primary"
                >
                  {p.name}
                </Link>
              ))}
            </div>
          </div>

        </div>
      }
    />
    </>
  );
}
