import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

const PROTOTYPE_FILES = [
  "wk-data.js",
  "tweaks-panel.jsx",
  "wk-components.jsx",
  "wk-auth.jsx",
  "wk-screens.jsx",
  "wk-app.jsx",
] as const;

export async function GET() {
  const prototypePath = join(
    process.cwd(),
    "public",
    "hartmanwk2026-prototype",
    "Hartman WK Poule.html",
  );

  let html = await readFile(prototypePath, "utf8");

  html = html.replace(
    "<title>Hartman WK Poule</title>",
    '<title>Hartman WK Poule 2026</title>\n<meta name="robots" content="noindex,nofollow" />',
  );

  for (const file of PROTOTYPE_FILES) {
    html = html
      .split(`src="${file}"`)
      .join(`src="/hartmanwk2026-prototype/${file}"`);
  }

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}
