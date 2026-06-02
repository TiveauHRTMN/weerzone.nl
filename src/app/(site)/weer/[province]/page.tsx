import { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";
import {
  NL_PROVINCE_SLUGS,
  PROVINCE_LABELS,
  isNLProvince,
  nlPlacesByProvince,
  placeSlug,
  type NLProvince,
} from "@/lib/places-data";
import { notFound } from "next/navigation";
import Link from "next/link";
import { hreflangSelf } from "@/lib/hreflang";

export const revalidate = 43200;
export const dynamicParams = false;

export async function generateStaticParams() {
  return NL_PROVINCE_SLUGS.map((province) => ({ province }));
}

export async function generateMetadata({ params }: { params: Promise<{ province: string }> }): Promise<Metadata> {
  const { province } = await params;
  if (!isNLProvince(province)) return {};
  const label = PROVINCE_LABELS[province];

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

export default async function ProvincePage({ params }: { params: Promise<{ province: string }> }) {
  const { province } = await params;
  if (!isNLProvince(province)) notFound();
  const label = PROVINCE_LABELS[province];

  // Deduplicatie op basis van slug om dubbele links te voorkomen
  const seenSlugs = new Set<string>();
  const rawPlaces = nlPlacesByProvince()[province as NLProvince] || [];
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
