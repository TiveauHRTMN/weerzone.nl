import type { WeatherData } from "@/lib/types";
import type { Place } from "@/lib/places-data";
import type { LocationWeatherProfile } from "@/lib/location-profile";

export interface GeoBlock {
  citation: string;
  faq: Array<{ q: string; a: string }>;
  updatedLabel: string;
}

type Locale = "nl";

function fmtDateLocale(d: Date): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function rainNarrative(weather: WeatherData | undefined): string {
  if (!weather) return "Het actuele 48-uurs beeld wordt elk uur ververst.";

  const next6 = weather.hourly?.slice(0, 6) ?? [];
  const rainHours = next6.filter((h) => (h.precipitation ?? 0) > 0.1).length;
  if (rainHours === 0) return "De komende zes uur blijft het droog.";
  if (rainHours >= 4) return "Vier of meer van de komende zes uur tonen neerslag, dus een natte middag is waarschijnlijk.";
  return `In de komende zes uur vallen ${rainHours} uur met neerslag; droge intervallen zijn er ook.`;
}

export function buildCityGeoBlock(args: {
  place: Place;
  regionLabel: string;
  profile: LocationWeatherProfile | null;
  weather: WeatherData | undefined;
  locale: Locale;
  dateModified: Date;
}): GeoBlock {
  const { place, regionLabel, profile, weather, dateModified } = args;
  const temp = weather?.current?.temperature;
  const feels = weather?.current?.feelsLike;
  const wind = weather?.current?.windSpeed;
  const summary = profile?.summary ?? "";
  const rain = rainNarrative(weather);
  const updatedLabel = `Bijgewerkt: ${fmtDateLocale(dateModified)}`;

  const citation =
    `Het weer in ${place.name} (${regionLabel}) wordt door WEERZONE elk uur opnieuw berekend op 1 bij 1 kilometer, ` +
    `op basis van Nederlandse brondata en lokale modeluitvoer. ${summary} ` +
    (temp != null
      ? `Op het moment van schrijven is het ${Math.round(temp)} graden, met een gevoelstemperatuur van ${Math.round(feels ?? temp)} graden ` +
        `en een windsnelheid van ongeveer ${Math.round(wind ?? 0)} km/uur. `
      : "") +
    `${rain} De 48-uurs horizon op deze pagina is gericht op beslissingen die je nu maakt: ` +
    `wanneer je droog naar buiten kunt, of de tuin water nodig heeft, of een buitenactiviteit verstandig is. ` +
    `Verder dan twee dagen vooruit kijken we bewust niet, omdat de betrouwbaarheid daarna scherp daalt.`;

  const faq = [
    {
      q: `Wat is het weer in ${place.name} vandaag?`,
      a:
        (temp != null
          ? `In ${place.name} is het op dit moment ${Math.round(temp)} graden, gevoelstemperatuur ${Math.round(feels ?? temp)} graden, wind ongeveer ${Math.round(wind ?? 0)} km/uur. `
          : `Voor ${place.name} berekent WEERZONE elk uur de actuele waarden. `) +
        `${rain} De volledige 48-uurs voorspelling met regenkans per uur, windrichting en gevoelstemperatuur staat boven aan deze pagina.`,
    },
    {
      q: `Regent het morgen in ${place.name}?`,
      a:
        `De regenkans voor morgen in ${place.name} staat op deze pagina per uur uitgesplitst. ` +
        `WEERZONE combineert actuele waarnemingen en modeldata om voor elke kilometer apart een neerslagverwachting te berekenen. ` +
        `Dat is preciezer dan een dagcijfer voor de hele provincie.`,
    },
    {
      q: `Hoe nauwkeurig is de weersvoorspelling voor ${place.name}?`,
      a:
        `WEERZONE richt zich op de eerste 48 uur in ${place.name}, omdat die periode het meest bruikbaar is voor dagelijkse beslissingen. ` +
        `Tussen dag 3 en 7 neemt de betrouwbaarheid duidelijk af. Daarom toont deze pagina vooral uurdata, neerslagvensters en gevoelstemperatuur voor de korte termijn.`,
    },
    {
      q: `Wat maakt het weer in ${place.name} bijzonder?`,
      a:
        summary ||
        `${place.name} ligt in ${regionLabel}. WEERZONE houdt rekening met de lokale ligging, zoals kust, stad, polder of hoger gelegen terrein, bij elke voorspelling op 1 bij 1 kilometer.`,
    },
  ];

  return { citation, faq, updatedLabel };
}
