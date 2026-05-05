import { ALL_PLACES, PROVINCE_LABELS, placesByProvince, placeSlug, PLACES_COUNT } from "@/lib/places-data";
import { NextResponse } from "next/server";

export const revalidate = 3600; // 1 uur cache

const TOP_CITIES = [
  "Amsterdam", "Rotterdam", "Utrecht", "Den Haag", "Eindhoven",
  "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen",
  "Apeldoorn", "Haarlem", "Arnhem", "Amersfoort", "Zwolle",
];

export async function GET() {
  const byProvince = placesByProvince();

  const provinceLines = Object.entries(PROVINCE_LABELS)
    .map(([id, label]) => {
      const count = (byProvince[id] || []).length;
      return `- [Weer ${label}](https://weerzone.nl/weer/${id}): ${count} plaatsen in ${label}`;
    })
    .join("\n");

  const topCityLines = TOP_CITIES
    .map((name) => {
      const place = ALL_PLACES.find((p) => p.name === name);
      if (!place) return null;
      return `- [Weer ${name}](https://weerzone.nl/weer/${place.province}/${placeSlug(name)}): 48-uur weerverwachting voor ${name}`;
    })
    .filter(Boolean)
    .join("\n");

  const body = `# WEERZONE

> WEERZONE is een Nederlandse hyperlocale weerdienst die 48-uur weersverwachtingen geeft voor alle steden en provincies in Nederland. De service vertaalt meteorologische data naar praktische adviezen voor dagelijkse beslissingen — in gewone taal, zonder jargon.

## Populaire steden

${topCityLines}

## Provincies (alle ${Object.keys(PROVINCE_LABELS).length})

${provinceLines}

## Thematische weerpaginas

- [Regen Nederland](https://weerzone.nl/weer/regen): Neerslagverwachting per locatie
- [Onweer Nederland](https://weerzone.nl/weer/onweer): Onweersverwachting en bliksemrisico
- [48 uur weer](https://weerzone.nl/weer/48-uur): Uitgebreide 48-uurs voorspelling

## Diensten

- [Piet](https://weerzone.nl/piet): Persoonlijke ochtendmail met weervertaling op jouw postcode
- [Reed](https://weerzone.nl/reed): Weerwaarschuwingen wanneer het weer jouw drempelwaarde overschrijdt
- [Steve / Zakelijk](https://weerzone.nl/zakelijk): Weertranslatie voor operationele bedrijfsbeslissingen
- [Prijzen](https://weerzone.nl/prijzen): Overzicht van abonnementen en functies

## Over WEERZONE

- Taal: Nederlands (nl-NL)
- Dekking: ${PLACES_COUNT.toLocaleString("nl-NL")} plaatsen in alle 12 provincies
- Nauwkeurigheid: 92-98% voor 0-48 uur
- Update-frequentie: elk uur
- Privacy: https://weerzone.nl/privacy
- Contact: https://weerzone.nl/contact
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
