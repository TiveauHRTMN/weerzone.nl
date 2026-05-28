/**
 * Centrale locale-configuratie voor Weerzone.
 *
 * NL  → Piet-tier,  routes zonder prefix  (/piet, /weer/…)
 * DE  → Karl-tier,  routes onder /de/     (/de/mein-wetter, /de/wetter/…)
 * FR  → Luc-tier,   routes onder /fr/     (/fr/mon-meteo, /fr/meteo/…)
 */

import { type Province } from "@/lib/places-data";

export type Locale = "nl" | "de" | "fr" | "es";

export interface HreflangEntry {
  hreflang: string;
  href: string;
}

export type NavWeight = "default" | "strong" | "muted";

export interface LocaleConfig {
  code: Locale;
  label: string;
  hreflang: string;
  routes: {
    home: string;
    weather: string;
    myWeather: string;
    warnings: string;
  };
  nav: Array<{
    key: string;
    label: string;
    href: string;
    sublabel?: string;
    weight?: NavWeight;
  }>;
}

export type NavLink = LocaleConfig["nav"][number];

export const LOCALES: Record<Locale, LocaleConfig> = {
  nl: {
    code: "nl",
    label: "Nederland",
    hreflang: "nl-NL",
    routes: {
      home: "/",
      weather: "/weer",
      myWeather: "/piet",
      warnings: "/reed",
    },
    nav: [
      { key: "piet",          label: "Piet",          href: "/piet",            sublabel: "Je dagelijkse heads-up" },
      { key: "reed",          label: "Reed",          href: "/reed",            sublabel: "Voor buien, wind en onweer" },
      { key: "koos",          label: "Koos",          href: "/koos",            sublabel: "Als je eropuit wilt" },
      { key: "steve",         label: "Steve",         href: "/steve",           sublabel: "Je zakelijke heads-up" },
      { key: "over",          label: "About",         href: "/over",            weight: "muted" },
      { key: "contact",       label: "Contact",       href: "/contact",         weight: "muted" },
      { key: "mijn-weerzone", label: "Mijn Weerzone", href: "/mijn-weerzone",   weight: "strong" },
    ],
  },
  de: {
    code: "de",
    label: "Deutschland",
    hreflang: "de-DE",
    routes: {
      home: "/de",
      weather: "/de/wetter",
      myWeather: "/de/mein-wetter",
      warnings: "/de/warnungen",
    },
    nav: [
      { key: "mein-wetter", label: "Mein Wetter", href: "/de/mein-wetter", sublabel: "Dein taeglicher Heads-up" },
      { key: "warnungen", label: "Reed", href: "/de/warnungen", sublabel: "Fuer Regen, Wind und Gewitter" },
      { key: "steve", label: "Steve", href: "/steve", sublabel: "Dein Business-Heads-up" },
    ],
  },
  fr: {
    code: "fr",
    label: "France",
    hreflang: "fr-FR",
    routes: {
      home: "/fr",
      weather: "/fr/meteo",
      myWeather: "/fr/mon-meteo",
      warnings: "/fr/alertes",
    },
    nav: [
      { key: "ma-meteo", label: "Ma Météo", href: "/fr/mon-meteo" },
      { key: "alertes", label: "Reed", href: "/fr/alertes", sublabel: "Pour pluie, vent et orages" },
      { key: "steve", label: "Steve", href: "/steve", sublabel: "Votre heads-up business" },
    ],
  },
  es: {
    code: "es",
    label: "España",
    hreflang: "es-ES",
    routes: {
      home: "/es",
      weather: "/es/tiempo",
      myWeather: "/es/mi-tiempo",
      warnings: "/es/alertas",
    },
    nav: [
      { key: "mi-tiempo", label: "Mi tiempo", href: "/es/mi-tiempo" },
      { key: "alertas", label: "Alertas", href: "/es/alertas" },
      { key: "tiempo", label: "Tiempo", href: "/es/tiempo/espana" },
    ],
  },
};

