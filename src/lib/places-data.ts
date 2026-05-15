/**
 * Alle Nederlandse woonplaatsen — gegroepeerd per provincie.
 * Dit bestand wordt continu uitgebreid door OpenClaw's SEO engine.
 * 
 * Elke plaats wordt een eigen pagina op /weer/[province]/[place]
 * die rankt voor "weer [plaatsnaam]" in Google.
 * 
 * DOEL: ~7.000 plaatsen → ~7.000 indexeerbare pagina's.
 */

export interface Place {
  name: string;
  province: string;
  lat: number;
  lon: number;
  population?: number;
  character?: "coastal" | "inland" | "highland" | "urban"; // Voor slimme AI-commentaar en affiliates
}

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
  // Duitsland — Bundesländer
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
  // Frankrijk & Wallonie
  | "wallonie"
  | "ile-de-france";

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
  // Duitsland
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
  "saksen-anhalt": "Saksen-Anhalt",
  "sleeswijk-holstein": "Sleeswijk-Holstein",
  thuringen: "Thüringen",
  "baden-wurttemberg": "Baden-Württemberg",
  // Frankrijk & Wallonie
  wallonie: "Wallonie",
  "ile-de-france": "Île-de-France",
};

// ============================================================
// PLAATSEN DATABASE
// OpenClaw voegt hier continu plaatsen aan toe.
// Sorteer per provincie, alfabetisch op naam.
// ============================================================

import rawPlaces from './places.json';
export const ALL_PLACES: Place[] = rawPlaces as Place[];

// ============================================================
// Helper functies
// ============================================================

/** Totaal aantal plaatsen in de database */
export const PLACES_COUNT = ALL_PLACES.length;

/** Alle provincies met hun plaatsen */
export function placesByProvince(): Record<string, Place[]> {
  const result: Record<string, Place[]> = {};
  for (const place of ALL_PLACES) {
    if (!result[place.province]) {
      result[place.province] = [];
    }
    result[place.province].push(place);
  }
  return result;
}

/** Zoek een plaats op slug */
export function findPlace(provinceSlug: string, placeSlugToFind: string): Place | undefined {
  return ALL_PLACES.find(
    (p) =>
      p.province === provinceSlug &&
      placeSlug(p.name) === placeSlugToFind
  );
}

/** Maak een URL-slug van een plaatsnaam */
export function placeSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Verwijder e.g. û naar u
    .replace(/&/g, "en")                              // & naar en
    .replace(/[^a-z0-9\-]+/g, "-")                    // Alleen letters, cijfers & streepjes
    .replace(/-+/g, "-")                              // Voorkom dubbele streepjes in URLs
    .replace(/^-+|-+$/g, "");                         // Trim streepjes aan uiteinden
}

/** Vind de 5 dichtstbijzijnde plaatsen */
export function nearbyPlaces(place: Place, count = 5): Place[] {
  return ALL_PLACES
    .filter((p) => p.name !== place.name)
    .map((p) => ({
      ...p,
      dist: Math.sqrt(Math.pow(p.lat - place.lat, 2) + Math.pow(p.lon - place.lon, 2)),
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, count);
}
