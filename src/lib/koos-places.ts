import { KOOS_NL_CAMPING_PLACES } from "./koos-nl-camping-places.generated";
import type { Place } from "./places-data";

export function koosPlaceRouteSlug(place: Pick<Place, "name" | "slug">): string {
  return place.slug ?? place.name.toLowerCase().replace(/&/g, "en").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function mergeKoosPlaces(base: Place[], extra: Place[]): Place[] {
  const seen = new Set<string>();
  const merged: Place[] = [];

  for (const place of [...extra, ...base]) {
    const key = `${place.province}/${koosPlaceRouteSlug(place)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(place);
  }

  return merged;
}

const KOOS_CURATED_PLACES: Place[] = [
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
  { name: "Nationaal Park Veluwezoom", province: "gelderland", lat: 52.03, lon: 6.02, slug: "nationaal-park-veluwezoom", character: "highland" },
  { name: "Nationaal Park De Hoge Veluwe", province: "gelderland", lat: 52.1, lon: 5.83, slug: "nationaal-park-de-hoge-veluwe", character: "highland" },
  { name: "Nationaal Park De Biesbosch", province: "noord-brabant", lat: 51.75, lon: 4.78, slug: "nationaal-park-de-biesbosch", character: "coastal" },
  { name: "Nationaal Park Drents-Friese Wold", province: "drenthe", lat: 52.92, lon: 6.25, slug: "nationaal-park-drents-friese-wold", character: "inland" },
  { name: "Loonse en Drunense Duinen", province: "noord-brabant", lat: 51.66, lon: 5.13, character: "inland" },
  { name: "Schoorlse Duinen", province: "noord-holland", lat: 52.7, lon: 4.69, character: "coastal" },
  { name: "Oostvaardersplassen", province: "flevoland", lat: 52.45, lon: 5.38, character: "coastal" },
  { name: "Nationaal Park De Alde Feanen", province: "friesland", lat: 53.13, lon: 5.93, slug: "nationaal-park-de-alde-feanen", character: "coastal" },
  { name: "Weerribben-Wieden", province: "overijssel", lat: 52.73, lon: 6.05, character: "inland" },
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

/**
 * Lichte Koos-pool zonder `places.json`. Dit houdt /koos snel, terwijl campings
 * uit de sitemap/generated OSM-set wel als NL-first tips kunnen meedoen.
 */
export const KOOS_GETAWAY_PLACES_LIGHT: Place[] = mergeKoosPlaces(
  [...KOOS_CURATED_PLACES, ...KOOS_NL_CAMPING_PLACES],
  [],
).filter((p) => p.character !== "urban");