export const DEFAULT_LOCALE: Locale = "nl";

export function detectLocale(pathname: string): Locale {
  if (pathname.startsWith("/de")) return "de";
  if (pathname.startsWith("/fr")) return "fr";
  if (pathname.startsWith("/lu")) return "fr";
  if (pathname.startsWith("/es")) return "es";
  return "nl";
}

// ─── Bundesland URL-slug ↔ interne province-key mapping ──────────────────────
export const DE_BUNDESLAND_TO_PROVINCE: Record<string, Province> = {
  "berlin":                  "berlijn",
  "bayern":                  "beieren",
  "nordrhein-westfalen":     "noordrijn-westfalen",
  "niedersachsen":           "nedersaksen",
  "sachsen":                 "saksen",
  "sachsen-anhalt":          "saksen-anhalt",
  "thueringen":              "thuringen",
  "mecklenburg-vorpommern":  "mecklenburg-voorpommeren",
  "schleswig-holstein":      "sleeswijk-holstein",
  "rheinland-pfalz":         "rijnland-palts",
  "baden-wuerttemberg":      "baden-wurttemberg",
  "hessen":                  "hessen",
  "hamburg":                 "hamburg",
  "bremen":                  "bremen",
  "saarland":                "saarland",
  "brandenburg":             "brandenburg",
  "luxembourg":              "luxembourg-country",
};

export const PROVINCE_TO_DE_BUNDESLAND: Partial<Record<Province, string>> = {
  berlijn:                   "berlin",
  beieren:                   "bayern",
  "noordrijn-westfalen":     "nordrhein-westfalen",
  nedersaksen:               "niedersachsen",
  saksen:                    "sachsen",
  "saksen-anhalt":            "sachsen-anhalt",
  thuringen:                 "thueringen",
  "mecklenburg-voorpommeren":"mecklenburg-vorpommern",
  "sleeswijk-holstein":      "schleswig-holstein",
  "rijnland-palts":          "rheinland-pfalz",
  "baden-wurttemberg":       "baden-wuerttemberg",
  hessen:                    "hessen",
  hamburg:                   "hamburg",
  bremen:                    "bremen",
  saarland:                  "saarland",
  brandenburg:               "brandenburg",
  "luxembourg-country":      "luxembourg",
};

export const DE_BUNDESLAND_LABELS: Record<string, string> = {
  berlin:                   "Berlin",
  bayern:                   "Bayern",
  "nordrhein-westfalen":    "Nordrhein-Westfalen",
  niedersachsen:            "Niedersachsen",
  sachsen:                  "Sachsen",
  "sachsen-anhalt":         "Sachsen-Anhalt",
  thueringen:               "Thüringen",
  "mecklenburg-vorpommern": "Mecklenburg-Vorpommern",
  "schleswig-holstein":     "Schleswig-Holstein",
  "rheinland-pfalz":        "Rheinland-Pfalz",
  "baden-wuerttemberg":     "Baden-Württemberg",
  hessen:                   "Hessen",
  hamburg:                  "Hamburg",
  bremen:                   "Bremen",
  saarland:                 "Saarland",
  brandenburg:              "Brandenburg",
  luxembourg:               "Luxemburg",
};

export const DE_BUNDESLAND_SLUGS = Object.keys(DE_BUNDESLAND_TO_PROVINCE);

