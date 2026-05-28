/**
 * DWD-Wetterwarnungen — geparsed uit de officiële WarnWetter-app JSONP feed.
 *
 * Endpoint: https://www.dwd.de/DWD/warnungen/warnapp_landkreise/json/warnings.json
 * Response is JSONP: warnWetter.loadWarnings({ ... });
 * We strippen de wrapper en parsen de JSON.
 *
 * Format (per entry, gegroepeerd onder warncellId):
 *   {
 *     "regionName": "Berlin",
 *     "stateShort": "BE",
 *     "state": "Berlin",
 *     "level": 1-4,                // 1=Wetterwarn, 2=Markant, 3=Unwetter, 4=Extrem
 *     "type": int,                  // type-id (zie DWD docs)
 *     "event": "STURMBÖEN",
 *     "headline": "...",
 *     "description": "...",
 *     "instruction": "...",
 *     "start": 1234567890000,       // ms epoch
 *     "end": 1234567890000
 *   }
 *
 * State-codes:
 *   BW=Baden-Württemberg  BY=Bayern  BE=Berlin  BB=Brandenburg  HB=Bremen
 *   HH=Hamburg            HE=Hessen  MV=Mecklenburg-Vorpommern  NI=Niedersachsen
 *   NW=Nordrhein-Westfalen RP=Rheinland-Pfalz   SL=Saarland     SN=Sachsen
 *   ST=Sachsen-Anhalt     SH=Schleswig-Holstein TH=Thüringen
 */

export type DWDSeverity = "GREEN" | "YELLOW" | "ORANGE" | "RED" | "VIOLET";

export interface DWDWarning {
  bundesland: string;       // Display-naam, bv. "Berlin"
  bundeslandSlug: string;   // URL-slug, bv. "berlin"
  stateShort: string;       // DWD code, bv. "BE"
  region: string;           // Specifiek Landkreis/regio (vaak gelijk aan bundesland)
  type: string;             // Event-type, bv. "STURMBÖEN"
  severity: DWDSeverity;
  headline: string;
  description: string;
  instruction: string | null;
  validFrom: string | null;   // ISO 8601 UTC
  validUntil: string | null;  // ISO 8601 UTC
  /** Stabiele dedup-key */
  key: string;
}

export interface DWDWarningAdvice {
  impactTitle: string;
  expect: string[];
  actions: string[];
}

/** state-short → URL-slug (matched met DE_BUNDESLAND_SLUGS in config/locales.ts) */
export const STATE_SHORT_TO_SLUG: Record<string, string> = {
  BW: "baden-wuerttemberg",
  BY: "bayern",
  BE: "berlin",
  BB: "brandenburg",
  HB: "bremen",
  HH: "hamburg",
  HE: "hessen",
  MV: "mecklenburg-vorpommern",
  NI: "niedersachsen",
  NW: "nordrhein-westfalen",
  RP: "rheinland-pfalz",
  SL: "saarland",
  SN: "sachsen",
  ST: "sachsen-anhalt",
  SH: "schleswig-holstein",
  TH: "thueringen",
};

export const STATE_SHORT_TO_LABEL: Record<string, string> = {
  BW: "Baden-Württemberg",
  BY: "Bayern",
  BE: "Berlin",
  BB: "Brandenburg",
  HB: "Bremen",
  HH: "Hamburg",
  HE: "Hessen",
  MV: "Mecklenburg-Vorpommern",
  NI: "Niedersachsen",
  NW: "Nordrhein-Westfalen",
  RP: "Rheinland-Pfalz",
  SL: "Saarland",
  SN: "Sachsen",
  ST: "Sachsen-Anhalt",
  SH: "Schleswig-Holstein",
  TH: "Thüringen",
};

export const SEVERITY_LABEL: Record<DWDSeverity, string> = {
  GREEN: "Keine Warnung",
  YELLOW: "Wetterwarnung",
  ORANGE: "Markante Wetterwarnung",
  RED: "Unwetterwarnung",
  VIOLET: "Extreme Unwetterwarnung",
};

function levelToSeverity(level: number): DWDSeverity {
  if (level >= 4) return "VIOLET";
  if (level === 3) return "RED";
  if (level === 2) return "ORANGE";
  if (level === 1) return "YELLOW";
  return "GREEN";
}

interface DWDRawWarning {
  regionName?: string;
  stateShort?: string;
  state?: string;
  level?: number;
  type?: number;
  event?: string;
  headline?: string;
  description?: string;
  instruction?: string;
  start?: number;
  end?: number;
}

function toIso(epochMs?: number): string | null {
  if (!epochMs || !Number.isFinite(epochMs)) return null;
  try {
    return new Date(epochMs).toISOString();
  } catch {
    return null;
  }
}

