/**
 * ESTOFEX (European Storm Forecast Experiment) integratie.
 *
 * Estofex publiceert dagelijkse storm-forecasts voor Europa met threat levels:
 *   Level 1 — kleine kans op zwaar onweer
 *   Level 2 — significante kans
 *   Level 3 — grote kans op extreem zwaar onweer
 *
 * Voor Weerzone halen we alleen op wat relevant is voor NL/Benelux:
 *   - Wanneer ergens een actief level >= 2 valid is, OF
 *   - Wanneer de bulletin-tekst expliciet Benelux/Netherlands/Holland noemt.
 *
 * Bron: https://www.estofex.org (Creative Commons BY-NC-SA 3.0)
 */

const ESTOFEX_INDEX = "https://www.estofex.org/cgi-bin/polygon/showforecast.cgi?listvalid=yes";
const ESTOFEX_DETAIL = "https://www.estofex.org/cgi-bin/polygon/showforecast.cgi?text=yes&fcstfile=";

const BENELUX_KEYWORDS = [
  "Benelux", "Netherlands", "Holland", "Belgium", "Belgian", "Luxembourg",
  "Limburg", "Brabant", "Friesland", "Frisia",
];

export interface EstofexForecast {
  level: 1 | 2 | 3;
  validFrom: string | null;  // ISO 8601 UTC
  validUntil: string | null; // ISO 8601 UTC
  fileName: string;          // bv. "2026050406_..._stormforecast.xml"
  detailUrl: string;
}

export interface EstofexBeneluxSummary {
  /** Hoogste actieve level wereldwijd in deze cyclus. */
  maxLevel: 1 | 2 | 3;
  /** Geldigheidsperiode van het bulletin. */
  validFrom: string | null;
  validUntil: string | null;
  /** Eerste paragraaf die expliciet over Benelux/NL gaat (excerpt, max ~600 tekens). */
  beneluxText: string | null;
  /** Of het bulletin Benelux/NL noemt. */
  mentionsBenelux: boolean;
  sourceUrl: string;
}

function parseValidPeriod(html: string): { from: string | null; until: string | null } {
  // "Sun 03 May 2026 06:00 to Mon 04 May 2026 06:00 UTC" — separator kan "to" of "-" zijn
  const m = html.match(
    /([A-Z][a-z]{2})\s+(\d{1,2})\s+([A-Z][a-z]{2,8})\s+(\d{4})\s+(\d{2}):(\d{2})\s*(?:to|-)?\s*(?:<BR>)?\s*([A-Z][a-z]{2})\s+(\d{1,2})\s+([A-Z][a-z]{2,8})\s+(\d{4})\s+(\d{2}):(\d{2})\s*UTC/,
  );
  if (!m) return { from: null, until: null };
  const months: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  const fromMonth = months[m[3].slice(0, 3)] ?? "01";
  const untilMonth = months[m[9].slice(0, 3)] ?? "01";
  const from = `${m[4]}-${fromMonth}-${m[2].padStart(2, "0")}T${m[5]}:${m[6]}:00Z`;
  const until = `${m[10]}-${untilMonth}-${m[8].padStart(2, "0")}T${m[11]}:${m[12]}:00Z`;
  return { from, until };
}

