import { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import { fetchWeatherData } from "@/lib/weather";
import { placesByProvince, placeSlug } from "@/lib/places-data";
import { notFound } from "next/navigation";
import Link from "next/link";
import { schemaBreadcrumb, schemaCityDataset, schemaLd, schemaWebPage } from "@/lib/schema";
import {
  DE_BUNDESLAND_TO_PROVINCE,
  DE_BUNDESLAND_LABELS,
  DE_BUNDESLAND_SLUGS,
} from "@/config/locales";

export function generateStaticParams() {
  return DE_BUNDESLAND_SLUGS.map((bundesland) => ({ bundesland }));
}

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bundesland: string }>;
}): Promise<Metadata> {
  const { bundesland } = await params;
  const label = DE_BUNDESLAND_LABELS[bundesland];
  if (!label) return {};

  return {
    title: `Wetter ${label} — Aktuelle Wettervorhersage pro Stadt`,
    description: `Aktuelles Wetter in ${label}. Genaue 48-Stunden-Prognose für alle Städte und Gemeinden. Temperatur, Niederschlag und Wind pro Stunde.`,
    alternates: {
      canonical: `https://weerzone.nl/de/wetter/${bundesland}`,
      languages: {
        "de-DE": `https://weerzone.nl/de/wetter/${bundesland}`,
        "x-default": `https://weerzone.nl/de/wetter/${bundesland}`,
      },
    },
    openGraph: {
      title: `Wetter ${label} — WEERZONE`,
      description: `48h Wettervorhersage für alle Orte in ${label}.`,
      locale: "de_DE",
    },
  };
}

