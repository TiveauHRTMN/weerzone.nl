import { NextRequest, NextResponse } from "next/server";
import { fetchNearestStationObservation } from "@/lib/knmi-edr";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
  const lon = parseFloat(req.nextUrl.searchParams.get("lon") ?? "");

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: "lat/lon required" }, { status: 400 });
  }

  if (!process.env.KNMI_EDR_API_KEY && !process.env.KNMI_API_KEY) {
    return NextResponse.json({ error: "KNMI_EDR_API_KEY not configured" }, { status: 503 });
  }

  const obs = await fetchNearestStationObservation(lat, lon);
  if (!obs) {
    return NextResponse.json({ error: "No observation available" }, { status: 502 });
  }

  return NextResponse.json(obs, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
  });
}