/** Lees de Estofex index en geef alle actieve forecasts terug. */
async function fetchActiveForecasts(): Promise<EstofexForecast[]> {
  try {
    const res = await fetch(ESTOFEX_INDEX, {
      next: { revalidate: 1800 }, // 30 min — Estofex updatet 1-2× per dag
      headers: { "User-Agent": "WeerzoneBot/1.0 (+https://weerzone.nl)" },
    });
    if (!res.ok) return [];
    const html = await res.text();

    const out: EstofexForecast[] = [];
    const rowRegex = /fcstfile=([^"&]+_(\d)_stormforecast\.xml)[\s\S]*?<P[^>]*>([\s\S]*?)<\/P>/g;
    let m;
    while ((m = rowRegex.exec(html)) !== null) {
      const fileName = m[1];
      const level = parseInt(m[2], 10) as 1 | 2 | 3;
      if (![1, 2, 3].includes(level)) continue;
      out.push({
        level,
        validFrom: null,
        validUntil: null,
        fileName,
        detailUrl: `${ESTOFEX_DETAIL}${fileName}`,
      });
    }
    return out;
  } catch (err) {
    console.error("Estofex index fetch failed:", err);
    return [];
  }
}

/** Haal het detail-bulletin op voor één forecast. */
async function fetchForecastDetail(forecast: EstofexForecast): Promise<{
  validFrom: string | null;
  validUntil: string | null;
  bulletin: string;
} | null> {
  try {
    const res = await fetch(forecast.detailUrl, {
      next: { revalidate: 1800 },
      headers: { "User-Agent": "WeerzoneBot/1.0 (+https://weerzone.nl)" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const period = parseValidPeriod(html);
    const bulletinMatch = html.match(/<P CLASS="bulletin">([\s\S]*?)<\/P>/g) || [];
    const bulletin = bulletinMatch
      .map((p) => p.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
      .join("\n\n");
    return { validFrom: period.from, validUntil: period.until, bulletin };
  } catch {
    return null;
  }
}

/**
 * Genereer een korte Nederlandstalige samenvatting van wat ESTOFEX voor de
 * Benelux verwacht. Geen LLM — keyword-matching op de Engelse bulletin-tekst.
 *
 * Output is altijd 1 zin, eindigt op "verwacht voor zondag/maandag/etc"
 * of een vergelijkbare datum-aanduiding indien beschikbaar.
 */
export function summarizeEstofexNL(est: EstofexBeneluxSummary): string | null {
  const text = (est.beneluxText ?? "").toLowerCase();
  const lvl = est.maxLevel;

  if (!est.mentionsBenelux && lvl < 2) return null;

  const threats: string[] = [];
  if (/\b(thunderstorm|onweer|supercell|convective)\b/.test(text)) threats.push("onweersbuien");
  if (/\b(large hail|hail)\b/.test(text)) threats.push("(grote) hagel");
  if (/\b(severe gust|damaging wind|gust)\b/.test(text)) threats.push("zware windstoten");
  if (/\b(heavy rain|excessive rain|flooding)\b/.test(text)) threats.push("zware regen");
  if (/\b(tornado|funnel)\b/.test(text)) threats.push("een (kleine) kans op een windhoos");

  const threatPart = threats.length > 0
    ? threats.slice(0, 3).join(", ")
    : "onstabiel weer";

  const period = est.validFrom ? new Date(est.validFrom) : null;
  let when = "";
  if (period && !isNaN(period.getTime())) {
    const days = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = new Date(period);
    day.setHours(0, 0, 0, 0);
    const diff = Math.round((day.getTime() - today.getTime()) / 86400000);
    if (diff === 0) when = "vandaag";
    else if (diff === 1) when = "morgen";
    else if (diff === 2) when = "overmorgen";
    else if (diff > 0 && diff < 7) when = days[period.getDay()];
  }

  const lvlPhrase = lvl >= 3
    ? "Forse kans op extreem zwaar weer"
    : lvl >= 2
    ? "Verhoogde kans op zwaar weer"
    : "Lichte kans op zwaar weer";

  const suffix = est.mentionsBenelux ? " in de Benelux" : " in delen van Europa";
  const whenSuffix = when ? ` voor ${when}` : "";

  return `${lvlPhrase} met ${threatPart}${suffix}${whenSuffix}.`;
}

function extractBeneluxParagraph(bulletin: string): string | null {
  // Splits het bulletin in zinnen, vind de eerste zin met een Benelux/NL
  // keyword en geef die + de 1-2 omliggende zinnen terug. Dat is veel
  // bruikbaarder dan de eerste 600 tekens van een paragraaf over SW France.
  const sentences = bulletin
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    if (BENELUX_KEYWORDS.some((kw) => s.includes(kw))) {
      // 1 zin ervoor (context) + de match + 2 zinnen erna.
      const start = Math.max(0, i - 1);
      const end = Math.min(sentences.length, i + 3);
      const excerpt = sentences.slice(start, end).join(" ");
      return excerpt.length > 700 ? excerpt.slice(0, 700) + "…" : excerpt;
    }
  }
  return null;
}

/**
 * Haal een Benelux-relevante samenvatting op.
 *
 * Returns null wanneer er geen actief bulletin is OF het bulletin alleen
 * level 1 buiten Benelux beschrijft.
 *
 * @param minLevel Minimum threat level om sowieso te returnen (default 2).
 *                 Lagere levels worden alleen gereturneerd als het bulletin
 *                 expliciet Benelux/NL noemt.
 */
export async function fetchEstofexBeneluxSummary(
  minLevel: 1 | 2 | 3 = 2,
): Promise<EstofexBeneluxSummary | null> {
  const forecasts = await fetchActiveForecasts();
  if (forecasts.length === 0) return null;

  const maxLevel = forecasts.reduce(
    (max, f) => (f.level > max ? f.level : max),
    1 as 1 | 2 | 3,
  );

  // Pak de hoogste-level forecast om het detail van te lezen
  const top = [...forecasts].sort((a, b) => b.level - a.level)[0];
  const detail = await fetchForecastDetail(top);
  if (!detail) return null;

  const beneluxText = extractBeneluxParagraph(detail.bulletin);
  const mentionsBenelux = beneluxText !== null;

  // Filter: alleen returnen als level boven drempel OF expliciet Benelux noemt
  if (maxLevel < minLevel && !mentionsBenelux) return null;

  return {
    maxLevel,
    validFrom: detail.validFrom,
    validUntil: detail.validUntil,
    beneluxText,
    mentionsBenelux,
    sourceUrl: top.detailUrl,
  };
}