export default async function BundeslandPage({
  params,
}: {
  params: Promise<{ bundesland: string }>;
}) {
  const { bundesland } = await params;
  const province = DE_BUNDESLAND_TO_PROVINCE[bundesland];
  const label = DE_BUNDESLAND_LABELS[bundesland];
  if (!province || !label) notFound();

  const seenSlugs = new Set<string>();
  const rawPlaces = placesByProvince()[province] ?? [];
  const allPlacesDeduped = rawPlaces
    .filter((p) => {
      const s = placeSlug(p.name);
      if (seenSlugs.has(s)) return false;
      seenSlugs.add(s);
      return true;
    });

  // Beperk de zichtbare "Alle Orte"-lijst tot plaatsen met >= 1000 inwoners,
  // anders streamt Next.js voor grote Bundesländer (Bayern, NRW) duizenden
  // <a>-tags + serialized RSC payload in de initiële HTML. De kleinere
  // plaatsen blijven indexeerbaar via sitemap-de.xml.
  const places = allPlacesDeduped
    .filter((p) => (p.population ?? 0) >= 1000)
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

  const mainCities = [...allPlacesDeduped]
    .filter((p) => p.population && p.population >= 5000)
    .sort((a, b) => (b.population ?? 0) - (a.population ?? 0))
    .slice(0, 12);

  const refCity = mainCities[0] ?? places[0];
  if (!refCity) notFound();

  const weather = await fetchWeatherData(refCity.lat, refCity.lon, false, false, undefined, "de");

  const temp = weather ? Math.round(weather.current.temperature) : null;
  const rain = weather?.daily[0]?.precipitationSum ?? 0;
  const wind = weather ? Math.round(weather.current.windSpeed) : 0;
  const pageUrl = `https://weerzone.nl/de/wetter/${bundesland}`;

  const karlUrteil = !weather || temp === null ? null : (() => {
    if (bundesland === "nordrhein-westfalen")
      return `NRW: ${temp}°C. ${wind > 25 ? `${wind} km/h — Ruhrgebiet trifft Nordseesturm. Jacke einpacken.` : "Zwischen Rhein und Ruhr heute okay. Kurze Pause draußen ist drin."}`;
    if (bundesland === "bayern")
      return `Bayern: ${temp}°C. ${temp > 28 ? "Biergarten ist Pflicht — ab heute Nachmittag." : temp < 5 ? "Alpenwind schneidet. Dicke Jacke, kein Witz." : "Gut genug für einen Ausflug in die Umgebung."}`;
    if (bundesland === "berlin")
      return `Berlin: ${temp}°C. ${rain > 3 ? "Regen in der Hauptstadt — die Clubs machen weiter. Du vielleicht auch." : "Berlin, du bist so wunderbar. Zumindest heute."}`;
    if (bundesland === "hamburg")
      return `Hamburg: ${temp}°C. ${wind > 30 ? `${wind} km/h Nordseewind — Hafencity wackelt ein wenig.` : "Hafen läuft ruhig. Gute Zeit für eine Runde an der Elbe."}`;
    if (bundesland === "hessen")
      return `Hessen: ${temp}°C. Frankfurt-Finanzwelt interessiert das Wetter nicht. ${rain > 2 ? "Regenschirm am Zeil Pflicht." : "Trocken genug für einen Spaziergang am Main."}`;
    if (bundesland === "niedersachsen")
      return `Niedersachsen: ${temp}°C. ${wind > 20 ? `${wind} km/h — flaches Land, kein Schutz. Wie zu Hause.` : "Ruhig heute. Polder in Bestform."}`;
    if (bundesland === "sachsen")
      return `Sachsen: ${temp}°C. Leipzig oder Dresden — beide haben ${rain > 2 ? "Regen als einzige Attraktion heute." : "schönes Wetter. Elbe-Spaziergang rein."}`;
    if (bundesland === "thueringen")
      return `Thüringen: ${temp}°C. ${temp < 8 ? "Thüringer Wald im Nebel. Bratwurst essen und drinbleiben." : "Grüner Mittelgebirge in guter Form heute."}`;
    if (bundesland === "saarland")
      return `Saarland: ${temp}°C. Kleinstes Bundesland, größter Wetteranspruch. ${wind > 25 ? "Wind von den Vogesen. Heftig." : "Angenehm ruhig heute."}`;
    if (bundesland === "rheinland-pfalz")
      return `Rheinland-Pfalz: ${temp}°C. Moselwein bei ${rain > 2 ? "Regen im Weinberg — romantisch oder deprimierend?" : "Sonnenschein. Perfekter Tag."}`;
    if (bundesland === "schleswig-holstein")
      return `Schleswig-Holstein: ${temp}°C. ${wind > 30 ? `${wind} km/h von der Ostsee — von Kiel nach Flensburg ohne Fahrrad.` : "Ruhig an der Küste heute."}`;
    if (bundesland === "mecklenburg-vorpommern")
      return `Mecklenburg: ${temp}°C. ${rain > 2 ? "Rügen im Regen — graue Ostsee, grauer Himmel." : "Klar über den Seen. Perfekter Kanustag."}`;
    if (bundesland === "brandenburg")
      return `Brandenburg: ${temp}°C. Potsdamer Schlösser oder märkische Wälder — dem Wetter ist das egal. ${temp > 20 ? "Heute ein schöner Ausflug." : "Eher drinbleiben."}`;
    if (bundesland === "sachsen-anhalt")
      return `Sachsen-Anhalt: ${temp}°C. Halle oder Magdeburg — ${wind > 20 ? "Wind quer durch die Elbe-Ebene." : "windstill und überraschend angenehm."}`;
    if (bundesland === "bremen")
      return `Bremen: ${temp}°C. Kleinster Stadtstaat, ${rain > 2 ? "aber heute der nasseste." : "aber heute überraschend trocken."}`;
    if (bundesland === "baden-wuerttemberg")
      return `Baden-Württemberg: ${temp}°C. ${temp > 30 ? "Sommer im Schwarzwald. Vorsicht vor Gewittern." : temp < 3 ? "Schwarzwald unter Schnee. Skier raus." : "Schwarzwald zeigt sich von seiner besten Seite."}`;
    return `${label}: ${temp}°C. ${wind > 30 ? "Stürmisch." : "Mäßig."}`;
  })();

  const jsonLd = [
    schemaBreadcrumb([
      { name: "WEERZONE", item: "https://weerzone.nl" },
      { name: "Wetter", item: "https://weerzone.nl/de/wetter" },
      { name: label, item: pageUrl },
    ]),
    schemaWebPage({
      name: `Wetter ${label} - WEERZONE`,
      url: pageUrl,
      description: `Aktuelles Wetter in ${label}. Genaue 48-Stunden-Prognose fuer alle Staedte und Gemeinden.`,
      inLanguage: "de-DE",
      speakableSelectors: ["h1", "[data-speakable]", ".card"],
    }),
    schemaCityDataset({
      placeName: refCity.name,
      url: `${pageUrl}/${placeSlug(refCity.name)}`,
      inLanguage: "de-DE",
      name: `Hyperlokale Wetterdaten ${refCity.name}`,
      description: `Lokale Vorhersage fuer ${refCity.name} in ${label}, mit Temperatur, Regen, Wind und 48-Stunden-Horizont.`,
    }),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Staedte in ${label}`,
      itemListElement: mainCities.map((place, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://weerzone.nl/de/wetter/${bundesland}/${placeSlug(place.name)}`,
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="sr-only">Wetter {label} — Aktuelle Wettervorhersage pro Stadt</h1>
      <WeatherDashboard
        initialCity={refCity}
        initialWeather={weather ?? undefined}
        locale="de"
        titleOverride={`Wetter in ${label}`}
        beforeFooter={
          <div className="mt-12 mb-20 px-6 max-w-4xl mx-auto">
            {karlUrteil && (
              <div className="card p-6 bg-[#22c55e]/5 border border-[#22c55e]/20 mb-10 overflow-hidden relative group">
                <div className="absolute -right-4 -top-4 text-6xl opacity-10 group-hover:rotate-12 transition-transform">
                  🌦
                </div>
                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-10 h-10 rounded-full bg-[#22c55e] flex items-center justify-center text-xl font-black text-white shrink-0 shadow-lg">
                    K
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-text-primary uppercase tracking-tighter mb-1">
                      Karls Regionales Urteil
                    </h3>
                    <p className="text-text-secondary italic leading-relaxed" data-speakable>
                      &ldquo;{karlUrteil}&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            )}

            {mainCities.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-6">
                  Wichtigste Städte
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {mainCities.map((place) => (
                    <Link
                      key={place.name}
                      href={`/de/wetter/${bundesland}/${placeSlug(place.name)}`}
                      className="card p-4 hover:border-[#22c55e]/50 transition-all border border-white/5"
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
              <summary className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-6 cursor-pointer hover:text-[#22c55e] transition-colors list-none flex items-center gap-2">
                <span className="text-[10px] group-open:rotate-90 transition-transform">▶</span>
                Alle {places.length} Orte in {label}
              </summary>
              <div className="mt-6">
                {Object.entries(
                  places.reduce(
                    (acc, place) => {
                      const letter = place.name.charAt(0).toUpperCase();
                      if (!acc[letter]) acc[letter] = [];
                      acc[letter].push(place);
                      return acc;
                    },
                    {} as Record<string, typeof places>,
                  ),
                )
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([letter, letterPlaces]) => (
                    <div key={letter} className="mb-10">
                      <h3 className="text-xl font-black text-white/20 mb-4 border-b border-white/5 pb-2">
                        {letter}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-1">
                        {letterPlaces.map((place) => (
                          <a
                            key={place.name}
                            href={`/de/wetter/${bundesland}/${placeSlug(place.name)}`}
                            className="text-sm py-1 text-white/40 hover:text-[#22c55e] transition-colors truncate"
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
