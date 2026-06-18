/**
 * Geocoding van Nederlandse postcodes → coördinaten.
 *
 * Bron: PDOK Locatieserver (BZK) — gratis, geen API-key, NL-overheid.
 * Retourneert het centroïde van de postcode (lat/lon) + een leesbare plaatsnaam.
 *
 * Gebruikt door de onboarding en backfill om `primary_lat/lon` te vullen wanneer
 * GPS niet beschikbaar is. Zonder coördinaten valt een account uit de
 * agent-cron (die filtert op niet-null primary_lat/lon).
 */

export interface GeocodeResult {
  lat: number;
  lon: number;
  /** bv. "Reine Claude, 1731PA Winkel" */
  label: string;
}

const PDOK_FREE =
  "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free";

/** "POINT(4.911 52.746)" → { lat: 52.746, lon: 4.911 } */
function parsePoint(point: string): { lat: number; lon: number } | null {
  const m = point.match(/POINT\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/);
  if (!m) return null;
  const lon = Number(m[1]);
  const lat = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

/**
 * Geocodeer een Nederlandse postcode (met of zonder spatie) naar coördinaten.
 * Retourneert `null` als de postcode onbekend is of de bron onbereikbaar.
 */
export async function geocodePostcodeNL(postcode: string): Promise<GeocodeResult | null> {
  const q = postcode.replace(/\s+/g, "").toUpperCase();
  // NL-postcode: 4 cijfers + 2 letters. Anders niet eens proberen.
  if (!/^\d{4}[A-Z]{2}$/.test(q)) return null;

  const url = `${PDOK_FREE}?q=${encodeURIComponent(q)}&fq=type:postcode&rows=1&fl=centroide_ll,weergavenaam`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 * 60 * 24 * 30 }, // postcode-centroïdes wijzigen vrijwel nooit
    });
    if (!res.ok) return null;
    const data = await res.json();
    const doc = data?.response?.docs?.[0];
    if (!doc?.centroide_ll) return null;
    const coords = parsePoint(doc.centroide_ll);
    if (!coords) return null;
    return { ...coords, label: doc.weergavenaam ?? q };
  } catch {
    return null;
  }
}
