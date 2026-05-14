import { NextRequest, NextResponse } from "next/server";
import { fetchNearestStationObservation } from "@/lib/knmi-edr";
import { KNMI_STATIONS } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";
import { isMarianaAuthorized, marianaUnauthorized } from "@/lib/mariana/http";
import { forecastsFromWeatherData, logMarianaActual, logMarianaForecasts } from "@/lib/mariana/service";
import { toMarianaLocation } from "@/lib/mariana/location";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!isMarianaAuthorized(request)) return marianaUnauthorized();

  const limit = Math.max(1, Math.min(50, Number(request.nextUrl.searchParams.get("limit") ?? 12)));
  const offset = Math.max(0, Number(request.nextUrl.searchParams.get("offset") ?? 0));
  const stations = KNMI_STATIONS.slice(offset, offset + limit);
  const runId = `mariana-${new Date().toISOString()}`;

  const results = {
    runId,
    processed: 0,
    forecastRows: 0,
    actualRows: 0,
    verifiedForecasts: 0,
    errors: [] as string[],
  };

  for (const station of stations) {
    try {
      const location = toMarianaLocation(station);
      const weather = await fetchWeatherData(station.lat, station.lon, false, true, station);
      if (!weather?.hourly?.length) {
        results.errors.push(`${station.name}: forecast unavailable`);
        continue;
      }

      const forecasts = forecastsFromWeatherData({
        location: station,
        weather,
        forecastTimestamp: new Date(),
        runId,
      });
      const forecastResult = await logMarianaForecasts(forecasts);
      results.forecastRows += forecastResult.inserted;

      const observation = await fetchNearestStationObservation(station.lat, station.lon).catch(() => null);
      if (observation) {
        const actualResult = await logMarianaActual({
          location,
          observedAt: observation.measuredAt,
          stationId: observation.stationId,
          source: "knmi_edr_10_minute_observation",
          variables: {
            temperature: observation.temperature ?? undefined,
            humidity: observation.humidity ?? undefined,
            windSpeed: observation.windSpeed !== null ? Number((observation.windSpeed * 3.6).toFixed(2)) : undefined,
            precipitation: observation.precipitation ?? undefined,
          },
        });
        if (actualResult.ok) results.actualRows++;
        results.verifiedForecasts += actualResult.verifiedForecasts;
      }

      results.processed++;
    } catch (error) {
      results.errors.push(`${station.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return NextResponse.json(results);
}
