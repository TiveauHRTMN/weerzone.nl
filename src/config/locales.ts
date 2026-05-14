/**
 * Centrale locale-configuratie voor Weerzone.
 *
 * NL  → Piet-tier,  routes zonder prefix  (/mijnweer, /weer/…)
 * DE  → Karl-tier,  routes onder /de/     (/de/mein-wetter, /de/wetter/…)
 *
 * Voeg /be/ toe door een derde locale entry te maken.
 */

import type { Province } from "@/lib/places-data";

// ─── Locale type ─────────────────────────────────────────────────────────────
export type Locale = "nl" | "de";

// ─── Nav link definitie ───────────────────────────────────────────────────────
export interface NavLink {
  key: string;
  label: string;
  href: string;
}

// ─── Locale config ────────────────────────────────────────────────────────────
export interface LocaleConfig {
  locale: Locale;
  lang: string;
  entryTier: "piet" | "karl";
  routes: {
    home: string;
    myWeather: string;
    warnings: string;
    pricing: string;
    about: string;
    contact: string;
    weather: string;
  };
  nav: NavLink[];
  meta: {
    titleDefault: string;
    titleTemplate: string;
    description: string;
    ogLocale: string;
    siteName: string;
  };
  hreflang: string;
}

export const LOCALES: Record<Locale, LocaleConfig> = {
  nl: {
    locale: "nl",
    lang: "nl",
    entryTier: "piet",
    routes: {
      home: "/",
      myWeather: "/mijnweer",
      warnings: "/waarschuwingen",
      pricing: "/prijzen",
      about: "/over",
      contact: "/contact",
      weather: "/weer",
    },
    nav: [
      { key: "mijnweer",        label: "Mijn Weer",      href: "/mijnweer" },
      { key: "waarschuwingen",  label: "Waarschuwingen", href: "/waarschuwingen" },
      { key: "zakelijk",        label: "Zakelijk",       href: "/zakelijk" },
      { key: "prijzen",         label: "Prijzen",        href: "/prijzen" },
      { key: "over",            label: "Over",           href: "/over" },
      { key: "contact",         label: "Contact",        href: "/contact" },
    ],
    meta: {
      titleDefault:   "WEERZONE | Weerkeuzes voor vandaag en morgen",
      titleTemplate:  "%s | WEERZONE",
      description:    "WEERZONE helpt je beslissen wat je vandaag en morgen met het weer doet. Hyperlokaal, tot 48 uur vooruit.",
      ogLocale:       "nl_NL",
      siteName:       "WEERZONE",
    },
    hreflang: "nl-NL",
  },

  de: {
    locale: "de",
    lang: "de",
    entryTier: "karl",
    routes: {
      home: "/de",
      myWeather: "/de/mein-wetter",
      warnings: "/de/warnungen",
      pricing: "/de/preise",
      about: "/de/uber-uns",
      contact: "/de/kontakt",
      weather: "/de/wetter",
    },
    nav: [
      { key: "mein-wetter", label: "Mein Wetter", href: "/de/mein-wetter" },
      { key: "warnungen",   label: "Warnungen",   href: "/de/warnungen" },
      { key: "preise",      label: "Preise",      href: "/de/preise" },
      { key: "uber-uns",    label: "Über uns",    href: "/de/uber-uns" },
      { key: "kontakt",     label: "Kontakt",     href: "/de/kontakt" },
    ],
    meta: {
      titleDefault:   "WEERZONE | Lokale Wettervorhersage für Deutschland",
      titleTemplate:  "%s | WEERZONE Deutschland",
      description:    "Aktuelle Wettervorhersage für Deutschland. Präzise lokale Prognosen für Temperatur, Niederschlag, Wind und Warnungen für die nächsten 48 Stunden.",
      ogLocale:       "de_DE",
      siteName:       "WEERZONE",
    },
    hreflang: "de-DE",
  },
};

// ─── Locale detection ─────────────────────────────────────────────────────────
export function detectLocale(pathname: string): Locale {
  if (pathname === "/de" || pathname.startsWith("/de/")) return "de";
  return "nl";
}

export function getLocaleConfig(pathname: string): LocaleConfig {
  return LOCALES[detectLocale(pathname)];
}

// ─── Bundesland URL-slug ↔ interne province-key mapping ──────────────────────
// /de/wetter/[bundesland]/[ort] gebruikt Duitse URL-slugs voor SEO.
// Intern slaan we plaatsen op met de Dutch-slang province-keys.

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
  // Identiek in Duits en intern
  "hessen":                  "hessen",
  "hamburg":                 "hamburg",
  "bremen":                  "bremen",
  "saarland":                "saarland",
  "brandon":                 "brandenburg",
};

export const PROVINCE_TO_DE_BUNDESLAND: Partial<Record<Province, string>> = {
  berlijn:                   "berlin",
  beieren:                   "bayern",
  "noordrijn-westfalen":     "nordrhein-westfalen",
  nedersaksen:               "niedersachsen",
  saksen:                    "sachsen",
  "saksen-anhalt":           "sachsen-anhalt",
  thuringen:                 "thueringen",
  "mecklenburg-voorpommeren":"mecklenburg-vorpommern",
  "sleeswijk-holstein":      "schleswig-holstein",
  "rijnland-palts":          "rheinland-pfalz",
  "baden-wurttemberg":       "baden-wuerttemberg",
  hessen:                    "hessen",
  hamburg:                   "hamburg",
  bremen:                    "bremen",
  saarland:                  "saarland",
  brandenburg:               "brandon",
};

// Weergave-namen voor /de/wetter/[bundesland] pagina's
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
  brandon:                  "Brandenburg",
};

// Alle geldige Duitse Bundesland URL-slugs
export const DE_BUNDESLAND_SLUGS = Object.keys(DE_BUNDESLAND_TO_PROVINCE);

// ─── hreflang helpers ─────────────────────────────────────────────────────────
const BASE = "https://weerzone.nl";

export interface HreflangEntry {
  hreflang: string;
  href: string;
}

export function buildHreflang(nlPath: string, dePath: string): HreflangEntry[] {
  return [
    { hreflang: "nl-NL",    href: `${BASE}${nlPath}` },
    { hreflang: "de-DE",    href: `${BASE}${dePath}` },
    { hreflang: "x-default", href: `${BASE}${nlPath}` },
  ];
}

// Voor pagina's die alleen in één taal bestaan (bijv. DE-weerplaats zonder NL-equivalent)
export function buildHreflangSingle(path: string, locale: Locale): HreflangEntry[] {
  return [
    { hreflang: LOCALES[locale].hreflang, href: `${BASE}${path}` },
    { hreflang: "x-default", href: `${BASE}${path}` },
  ];
}