function parseEntry(stateShort: string, raw: DWDRawWarning): DWDWarning | null {
  const level = typeof raw.level === "number" ? raw.level : 0;
  const severity = levelToSeverity(level);
  if (severity === "GREEN") return null;

  const slug = STATE_SHORT_TO_SLUG[stateShort];
  if (!slug) return null;

  const bundesland = STATE_SHORT_TO_LABEL[stateShort] ?? raw.state ?? stateShort;
  const validFrom = toIso(raw.start);
  const validUntil = toIso(raw.end);

  return {
    bundesland,
    bundeslandSlug: slug,
    stateShort,
    region: raw.regionName ?? bundesland,
    type: raw.event ?? "Wetterwarnung",
    severity,
    headline: raw.headline ?? raw.event ?? "Wetterwarnung",
    description: raw.description ?? "",
    instruction: raw.instruction ?? null,
    validFrom,
    validUntil,
    key: [slug, raw.event ?? "?", severity, validFrom ?? "?", raw.regionName ?? "?"].join("|"),
  };
}

/**
 * Strip de JSONP wrapper `warnWetter.loadWarnings(...);` en geef de JSON terug.
 */
function stripJsonp(body: string): string {
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Onverwachte DWD-response (geen JSON-object gevonden)");
  }
  return body.slice(start, end + 1);
}

/** Haal alle actieve DWD-warnings op (alle bundeslands tegelijk). */
export async function fetchDWDWarnings(): Promise<DWDWarning[]> {
  if (process.env.NEXT_PHASE === "phase-production-build") return [];

  const url = "https://www.dwd.de/DWD/warnungen/warnapp_landkreise/json/warnings.json";
  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { "User-Agent": "WeerzoneBot/1.0 (+https://weerzone.nl)" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const body = await res.text();
    const json = JSON.parse(stripJsonp(body)) as {
      warnings?: Record<string, DWDRawWarning[]>;
    };
    const warnings: DWDWarning[] = [];
    const seen = new Set<string>();
    const map = json.warnings ?? {};
    for (const entries of Object.values(map)) {
      if (!Array.isArray(entries)) continue;
      for (const raw of entries) {
        const stateShort = raw.stateShort;
        if (!stateShort) continue;
        const w = parseEntry(stateShort, raw);
        if (!w) continue;
        if (seen.has(w.key)) continue;
        seen.add(w.key);
        warnings.push(w);
      }
    }
    return warnings;
  } catch (err) {
    console.error("DWD fetch failed:", err);
    return [];
  }
}

export function warningsForBundesland(
  warnings: DWDWarning[],
  bundeslandSlug: string,
): DWDWarning[] {
  return warnings.filter((w) => w.bundeslandSlug === bundeslandSlug);
}

export function highestSeverity(warnings: DWDWarning[]): DWDSeverity | null {
  if (warnings.some((w) => w.severity === "VIOLET")) return "VIOLET";
  if (warnings.some((w) => w.severity === "RED")) return "RED";
  if (warnings.some((w) => w.severity === "ORANGE")) return "ORANGE";
  if (warnings.some((w) => w.severity === "YELLOW")) return "YELLOW";
  return null;
}

/**
 * Map lat/lon naar het dichtstbijzijnde Bundesland (via places-data).
 * Niet GPS-precies — voldoende om DWD-warnings aan een gebruikerslocatie te koppelen.
 */
