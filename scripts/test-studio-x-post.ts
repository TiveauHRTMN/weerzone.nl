/**
 * Mariana Studio — e2e-test voor het X-kanaal: xCaption-checks + een échte
 * Buffer-post naar X als DRAFT (zichtbaar in Buffer, niet publiek).
 *
 *   npx tsx scripts/test-studio-x-post.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { postToX } from "../src/lib/mariana/studio/buffer";
import { xCaption } from "../src/lib/mariana/studio/caption";

async function main() {
  const short = "Dagverwachting. Zonnig en warm.\n\n#weer #weerzone";
  const shortOk = xCaption(short) === short;
  console.log("xCaption kort ongewijzigd:", shortOk);

  const long =
    "Dagverwachting. " +
    "Een lange zin over het weer met veel detail. ".repeat(10) +
    "\n\n#weer #weerzone #weerbericht #nederland";
  const xc = xCaption(long);
  const longOk = [...xc].length <= 280 && xc.endsWith("…");
  console.log(`xCaption lang ${long.length} -> ${[...xc].length}, geknipt op woordgrens + …:`, longOk);
  if (!shortOk || !longOk) {
    console.error("xCaption-checks FALEN");
    process.exit(1);
  }

  const r = await postToX({
    imageUrl: "https://weerzone.nl/api/studio/image?date=2026-07-03&slot=slide1",
    caption: xCaption("Testpost vanuit Mariana Studio: X-kanaal e2e (draft, niet publiceren). #weer #weerzone"),
    mode: "draft",
  });
  console.log("postToX (draft):", JSON.stringify(r));
  if (!r.ok) process.exit(1);
}

main().catch((e) => {
  console.error("FAIL:", e);
  process.exit(1);
});
