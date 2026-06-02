import { NextResponse } from "next/server";
import { pingIndexNow } from "@/lib/indexnow";

// Dagelijkse IndexNow ping voor de high-value URLs. We pingen niet alle 88k
// programmatische stadpagina's omdat IndexNow daarvoor te luidruchtig is — voor
// dynamische weerdata is dat ook niet zinnig (Bing crawlt vanzelf opnieuw).
// Wel: alle locale-roots + key landings, zodat updates daar binnen minuten
// zichtbaar zijn bij Bing.
//
// Vercel cron-token wordt gevalideerd via Authorization: Bearer ${CRON_SECRET}.

const STATIC_URLS = [
  "https://weerzone.nl",
  "https://weerzone.nl/weer",
  "https://weerzone.nl/piet",
  "https://weerzone.nl/reed",
  "https://weerzone.nl/koos",
  "https://weerzone.nl/steve",
  "https://weerzone.nl/over",
];

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await pingIndexNow(STATIC_URLS);
    return NextResponse.json({ ok: result.ok, status: result.status, pinged: result.count });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
