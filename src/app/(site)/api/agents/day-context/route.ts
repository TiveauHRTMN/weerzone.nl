import { NextResponse } from "next/server";
import { getDayContext, listHolidays, type SchoolRegion } from "@/lib/agents/day-context";

export const dynamic = "force-dynamic";

/**
 * Debug-endpoint voor de agent-laag.
 *
 *   GET /api/agents/day-context
 *   GET /api/agents/day-context?date=2026-12-25
 *   GET /api/agents/day-context?date=2026-04-29&region=zuid
 *   GET /api/agents/day-context?date=2026-04-29&region=zuid&include=holidays
 *
 * Niet voor productieconsumptie — alleen om snel in de browser te zien wat
 * Piet/Reed/Koos straks zien wanneer ze een dag opvragen. Geen auth omdat
 * er geen gevoelige data in zit (puur kalenderdata).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date");
  const regionParam = url.searchParams.get("region") as SchoolRegion | null;
  const includeHolidays = url.searchParams.get("include") === "holidays";

  const region: SchoolRegion | undefined =
    regionParam === "noord" || regionParam === "midden" || regionParam === "zuid"
      ? regionParam
      : undefined;

  const context = getDayContext(dateParam ?? undefined, region);

  const body: Record<string, unknown> = { context };
  if (includeHolidays) {
    const year = Number(context.date.slice(0, 4));
    body.holidays = listHolidays(year);
  }

  return NextResponse.json(body, {
    headers: { "cache-control": "no-store" },
  });
}
