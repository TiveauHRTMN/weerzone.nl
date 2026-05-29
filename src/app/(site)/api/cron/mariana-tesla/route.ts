import { NextRequest, NextResponse } from "next/server";
import { runTeslaForAllRegions, runTeslaForRegionSlug } from "@/lib/mariana/tesla/engine";
import { saveTeslaRuns } from "@/lib/mariana/tesla/storage";
import type { TeslaTrigger } from "@/lib/mariana/tesla/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Mariana Tesla — run-endpoint.
 *
 * Draait de convectieve reasoning-engine voor één regio (?region=slug) of alle
 * mesoschaal-regio's. Primair bedoeld als async trigger (Oracle meldt onstabiele
 * lucht); voorlopig ook handmatig aan te roepen voor debug.
 *
 * NB: nog NIET in vercel.json geregistreerd — Tesla draait event-getriggerd, niet
 * op een vast schema (kostenbeheersing + Oracle-trigger-contract). Persistentie
 * (Supabase mariana_tesla) volgt als aparte laag.
 *
 * Auth: in productie vereist Bearer MARIANA_SECRET/CRON_SECRET; lokaal vrij.
 */
function authorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.MARIANA_SECRET ?? process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

const VALID_TRIGGERS: TeslaTrigger[] = [
  "oracle_instability_pipeline",
  "estofex_threat",
  "model_cape_threshold",
  "scheduled_season",
  "manual",
  "founder_observation",
];

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY ontbreekt — Tesla kan niet redeneren" },
      { status: 503 }
    );
  }

  const params = request.nextUrl.searchParams;
  const region = params.get("region");
  const triggerParam = params.get("trigger") as TeslaTrigger | null;
  const trigger: TeslaTrigger =
    triggerParam && VALID_TRIGGERS.includes(triggerParam) ? triggerParam : "manual";
  const effort = (params.get("effort") as "low" | "medium" | "high" | "xhigh" | "max" | null) ?? undefined;

  try {
    if (region) {
      const run = await runTeslaForRegionSlug(region, { trigger, effort });
      const persisted = await saveTeslaRuns([run]);
      return NextResponse.json({ ok: true, runs: [run], errors: [], persisted });
    }
    const { runs, errors } = await runTeslaForAllRegions({ trigger, effort });
    const persisted = await saveTeslaRuns(runs);
    return NextResponse.json({ ok: true, runs, errors, persisted });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
