import { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";
import { PROVINCE_LABELS, type Province, placesByProvince, placeSlug } from "@/lib/places-data";
import { notFound } from "next/navigation";
import Link from "next/link";

export async function generateStaticParams() {
  return Object.keys(PROVINCE_LABELS).map((province) => ({ province }));
}

export async function generateMetadata({ params }: { params: Promise<{ province: Province }> }): Promise<Metadata> {
  const { province } = await params;
  const label = PROVINCE_LABELS[province];
  if (!label) return {};

  return {
    title: `Weer ${label} | Actuele weersverwachting per stad`,
    description: `Het actuele weer in de provincie ${label}. Bekijk de weersverwachting voor alle steden en dorpen in ${label} direct van het KNMI.`,
    alternates: {
      canonical: `https://weerzone.nl/weer/${province}`,
    },
  };
}

export default async function ProvincePage({ params }: { params: Promise<{ province: Province }> }) {
  const { province } = await params;
  const label = PROVINCE_LABELS[province];
  if (!label) notFound();

  const places = placesByProvince()[province] || [];

  // Gebruik de eerste stad uit de lijst als referentie voor de provincie
  const refCity = places[0] || DUTCH_CITIES.find(c => c.name === "De Bilt")!;
  const weather = await fetchWeatherData(refCity.lat, refCity.lon);

  if (!weather) {
    return <div>Data tijdelijk niet beschikbaar...</div>;
  }

  // Piet's Regionale Uitbrander (Provincie Roast 1.0)
  const regionalOpinion = (() => {
    const temp = Math.round(weather.current.temperature);
    const rain = weather.current.precipitation;
    const wind = Math.round(weather.current.windSpeed);
    
    if (province === "limburg") return `Limburg: ${temp}°C. Vlaai eten in de zon? In je dromen. ${wind} km/u wind op de heuvels. Zoek een grot op of trek een dikke trui aan.`;
    if (province === "groningen") return `Groningen: ${temp}°C. Het waait weer een baksteen uit de muur (${wind} km/u). Blijf niet lullen maar zoek de luwte op.`;
    if (province === "zeeland") return `Zeeland: ${temp}°C. Altijd die wind hè? ${wind} km/u. Als je niet wilt wegwaaien bij de Neeltje Jans, blijf je nu binnen.`;
    if (province === "friesland") return `Friesland: ${temp}°C. Prachtig dat water, maar met ${rain}mm regen zijn zelfs de Friezen niet blij vandaag.`;
    if (province === "noord-brabant") return `Brabant: ${temp}°C. Gezelligheid kent geen tijd, maar met dit weer is de kroeg de enige optie.`;
    return `${label}: ${temp}°C. Piet's oordeel? ${wind > 30 ? "Stormachtig kut." : "Matig, niks om over naar huis te schrijven."} WeerZone expertise: bereid je voor op ${temp < 10 ? "kou" : "gedoe"}.`;
  })();

  return (
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
                <div className="mt-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent-orange animate-pulse" />
                  <span className="text-[10px] font-bold text-accent-orange uppercase tracking-widest">Live vanuit de redactie</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter">
              Steden in {label}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {places.sort((a, b) => a.name.localeCompare(b.name)).map((place) => (
              <Link
                key={place.name}
                href={`/weer/${province}/${placeSlug(place.name)}`}
                className="card p-4 hover:scale-[1.02] transition-transform active:scale-[0.98]"
              >
                <span className="text-sm font-bold text-text-primary line-clamp-1">
                  {place.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      }
    />
  );
}
