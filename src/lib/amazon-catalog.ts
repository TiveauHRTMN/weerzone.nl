// ============================================================
// Amazon-productencatalogus met weer-tags en scoring.
//
// Strategie:
// - ASIN-based waar we zeker zijn dat product leeft (getest).
// - Zoek-URL based ("search://keywords") voor breedte — 404-vrij.
// - Elke entry heeft tags + base-score; matcher vermenigvuldigt
//   op basis van actieve weer-condities.
// ============================================================

import { amazonProductUrl, amazonUrl } from "./affiliates";

export type WeatherTag =
  | "rain_now"        // regent nu
  | "rain_soon"       // regen binnen 6u
  | "rain_heavy"      // >5mm dag
  | "storm"           // wind ≥60 km/u
  | "windy"           // wind 40-60 km/u
  | "cold"            // <5°
  | "freezing"        // ≤0°
  | "extreme_cold"    // ≤-5°
  | "warm"            // 18-25°
  | "hot"             // ≥26°
  | "heatwave"        // ≥30°
  | "uv_high"         // UV ≥6
  | "uv_extreme"      // UV ≥8
  | "dry_spell"       // 48u droog
  | "perfect"         // droog, 15-23°, weinig wind
  | "snow"
  | "thunder"         // onweer kans
  | "fog"
  | "spring" | "summer" | "autumn" | "winter"
  | "weekend"
  | "evening" | "morning"
  | "garden"          // seizoen+droog → tuin-spul
  | "indoor"          // stug weer → binnen
  | "commute"         // weekdag + regen/kou → forens-spul
  | "allergy"         // lente/zomer → pollen
  | "sun" | "outdoor" | "sport" | "festival";

export interface CatalogProduct {
  id: string;                 // uniek voor rotatie
  asin?: string;              // als bekend
  searchQuery?: string;       // fallback voor zoek-URL
  title: string;
  subtitle: string;           // waarom-copy, 1 zin, weer-gerelateerd
  image: string;              // Amazon CDN of emoji-gradient (zie helper)
  priceHint: string;          // "€29,95" — is hint, niet live
  oldPrice?: string;
  tags: WeatherTag[];
  baseScore: number;          // 1-10 default
  badge?: string;             // "Bestseller", "Deal"
}

// ============================================================
// Catalogus — curated. Elk product is ooit handmatig gepicked.
// ============================================================

