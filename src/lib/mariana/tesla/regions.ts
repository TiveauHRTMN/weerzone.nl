/**
 * Mariana Tesla — Nederlandse mesoschaal-regio's (sectie 10 van de prompt).
 *
 * Tesla behandelt Nederland niet als vlak grid. Elke regio heeft een
 * representatief analysepunt (lat/lon) waar de convectieve data per model wordt
 * opgehaald, plus de mesoscale rol die Tesla zwaar moet wegen. v1 = NL-first;
 * later generaliseerbaar naar andere Weerzone-landen.
 */

export interface TeslaRegion {
  /** Stabiele id (kebab-case) — gebruikt als opslag-key. */
  slug: string;
  /** Weergavenaam zoals in de prompt. */
  name: string;
  /** Representatief analysepunt. */
  lat: number;
  lon: number;
  /** Mesoscale rol/aandachtspunten (mensleesbaar, ook als context-hint). */
  role: string;
}

export const TESLA_REGIONS: readonly TeslaRegion[] = [
  {
    slug: "noordzee-kust",
    name: "Noordzee / kust",
    lat: 52.46,
    lon: 4.3,
    role: "Marine layer, kustconvergentie, koelere onderlaag, elevated convection, zee-lucht contrast, offshore initiatie.",
  },
  {
    slug: "kop-noord-holland",
    name: "Kop van Noord-Holland / Wieringen",
    lat: 52.78,
    lon: 4.8,
    role: "Land-water overgang, windconvergentie, vroege seed-cells, Noordzee->land interactie. (Case 001 initiatiezone.)",
  },
  {
    slug: "ijsselmeer-markermeer",
    name: "IJsselmeer / Markermeer",
    lat: 52.6,
    lon: 5.25,
    role: "Open fetch, inflow-kwaliteit, boundary-interactie, regeneratie, corridor naar Flevoland/Friesland.",
  },
  {
    slug: "flevoland",
    name: "Flevoland",
    lat: 52.51,
    lon: 5.47,
    role: "Land-water overgang, rechte open fetch, doorgroei naar Veluwe/Overijssel.",
  },
  {
    slug: "veluwe",
    name: "Veluwe",
    lat: 52.2,
    lon: 5.85,
    role: "Lichte hoogte/droge bodem, thermische trigger, randconvergentie.",
  },
  {
    slug: "rivierengebied",
    name: "Rivierengebied",
    lat: 51.85,
    lon: 5.55,
    role: "Vochtige lage lagen, boundary-interactie, zuidelijke/zuidwestelijke aanvoer.",
  },
  {
    slug: "duitse-grens",
    name: "Duitse grens",
    lat: 52.0,
    lon: 6.3,
    role: "Downstream maturation, minder maritieme demping, heractivatie mogelijk.",
  },
  {
    slug: "wadden-friesland",
    name: "Wadden / Friesland",
    lat: 53.2,
    lon: 5.6,
    role: "Noordelijke track bij NW->O/NO systemen, water-boundary enhancement, shelf/line visibility.",
  },
  {
    slug: "zuidoost-nl",
    name: "Zuidoost-NL (Limburg / Oost-Brabant)",
    lat: 51.2,
    lon: 5.9,
    role: "Vroege zuidelijke theta-e aanvoer (Spaanse pluim), orografische enhancement, downstream maturation uit BE/DE, hoger severe-plafond.",
  },
  {
    slug: "zuidwest-nl",
    name: "Zuidwest-NL (Zeeland / Zuid-Holland-zuid)",
    lat: 51.5,
    lon: 3.9,
    role: "Zee-land contrast, kustconvergentie in de delta, vroege offshore-initiatie, eerste landfall-corridor bij ZW-stroming.",
  },
  {
    slug: "zuiden-noord-brabant",
    name: "Zuiden (Noord-Brabant)",
    lat: 51.5,
    lon: 5.25,
    role: "Centrale doorvoercorridor tussen zuidwest en zuidoost, thermische trigger op zandgronden, multicell-organisatie richting rivierengebied/Veluwe.",
  },
];

export function getTeslaRegion(slug: string): TeslaRegion | undefined {
  return TESLA_REGIONS.find((r) => r.slug === slug);
}
