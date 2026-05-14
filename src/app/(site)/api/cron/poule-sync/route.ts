import { syncMatchScores } from "@/lib/poule";
import { NextResponse } from "next/server";

/**
 * Cron job om WK uitslagen te synchroniseren.
 * Kan worden aangeroepen via Vercel Cron of een andere scheduler.
 */
export async function GET(request: Request) {
  // Beveiliging: check voor een CRON_SECRET of vergelijkbaar als het op Vercel draait
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (process.env.CRON_SECRET && key !== process.env.CRON_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // We syncen voor het actieve WK toernooi
    await syncMatchScores('wk-2026');
    return NextResponse.json({ ok: true, message: 'Poule sync voltooid' });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