// ─── Régions Françaises ─────────────────────────────────────────────────────────
export const FR_REGION_TO_PROVINCE: Record<string, Province> = {
  "ain": "ain", "aisne": "aisne", "allier": "allier", "alpes-de-haute-provence": "alpes-de-haute-provence",
  "hautes-alpes": "hautes-alpes", "alpes-maritimes": "alpes-maritimes", "ardeche": "ardeche", "ardennes": "ardennes",
  "ariege": "ariege", "aube": "aube", "aude": "aude", "aveyron": "aveyron", "bouches-du-rhone": "bouches-du-rhone",
  "calvados": "calvados", "cantal": "cantal", "charente": "charente", "charente-maritime": "charente-maritime",
  "cher": "cher", "correze": "correze", "cote-d-or": "cote-d-or", "cotes-d-armor": "cotes-d-armor",
  "creuse": "creuse", "dordogne": "dordogne", "doubs": "doubs", "drome": "drome", "eure": "eure",
  "eure-et-loir": "eure-et-loir", "finistere": "finistere", "corse-du-sud": "corse-du-sud", "haute-corse": "haute-corse",
  "gard": "gard", "haute-garonne": "haute-garonne", "gers": "gers", "gironde": "gironde", "herault": "herault",
  "ille-et-vilaine": "ille-et-vilaine", "indre": "indre", "indre-et-loire": "indre-et-loire", "isere": "isere",
  "jura": "jura", "landes": "landes", "loir-et-cher": "loir-et-cher", "loire": "loire", "haute-loire": "haute-loire",
  "loire-atlantique": "loire-atlantique", "loiret": "loiret", "lot": "lot", "lot-et-garonne": "lot-et-garonne",
  "lozere": "lozere", "maine-et-loire": "maine-et-loire", "manche": "manche", "marne": "marne", "haute-marne": "haute-marne",
  "mayenne": "mayenne", "meurthe-et-moselle": "meurthe-et-moselle", "meuse": "meuse", "morbihan": "morbihan",
  "moselle": "moselle", "nievre": "nievre", "nord": "nord", "oise": "oise", "orne": "orne", "pas-de-calais": "pas-de-calais",
  "puy-de-dome": "puy-de-dome", "pyrenees-atlantiques": "pyrenees-atlantiques", "hautes-pyrenees": "hautes-pyrenees",
  "pyrenees-orientales": "pyrenees-orientales", "bas-rhin": "bas-rhin", "haut-rhin": "haut-rhin", "rhone": "rhone",
  "haute-saone": "haute-saone", "saone-et-loire": "saone-et-loire", "sarthe": "sarthe", "savoie": "savoie",
  "haute-savoie": "haute-savoie", "paris": "paris", "seine-maritime": "seine-maritime", "seine-et-marne": "seine-et-marne",
  "yvelines": "yvelines", "deux-sevres": "deux-sevres", "somme": "somme", "tarn": "tarn", "tarn-et-garonne": "tarn-et-garonne",
  "var": "var", "vaucluse": "vaucluse", "vendee": "vendee", "vienne": "vienne", "haute-vienne": "haute-vienne",
  "vosges": "vosges", "yonne": "yonne", "territoire-de-belfort": "territoire-de-belfort", "essonne": "essonne",
  "hauts-de-seine": "hauts-de-seine", "seine-saint-denis": "seine-saint-denis", "val-de-marne": "val-de-marne",
  "val-d-oise": "val-d-oise", "wallonie": "wallonie", "luxembourg": "luxembourg-country",
};

