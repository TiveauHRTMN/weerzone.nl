import "dotenv/config";
import { dagIntro, morgenAlinea, catchyFallback } from "@/lib/mariana/studio/narrative";

const warmst = { name: "Maastricht", value: 34, region: "Zuid" as const };
const koelst = { name: "Ameland", value: 21, region: "Noord" as const };

async function main() {
  const fb = catchyFallback(warmst, koelst, 13, "Hoog (gras)");
  console.log("FALLBACK:", fb);
  if (!fb.includes("34") || !fb.includes("21")) throw new Error("fallback mist cijfers");

  const intro = await dagIntro({ warmst, koelst, spread: 13, pollen: "Hoog (gras)", regime: "hittekoepel" });
  console.log("INTRO:", intro);
  if (!intro.includes("34")) throw new Error("intro mist warmste cijfer");

  const morgen = await morgenAlinea({ morgenMax: 29, tendens: "iets koeler", regime: "wisselvallig" });
  console.log("MORGEN:", morgen);
  if (!morgen.includes("29")) throw new Error("morgen mist cijfer");
}
main().catch((e) => { console.error(e); process.exit(1); });
