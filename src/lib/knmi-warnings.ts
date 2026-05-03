/**
 * KNMI weeralarmen — geparsed uit de officiële KNMI provincie-HTML.
 *
 * De oude RSS-feed (cdn.knmi.nl/.../rss_KNMIwaarschuwingen.xml) werd door KNMI
 * bevroren in 2023 en geeft nu permanent oude data terug. We scrapen daarom
 * direct de provincie-pagina's, dezelfde HTML die op knmi.nl wordt getoond.
 */

export type KNMISeverity = "GREEN" | "YELLOW" | "ORANGE" | "RED";

export interface KNMIWarning {
  province: string;          // KNMI display-name, bv. "Noord-Holland"
  provinceSlug: string;      // URL-slug, bv. "noord-holland"
  type: string;              // "Onweersbuien", "Windstoten", "Gladheid", ...
  severity: KNMISeverity;    // GREEN / YELLOW / ORANGE / RED
  description: string;       // platte tekst zoals KNMI hem toont
  validFrom: string | null;  // ISO 8601 (Europe/Amsterdam-naïef → UTC), null = onbekend
  validUntil: string | null; // idem
  issuedAt: string | null;   // ISO 8601 — moment van uitgifte
  /** Stabiele dedup-key (hash-vrij): provinceSlug|type|severity|validFrom|issuedAt */
  key: string;
}

/** Optionele verrijking met Open-Meteo data binnen het waarschuwingsvenster. */
export interface KNMIWarningEnriched extends KNMIWarning {
  enriched?: {
    capeMaxJkg: number;
    precipitationPeakMm: number;
    precipitationPeakHour: string | null;  // ISO van het uur met meeste regen
    precipitationTotalMm: number;
    windPeakKmh: number;
    windPeakHour: string | null;
  };
}

const PROVINCE_SLUGS = [
  "groningen", "friesland", "drenthe", "overijssel", "flevoland",
  "gelderland", "utrecht", "noord-holland", "zuid-holland", "zeeland",
  "noord-brabant", "limburg",
] as const;

export const PROVINCE_SLUG_TO_KNMI: Record<string, string> = {
  "groningen": "Groningen",
  "friesland": "Friesland",
  "drenthe": "Drenthe",
  "overijssel": "Overijssel",
  "flevoland": "Flevoland",
  "gelderland": "Gelderland",
  "utrecht": "Utrecht",
  "noord-holland": "Noord-Holland",
  "zuid-holland": "Zuid-Holland",
  "zeeland": "Zeeland",
  "noord-brabant": "Noord-Brabant",
  "limburg": "Limburg",
};

const SEVERITY_BY_STATUS: Record<string, KNMISeverity> = {
  "0": "GREEN",
  "1": "YELLOW",
  "2": "ORANGE",
  "3": "RED",
};

function stripHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<a\b[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/([.!?])([A-Z])/g, "$1 $2")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** "02/05/2026 13:59 uur LT" → ISO 8601 (treat as Europe/Amsterdam). */
function parseIssuedAt(meta: string): string | null {
  const m = meta.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, dd, mm, yyyy, hh, mi] = m;
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:00`;
}

/**
 * Combineer baseDate (uitgifte-datum) + dayOffset + "HH:MM" → ISO datetime
 * (Europe/Amsterdam naïef). dayOffset 0 = uitgifte-dag.
 */
function buildIso(baseDate: string, dayOffset: number, time: string): string | null {
  const t = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!t) return null;
  const [, hStr, mStr] = t;
  const base = new Date(`${baseDate}T00:00:00Z`); // UTC anchor for arithmetic
  base.setUTCDate(base.getUTCDate() + dayOffset);
  const yyyy = base.getUTCFullYear();
  const mm = String(base.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(base.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hStr.padStart(2, "0")}:${mStr}:00`;
}

