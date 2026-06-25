import { NextResponse } from "next/server";
import { currentRanking, regionAverages } from "@/lib/mariana/studio/temps";
import { loadLatestStudioDay } from "@/lib/mariana/studio/storage";
import { studioGateOk } from "@/lib/mariana/studio/gate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!studioGateOk(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const ranked = await currentRanking();
    if (!ranked.length) throw new Error("geen current data");
    const warmst = ranked[0];
    return NextResponse.json({
      ok: true,
      stale: false,
      regionTempsNow: regionAverages(ranked),
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
