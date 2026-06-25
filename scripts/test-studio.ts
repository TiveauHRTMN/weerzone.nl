import "dotenv/config";
import { runStudio } from "@/lib/mariana/studio/engine";

async function main() {
  const day = await runStudio({ dayOffset: 0 });
  console.log(JSON.stringify(day, null, 2));
  if (!day.slide1.intro || !day.slide1.regionTemps) throw new Error("slide1 incompleet");
  if (!day.slide3.morgen.alinea) throw new Error("slide3 morgen incompleet");
  if (typeof day.slide1.metrics.uvIndex !== "number") throw new Error("metrics incompleet");
  console.log("\nslide4 (heads-up):", day.slide4 ? day.slide4.type : "geen vandaag");
}
main().catch((e) => { console.error(e); process.exit(1); });
