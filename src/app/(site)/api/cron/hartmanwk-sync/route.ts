import { NextResponse, type NextRequest } from "next/server";
import { runHartmanWkFifaSync } from "@/lib/hartmanwk-fifa";
import { isInHartmanWkMatchWindow } from "@/lib/hartmanwk-matches";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Hartman WK 2026 — automatische sync uit FIFA's data-API.
 * Haalt uitslagen + speler-statjes op en werkt de ranglijst/poules bij.
 * Registreer in vercel.json (crons[]). Auth: Bearer CRON_SECRET in productie.
 */
function authorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.CRON_SECRET || process.env.HARTMANWK_ADMIN_TOKEN;
  if (!secret) return true; // geen secret ingesteld → Vercel-cron toelaten
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // De cron vuurt elke 10 minuten, maar syncen heeft alleen zin rond een
  // wedstrijd (aftrap tot 4 uur erna — de tijden staan in hartmanwk-matches).
  // Buiten die vensters één vangnet-run per 2 uur, plus altijd via ?force=1.
  const now = new Date();
  const force = request.nextUrl.searchParams.get("force") === "1";
  const baseline = now.getUTCMinutes() < 10 && now.getUTCHours() % 2 === 0;
  if (!force && !isInHartmanWkMatchWindow(now) && !baseline) {
    return NextResponse.json({ ok: true, skipped: "geen wedstrijd bezig of net afgelopen" });
  }

  try {
    const result = await runHartmanWkFifaSync();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Hartman WK FIFA sync error:", error);
    return NextResponse.json({ ok: false, error: String((error as Error)?.message || error) }, { status: 500 });
  }
}
