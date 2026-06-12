import { NextRequest, NextResponse } from "next/server";
import { fetchWeatherData } from "@/lib/weather";
import { fetchPietDayStory } from "@/lib/piet-forecast";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lon = parseFloat(searchParams.get("lon") ?? "");
  const city = searchParams.get("city") ?? "Nederland";
  const dayOffset = searchParams.get("dayOffset") === "1" ? 1 : 0;

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: "lat/lon required" }, { status: 400 });
  }

  const weather = await fetchWeatherData(lat, lon).catch(() => null);
  if (!weather) return NextResponse.json(null);

  const forecast = await fetchPietDayStory(lat, lon, city, weather, dayOffset).catch(() => null);
  return NextResponse.json(forecast);
}
