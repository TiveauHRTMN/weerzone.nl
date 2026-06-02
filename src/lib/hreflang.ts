import { LOCALES, type HreflangEntry } from "@/config/locales";

const BASE_URL = "https://weerzone.nl";

function localizedPath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

export function hreflangLanguages(path: string): Record<string, string> {
  const href = `${BASE_URL}${localizedPath(path)}`;
  const entries: HreflangEntry[] = [
    { hreflang: LOCALES.nl.hreflang, href },
    { hreflang: "x-default", href },
  ];

  return Object.fromEntries(entries.map((entry) => [entry.hreflang, entry.href]));
}

export function hreflangSelf(
  _selfLocale: "nl" | "de" | "fr" | "es",
  selfPath: string
): Record<string, string> {
  const href = `${BASE_URL}${localizedPath(selfPath)}`;
  return { [LOCALES.nl.hreflang]: href, "x-default": href };
}

export function hreflangCluster(paths: {
  nl: string;
  de?: string;
  fr?: string;
  es?: string;
  xDefault?: "nl" | "de" | "fr" | "es";
}): Record<string, string> {
  const href = `${BASE_URL}${localizedPath(paths.nl)}`;
  return { [LOCALES.nl.hreflang]: href, "x-default": href };
}
