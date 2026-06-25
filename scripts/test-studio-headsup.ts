import "dotenv/config";
import { decideHeadsUp } from "@/lib/mariana/studio/headsup";

const mild = [{ name: "Eindhoven", value: 22, region: "Zuid" as const }, { name: "Texel", value: 17, region: "Noord" as const }];
const heet = [{ name: "Maastricht", value: 33, region: "Zuid" as const }, { name: "Texel", value: 24, region: "Noord" as const }];

async function main() {
  const geen = await decideHeadsUp({ morgenRanked: mild, oracleGateActive: false, regionThunder: false });
  console.log("MILD (verwacht null tenzij KNMI geel):", geen?.type ?? "null");

  const onweer = await decideHeadsUp({ morgenRanked: mild, oracleGateActive: true, regionThunder: false });
  console.log("ONWEER:", onweer?.type, "—", onweer?.titel);
  if (onweer?.type !== "onweer") throw new Error("onweer-trigger faalt");

  const hitte = await decideHeadsUp({ morgenRanked: heet, oracleGateActive: false, regionThunder: false });
  console.log("HITTE:", hitte?.type, "—", hitte?.titel);
  if (hitte && hitte.type === "hitte" && !hitte.intro.includes("33")) throw new Error("hitte-intro mist cijfer");
}
main().catch((e) => { console.error(e); process.exit(1); });
