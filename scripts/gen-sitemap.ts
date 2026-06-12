/**
 * Sitemap generator (handmatig: npx tsx scripts/gen-sitemap.ts).
 *
 * De runtime sitemap routes gebruiken dezelfde builders in src/lib/sitemap-data.ts.
 * Dit script schrijft previews naar .audits/sitemap-preview. De runtime route
 * handlers zijn de enige publieke bron; bestanden met dezelfde URL in public/
 * conflicteren in Next.js 16 met route.ts.
 */

import fs from "node:fs";
import path from "node:path";
import {
  buildNLSitemap,
  buildSitemapIndex,
  buildStaticSitemap,
} from "../src/lib/sitemap-data";

const outputDir = path.join(process.cwd(), ".audits", "sitemap-preview");

const files = [
  ["sitemap.xml", () => buildSitemapIndex()],
  ["sitemap-static.xml", () => buildStaticSitemap()],
  ["sitemap-nl.xml", () => buildNLSitemap()],
] as const;

function run() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const [file, build] of files) {
    const xml = build();
    const out = path.join(outputDir, file);
    fs.writeFileSync(out, xml, "utf8");
    if (process.env.NODE_ENV !== "production") {
      console.log(`${file}: ${Buffer.byteLength(xml, "utf8").toLocaleString("nl-NL")} bytes`);
    }
  }
}

run();
