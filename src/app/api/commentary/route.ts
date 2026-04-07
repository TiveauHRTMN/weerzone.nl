import { NextRequest } from "next/server";
import { fetchWeatherData } from "@/lib/weather";
import {
  getMainCommentary,
  getKutweerScore,
  getFietsScore,
  getOutfitAdvice,
  getWindComment,
  getRandomQuote,
  getUvLabel,
} from "@/lib/commentary";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = parseFloat(searchParams.get("lat") || "");
  const lon = parseFloat(searchParams.get("lon") || "");

  if (isNaN(lat) || isNaN(lon)) {
    return Response.json({ error: "Missing or invalid lat/lon" }, { status: 400 });
  }

  const weather = await fetchWeatherData(lat, lon);

  return Response.json({
    weather,
    commentary: {
      main: getMainCommentary(weather),
      kutweerScore: getKutweerScore(weather),
      fietsScore: getFietsScore(weather),
      outfit: getOutfitAdvice(weather),
      wind: getWindComment(weather.current.windSpeed, weather.current.windGusts),
      quote: getRandomQuote(),
      uv: getUvLabel(weather.uvIndex),
    },
  });
}
