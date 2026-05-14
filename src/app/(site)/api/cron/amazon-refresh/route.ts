import { NextResponse } from "next/server";
import { refreshAll } from "@/lib/amazon-live";

// Dagelijkse cron — vernieuwt alle product-data uit PA-API.
// Vercel Hobby = 1x/dag max.

export const maxDuration = 300; // 5 min — search kan lang duren door rate-limit throttle

export async function GET(request: Request) {
  // Simpele bescherming: Vercel's cron voegt x-vercel-cron header toe,
  // handmatig aanroepen mag met ?key=<CRON_SECRET>
  const authHeader = request.headers.get("authorization");
  const url = new URL(request.url);
  const providedKey = url.searchParams.get("key");
  const cronSecret = process.env.CRON_SECRET;

  const isCron = request.headers.get("x-vercel-cron") === "1";
  const isAuthed =
    isCron ||
    (cronSecret && (authHeader === `Bearer ${cronSecret}` || providedKey === cronSecret));

  if (!isAuthed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const start = Date.now();
  try {
    const { ok, fail } = await refreshAll();
    return NextResponse.json({
      ok,
      fail,
      durationMs: Date.now() - start,
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e), durationMs: Date.now() - start },
      { status: 500 },
    );
  }
}
