import { NextResponse, type NextRequest } from "next/server";
import { runHartmanWkFifaSync } from "@/lib/hartmanwk-fifa";

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
  try {
    const result = await runHartmanWkFifaSync();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Hartman WK FIFA sync error:", error);
    return NextResponse.json({ ok: false, error: String((error as Error)?.message || error) }, { status: 500 });
  }
}
