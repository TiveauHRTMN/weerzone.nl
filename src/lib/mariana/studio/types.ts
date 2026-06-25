/**
 * Mariana Studio — datamodel voor de 4 TikTok-slide-templates.
 * Eén StudioDay = één rij in tabel `mariana_studio`.
 */

export type Region = "Noord" | "Oost" | "Midden" | "West" | "Zuid";

export interface RegionTemps {
  noord: number;
  oost: number;
  midden: number;
  west: number;
  zuid: number;
}

export interface Ranked {
  name: string;
  value: number;
  region: Region;
}

/** Slide 1 — 08:00 Dagverwachting. */
export interface Slide1 {
  badge: string;          // "Dinsdag 23 juni · 08:00"
  titel: string;          // "Vandaag"
  intro: string;          // LLM
  regionTemps: RegionTemps;            // verwachte max (mediaan)
  dayparts: { ochtend: number; middag: number; avond: number; nacht: number };
  metrics: { uvIndex: number; hooikoorts: string; windBft: number; fietsweer: string };
  tagline: string;
}

/** Slide 2 — 14:00 Actueel weer. Cijfers leeg in de rij; pagina vult ze live. */
export interface Slide2 {
  badge: string;          // "Nu · 14:00"
  titel: string;          // "Actueel weer"
  subtitel: string;
  regionTempsNow: RegionTemps | null;  // live
  warmstePlek: { naam: string; temp: number } | null;  // live
}

/** Slide 3 — 20:00 Vandaag & Morgen. */
export interface Slide3 {
  badge: string;          // "Avond · 23 juni"
  titel: string;          // "Vandaag & Morgen"
  vandaag: {
    hoogste: { temp: number; plaats: string };
    laagste: { temp: number; label: string };
    weerfeit: string;
  };
  morgen: { temp: number; alinea: string };  // alinea = LLM
}

/** Slide 4 — 22:00 Heads-up. null = geen heads-up vandaag, niet posten. */
export type HeadsUpType = "onweer" | "knmi" | "hitte" | "kou";

export interface HeadsUp {
  type: HeadsUpType;
  badge: string;          // "Heads-up · vanavond"
  titel: string;          // "Onweer trekt binnen"
  intro: string;          // LLM
  rijen: { wanneer: string; waar: string; verwacht: string };
  advies: string;
}

export interface StudioDay {
  forecastDate: string;   // ISO yyyy-mm-dd (de dag waarop de posts gaan)
  runAt: string;          // ISO timestamp van generatie
  slide1: Slide1;
  slide2: Slide2;
  slide3: Slide3;
  slide4: HeadsUp | null;
}
