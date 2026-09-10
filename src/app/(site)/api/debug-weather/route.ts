// TIJDELIJKE diagnostiek voor de storing van 2026-09-10 (stale /weer-paginas).
// fetchWeatherData faalt op Vercel zonder ook maar een logregel; deze route meet
// per laag waar het misgaat. Verwijderen zodra de oorzaak vast staat.
import { NextResponse } from "next/server";
import { fetchWeatherData, snapToGrid, PROGRAMMATIC_GRID_STEP } from "@/lib/weather";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const OM = "https://api.open-meteo.com/v1/forecast";

async function timed<T>(label: string, fn: () => Promise<T>) {
  const t0 = Date.now();
  try {
    const value = await fn();
    return { label, ms: Date.now() - t0, ok: true, value };
  } catch (e) {
    return { label, ms: Date.now() - t0, ok: false, error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
  }
}

export async function GET() {
  const g = snapToGrid(52.0907, 5.1214, PROGRAMMATIC_GRID_STEP);

  const rawBare = await timed("raw open-meteo (kaal, geen next-cache)", async () => {
    const res = await fetch(`${OM}?latitude=${g.lat}&longitude=${g.lon}&current=temperature_2m`, { cache: "no-store" });
    return { status: res.status, bodyHead: (await res.text()).slice(0, 200) };
  });

  const rawCached = await timed("raw open-meteo (met next revalidate)", async () => {
    const res = await fetch(`${OM}?latitude=${g.lat}&longitude=${g.lon}&current=temperature_2m`, { next: { revalidate: 600 } });
    return { status: res.status, bodyHead: (await res.text()).slice(0, 200) };
  });

  const supa = await timed("raw fetch naar de dode Supabase-host", async () => {
    const url = `${process.env.SUPABASE_URL ?? "https://bhguergqkyiejyxsiwdu.supabase.co"}/rest/v1/`;
    const res = await fetch(url, { cache: "no-store" });
    return { status: res.status };
  });

  const full = await timed("fetchWeatherData(highRes=false)", async () => {
    const w = await fetchWeatherData(g.lat, g.lon, false, false);
    return { isNull: w === null, keys: w ? Object.keys(w).slice(0, 12) : null };
  });

  return NextResponse.json({
    now: new Date().toISOString(),
    region: process.env.VERCEL_REGION ?? null,
    nextPhase: process.env.NEXT_PHASE ?? null,
    nodeVersion: process.version,
    uvThreadpool: process.env.UV_THREADPOOL_SIZE ?? "(default 4)",
    grid: g,
    steps: [rawBare, rawCached, supa, full],
  });
}