export async function nearestBundeslandSlug(lat: number, lon: number): Promise<string | null> {
  const { ALL_PLACES } = await import("@/lib/places-data");
  const { PROVINCE_TO_DE_BUNDESLAND } = await import("@/config/locales");
  let nearest = ALL_PLACES[0];
  let minDist = Infinity;
  for (const p of ALL_PLACES) {
    const dLat = ((p.lat - lat) * Math.PI) / 180;
    const dLon = ((p.lon - lon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((p.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const dist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 6371;
    if (dist < minDist) {
      minDist = dist;
      nearest = p;
    }
  }
  if (!nearest?.province) return null;
  return PROVINCE_TO_DE_BUNDESLAND[nearest.province as keyof typeof PROVINCE_TO_DE_BUNDESLAND] ?? null;
}

export function formatWindowLabel(w: DWDWarning): string {
  if (!w.validFrom || !w.validUntil) return "";
  const tz = "Europe/Berlin";
  const from = new Date(w.validFrom);
  const until = new Date(w.validUntil);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fromDay = new Date(from);
  fromDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round((fromDay.getTime() - today.getTime()) / 86400000);

  let dayLabel = "";
  if (diffDays === 0) dayLabel = "Heute";
  else if (diffDays === 1) dayLabel = "Morgen";
  else dayLabel = from.toLocaleDateString("de-DE", { weekday: "short", timeZone: tz });

  const fmt = (d: Date) =>
    d.toLocaleTimeString("de-DE", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
  return `${dayLabel} ${fmt(from)}–${fmt(until)}`;
}

export function warningAdviceFor(warning: Pick<DWDWarning, "type" | "description">): DWDWarningAdvice {
  const text = `${warning.type} ${warning.description}`.toLowerCase();

  if (text.includes("sturm") || text.includes("orkan") || text.includes("böen") || text.includes("wind")) {
    return {
      impactTitle: "Sturmböen: was bedeutet das praktisch?",
      expect: [
        "Radfahrer, Fußgänger und hohe Fahrzeuge können beeinträchtigt werden — besonders an der Küste, auf Brücken und bei offenen Flächen.",
        "Lose Gegenstände wie Container, Gartenmöbel, Trampoline, Sonnenschirme und Baumaterial können wegfliegen.",
        "An Bäumen besteht Risiko abbrechender Äste. Parken oder Gehen unter Bäumen ist während des Höhepunkts weniger sinnvoll.",
      ],
      actions: [
        "Sichere lose Gegenstände, bevor die Warnung beginnt, oder hol sie rein.",
        "Verschiebe Wassersport, Strandaktivitäten und Höhenarbeit, wenn möglich.",
        "Fahre langsamer über Brücken, Dämme und offene Strecken; halte mehr Abstand zu LKW und Anhängern.",
        "Parke nicht unter Bäumen und meide Wald oder Dünen während der stärksten Böen.",
      ],
    };
  }

  if (text.includes("gewitter") || text.includes("blitz")) {
    return {
      impactTitle: "Gewitter: was bedeutet das praktisch?",
      expect: [
        "Risiko von Blitzschlag, kräftigen Schauern, Windböen und lokal viel Wasser in kurzer Zeit.",
        "Aktivitäten draußen, Sportplätze, offene Gewässer und freies Gelände werden riskanter.",
      ],
      actions: [
        "Geh nach drinnen, sobald du Donner hörst — und meide Bäume, Masten und offene Gewässer.",
        "Ziehe lose Elektrogeräte vom Strom oder nutze Überspannungsschutz.",
        "Plane Außenaktivitäten um die Schauer herum und prüfe kurz vor Aufbruch die Warnlage erneut.",
      ],
    };
  }

  if (text.includes("regen") || text.includes("starkregen") || text.includes("niederschlag")) {
    return {
      impactTitle: "Starkregen: was bedeutet das praktisch?",
      expect: [
        "Risiko von Wasser auf der Straße, schlechter Sicht und längerer Fahrzeit.",
        "Tiefliegende Straßen, Tunnel und Keller können lokal Probleme bekommen.",
      ],
      actions: [
        "Kontrolliere Dachrinnen, Abflüsse und Kellerentwässerung, wenn du weißt, dass sie empfindlich sind.",
        "Meide überflutete Straßen und fahre nicht schnell durch tiefe Pfützen.",
        "Plane mehr Fahrzeit ein und halte Abstand im Verkehr.",
      ],
    };
  }

  if (text.includes("glätte") || text.includes("schnee") || text.includes("eis")) {
    return {
      impactTitle: "Glätte: was bedeutet das praktisch?",
      expect: [
        "Gehwege, Radwege, Brücken sowie Auf- und Abfahrten können stellenweise glatt sein.",
        "Reisezeit kann sich durch geringere Geschwindigkeit und Zwischenfälle schnell verlängern.",
      ],
      actions: [
        "Fahr früher los oder verschiebe nicht-notwendige Fahrten.",
        "Gehe und fahre ruhiger; Brücken und schattige Stellen sind oft zuerst glatt.",
        "Streue an deiner Tür oder Auffahrt, wenn dort viel gegangen wird.",
      ],
    };
  }

  if (text.includes("hitze")) {
    return {
      impactTitle: "Hitze: was bedeutet das praktisch?",
      expect: [
        "Empfindliche Menschen, Haustiere und schwere körperliche Arbeit draußen sind stärker gefährdet.",
        "Innenräume und Autos können sich schnell aufheizen.",
      ],
      actions: [
        "Trinke ausreichend Wasser und meide schwere Anstrengung in den heißesten Stunden.",
        "Halte Vorhänge auf der Sonnenseite geschlossen und lüfte, sobald es draußen kühler wird.",
        "Lass Kinder und Tiere nie im Auto zurück.",
      ],
    };
  }

  return {
    impactTitle: "Wetterwarnung: was bedeutet das praktisch?",
    expect: [
      "Das Wetter kann vorübergehend Beeinträchtigungen oder Risiken für Außenaktivitäten und Verkehr bringen.",
    ],
    actions: [
      "Prüfe kurz vor Aufbruch die Warnlage erneut.",
      "Passe deine Planung an, wenn du draußen, auf der Straße oder auf dem Wasser sein musst.",
    ],
  };
}