export const FR_REGION_LABELS: Record<string, string> = {
  "ain": "Ain (01)", "aisne": "Aisne (02)", "allier": "Allier (03)", "alpes-de-haute-provence": "Alpes-de-Haute-Provence (04)",
  "hautes-alpes": "Hautes-Alpes (05)", "alpes-maritimes": "Alpes-Maritimes (06)", "ardeche": "Ardèche (07)",
  "ardennes": "Ardennes (08)", "ariege": "Ariège (09)", "aube": "Aube (10)", "aude": "Aude (11)", "aveyron": "Aveyron (12)",
  "bouches-du-rhone": "Bouches-du-Rhône (13)", "calvados": "Calvados (14)", "cantal": "Cantal (15)",
  "charente": "Charente (16)", "charente-maritime": "Charente-Maritime (17)", "cher": "Cher (18)", "correze": "Corrèze (19)",
  "cote-d-or": "Côte-d'Or (21)", "cotes-d-armor": "Côtes-d'Armor (22)", "creuse": "Creuse (23)", "dordogne": "Dordogne (24)",
  "doubs": "Doubs (25)", "drome": "Drôme (26)", "eure": "Eure (27)", "eure-et-loir": "Eure-et-Loir (28)",
  "finistere": "Finistère (29)", "corse-du-sud": "Corse-du-Sud (2A)", "haute-corse": "Haute-Corse (2B)",
  "gard": "Gard (30)", "haute-garonne": "Haute-Garonne (31)", "gers": "Gers (32)", "gironde": "Gironde (33)",
  "herault": "Hérault (34)", "ille-et-vilaine": "Ille-et-Vilaine (35)", "indre": "Indre (36)", "indre-et-loire": "Indre-et-Loire (37)",
  "isere": "Isère (38)", "jura": "Jura (39)", "landes": "Landes (40)", "loir-et-cher": "Loir-et-Cher (41)",
  "loire": "Loire (42)", "haute-loire": "Haute-Loire (43)", "loire-atlantique": "Loire-Atlantique (44)",
  "loiret": "Loiret (45)", "lot": "Lot (46)", "lot-et-garonne": "Lot-et-Garonne (47)", "lozere": "Lozère (48)",
  "maine-et-loire": "Maine-et-Loire (49)", "manche": "Manche (50)", "marne": "Marne (51)", "haute-marne": "Haute-Marne (52)",
  "mayenne": "Mayenne (53)", "meurthe-et-moselle": "Meurthe-et-Moselle (54)", "meuse": "Meuse (55)", "morbihan": "Morbihan (56)",
  "moselle": "Moselle (57)", "nievre": "Nièvre (58)", "nord": "Nord (59)", "oise": "Oise (60)", "orne": "Orne (61)",
  "pas-de-calais": "Pas-de-Calais (62)", "puy-de-dome": "Puy-de-Dôme (63)", "pyrenees-atlantiques": "Pyrénées-Atlantiques (64)",
  "hautes-pyrenees": "Hautes-Pyrénées (65)", "pyrenees-orientales": "Pyrénées-Orientales (66)", "bas-rhin": "Bas-Rhin (67)",
  "haut-rhin": "Haut-Rhin (68)", "rhone": "Rhône (69)", "haute-saone": "Haute-Saône (70)", "saone-et-loire": "Saöne-et-Loire (71)",
  "sarthe": "Sarthe (72)", "savoie": "Savoie (73)", "haute-savoie": "Haute-Savoie (74)", "paris": "Paris (75)",
  "seine-maritime": "Seine-Maritime (76)", "seine-et-marne": "Seine-et-Marne (77)", "yvelines": "Yvelines (78)",
  "deux-sevres": "Deux-Sèvres (79)", "somme": "Somme (80)", "tarn": "Tarn (81)", "tarn-et-garonne": "Tarn-et-Garonne (82)",
  "var": "Var (83)", "vaucluse": "Vaucluse (84)", "vendee": "Vendée (85)", "vienne": "Vienne (86)", "haute-vienne": "Haute-Vienne (87)",
  "vosges": "Vosges (88)", "yonne": "Yonne (89)", "territoire-de-belfort": "Territoire de Belfort (90)", "essonne": "Essonne (91)",
  "hauts-de-seine": "Hauts-de-Seine (92)", "seine-saint-denis": "Seine-Saint-Denis (93)", "val-de-marne": "Val-de-Marne (94)",
  "val-d-oise": "Val-d'Oise (95)", "wallonie": "Wallonie", "luxembourg": "Luxembourg",
};

export const FR_REGION_SLUGS = Object.keys(FR_REGION_TO_PROVINCE);

