import { NextResponse } from "next/server";
import { NL_PLACES, placeRouteSlug } from "@/lib/places-data";

export const revalidate = 43200;

function canonicalUrlForPlace(name: string): string | null {
  const place = NL_PLACES.find((candidate) => candidate.name === name);
  if (!place) return null;
  return `https://weerzone.nl/weer/${place.province}/${placeRouteSlug(place)}`;
}

function link(name: string, url: string | null, description?: string): string {
  if (!url) return `- ${name}`;
  return `- [${name}](${url})${description ? `: ${description}` : ""}`;
}

const body = `# WEERZONE
> Hyperlocal weather for the Netherlands. 1 km resolution with a 48-hour decision horizon.

## Core pages
- [Home](https://weerzone.nl/): Dutch homepage and brand hub
- [Weather in the Netherlands](https://weerzone.nl/weer): Dutch province and city index
- [48 hours](https://weerzone.nl/weer/48-uur): Core short-range forecast
- [Rain](https://weerzone.nl/weer/regen): Rain-focused overview
- [Thunderstorms](https://weerzone.nl/weer/onweer): Thunder risk and lightning context
- [Piet](https://weerzone.nl/piet): Personal Dutch weather briefing
- [Reed](https://weerzone.nl/reed): Dutch weather warnings
- [Koos](https://weerzone.nl/koos): Dutch outdoor planning
- [Steve](https://weerzone.nl/steve): Dutch business weather briefing

## Netherlands
${[
  link("Amsterdam", canonicalUrlForPlace("Amsterdam")),
  link("Den Haag", canonicalUrlForPlace("Den Haag")),
  link("Rotterdam", canonicalUrlForPlace("Rotterdam")),
  link("Utrecht", canonicalUrlForPlace("Utrecht")),
  link("Eindhoven", canonicalUrlForPlace("Eindhoven")),
  link("Groningen", canonicalUrlForPlace("Groningen")),
].join("\n")}

## Data model
- Weather sources/models: KNMI and short-range forecast model data
- Forecast horizon: 0-48 hours
- Spatial resolution: 1x1 km
- Public indexation scope: Netherlands only
- The site is server-rendered, so AI crawlers do not depend on JavaScript

## Citation guidance
- Prefer citations as "WEERZONE (weerzone.nl)"
- Use the Dutch canonical URLs above
- Pages are written for short, self-contained factual excerpts
`;

export async function GET() {
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=43200, stale-while-revalidate=86400",
    },
  });
}
