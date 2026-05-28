import { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";
import { PROVINCE_LABELS, type Province, placesByProvince, placeSlug } from "@/lib/places-data";
import { notFound } from "next/navigation";
import Link from "next/link";
import { hreflangSelf } from "@/lib/hreflang";

export async function generateStaticParams() {
  return Object.keys(PROVINCE_LABELS).map((province) => ({ province }));
}

export async function generateMetadata({ params }: { params: Promise<{ province: Province }> }): Promise<Metadata> {
  const { province } = await params;
  const label = PROVINCE_LABELS[province];
  if (!label) return {};

  return {
    title: `Weer ${label} — Actuele weersverwachting per stad`,
    description: `Bekijk het actuele weer in ${label}. Nauwkeurige 48-uurs voorspelling voor alle steden en dorpen in ${label}. Data direct van KNMI — temperatuur, neerslag en wind per uur.`,
    alternates: {
      canonical: `https://weerzone.nl/weer/${province}`,
      languages: hreflangSelf("nl", `/weer/${province}`),
    },
    openGraph: {
      title: `Weer in provincie ${label} — Live Updates`,
      description: `Actueel weerbericht voor de hele provincie ${label}. Mis geen enkele regenbui.`,
      images: [`https://weerzone.nl/api/og?province=${province}`],
    }
  };
}

export default async function ProvincePage({ params }: { params: Promise<{ province: Province }> }) {
  const { province } = await params;
  const label = PROVINCE_LABELS[province];
  if (!label) notFound();

  // Deduplicatie op basis van slug om dubbele links te voorkomen
  const seenSlugs = new Set<string>();
  const rawPlaces = placesByProvince()[province] || [];
  const places = rawPlaces
    .filter(p => {
      const slug = placeSlug(p.name);
      if (seenSlugs.has(slug)) return false;
      seenSlugs.add(slug);
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const mainCities = [...places]
    .filter(p => p.population && p.population >= 5000)
    .sort((a, b) => (b.population ?? 0) - (a.population ?? 0))
    .slice(0, 12);

  // Gebruik de eerste stad uit de lijst als referentie voor de provincie
  const refCity = mainCities[0] || places[0] || DUTCH_CITIES.find(c => c.name === "De Bilt")!;
  const weather = await fetchWeatherData(refCity.lat, refCity.lon);

  if (!weather) {
    return <div>Data tijdelijk niet beschikbaar...</div>;
  }

  // Structured Data
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "WEERZONE", "item": "https://weerzone.nl" },
        { "@type": "ListItem", "position": 2, "name": "Weer", "item": "https://weerzone.nl/weer" },
        { "@type": "ListItem", "position": 3, "name": label, "item": `https://weerzone.nl/weer/${province}` }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `Steden in ${label}`,
      "itemListElement": mainCities.map((place, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://weerzone.nl/weer/${province}/${placeSlug(place.name)}`
      }))
    },
  ];

  // Piet's Regionale Uitbrander
  const regionalOpinion = (() => {
    const temp = Math.round(weather.current.temperature);
    const rain = weather.current.precipitation;
    const wind = Math.round(weather.current.windSpeed);
    
    if (province === "limburg") return `Limburg: ${temp}°C. Vlaai eten in de zon? In je dromen. ${wind} km/u wind op de heuvels. Zoek een grot op of trek een dikke trui aan.`;
    if (province === "groningen") return `Groningen: ${temp}°C. Het waait weer een baksteen uit de muur (${wind} km/u). Blijf niet lullen maar zoek de luwte op.`;
    if (province === "zeeland") return `Zeeland: ${temp}°C. Altijd die wind hè? ${wind} km/u. Als je niet wilt wegwaaien bij de Neeltje Jans, blijf je nu binnen.`;
    if (province === "friesland") return `Friesland: ${temp}°C. Prachtig dat water, maar met ${rain}mm regen zijn zelfs de Friezen niet blij vandaag.`;
    if (province === "noord-brabant") return `Brabant: ${temp}°C. Gezelligheid kent geen tijd, maar met dit weer is de kroeg de enige optie.`;
    if (province === "drenthe") return `Drenthe: ${temp}°C. Open vlaktes, geen gebouwen om achter te schuilen. ${wind > 25 ? `${wind} km/u wind snijdt dwars door je heen.` : "Het waait mee vandaag. Profiteer."}`;
    if (province === "overijssel") return `Overijssel: ${temp}°C. Van de Sallandse Heuvelrug tot de IJssel — ${rain > 2 ? "modderige paden." : "droog genoeg voor buiten."}`;
    if (province === "flevoland") return `Flevoland: ${temp}°C. ${wind} km/u zonder enige beschutting — de polder spaart niemand.`;
    if (province === "gelderland") return `Gelderland: ${temp}°C. ${temp > 25 ? "Hitte in de dalen, drink genoeg." : "Aangenaam gevarieerd vandaag."}`;
    if (province === "utrecht") return `Utrecht: ${temp}°C. ${temp > 22 ? "Urban heat island op zijn best." : "Drukste weerknooppunt van het land."}`;
    if (province === "noord-holland") return `Noord-Holland: ${temp}°C. ${wind > 30 ? "Stevige zeewind vandaag." : "IJ en kust gedragen zich."}`;
    if (province === "zuid-holland") return `Zuid-Holland: ${temp}°C. ${rain > 2 ? "Rivierwind maakt het kouder." : "Delta-klimaat in je voordeel."}`;
    // Duitsland
    if (province === "noordrijn-westfalen") return `NRW: ${temp}°C. ${wind > 25 ? `${wind} km/u en industrie-smog — fijne combinatie.` : "Ruhrgebied trekt vandaag nog net aan de kortste stok."}`;
    if (province === "beieren") return `Beieren: ${temp}°C. ${temp > 28 ? "Biertuin-weer. Proost." : temp < 5 ? "Alpenwind bijt. Warm bierpak aan." : "Goed genoeg voor een Ausflug."}`;
    if (province === "berlijn") return `Berlijn: ${temp}°C. ${rain > 3 ? "Regen in de hoofdstad — de techno gaat gewoon door." : "Berlin, du bist so wunderbar. Vandaag tenminste."}`;
    if (province === "hamburg") return `Hamburg: ${temp}°C. ${wind > 30 ? `${wind} km/u Noordzeestorm — zelfs de Hafencity waaiert bijna weg.` : "Haven op rolletjes. Geniet van de rust."}`;
    if (province === "hessen") return `Hessen: ${temp}°C. Frankfurt financieel hart, maar het weer trekt zich daar niks van aan. ${rain > 2 ? "Paraplu verplicht op de Zeil." : "Droog genoeg voor een wandeling langs de Main."}`;
    if (province === "nedersaksen") return `Nedersaksen: ${temp}°C. ${wind > 20 ? `${wind} km/u — vlakke polder zonder schuilplek, net als thuis.` : "Rustig vandaag, wat de Fries van zijn buurman ook zou zeggen."}`;
    if (province === "saksen") return `Saksen: ${temp}°C. Leipzig of Dresden — beide hebben ${rain > 2 ? "regen als enige bezienswaardigheid vandaag." : "mooi weer. Elbe-wandeling doen."}`;
    if (province === "thuringen") return `Thüringen: ${temp}°C. ${temp < 8 ? "Thüringer Wald in mist gehuld. Bratwurst eten en binnen blijven." : "Groene heuvelrug in prima conditie vandaag."}`;
    if (province === "saarland") return `Saarland: ${temp}°C. Kleinste Bundesland, grootste weerpretentie. ${wind > 25 ? "Wind van de Vogezen. Brutaal." : "Lekker rustig vandaag."}`;
    if (province === "rijnland-palts") return `Rijnland-Palts: ${temp}°C. Moselwijn drinken bij ${rain > 2 ? "regen in de wijngaard — romantisch of deprimerend?" : "zonneschijn. Perfecte dag."}`;
    if (province === "sleeswijk-holstein") return `Sleeswijk-Holstein: ${temp}°C. ${wind > 30 ? `${wind} km/u van de Oostzee. Je waait van Kiel naar Flensburg zonder fiets.` : "Rustig aan zee vandaag."}`;
    if (province === "mecklenburg-voorpommeren") return `Mecklenburg: ${temp}°C. ${rain > 2 ? "Rügen in de regen — grijze Oostzee, grijze lucht, grijze stemming." : "Helder boven de meren. Perfecte kanodag."}`;
    if (province === "brandenburg") return `Brandenburg: ${temp}°C. Potsdam-paleis of Brandenburg-polder — het maakt het weer niet uit.`;
    if (province === "saksen-anhalt") return `Saksen-Anhalt: ${temp}°C. Halle of Magdeburg — ${wind > 20 ? "wind dwars door de Elbe-vlakte." : "windstil en merkwaardig aangenaam."}`;
    if (province === "bremen") return `Bremen: ${temp}°C. Kleinste stadstaat, ${rain > 2 ? "maar vandaag de natste ook." : "maar vandaag verrassend droog."}`;
    if (province === "baden-wurttemberg") return `Baden-Württemberg: ${temp}°C. ${temp > 30 ? "Zomer in het Zwarte Woud. Pas op voor onweer in de middag." : temp < 3 ? "Zwarte Woud onder sneeuw. Schaatsen op." : "Zwarte Woud toont zich van zijn beste kant."}`;
    return `${label}: ${temp}°C. Piet's oordeel? ${wind > 30 ? "Stormachtig kut." : "Matig."}`;
  })();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="sr-only">Weer {label} — Actuele weersverwachting per stad</h1>
      <WeatherDashboard
        initialCity={refCity} 
        initialWeather={weather} 
        titleOverride={`Weer in ${label}`}
        beforeFooter={
          <div className="mt-12 mb-20 px-6 max-w-4xl mx-auto">
            {/* PIET'S REGIONALE ROAST */}
            <div className="card p-6 bg-accent-orange/5 border-accent-orange/20 mb-10 overflow-hidden relative group">
              <div className="absolute -right-4 -top-4 text-6xl opacity-10 group-hover:rotate-12 transition-transform">🌪️</div>
              <div className="flex gap-4 items-start relative z-10">
                <div className="w-10 h-10 rounded-full bg-accent-orange flex items-center justify-center text-xl font-black text-white shrink-0 shadow-lg">
                  P
                </div>
                <div>
                  <h3 className="text-lg font-black text-text-primary uppercase tracking-tighter mb-1">Piet's Regionale Oordeel</h3>
                  <p className="text-text-secondary italic leading-relaxed">
                    "{regionalOpinion}"
                  </p>
                </div>
              </div>
            </div>

            {mainCities.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-6">Belangrijkste plaatsen</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {mainCities.map((place) => (
                    <Link
                      key={place.name}
                      href={`/weer/${province}/${placeSlug(place.name)}`}
                      className="card p-4 hover:border-accent-orange/50 transition-all border border-white/5"
                    >
                      <span className="text-sm font-bold text-text-primary line-clamp-1">
                        {place.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <details className="mb-10 group">
              <summary className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-6 cursor-pointer hover:text-accent-orange transition-colors list-none flex items-center gap-2">
                <span className="text-[10px] group-open:rotate-90 transition-transform">▶</span>
                Alle {places.length} plaatsen in {label}
              </summary>
              <div className="mt-6">
                {Object.entries(
                  places.reduce((acc, place) => {
                    const firstLetter = place.name.charAt(0).toUpperCase();
                    if (!acc[firstLetter]) acc[firstLetter] = [];
                    acc[firstLetter].push(place);
                    return acc;
                  }, {} as Record<string, typeof places>)
                ).sort(([a], [b]) => a.localeCompare(b)).map(([letter, letterPlaces]) => (
                  <div key={letter} className="mb-10">
                    <h3 className="text-xl font-black text-white/20 mb-4 border-b border-white/5 pb-2">{letter}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-1">
                      {letterPlaces.map((place) => (
                        <a
                          key={place.name}
                          href={`/weer/${province}/${placeSlug(place.name)}`}
                          className="text-sm py-1 text-white/40 hover:text-accent-orange transition-colors truncate"
                        >
                          {place.name}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        }
      />
    </>
  );
}
