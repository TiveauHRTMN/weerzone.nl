import { NextRequest, NextResponse } from "next/server";
import { nearestKNMIStationId, fetchMonthlyClimateData } from "@/lib/knmi-edr";
import { getClimateNormal } from "@/lib/climate";

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

  const now = new Date();
  const month = now.getUTCMonth(); // 0-indexed
  const year = now.getUTCFullYear();

  const station = await nearestKNMIStationId(lat, lon);
  if (!station) {
    return NextResponse.json({ error: "No station found" }, { status: 502 });
  }

  const data = await fetchMonthlyClimateData(station.id, year, month + 1);
  if (!data) {
    return NextResponse.json({ error: "No climate data available" }, { status: 502 });
  }

  const normal = getClimateNormal(month);

  const tempDiff =
    data.avgTemp !== null
      ? Math.round((data.avgTemp - normal.avgTemp) * 10) / 10
      : null;

  const dailyNormalPrecip = normal.avgPrecipitation / 30;
  const measuredDailyPrecip =
    data.totalPrecipitation !== null && data.daysWithData > 0
      ? data.totalPrecipitation / data.daysWithData
      : null;

  const precipRatio =
    measuredDailyPrecip !== null
      ? Math.round((measuredDailyPrecip / dailyNormalPrecip) * 100)
      : null;

  const sunRatio =
    data.totalSunHours !== null && normal.avgSunHours > 0
      ? Math.round((data.totalSunHours / normal.avgSunHours) * 100)
      : null;

  return NextResponse.json(
    {
      stationId: station.id,
      stationName: station.name,
      month,
      year,
      daysWithData: data.daysWithData,
      avgTemp: data.avgTemp,
      avgTempMax: data.avgTempMax,
      avgTempMin: data.avgTempMin,
      totalPrecipitation: data.totalPrecipitation,
      totalSunHours: data.totalSunHours,
      normal: {
        avgTemp: normal.avgTemp,
        avgPrecipitation: normal.avgPrecipitation,
        avgSunHours: normal.avgSunHours,
      },
      tempDiff,
      precipRatio,
      sunRatio,
    },
    {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300" },
    }
  );
}