export const CATALOG: CatalogProduct[] = [
  // ==== REGEN / STORM ====
  {
    id: "senz-storm",
    asin: "B07B8K47M2",
    title: "Senz° stormparaplu — windproof tot 100 km/u",
    subtitle: "Normale paraplu overleeft een NL-herfst niet. Deze wel.",
    image: "https://m.media-amazon.com/images/I/61zPZGagoSL._AC_UL320_.jpg",
    priceHint: "€29,95",
    tags: ["windy", "storm"],
    baseScore: 5,
    badge: "Anti-storm",
  },
  {
    id: "budget-umby",
    asin: "B00CD7GZLU",
    title: "Compacte Opvouwbare Paraplu — Zwart",
    subtitle: "Past in je binnenzak. Onmisbaar bij elke bui.",
    image: "emoji:☂️:#1a1a1a",
    priceHint: "€7,95",
    tags: ["rain_now", "rain_soon", "commute"],
    baseScore: 10,
    badge: "Scherpe deal",
  },
  {
    id: "regenjas-dames",
    searchQuery: "regenjas dames waterdicht ademend",
    title: "Regenjas — waterdicht & ademend",
    subtitle: "Paraplu vergeet je. Jas niet.",
    image: "emoji:🧥:#4a9ee8",
    priceHint: "vanaf €34",
    tags: ["rain_now", "rain_soon", "rain_heavy", "commute"],
    baseScore: 7,
  },
  {
    id: "regenjas-heren",
    searchQuery: "regenjas heren waterdicht",
    title: "Regenjas heren — waterdicht",
    subtitle: "Droog naar kantoor, droog terug.",
    image: "emoji:🧥:#2d6fb8",
    priceHint: "vanaf €39",
    tags: ["rain_now", "rain_soon", "rain_heavy", "commute"],
    baseScore: 7,
  },
  {
    id: "kinder-regenpak",
    searchQuery: "regenpak kind regenbroek jas set",
    title: "Kinder-regenpak — jas + broek",
    subtitle: "Plassen zijn geen probleem. Ouders wel als het pak ontbreekt.",
    image: "emoji:☂️:#ffc440",
    priceHint: "vanaf €24,95",
    tags: ["rain_now", "rain_soon", "rain_heavy"],
    baseScore: 5,
  },
  {
    id: "regenponcho-wegwerp",
    asin: "B002XW0R8G",
    title: "Eco-Regenponcho (5 stuks) — Compact",
    subtitle: "Past in elke tas. Redt je dag bij een onverwachte bui.",
    image: "emoji:🌧️:#94a3b8",
    priceHint: "€8,95",
    tags: ["rain_now", "rain_soon", "commute", "festival"],
    baseScore: 10,
    badge: "Impulskoop",
  },
  {
    id: "regenhoes-rugzak",
    searchQuery: "regenhoes rugzak waterdicht",
    title: "Regenhoes voor rugzak",
    subtitle: "Je laptop verdraagt geen motregen.",
    image: "emoji:🎒:#6a93c0",
    priceHint: "€8,99",
    tags: ["rain_now", "rain_soon", "commute"],
    baseScore: 6,
  },

  // ==== KOU / VORST ====
  {
    id: "thermo-merino",
    asin: "B0DB2TYZ3W",
    title: "Thermo-ondergoed — merino wol",
    subtitle: "Zonder thermolaag voel je −5° tot op het bot.",
    image: "https://m.media-amazon.com/images/I/61m1v4fm5wL._AC_UL320_.jpg",
    priceHint: "€29,99",
    oldPrice: "€39,99",
    tags: ["cold", "freezing", "extreme_cold", "winter"],
    baseScore: 8,
    badge: "Must-have",
  },
  {
    id: "ijskrabber-handschoen",
    asin: "B09QGWXRY9",
    title: "IJskrabber mét verwarmde handschoen",
    subtitle: "Bij vorst bevriest alles. Je autoruit ook.",
    image: "https://m.media-amazon.com/images/I/71Zccm+HmPL._AC_UL320_.jpg",
    priceHint: "€9,99",
    tags: ["freezing", "extreme_cold", "winter", "commute"],
    baseScore: 7,
  },
  {
    id: "ontdooier-spray",
    asin: "B0068NUR78",
    title: "Ruitontdooier Spray (500ml) — Snelwerkend",
    subtitle: "Krabben is verleden tijd. Spray, wacht, rijd.",
    image: "emoji:🧼:#7dd3fc",
    priceHint: "€6,49",
    tags: ["freezing", "extreme_cold", "winter", "commute"],
    baseScore: 10,
    badge: "Geen gekrab",
  },
  {
    id: "handschoenen-touchscreen",
    searchQuery: "handschoenen touchscreen winter heren dames",
    title: "Winter-handschoenen — touchscreen",
    subtitle: "Scrollen met ijsvingers werkt niet. Deze wel.",
    image: "emoji:🧤:#334e7e",
    priceHint: "vanaf €12,95",
    tags: ["cold", "freezing", "winter"],
    baseScore: 5,
  },
  {
    id: "softshell",
    asin: "B0836GND15",
    title: "Softshell jas — wind- en waterafstotend",
    subtitle: "Warm genoeg voor binnen, sterk genoeg voor buiten.",
    image: "https://m.media-amazon.com/images/I/61B7yOCdstL._AC_UL320_.jpg",
    priceHint: "€49,99",
    oldPrice: "€64,99",
    tags: ["cold", "windy", "autumn", "spring"],
    baseScore: 7,
    badge: "Deal",
  },
  {
    id: "elektrische-deken",
    searchQuery: "elektrische deken warmtedeken",
    title: "Warmtedeken — elektrisch",
    subtitle: "Verwarming hoog = duur. Deken = goedkoop en knus.",
    image: "emoji:🔥:#c4452c",
    priceHint: "vanaf €34,95",
    tags: ["cold", "freezing", "extreme_cold", "indoor", "winter", "evening"],
    baseScore: 8,
    badge: "Bespaart gas",
  },
  {
    id: "handwarmers",
    asin: "B00O9SCTZ6",
    title: "Zelfopwarmende handwarmers (10 paar)",
    subtitle: "Instant warmte in je jaszak. Onmisbaar bij vrieskou.",
    image: "emoji:🔥:#f59e0b",
    priceHint: "€12,99",
    tags: ["cold", "freezing", "extreme_cold", "commute", "winter"],
    baseScore: 10,
    badge: "Warmhouder",
  },

  // ==== HITTE / ZON ====
  {
    id: "zonnebrand-spf50",
    searchQuery: "zonnebrand spf 50 waterproof",
    title: "Zonnebrand SPF 50+ waterproof",
    subtitle: "Hoge UV → zonder smeren binnen 20 min verbrand.",
    image: "emoji:🧴:#ff9a3c",
    priceHint: "vanaf €9,99",
    tags: ["uv_high", "uv_extreme", "hot", "heatwave", "summer"],
    baseScore: 7,
    badge: "UV-beschermer",
  },
  {
    id: "lipbalm-uv",
    asin: "B01DPA6L9M",
    title: "SPF 30 Lippenbalsem (2-pack)",
    subtitle: "Bescherm je lippen tegen verbranding bij felle zon.",
    image: "emoji:💄:#fca5a5",
    priceHint: "€4,95",
    tags: ["uv_high", "uv_extreme", "hot", "sun"],
    baseScore: 10,
    badge: "Bescherming",
  },
  {
    id: "waterfles-iso",
    asin: "B092W7W5BB",
    title: "Geïsoleerde fles 1L — 24u koud",
    subtitle: "Bij hitte verlies je meer vocht dan je denkt.",
    image: "https://m.media-amazon.com/images/I/41Hyv0IGKpL._AC_UL320_.jpg",
    priceHint: "€16,99",
    tags: ["hot", "heatwave", "warm", "summer"],
    baseScore: 7,
  },
  {
    id: "ventilator-tafel",
    searchQuery: "ventilator tafel stil usb",
    title: "Tafelventilator — stil & USB",
    subtitle: "Airco is luxe. Deze ventilator fluistert ≤35 dB.",
    image: "emoji:💨:#77c8ff",
    priceHint: "vanaf €19,95",
    tags: ["hot", "heatwave", "summer", "indoor"],
    baseScore: 8,
    badge: "Populair",
  },
  {
    id: "zonnebril-uv400",
    searchQuery: "zonnebril gepolariseerd UV400",
    title: "Gepolariseerde zonnebril UV400",
    subtitle: "Felle zon. Bescherm je ogen, en zie er goed uit.",
    image: "emoji:🕶️:#1a1a1a",
    priceHint: "vanaf €14,95",
    tags: ["uv_high", "uv_extreme", "warm", "hot", "summer", "spring"],
    baseScore: 6,
  },
  {
    id: "koelbox",
    asin: "B0GLFFKWT4",
    title: "Koelbox 24L — houdt 48u koud",
    subtitle: "BBQ- of strandweer. Drankjes koud is geen optie.",
    image: "https://m.media-amazon.com/images/I/71tONXZG4VL._AC_UL320_.jpg",
    priceHint: "€34,95",
    tags: ["hot", "heatwave", "summer", "dry_spell", "weekend"],
    baseScore: 6,
  },
  {
    id: "parasol",
    searchQuery: "parasol balkon tuin UV",
    title: "Parasol — tuin of balkon",
    subtitle: "Zonder schaduw is een hittegolf geen feest.",
    image: "emoji:⛱️:#ff7a4c",
    priceHint: "vanaf €29,95",
    tags: ["heatwave", "hot", "summer", "garden"],
    baseScore: 5,
  },

  // ==== WIND ====
  {
    id: "windbreaker",
    searchQuery: "windbreaker jas lichtgewicht heren dames",
    title: "Windbreaker — licht en stevig",
    subtitle: "Windstoten blazen een gewone jas op. Deze niet.",
    image: "emoji:🌬️:#5a8fc9",
    priceHint: "vanaf €24,99",
    tags: ["windy", "storm", "autumn", "spring"],
    baseScore: 6,
  },

  // ==== PERFECT / DROOG / SEIZOEN ====
  {
    id: "picknickdeken",
    asin: "B0GLFFKWT4",
    title: "Picknickdeken XL — waterdichte onderkant",
    subtitle: "Droog, zacht, zon. Dit weer verdient je tijd buiten.",
    image: "https://m.media-amazon.com/images/I/71tONXZG4VL._AC_UL320_.jpg",
    priceHint: "€24,99",
    tags: ["perfect", "dry_spell", "warm", "weekend", "spring", "summer"],
    baseScore: 5,
    badge: "Prachtweer",
  },
  {
    id: "bbq-kolen",
    searchQuery: "houtskool briketten bbq",
    title: "Houtskool briketten — lange brandduur",
    subtitle: "Droog avond = BBQ-avond.",
    image: "emoji:🔥:#3a3a3a",
    priceHint: "vanaf €9,99",
    tags: ["dry_spell", "warm", "hot", "summer", "weekend", "evening"],
    baseScore: 6,
  },
  {
    id: "tuinstoel",
    searchQuery: "tuinstoel opvouwbaar",
    title: "Opvouwbare tuinstoel",
    subtitle: "Zon + weekend = naar buiten.",
    image: "emoji:🪑:#83b577",
    priceHint: "vanaf €29,95",
    tags: ["garden", "spring", "summer", "dry_spell", "weekend", "perfect"],
    baseScore: 5,
  },
  {
    id: "fietstas-waterdicht",
    searchQuery: "fietstas waterdicht pannier",
    title: "Waterdichte fietstas",
    subtitle: "Forenzen op de fiets? Je spullen moeten droog blijven.",
    image: "emoji:🚲:#1a7a4a",
    priceHint: "vanaf €24,95",
    tags: ["rain_now", "rain_soon", "commute", "autumn"],
    baseScore: 5,
  },

  // ==== ONWEER / INDOOR ====
  {
    id: "overspanningsbeveiliging",
    searchQuery: "stekkerdoos overspanningsbeveiliging",
    title: "Stekkerdoos met overspanningsbeveiliging",
    subtitle: "Onweer = piekspanning = gesneuvelde router.",
    image: "emoji:⚡:#ffd84a",
    priceHint: "vanaf €17,99",
    tags: ["thunder", "storm"],
    baseScore: 7,
  },
  {
    id: "boek-leeshoek",
    searchQuery: "leeslamp boek",
    title: "LED leeslamp — clip-on",
    subtitle: "Rot-weer-avond. Licht aan, boek open.",
    image: "emoji:📖:#b58a4a",
    priceHint: "vanaf €14,99",
    tags: ["indoor", "rain_heavy", "storm", "evening"],
    baseScore: 4,
  },
  {
    id: "doekje-beslagen",
    asin: "B01K7031X8",
    title: "Anti-condens Doekjes (Set van 3)",
    subtitle: "Bril of scherm beslagen door de kou? Eén veeg klaar.",
    image: "emoji:👓:#e2e8f0",
    priceHint: "€3,99",
    tags: ["cold", "fog", "commute", "indoor"],
    baseScore: 10,
    badge: "Glashelder",
  },
  {
    id: "thee-selectie",
    searchQuery: "thee cadeauverpakking",
    title: "Thee-selectie cadeaubox",
    subtitle: "Kou + grijs + binnen. Thee lost veel op.",
    image: "emoji:🍵:#6b8e4a",
    priceHint: "vanaf €14,95",
    tags: ["cold", "freezing", "indoor", "autumn", "winter", "evening"],
    baseScore: 5,
  },
  {
    id: "powerbank-compact",
    asin: "B019FI6D62",
    title: "Anker PowerCore 10k — Compacte Powerbank",
    subtitle: "Storm op komst? Blijf bereikbaar bij stroomuitval.",
    image: "emoji:🔋:#10b981",
    priceHint: "€24,99",
    tags: ["storm", "indoor", "commute"],
    baseScore: 6,
  },

  // ==== MIST ====
  {
    id: "fietsverlichting",
    searchQuery: "fietsverlichting led oplaadbaar set",
    title: "Fietsverlichting — LED, oplaadbaar",
    subtitle: "Mist + herfstavond = onzichtbaar zonder goed licht.",
    image: "emoji:🔦:#ffc440",
    priceHint: "vanaf €19,95",
    tags: ["fog", "autumn", "winter", "commute", "evening"],
    baseScore: 6,
  },

  // ==== POLLEN ====
  {
    id: "hooikoorts",
    searchQuery: "hooikoorts antihistamine",
    title: "Hooikoorts-tabletten (niet-suf-makend)",
    subtitle: "Lentezon + wind = pollen overal.",
    image: "emoji:🤧:#9bd17a",
    priceHint: "vanaf €8,99",
    tags: ["allergy", "spring", "dry_spell", "warm"],
    baseScore: 6,
  },

  // ==== SNEEUW ====
  {
    id: "sneeuwschep",
    searchQuery: "sneeuwschep schraper",
    title: "Sneeuwschep — lang handvat",
    subtitle: "Sneeuw schept zichzelf niet.",
    image: "emoji:🌨️:#a8cfe8",
    priceHint: "vanaf €14,95",
    tags: ["snow", "freezing", "winter"],
    baseScore: 6,
  },
  {
    id: "strooizout",
    searchQuery: "strooizout 25kg dooizout",
    title: "Strooizout — 25kg",
    subtitle: "Gladheid voor de deur = claim. Niet grappig.",
    image: "emoji:🧂:#e6e6e6",
    priceHint: "vanaf €12,95",
    tags: ["snow", "freezing", "extreme_cold", "winter"],
    baseScore: 5,
  },
];

// ============================================================
// Helpers
// ============================================================

export function productHref(p: CatalogProduct): string {
  if (p.asin) return amazonProductUrl(p.asin);
  if (p.searchQuery) return amazonUrl(p.searchQuery);
  return "https://www.amazon.nl";
}

/** Parsed emoji-image: "emoji:🧥:#4a9ee8" → { emoji, color } */
export function parseEmojiImage(src: string): { emoji: string; color: string } | null {
  if (!src.startsWith("emoji:")) return null;
  const [, emoji, color] = src.split(":");
  return { emoji: emoji || "📦", color: color || "#cccccc" };
}
