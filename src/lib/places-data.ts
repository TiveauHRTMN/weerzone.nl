/**
 * Alle Nederlandse woonplaatsen — gegroepeerd per provincie.
 * Dit bestand wordt continu uitgebreid door OpenClaw's SEO engine.
 * 
 * Elke plaats wordt een eigen pagina op /weer/[province]/[place]
 * die rankt voor "weer [plaatsnaam]" in Google.
 * 
 * DOEL: ~7.000 plaatsen → ~7.000 indexeerbare pagina's.
 */

import allPlacesRaw from "./places.json";
import { KOOS_NL_CAMPING_PLACES } from "./koos-nl-camping-places.generated";

export interface Place {
  name: string;
  province: string;
  lat: number;
  lon: number;
  slug?: string;
  population?: number;
  geonames_id?: number;
  character?: "coastal" | "inland" | "highland" | "urban" | "mountain" | "mediterranean coastal" | "atlantic coastal" | "northern continental"; // Voor slimme AI-commentaar en affiliates
}

const KOOS_NL_PLACES: Place[] = [
  // Koos core destinations already shown or likely to be shown in /koos.
  { name: "Texel", province: "noord-holland", lat: 53.0606, lon: 4.7994, character: "coastal", population: 13600 },
  { name: "Zandvoort", province: "noord-holland", lat: 52.372, lon: 4.5302, character: "coastal", population: 17000 },
  { name: "Giethoorn", province: "overijssel", lat: 52.74, lon: 6.0833, character: "inland", population: 2800 },
  { name: "Maastricht", province: "limburg", lat: 50.8514, lon: 5.691, character: "urban", population: 122000 },
  { name: "Leiden Centraal", province: "zuid-holland", lat: 52.1662, lon: 4.481, slug: "leiden-centraal", character: "urban" },
  { name: "Den Haag Centraal", province: "zuid-holland", lat: 52.081, lon: 4.324, slug: "den-haag-centraal", character: "urban" },
  { name: "Arnhem Centraal", province: "gelderland", lat: 51.9859, lon: 5.8987, slug: "arnhem-centraal", character: "urban" },
  { name: "Middelburg", province: "zeeland", lat: 51.4988, lon: 3.6114, character: "coastal", population: 49000 },
  { name: "Groningen", province: "groningen", lat: 53.2194, lon: 6.5665, character: "urban", population: 238000 },
  { name: "Rotterdam", province: "zuid-holland", lat: 51.9244, lon: 4.4777, character: "urban", population: 670000 },

  // Waddeneilanden en Waddenplaten, inclusief Griend.
  { name: "Vlieland", province: "friesland", lat: 53.296, lon: 5.066, character: "coastal", population: 1200 },
  { name: "Terschelling", province: "friesland", lat: 53.397, lon: 5.345, character: "coastal", population: 4900 },
  { name: "Ameland", province: "friesland", lat: 53.45, lon: 5.75, character: "coastal", population: 3700 },
  { name: "Schiermonnikoog", province: "friesland", lat: 53.489, lon: 6.2, character: "coastal", population: 950 },
  { name: "Griend", province: "friesland", lat: 53.248, lon: 5.255, slug: "griend", character: "coastal" },
  { name: "Richel", province: "friesland", lat: 53.281, lon: 5.159, character: "coastal" },
  { name: "Engelsmanplaat", province: "friesland", lat: 53.451, lon: 6.055, character: "coastal" },
  { name: "Noorderhaaks", province: "noord-holland", lat: 52.994, lon: 4.71, character: "coastal" },
  { name: "Razende Bol", province: "noord-holland", lat: 52.994, lon: 4.71, character: "coastal" },
  { name: "Rottumerplaat", province: "groningen", lat: 53.536, lon: 6.55, character: "coastal" },
  { name: "Rottumeroog", province: "groningen", lat: 53.54, lon: 6.58, character: "coastal" },
  { name: "Simonszand", province: "groningen", lat: 53.493, lon: 6.368, character: "coastal" },

  // Natuur- en dagbestemmingen die Koos binnen Nederland kan aanraden.
  { name: "Nationaal Park Veluwezoom", province: "gelderland", lat: 52.03, lon: 6.02, slug: "nationaal-park-veluwezoom", character: "highland" },
  { name: "Nationaal Park De Hoge Veluwe", province: "gelderland", lat: 52.1, lon: 5.83, slug: "nationaal-park-de-hoge-veluwe", character: "highland" },
  { name: "Nationaal Park De Biesbosch", province: "noord-brabant", lat: 51.75, lon: 4.78, slug: "nationaal-park-de-biesbosch", character: "coastal" },
  { name: "Nationaal Park Drents-Friese Wold", province: "drenthe", lat: 52.92, lon: 6.25, slug: "nationaal-park-drents-friese-wold", character: "inland" },
  { name: "Loonse en Drunense Duinen", province: "noord-brabant", lat: 51.66, lon: 5.13, character: "inland" },
  { name: "Schoorlse Duinen", province: "noord-holland", lat: 52.7, lon: 4.69, character: "coastal" },
  { name: "Oostvaardersplassen", province: "flevoland", lat: 52.45, lon: 5.38, character: "coastal" },
  { name: "Nationaal Park De Alde Feanen", province: "friesland", lat: 53.13, lon: 5.93, slug: "nationaal-park-de-alde-feanen", character: "coastal" },
  { name: "Weerribben-Wieden", province: "overijssel", lat: 52.73, lon: 6.05, character: "inland" },

  // Campings en vakantieparken: weerpagina's voor buitenplanning, geen boekingsadvies.
  { name: "Camping De Lakens", province: "noord-holland", lat: 52.407, lon: 4.546, slug: "camping-de-lakens", character: "coastal" },
  { name: "Camping Bakkum", province: "noord-holland", lat: 52.555, lon: 4.637, slug: "camping-bakkum", character: "coastal" },
  { name: "Camping De Krim", province: "noord-holland", lat: 53.159, lon: 4.866, slug: "camping-de-krim", character: "coastal" },
  { name: "Camping Tempelhof", province: "noord-holland", lat: 52.847, lon: 4.708, slug: "camping-tempelhof", character: "coastal" },
  { name: "Camping Stortemelk", province: "friesland", lat: 53.298, lon: 5.078, slug: "camping-stortemelk", character: "coastal" },
  { name: "Camping It Wiid", province: "friesland", lat: 53.131, lon: 5.946, slug: "camping-it-wiid", character: "coastal" },
  { name: "Camping Lauwersoog", province: "groningen", lat: 53.407, lon: 6.205, slug: "camping-lauwersoog", character: "coastal" },
  { name: "Camping De Norgerberg", province: "drenthe", lat: 53.063, lon: 6.463, slug: "camping-de-norgerberg", character: "inland" },
  { name: "Camping Beerze Bulten", province: "overijssel", lat: 52.52, lon: 6.54, slug: "camping-beerze-bulten", character: "inland" },
  { name: "Camping De Kleine Wolf", province: "overijssel", lat: 52.55, lon: 6.44, slug: "camping-de-kleine-wolf", character: "inland" },
  { name: "Camping De Wildhoeve", province: "gelderland", lat: 52.3, lon: 5.98, slug: "camping-de-wildhoeve", character: "inland" },
  { name: "Camping De Pampel", province: "gelderland", lat: 52.12, lon: 5.86, slug: "camping-de-pampel", character: "highland" },
  { name: "Camping De Helfterkamp", province: "gelderland", lat: 52.31, lon: 5.99, slug: "camping-de-helfterkamp", character: "inland" },
  { name: "Camping Ginkelduin", province: "utrecht", lat: 52.01, lon: 5.45, slug: "camping-ginkelduin", character: "highland" },
  { name: "Camping Duinrell", province: "zuid-holland", lat: 52.146, lon: 4.389, slug: "camping-duinrell", character: "coastal" },
  { name: "Camping Janse", province: "zeeland", lat: 51.503, lon: 3.475, slug: "camping-janse", character: "coastal" },
  { name: "Camping Ons Buiten", province: "zeeland", lat: 51.567, lon: 3.555, slug: "camping-ons-buiten", character: "coastal" },
  { name: "Camping De Pekelinge", province: "zeeland", lat: 51.566, lon: 3.557, slug: "camping-de-pekelinge", character: "coastal" },
  { name: "Camping De Paal", province: "noord-brabant", lat: 51.33, lon: 5.34, slug: "camping-de-paal", character: "inland" },
  { name: "Camping De Leistert", province: "limburg", lat: 51.255, lon: 5.926, slug: "camping-de-leistert", character: "inland" },
];