/** Parse één warning-overview block uit de KNMI provincie-HTML. */
function parseWarningBlock(
  block: string,
  meta: string,
  issuedAt: string | null,
  provinceSlug: string,
): KNMIWarning | null {
  const statusMatch = block.match(/data-statuscode="(\d+)"/);
  const severity = statusMatch ? (SEVERITY_BY_STATUS[statusMatch[1]] ?? "YELLOW") : "YELLOW";
  if (severity === "GREEN") return null;

  const typeMatch = block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
  const type = typeMatch ? stripHtml(typeMatch[1]).trim() : "Waarschuwing";

  const descMatch = block.match(/class="warning-overview__description"[^>]*>([\s\S]*?)<\/div>/);
  const description = descMatch ? stripHtml(descMatch[1]) : "";

  const sectionMatch = block.match(
    /class="warning-timeline__section"[^>]*data-from-day="(\d+)"[^>]*data-from-time="([^"]+)"[^>]*data-until-day="(\d+)"[^>]*data-until-time="([^"]+)"/,
  );
  let validFrom: string | null = null;
  let validUntil: string | null = null;
  if (sectionMatch && issuedAt) {
    const [, fromDay, fromTime, untilDay, untilTime] = sectionMatch;
    const issuedDate = issuedAt.slice(0, 10);
    validFrom = buildIso(issuedDate, parseInt(fromDay, 10), fromTime);
    validUntil = buildIso(issuedDate, parseInt(untilDay, 10), untilTime);
  }

  const key = [
    provinceSlug,
    type,
    severity,
    validFrom ?? "?",
    issuedAt ?? "?",
  ].join("|");

  return {
    province: PROVINCE_SLUG_TO_KNMI[provinceSlug] ?? provinceSlug,
    provinceSlug,
    type,
    severity,
    description,
    validFrom,
    validUntil,
    issuedAt,
    key,
  };
}

async function fetchProvincePage(slug: string): Promise<KNMIWarning[]> {
  const url = `https://www.knmi.nl/nederland-nu/weer/waarschuwingen/${slug}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { "User-Agent": "WeerzoneBot/1.0 (+https://weerzone.nl)" },
    });
    if (!res.ok) return [];
    const html = await res.text();

    const metaMatch = html.match(/<p class="meta">\s*Uitgifte:\s*([^<]+?)\s*<\/p>/);
    const issuedAt = metaMatch ? parseIssuedAt(metaMatch[1]) : null;

    const blocks: string[] = [];
    const blockRegex = /<div class="warning-overview--container">[\s\S]*?(?=<div class="warning-overview__nav|<div class="weather__text|<\/section>|<footer)/g;
    let m;
    while ((m = blockRegex.exec(html)) !== null) {
      blocks.push(m[0]);
    }

    const warnings: KNMIWarning[] = [];
    for (const block of blocks) {
      const w = parseWarningBlock(block, "", issuedAt, slug);
      if (w) warnings.push(w);
    }
    return warnings;
  } catch (err) {
    console.error(`KNMI fetch failed for ${slug}:`, err);
    return [];
  }
}

/** Haal alle actieve KNMI-waarschuwingen op (12 provincies parallel). */
export async function fetchKNMIWarnings(): Promise<KNMIWarning[]> {
  const all = await Promise.all(PROVINCE_SLUGS.map(fetchProvincePage));
  return all.flat();
}

export function warningsForProvince(
  warnings: KNMIWarning[],
  provinceSlug: string,
): KNMIWarning[] {
  return warnings.filter((w) => w.provinceSlug === provinceSlug);
}

export function highestSeverity(warnings: KNMIWarning[]): KNMISeverity | null {
  if (warnings.some((w) => w.severity === "RED")) return "RED";
  if (warnings.some((w) => w.severity === "ORANGE")) return "ORANGE";
  if (warnings.some((w) => w.severity === "YELLOW")) return "YELLOW";
  return null;
}

/**
 * Verrijk een waarschuwing met Open-Meteo metingen binnen het tijdvenster:
 * CAPE-piek, neerslag-totaal/-piek, wind-piek.
 */
export async function enrichWarning(
  warning: KNMIWarning,
  lat: number,
  lon: number,
): Promise<KNMIWarningEnriched> {
  if (!warning.validFrom || !warning.validUntil) return warning;

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?` +
      new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        hourly: "precipitation,wind_speed_10m,wind_gusts_10m,cape",
        timezone: "Europe/Amsterdam",
        forecast_days: "3",
      }).toString();

    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return warning;
    const data = await res.json();
    const h = data.hourly;
    if (!h?.time) return warning;

    const fromMs = new Date(warning.validFrom).getTime();
    const untilMs = new Date(warning.validUntil).getTime();

    let capeMax = 0;
    let precipPeak = 0;
    let precipPeakHour: string | null = null;
    let precipTotal = 0;
    let windPeak = 0;
    let windPeakHour: string | null = null;

    for (let i = 0; i < h.time.length; i++) {
      const t = new Date(h.time[i]).getTime();
      if (t < fromMs || t > untilMs) continue;
      const cape = h.cape?.[i] ?? 0;
      const precip = h.precipitation?.[i] ?? 0;
      const wind = Math.max(h.wind_speed_10m?.[i] ?? 0, h.wind_gusts_10m?.[i] ?? 0);
      if (cape > capeMax) capeMax = cape;
      if (precip > precipPeak) { precipPeak = precip; precipPeakHour = h.time[i]; }
      precipTotal += precip;
      if (wind > windPeak) { windPeak = wind; windPeakHour = h.time[i]; }
    }

    return {
      ...warning,
      enriched: {
        capeMaxJkg: Math.round(capeMax),
        precipitationPeakMm: Math.round(precipPeak * 10) / 10,
        precipitationPeakHour: precipPeakHour,
        precipitationTotalMm: Math.round(precipTotal * 10) / 10,
        windPeakKmh: Math.round(windPeak),
        windPeakHour,
      },
    };
  } catch (err) {
    console.error("enrichWarning failed:", err);
    return warning;
  }
}

