// Haalt de dag-maxtemperatuur (vandaag) voor een brede set NL-plekken op via
// Open-Meteo en rangschikt de 5 warmste en 5 koelste — voor de TikTok-ranglijst.
const PLACES: Array<[string, number, number]> = [
  // kust / Wadden (kandidaat-koudst)
  ["Den Helder", 52.96, 4.76], ["Texel (De Cocksdorp)", 53.15, 4.88], ["IJmuiden", 52.46, 4.61],
  ["Petten", 52.77, 4.66], ["Zandvoort", 52.37, 4.53], ["Hoek van Holland", 51.98, 4.13],
  ["Vlieland", 53.30, 5.07], ["Terschelling", 53.36, 5.34], ["Ameland", 53.45, 5.74],
  ["Schiermonnikoog", 53.48, 6.16], ["Lauwersoog", 53.41, 6.21], ["Harlingen", 53.17, 5.42],
  // Zeeland
  ["Vlissingen", 51.44, 3.57], ["Middelburg", 51.50, 3.61], ["Terneuzen", 51.34, 3.83], ["Goes", 51.50, 3.89],
  // zuiden / zuidoosten (kandidaat-warmst)
  ["Maastricht", 50.85, 5.69], ["Heerlen", 50.89, 5.98], ["Roermond", 51.19, 5.99], ["Venlo", 51.37, 6.17],
  ["Eindhoven", 51.44, 5.48], ["Tilburg", 51.56, 5.09], ["Breda", 51.59, 4.78], ["Roosendaal", 51.53, 4.46],
  ["Den Bosch", 51.70, 5.30], ["Nijmegen", 51.84, 5.86], ["Arnhem", 51.98, 5.91],
  // midden / oost / noord
  ["Utrecht", 52.09, 5.12], ["Amersfoort", 52.16, 5.39], ["Apeldoorn", 52.21, 5.97], ["Enschede", 52.22, 6.90],
  ["Zwolle", 52.51, 6.09], ["Assen", 52.99, 6.56], ["Emmen", 52.78, 6.90], ["Groningen", 53.22, 6.57],
  ["Leeuwarden", 53.20, 5.79], ["De Bilt", 52.10, 5.18],
  // west
  ["Amsterdam", 52.37, 4.90], ["Rotterdam", 51.92, 4.48], ["Den Haag", 52.08, 4.31], ["Alkmaar", 52.63, 4.75],
];

async function main() {
  const lat = PLACES.map((p) => p[1]).join(",");
  const lon = PLACES.map((p) => p[2]).join(",");
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max&timezone=Europe%2FAmsterdam&forecast_days=1`;
  const res = await fetch(url);
  if (!res.ok) { console.log("Open-Meteo error", res.status); return; }
  const data = await res.json();
  const rows = (Array.isArray(data) ? data : [data]) as Array<{ daily: { temperature_2m_max: number[]; time: string[] } }>;
  const ranked = PLACES.map((p, i) => ({
    name: p[0],
    max: rows[i]?.daily?.temperature_2m_max?.[0],
    date: rows[i]?.daily?.time?.[0],
  })).filter((r) => typeof r.max === "number").sort((a, b) => b.max! - a.max!);

  console.log("datum:", ranked[0]?.date);
  console.log("\n=== ALLE PLEKKEN (warm → koel) ===");
  ranked.forEach((r) => console.log(`${String(Math.round(r.max!)).padStart(2)}°  ${r.name}`));
  console.log("\n=== 5 WARMSTE ===");
  ranked.slice(0, 5).forEach((r, i) => console.log(`${i + 1}. ${r.name.padEnd(24)} ${Math.round(r.max!)}°`));
  console.log("\n=== 5 KOELSTE ===");
  ranked.slice(-5).reverse().forEach((r, i) => console.log(`${i + 1}. ${r.name.padEnd(24)} ${Math.round(r.max!)}°`));
}
main().catch((e) => console.error(e));
