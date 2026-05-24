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
  "https://weerzone.nl/mijnweer",
  "https://weerzone.nl/waarschuwingen",
  "https://weerzone.nl/zakelijk",
  "https://weerzone.nl/prijzen",
  "https://weerzone.nl/over",
  "https://weerzone.nl/de",
  "https://weerzone.nl/de/wetter",
  "https://weerzone.nl/de/mein-wetter",
  "https://weerzone.nl/de/warnungen",
  "https://weerzone.nl/de/preise",
  "https://weerzone.nl/fr",
  "https://weerzone.nl/fr/meteo",
  "https://weerzone.nl/fr/mon-meteo",
  "https://weerzone.nl/fr/alertes",
  "https://weerzone.nl/fr/tarifs",
  "https://weerzone.nl/es",
  "https://weerzone.nl/es/tiempo",
  "https://weerzone.nl/es/mi-tiempo",
  "https://weerzone.nl/es/alertas",
  "https://weerzone.nl/es/precios",
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
