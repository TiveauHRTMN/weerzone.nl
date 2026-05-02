export interface KNMIWarning {
  province: string;
  type: string;
  severity: "YELLOW" | "ORANGE" | "RED";
  description: string;
  pubDate: string;
}

const SEVERITY_MAP: [string, KNMIWarning["severity"]][] = [
  ["code rood", "RED"],
  ["code oranje", "ORANGE"],
  ["code geel", "YELLOW"],
];

const PROVINCE_NAMES = [
  "Waddeneilanden", "Friesland", "Groningen", "Drenthe", "Noord-Holland",
  "Flevoland", "Overijssel", "Gelderland", "Utrecht", "Zuid-Holland",
  "Zeeland", "Noord-Brabant", "Limburg", "Waddenzee", "IJsselmeergebied",
];

// Map places-data province slug → KNMI province name
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

function extractTag(tag: string, xml: string): string {
  const cdata = xml.match(new RegExp(`<${tag}><!\[CDATA\[([\\s\\S]*?)\]\]><\/${tag}>`));
  if (cdata) return cdata[1].trim();
  const plain = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\/${tag}>`));
  return plain ? plain[1].trim() : "";
}

function parseWarnings(xml: string): KNMIWarning[] {
  const warnings: KNMIWarning[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = extractTag("title", item);
    const description = extractTag("description", item);
    const pubDate = extractTag("pubDate", item);

    const combined = (title + " " + description).toLowerCase();

    // Skip non-warnings
    if (combined.includes("code groen") || combined.includes("geen waarschuwing")) continue;

    let severity: KNMIWarning["severity"] | null = null;
    for (const [key, val] of SEVERITY_MAP) {
      if (combined.includes(key)) { severity = val; break; }
    }
    if (!severity) continue;

    let province = "Nederland";
    for (const p of PROVINCE_NAMES) {
      if (title.includes(p) || description.includes(p)) { province = p; break; }
    }

    let type = "Weeralarm";
    if (combined.includes("onweer")) type = "Onweer";
    else if (combined.includes("hagel")) type = "Hagel";
    else if (combined.includes("wind")) type = "Windstoten";
    else if (combined.includes("sneeuw")) type = "Sneeuw";
    else if (combined.includes("vorst") || combined.includes("kou")) type = "Vorst";
    else if (combined.includes("hitte")) type = "Hitte";
    else if (combined.includes("mist")) type = "Mist";
    else if (combined.includes("neerslag") || combined.includes("regen")) type = "Neerslag";

    warnings.push({ province, type, severity, description: title, pubDate });
  }

  return warnings;
}

export async function fetchKNMIWarnings(): Promise<KNMIWarning[]> {
  try {
    const res = await fetch(
      "https://cdn.knmi.nl/knmi/xml/rss/rss_KNMIwaarschuwingen.xml",
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    return parseWarnings(await res.text());
  } catch {
    return [];
  }
}

export function warningsForProvince(warnings: KNMIWarning[], provinceSlug: string): KNMIWarning[] {
  const knmiName = PROVINCE_SLUG_TO_KNMI[provinceSlug];
  if (!knmiName) return warnings;
  return warnings.filter(w => w.province === knmiName || w.province === "Nederland");
}

export function highestSeverity(warnings: KNMIWarning[]): KNMIWarning["severity"] | null {
  if (warnings.some(w => w.severity === "RED")) return "RED";
  if (warnings.some(w => w.severity === "ORANGE")) return "ORANGE";
  if (warnings.some(w => w.severity === "YELLOW")) return "YELLOW";
  return null;
}
