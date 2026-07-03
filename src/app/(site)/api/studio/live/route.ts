import { NextResponse } from "next/server";
import { currentRanking, observedRanking, regionMaxima } from "@/lib/mariana/studio/temps";
import { loadLatestStudioDay } from "@/lib/mariana/studio/storage";
import { studioAccessOk } from "@/lib/mariana/studio/gate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await studioAccessOk(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    // Echte KNMI-metingen eerst; model-nowcast alleen als de stations niet
    // alle regio's dekken. Een "nu"-kaart hoort metingen te tonen, geen model.
    const observed = await observedRanking().catch((): Awaited<ReturnType<typeof observedRanking>> => []);
    const regionsCovered = new Set(observed.map((r) => r.region)).size;
    const ranked = regionsCovered === 5 ? observed : await currentRanking();
    if (!ranked.length) throw new Error("geen current data");
    const warmst = ranked[0];
    return NextResponse.json({
      ok: true,
      stale: false,
      regionTempsNow: regionMaxima(ranked),
      warmstePlek: { naam: warmst.name, temp: Math.round(warmst.value) },
    });
  } catch {
    // Terugval: verwachte cijfers uit de persisted dag-rij.
    const day = await loadLatestStudioDay();
    const fc = day?.slide1.regionTemps ?? { noord: 0, oost: 0, midden: 0, west: 0, zuid: 0 };
    const warm = day ? Math.round(day.slide3.vandaag.hoogste.temp) : 0;
    const plaats = day?.slide3.vandaag.hoogste.plaats ?? "—";
    return NextResponse.json({
      ok: true, stale: true,
      regionTempsNow: fc,
      warmstePlek: { naam: plaats, temp: warm },
    });
  }
}
