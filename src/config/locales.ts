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

const nlRoutes = {
  home: "/",
  weather: "/weer",
  myWeather: "/vandaag",
  warnings: "/vandaag#reed",
};

const nlNav: LocaleConfig["nav"] = [
  { key: "home", label: "Home", href: "/", sublabel: "Het weer op jouw plek" },
  { key: "vandaag", label: "Vandaag", href: "/vandaag", sublabel: "Wat vandaag voor jou betekent" },
  { key: "morgen", label: "Morgen", href: "/morgen", sublabel: "Vooruitkijken zonder ruis" },
  { key: "over", label: "Over", href: "/over", sublabel: "Hoe Weerzone werkt" },
  { key: "contact", label: "Contact", href: "/contact", sublabel: "Vraag of opmerking" },
];

function disabledLocale(code: Locale): LocaleConfig {
  return {
    code,
    label: "Nederland",
    hreflang: "nl-NL",
    routes: nlRoutes,
    nav: nlNav,
  };
}

export const LOCALES: Record<Locale, LocaleConfig> = {
  nl: disabledLocale("nl"),
  de: disabledLocale("de"),
  fr: disabledLocale("fr"),
  es: disabledLocale("es"),
};

export const DEFAULT_LOCALE: Locale = "nl";

export function detectLocale(): Locale {
  return "nl";
}

const BASE = "https://weerzone.nl";

export function buildHreflang(path: string): HreflangEntry[] {
  return [
    { hreflang: "nl-NL", href: `${BASE}${path}` },
    { hreflang: "x-default", href: `${BASE}${path}` },
  ];
}

export function buildHreflangSingle(path: string): HreflangEntry[] {
  return buildHreflang(path);
}
