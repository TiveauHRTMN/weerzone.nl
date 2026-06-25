import "dotenv/config";
import { forecastRanking, currentRanking, regionAverages, details } from "@/lib/mariana/studio/temps";

async function main() {
  const fc = await forecastRanking(0);
  const now = await currentRanking();
  const avg = regionAverages(fc);
  const det = await details(0);
  console.log("forecast plekken:", fc.length, "warmst:", fc[0]?.name, Math.round(fc[0]?.value));
  console.log("current plekken:", now.length, "warmst nu:", now[0]?.name, Math.round(now[0]?.value));
  console.log("regio-gemiddeld:", avg);
  console.log("details:", det);
  if (fc.length < 30) throw new Error("te weinig forecast-plekken");
  if (now.length < 30) throw new Error("te weinig current-plekken");
}
main().catch((e) => { console.error(e); process.exit(1); });
