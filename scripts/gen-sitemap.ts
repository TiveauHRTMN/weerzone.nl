/**
 * Sitemap generator (handmatig: npx tsx scripts/gen-sitemap.ts).
 *
 * De runtime sitemap routes gebruiken dezelfde builders in src/lib/sitemap-data.ts.
 * Dit script schrijft alleen dezelfde XML naar public/ voor statische fallback,
 * crawlers en handmatige checks.
 */

import fs from "node:fs";
import path from "node:path";
import {
  buildNLSitemap,
  buildSitemapIndex,
  buildStaticSitemap,
} from "../src/lib/sitemap-data";

const publicDir = path.join(process.cwd(), "public");

const files = [
  ["sitemap.xml", () => buildSitemapIndex()],
  ["sitemap-static.xml", () => buildStaticSitemap()],
  ["sitemap-nl.xml", () => buildNLSitemap()],
] as const;

function run() {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  for (const [file, build] of files) {
    const xml = build();
    const out = path.join(publicDir, file);
    fs.writeFileSync(out, xml, "utf8");
    if (process.env.NODE_ENV !== "production") {
      console.log(`${file}: ${Buffer.byteLength(xml, "utf8").toLocaleString("nl-NL")} bytes`);
    }
  }
}

run();