/**
 * Vind de provincie-slug van de dichtstbijzijnde plaats voor een coördinaat.
 * Niet super precies maar prima voor het toewijzen van KNMI-warnings aan een
 * gebruikerslocatie.
 */
export async function nearestProvinceSlug(lat: number, lon: number): Promise<string | null> {
  const { ALL_PLACES } = await import("@/lib/places-data");
  let nearest = ALL_PLACES[0];
  let minDist = Infinity;
  for (const p of ALL_PLACES) {
    const dLat = (p.lat - lat) * Math.PI / 180;
    const dLon = (p.lon - lon) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat * Math.PI / 180) * Math.cos(p.lat * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    const dist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 6371;
    if (dist < minDist) { minDist = dist; nearest = p; }
  }
  return nearest?.province ?? null;
}

/** Beknopte tijd-label voor banners ("Vandaag 21:00–02:00"). */
export function formatWindowLabel(w: KNMIWarning): string {
  if (!w.validFrom || !w.validUntil) return "";
  const from = new Date(w.validFrom);
  const until = new Date(w.validUntil);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fromDay = new Date(from);
  fromDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round((fromDay.getTime() - today.getTime()) / 86400000);

  let dayLabel = "";
  if (diffDays === 0) dayLabel = "Vandaag";
  else if (diffDays === 1) dayLabel = "Morgen";
  else dayLabel = from.toLocaleDateString("nl-NL", { weekday: "short" });

  const fromHM = `${String(from.getHours()).padStart(2, "0")}:${String(from.getMinutes()).padStart(2, "0")}`;
  const untilHM = `${String(until.getHours()).padStart(2, "0")}:${String(until.getMinutes()).padStart(2, "0")}`;
  return `${dayLabel} ${fromHM}–${untilHM}`;
}

export const SEVERITY_LABEL: Record<KNMISeverity, string> = {
  GREEN: "Geen waarschuwing",
  YELLOW: "Code geel",
  ORANGE: "Code oranje",
  RED: "Code rood",
};
