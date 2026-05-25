import { LOCALES, type HreflangEntry } from "@/config/locales";

const BASE_URL = "https://weerzone.nl";

function localizedPath(path: string, prefix: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath === "/") return prefix || "/";
  return `${prefix}${cleanPath}`;
}

export function hreflangLanguages(path: string): Record<string, string> {
  const entries: HreflangEntry[] = [
    { hreflang: LOCALES.nl.hreflang, href: `${BASE_URL}${localizedPath(path, "")}` },
    { hreflang: LOCALES.de.hreflang, href: `${BASE_URL}${localizedPath(path, "/de")}` },
    { hreflang: LOCALES.fr.hreflang, href: `${BASE_URL}${localizedPath(path, "/fr")}` },
    { hreflang: LOCALES.es.hreflang, href: `${BASE_URL}${localizedPath(path, "/es")}` },
    { hreflang: "x-default", href: `${BASE_URL}${localizedPath(path, "")}` },
  ];

  return Object.fromEntries(entries.map((entry) => [entry.hreflang, entry.href]));
}

/**
 * Hreflang voor pagina's die maar in één locale bestaan (stadpagina's NL/DE/
 * FR/ES). Self + x-default = self, zodat Google geen valse equivalenten zoekt.
 */
export function hreflangSelf(
  selfLocale: "nl" | "de" | "fr" | "es",
  selfPath: string
): Record<string, string> {
  const tag = LOCALES[selfLocale].hreflang;
  const href = `${BASE_URL}${selfPath}`;
  return { [tag]: href, "x-default": href };
}

/**
 * Luxembourg-stadpagina's bestaan in zowel DE als FR — sitemap-lu.xml verwijst
 * naar beide. Hreflang clustert ze met elkaar zodat de variant in de juiste
 * taal in de SERP verschijnt.
 */
export function hreflangLuxembourg(citySlug: string): Record<string, string> {
  const de = `${BASE_URL}/de/wetter/luxembourg/${citySlug}`;
  const fr = `${BASE_URL}/fr/meteo/luxembourg/${citySlug}`;
  return {
    "de-DE": de,
    "de-LU": de,
    "fr-FR": fr,
    "fr-LU": fr,
    "x-default": fr,
  };
}
