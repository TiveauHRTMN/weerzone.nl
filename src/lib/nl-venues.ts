import type { Place } from "./places-data";

/**
 * Curated NL leisure venues -> programmatische weerpagina's op
 * /weer/[province]/[slug]. Co-ordinaten via OpenStreetMap (Overpass).
 * Kwaliteit boven kwantiteit: alleen echt-gezochte venues, geen
 * kinderboerderijen/miniworlds (thin-content vermijden).
 *
 * Dit is de geverifieerde startset. Uitbreiding naar ~120 venues is een
 * aparte data-taak met geverifieerde co-ordinaten (niet uit het hoofd).
 */
export const NL_VENUE_PLACES: Place[] = [
  // --- Attractieparken ---
  { name: "Efteling", province: "noord-brabant", lat: 51.6499, lon: 5.0481, slug: "efteling", venueType: "attractiepark", character: "inland" },
  { name: "Walibi Holland", province: "flevoland", lat: 52.4402, lon: 5.768, slug: "walibi-holland", venueType: "attractiepark", character: "inland" },
  { name: "Toverland", province: "limburg", lat: 51.3983, lon: 5.9839, slug: "toverland", venueType: "attractiepark", character: "inland" },
  { name: "Attractiepark Slagharen", province: "overijssel", lat: 52.6232, lon: 6.5631, slug: "attractiepark-slagharen", venueType: "attractiepark", character: "inland" },
  { name: "Duinrell", province: "zuid-holland", lat: 52.1476, lon: 4.3807, slug: "duinrell", venueType: "attractiepark", character: "coastal" },
  { name: "Avonturenpark Hellendoorn", province: "overijssel", lat: 52.3898, lon: 6.436, slug: "avonturenpark-hellendoorn", venueType: "attractiepark", character: "inland" },
  { name: "Julianatoren", province: "gelderland", lat: 52.2267, lon: 5.916, slug: "julianatoren", venueType: "attractiepark", character: "highland" },
  { name: "Familiepark Drievliet", province: "zuid-holland", lat: 52.0543, lon: 4.3503, slug: "drievliet", venueType: "attractiepark", character: "urban" },
  { name: "Linnaeushof", province: "noord-holland", lat: 52.3254, lon: 4.5984, slug: "linnaeushof", venueType: "attractiepark", character: "coastal" },
  { name: "Madurodam", province: "zuid-holland", lat: 52.0995, lon: 4.2976, slug: "madurodam", venueType: "attractiepark", character: "coastal" },
  { name: "Deltapark Neeltje Jans", province: "zeeland", lat: 51.6391, lon: 3.7143, slug: "deltapark-neeltje-jans", venueType: "attractiepark", character: "coastal" },
  { name: "Familiepark DippieDoe", province: "noord-brabant", lat: 51.4999, lon: 5.436, slug: "dippiedoe", venueType: "attractiepark", character: "inland" },
  { name: "Sprookjeswonderland", province: "noord-holland", lat: 52.7118, lon: 5.2895, slug: "sprookjeswonderland", venueType: "attractiepark", character: "coastal" },

  // --- Dierentuinen ---
  { name: "Artis", province: "noord-holland", lat: 52.366, lon: 4.9167, slug: "artis", venueType: "dierentuin", character: "urban" },
  { name: "Burgers' Zoo", province: "gelderland", lat: 52.0101, lon: 5.9001, slug: "burgers-zoo", venueType: "dierentuin", character: "highland" },
  { name: "Apenheul", province: "gelderland", lat: 52.2152, lon: 5.9186, slug: "apenheul", venueType: "dierentuin", character: "highland" },
  { name: "AquaZoo Leeuwarden", province: "friesland", lat: 53.2151, lon: 5.8831, slug: "aquazoo-leeuwarden", venueType: "dierentuin", character: "inland" },
  { name: "Avifauna", province: "zuid-holland", lat: 52.1393, lon: 4.649, slug: "avifauna", venueType: "dierentuin", character: "inland" },
  { name: "BestZOO", province: "noord-brabant", lat: 51.5293, lon: 5.4008, slug: "bestzoo", venueType: "dierentuin", character: "inland" },
];