function mergePlaces(base: Place[], extra: Place[]): Place[] {
  const seen = new Set<string>();
  const merged: Place[] = [];

  for (const place of [...extra, ...base]) {
    const key = `${place.province}/${placeRouteSlug(place)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(place);
  }

  return merged;
}

export const ALL_PLACES = mergePlaces(allPlacesRaw as Place[], [
  ...KOOS_NL_PLACES,
  ...KOOS_NL_CAMPING_PLACES,
]);
export const PLACES_COUNT = ALL_PLACES.length;

/**
 * Alléén echte woonplaatsen (places.json), zónder de Koos-bestemmingen,
 * campings, vakantieparken en natuurgebieden. Gebruik dit voor "waar ben ik?"-
 * GPS-resolutie: een gebruiker woont in een plaats, niet op een camping.
 */
export const SETTLEMENT_PLACES = allPlacesRaw as Place[];

/**
 * Koos' getaway-kandidaten: échte dagbestemmingen (Waddeneilanden, natuurgebieden,
 * kust, campings/vakantieparken) — bewust ZONDER stadscentra, want "het is droog
 * in Rotterdam" is geen uitje. Gevoed door de curated set + de OSM-campings.
 * Dit is de pool waaruit /koos binnenlandse tips kiest (NL-first).
 */
export const KOOS_GETAWAY_PLACES: Place[] = mergePlaces(
  [...KOOS_NL_PLACES, ...KOOS_NL_CAMPING_PLACES],
  [],
).filter((p) => p.character !== "urban");

export type Province =
  | "groningen"
  | "friesland"
  | "drenthe"
  | "overijssel"
  | "flevoland"
  | "gelderland"
  | "utrecht"
  | "noord-holland"
  | "zuid-holland"
  | "zeeland"
  | "noord-brabant"
  | "limburg"
  | "antwerpen"
  | "limburg-be"
  | "oost-vlaanderen"
  | "vlaams-brabant"
  | "west-vlaanderen"
  | "wallonie"
  | "beieren"
  | "berlijn"
  | "brandenburg"
  | "bremen"
  | "hamburg"
  | "hessen"
  | "mecklenburg-voorpommeren"
  | "nedersaksen"
  | "noordrijn-westfalen"
  | "rijnland-palts"
  | "saarland"
  | "saksen"
  | "saksen-anhalt"
  | "sleeswijk-holstein"
  | "thuringen"
  | "baden-wurttemberg"
  | "ain"
  | "aisne"
  | "allier"
  | "alpes-de-haute-provence"
  | "hautes-alpes"
  | "alpes-maritimes"
  | "ardeche"
  | "ardennes"
  | "ariege"
  | "aube"
  | "aude"
  | "aveyron"
  | "bouches-du-rhone"
  | "calvados"
  | "cantal"
  | "charente"
  | "charente-maritime"
  | "cher"
  | "correze"
  | "cote-d-or"
  | "cotes-d-armor"
  | "creuse"
  | "dordogne"
  | "doubs"
  | "drome"
  | "eure"
  | "eure-et-loir"
  | "finistere"
  | "corse-du-sud"
  | "haute-corse"
  | "gard"
  | "haute-garonne"
  | "gers"
  | "gironde"
  | "herault"
  | "ille-et-vilaine"
  | "indre"
  | "indre-et-loire"
  | "isere"
  | "jura"
  | "landes"
  | "loir-et-cher"
  | "loire"
  | "haute-loire"
  | "loire-atlantique"
  | "loiret"
  | "lot"
  | "lot-et-garonne"
  | "lozere"
  | "maine-et-loire"
  | "manche"
  | "marne"
  | "haute-marne"
  | "mayenne"
  | "meurthe-et-moselle"
  | "meuse"
  | "morbihan"
  | "moselle"
  | "nievre"
  | "nord"
  | "oise"
  | "orne"
  | "pas-de-calais"
  | "puy-de-dome"
  | "pyrenees-atlantiques"
  | "hautes-pyrenees"
  | "pyrenees-orientales"
  | "bas-rhin"
  | "haut-rhin"
  | "rhone"
  | "haute-saone"
  | "saone-et-loire"
  | "sarthe"
  | "savoie"
  | "haute-savoie"
  | "paris"
  | "seine-maritime"
  | "seine-et-marne"
  | "yvelines"
  | "deux-sevres"
  | "somme"
  | "tarn"
  | "tarn-et-garonne"
  | "var"
  | "vaucluse"
  | "vendee"
  | "vienne"
  | "haute-vienne"
  | "vosges"
  | "yonne"
  | "territoire-de-belfort"
  | "essonne"
  | "hauts-de-seine"
  | "seine-saint-denis"
  | "val-de-marne"
  | "val-d-oise"
  | "guadeloupe"
  | "martinique"
  | "guyane"
  | "la-reunion"
  | "mayotte"
  | "luxembourg-country"
  | "spanje";

export const PROVINCE_LABELS: Record<Province, string> = {
  groningen: "Groningen",
  friesland: "Friesland",
  drenthe: "Drenthe",
  overijssel: "Overijssel",
  flevoland: "Flevoland",
  gelderland: "Gelderland",
  utrecht: "Utrecht",
  "noord-holland": "Noord-Holland",
  "zuid-holland": "Zuid-Holland",
  zeeland: "Zeeland",
  "noord-brabant": "Noord-Brabant",
  limburg: "Limburg (NL)",
  antwerpen: "Antwerpen",
  "limburg-be": "Limburg (BE)",
  "oost-vlaanderen": "Oost-Vlaanderen",
  "vlaams-brabant": "Vlaams-Brabant",
  "west-vlaanderen": "West-Vlaanderen",
  wallonie: "Wallonie",
  beieren: "Beieren",
  berlijn: "Berlijn",
  brandenburg: "Brandenburg",
  bremen: "Bremen",
  hamburg: "Hamburg",
  hessen: "Hessen",
  "mecklenburg-voorpommeren": "Mecklenburg-Voorpommeren",
  nedersaksen: "Nedersaksen",
  "noordrijn-westfalen": "Noordrijn-Westfalen",
  "rijnland-palts": "Rijnland-Palts",
  saarland: "Saarland",
  saksen: "Saksen",
  "saksen-anhalt": "Sachsen-Anhalt",
  "sleeswijk-holstein": "Sleeswijk-Holstein",
  thuringen: "Thüringen",
  "baden-wurttemberg": "Baden-Württemberg",
  "ain": "Ain",
  "aisne": "Aisne",
  "allier": "Allier",
  "alpes-de-haute-provence": "Alpes-de-Haute-Provence",
  "hautes-alpes": "Hautes-Alpes",
  "alpes-maritimes": "Alpes-Maritimes",
  "ardeche": "Ardèche",
  "ardennes": "Ardennes",
  "ariege": "Ariège",
  "aube": "Aube",
  "aude": "Aude",
  "aveyron": "Aveyron",
  "bouches-du-rhone": "Bouches-du-Rhône",
  "calvados": "Calvados",
  "cantal": "Cantal",
  "charente": "Charente",
  "charente-maritime": "Charente-Maritime",
  "cher": "Cher",
  "correze": "Corrèze",
  "cote-d-or": "Côte-d'Or",
  "cotes-d-armor": "Côtes-d'Armor",
  "creuse": "Creuse",
  "dordogne": "Dordogne",
  "doubs": "Doubs",
  "drome": "Drôme",
  "eure": "Eure",
  "eure-et-loir": "Eure-et-Loir",
  "finistere": "Finistère",
  "corse-du-sud": "Corse-du-Sud",
  "haute-corse": "Haute-Corse",
  "gard": "Gard",
  "haute-garonne": "Haute-Garonne",
  "gers": "Gers",
  "gironde": "Gironde",
  "herault": "Hérault",
  "ille-et-vilaine": "Ille-et-Vilaine",
  "indre": "Indre",
  "indre-et-loire": "Indre-et-Loire",
  "isere": "Isère",
  "jura": "Jura",
  "landes": "Landes",
  "loir-et-cher": "Loir-et-Cher",
  "loire": "Loire",
  "haute-loire": "Haute-Loire",
  "loire-atlantique": "Loire-Atlantique",
  "loiret": "Loiret",
  "lot": "Lot",
  "lot-et-garonne": "Lot-et-Garonne",
  "lozere": "Lozère",
  "maine-et-loire": "Maine-et-Loire",
  "manche": "Manche",
  "marne": "Marne",
  "haute-marne": "Haute-Marne",
  "mayenne": "Mayenne",
  "meurthe-et-moselle": "Meurthe-et-Moselle",
  "meuse": "Meuse",
  "morbihan": "Morbihan",
  "moselle": "Moselle",
  "nievre": "Nièvre",
  "nord": "Nord",
  "oise": "Oise",
  "orne": "Orne",
  "pas-de-calais": "Pas-de-Calais",
  "puy-de-dome": "Puy-de-Dôme",
  "pyrenees-atlantiques": "Pyrénées-Atlantiques",
  "hautes-pyrenees": "Hautes-Pyrénées",
  "pyrenees-orientales": "Pyrénées-Orientales",
  "bas-rhin": "Bas-Rhin",
  "haut-rhin": "Haut-Rhin",
  "rhone": "Rhône",
  "haute-saone": "Haute-Saône",
  "saone-et-loire": "Saone-et-Loire",
  "sarthe": "Sarthe",
  "savoie": "Savoie",
  "haute-savoie": "Haute-Savoie",
  "paris": "Paris",
  "seine-maritime": "Seine-Maritime",
  "seine-et-marne": "Seine-et-Marne",
  "yvelines": "Yvelines",
  "deux-sevres": "Deux-Sèvres",
  "somme": "Somme",
  "tarn": "Tarn",
  "tarn-et-garonne": "Tarn-et-Garonne",
  "var": "Var",
  "vaucluse": "Vaucluse",
  "vendee": "Vendée",
  "vienne": "Vienne",
  "haute-vienne": "Haute-Vienne",
  "vosges": "Vosges",
  "yonne": "Yonne",
  "territoire-de-belfort": "Territoire de Belfort",
  "essonne": "Essonne",
  "hauts-de-seine": "Hauts-de-Seine",
  "seine-saint-denis": "Seine-Saint-Denis",
  "val-de-marne": "Val-de-Marne",
  "val-d-oise": "Val-d'Oise",
  "guadeloupe": "Guadeloupe",
  "martinique": "Martinique",
  "guyane": "Guyane",
  "la-reunion": "La Réunion",
  "mayotte": "Mayotte",
  "luxembourg-country": "Luxembourg",
  spanje: "Spanje",
};

export const NL_PROVINCE_SLUGS = [
  "groningen",
  "friesland",
  "drenthe",
  "overijssel",
  "flevoland",
  "gelderland",
  "utrecht",
  "noord-holland",
  "zuid-holland",
  "zeeland",
  "noord-brabant",
  "limburg",
] as const;

export type NLProvince = (typeof NL_PROVINCE_SLUGS)[number];

export const NL_PROVINCES = new Set<string>(NL_PROVINCE_SLUGS);

export function isNLProvince(province: string): province is NLProvince {
  return NL_PROVINCES.has(province);
}

export const NL_PLACES = ALL_PLACES.filter((place) => isNLProvince(place.province));

export type City = { name: string; lat: number; lon: number; population?: number; character?: string };

export function placesByProvince(): Record<string, Place[]> {
  const grouped: Record<string, Place[]> = {};
  for (const p of ALL_PLACES) {
    if (!grouped[p.province]) grouped[p.province] = [];
    grouped[p.province].push(p);
  }
  return grouped;
}

export function nlPlacesByProvince(): Record<NLProvince, Place[]> {
  const grouped = Object.fromEntries(
    NL_PROVINCE_SLUGS.map((province) => [province, [] as Place[]]),
  ) as Record<NLProvince, Place[]>;

  for (const place of NL_PLACES) {
    grouped[place.province as NLProvince].push(place);
  }

  return grouped;
}

export function placeSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function placeRouteSlug(place: Pick<Place, "name" | "slug">): string {
  return place.slug || placeSlug(place.name);
}

export function findPlace(province: string, slug: string): Place | undefined {
    return ALL_PLACES.find(p => p.province === province && placeRouteSlug(p) === slug);
}

export function nearbyPlaces(base: Place, limit = 10): Place[] {
    const dist = (p: Place) => (p.lat - base.lat) ** 2 + (p.lon - base.lon) ** 2;
    return ALL_PLACES
        .filter(p => p.name !== base.name || p.province !== base.province)
        .sort((a, b) => dist(a) - dist(b))
        .slice(0, limit);
}