export const PROVINCE_TO_FR_REGION: Partial<Record<Province, string>> = {
  "ain": "ain", "aisne": "aisne", "allier": "allier", "alpes-de-haute-provence": "alpes-de-haute-provence",
  "hautes-alpes": "hautes-alpes", "alpes-maritimes": "alpes-maritimes", "ardeche": "ardeche", "ardennes": "ardennes",
  "ariege": "ariege", "aube": "aube", "aude": "aude", "aveyron": "aveyron", "bouches-du-rhone": "bouches-du-rhone",
  "calvados": "calvados", "cantal": "cantal", "charente": "charente", "charente-maritime": "charente-maritime",
  "cher": "cher", "correze": "correze", "cote-d-or": "cote-d-or", "cotes-d-armor": "cotes-d-armor",
  "creuse": "creuse", "dordogne": "dordogne", "doubs": "doubs", "drome": "drome", "eure": "eure",
  "eure-et-loir": "eure-et-loir", "finistere": "finistere", "corse-du-sud": "corse-du-sud", "haute-corse": "haute-corse",
  "gard": "gard", "haute-garonne": "haute-garonne", "gers": "gers", "gironde": "gironde", "herault": "herault",
  "ille-et-vilaine": "ille-et-vilaine", "indre": "indre", "indre-et-loire": "indre-et-loire", "isere": "isere",
  "jura": "jura", "landes": "landes", "loir-et-cher": "loir-et-cher", "loire": "loire", "haute-loire": "haute-loire",
  "loire-atlantique": "loire-atlantique", "loiret": "loiret", "lot": "lot", "lot-et-garonne": "lot-et-garonne",
  "lozere": "lozere", "maine-et-loire": "maine-et-loire", "manche": "manche", "marne": "marne", "haute-marne": "haute-marne",
  "mayenne": "mayenne", "meurthe-et-moselle": "meurthe-et-moselle", "meuse": "meuse", "morbihan": "morbihan",
  "moselle": "moselle", "nievre": "nievre", "nord": "nord", "oise": "oise", "orne": "orne", "pas-de-calais": "pas-de-calais",
  "puy-de-dome": "puy-de-dome", "pyrenees-atlantiques": "pyrenees-atlantiques", "hautes-pyrenees": "hautes-pyrenees",
  "pyrenees-orientales": "pyrenees-orientales", "bas-rhin": "bas-rhin", "haut-rhin": "haut-rhin", "rhone": "rhone",
  "haute-saone": "haute-saone", "saone-et-loire": "saone-et-loire", "sarthe": "sarthe", "savoie": "savoie",
  "haute-savoie": "haute-savoie", "paris": "paris", "seine-maritime": "seine-maritime", "seine-et-marne": "seine-et-marne",
  "yvelines": "yvelines", "deux-sevres": "deux-sevres", "somme": "somme", "tarn": "tarn", "tarn-et-garonne": "tarn-et-garonne",
  "var": "var", "vaucluse": "vaucluse", "vendee": "vendee", "vienne": "vienne", "haute-vienne": "haute-vienne",
  "vosges": "vosges", "yonne": "yonne", "territoire-de-belfort": "territoire-de-belfort", "essonne": "essonne",
  "hauts-de-seine": "hauts-de-seine", "seine-saint-denis": "seine-saint-denis", "val-de-marne": "val-de-marne",
  "val-d-oise": "val-d-oise", "wallonie": "wallonie", "luxembourg-country": "luxembourg",
};

// ─── hreflang helpers ─────────────────────────────────────────────────────────
const BASE = "https://weerzone.nl";

export function buildHreflang(path: string): HreflangEntry[] {
  return [
    { hreflang: LOCALES.nl.hreflang, href: `${BASE}${path}` },
    { hreflang: LOCALES.de.hreflang, href: `${BASE}/de${path}` },
    { hreflang: LOCALES.fr.hreflang, href: `${BASE}/fr${path}` },
    { hreflang: LOCALES.es.hreflang, href: `${BASE}/es${path}` },
    { hreflang: "x-default", href: `${BASE}${path}` },
  ];
}

export function buildHreflangSingle(path: string, locale: Locale): HreflangEntry[] {
  return [
    { hreflang: LOCALES[locale].hreflang, href: `${BASE}${path}` },
    { hreflang: "x-default", href: `${BASE}${path}` },
  ];
}
