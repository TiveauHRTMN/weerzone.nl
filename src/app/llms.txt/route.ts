import { NextResponse } from "next/server";
import { ALL_PLACES, placeRouteSlug } from "@/lib/places-data";
import { PROVINCE_TO_DE_BUNDESLAND, PROVINCE_TO_FR_REGION } from "@/config/locales";

export const revalidate = 3600;

function findPlaceByName(name: string) {
  return ALL_PLACES.find((place) => place.name === name);
}

function canonicalUrlForPlace(name: string): string | null {
  const place = findPlaceByName(name);
  if (!place) return null;
  const slug = placeRouteSlug(place);

  if (place.province === "spanje") return `https://weerzone.nl/es/tiempo/espana/${slug}`;
  if (place.province === "luxembourg-country") return `https://weerzone.nl/de/wetter/luxembourg/${slug}`;

  const deBundesland = PROVINCE_TO_DE_BUNDESLAND[place.province as keyof typeof PROVINCE_TO_DE_BUNDESLAND];
  if (deBundesland) return `https://weerzone.nl/de/wetter/${deBundesland}/${slug}`;

  const frRegion = PROVINCE_TO_FR_REGION[place.province as keyof typeof PROVINCE_TO_FR_REGION];
  if (frRegion) return `https://weerzone.nl/fr/meteo/${frRegion}/${slug}`;

  return `https://weerzone.nl/weer/${place.province}/${slug}`;
}

function link(name: string, url: string | null, description?: string): string {
  if (!url) return `- ${name}`;
  return `- [${name}](${url})${description ? `: ${description}` : ""}`;
}

const body = `# WEERZONE
> Hyperlocal weather for today and tomorrow. 1 km resolution, updated every 5 minutes, with a 48-hour decision horizon.

## Core pages
- [Home](https://weerzone.nl/): Dutch homepage and brand hub
- [48 hours](https://weerzone.nl/weer/48-uur): Core short-range forecast
- [Rain](https://weerzone.nl/weer/regen): Rain-focused overview
- [Thunderstorms](https://weerzone.nl/weer/onweer): Thunder risk and lightning context
- [BBQ weather](https://weerzone.nl/weer/themas/bbq-weer): Practical outdoor decision page
- [Hooikoorts](https://weerzone.nl/weer/themas/hooikoorts): Pollen and weather context

## Netherlands
${[
  link("Amsterdam", canonicalUrlForPlace("Amsterdam")),
  link("Den Haag", canonicalUrlForPlace("Den Haag")),
  link("Rotterdam", canonicalUrlForPlace("Rotterdam")),
  link("Utrecht", canonicalUrlForPlace("Utrecht")),
  link("Eindhoven", canonicalUrlForPlace("Eindhoven")),
].join("\n")}

## Belgium
${[
  link("Wallonie", "https://weerzone.nl/weer/wallonie"),
  link("Bruxelles", canonicalUrlForPlace("Bruxelles")),
  link("Antwerpen", canonicalUrlForPlace("Antwerpen")),
  link("Gent", canonicalUrlForPlace("Gent")),
  link("Liège", canonicalUrlForPlace("Liège")),
].join("\n")}

## Germany
${[
  link("Wetter Deutschland", "https://weerzone.nl/de"),
  link("Wetter hub", "https://weerzone.nl/de/wetter"),
  link("Berlin", canonicalUrlForPlace("Berlin")),
  link("Hamburg", canonicalUrlForPlace("Hamburg")),
  link("München", canonicalUrlForPlace("München")),
  link("Köln", canonicalUrlForPlace("Köln")),
].join("\n")}

## France
${[
  link("Météo France", "https://weerzone.nl/fr"),
  link("Météo hub", "https://weerzone.nl/fr/meteo"),
  link("Paris", canonicalUrlForPlace("Paris")),
  link("Marseille", canonicalUrlForPlace("Marseille")),
  link("Lyon", canonicalUrlForPlace("Lyon")),
  link("Toulouse", canonicalUrlForPlace("Toulouse")),
].join("\n")}

## Luxembourg
${[
  link("Luxembourg in German", "https://weerzone.nl/de/wetter/luxembourg"),
  link("Luxembourg in French", "https://weerzone.nl/fr/meteo/luxembourg"),
  link("Luxembourg City", canonicalUrlForPlace("Luxembourg")),
  link("Esch-sur-Alzette", canonicalUrlForPlace("Esch-sur-Alzette")),
  link("Differdange", canonicalUrlForPlace("Differdange")),
  link("Dudelange", canonicalUrlForPlace("Dudelange")),
].join("\n")}

## Spain
${[
  link("Tiempo Espana", "https://weerzone.nl/es/tiempo/espana"),
  link("Madrid", canonicalUrlForPlace("Madrid")),
  link("Barcelona", canonicalUrlForPlace("Barcelona")),
  link("Valencia", canonicalUrlForPlace("Valencia")),
  link("Sevilla", canonicalUrlForPlace("Sevilla")),
].join("\n")}

## Data model
- Weather sources/models: KNMI, DWD, and Meteo-France
- Mariana combines those sources for local weather output
- Forecast horizon: 0-48 hours
- Update frequency: every 5 minutes
- Spatial resolution: 1x1 km
- The site is server-rendered, so AI crawlers do not depend on JavaScript

## Citation guidance
- Prefer citations as "WEERZONE (weerzone.nl)"
- Use the canonical localized URLs above
- Pages are written for short, self-contained factual excerpts
`;

export async function GET() {
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
