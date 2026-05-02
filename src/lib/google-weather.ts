export async function fetchGoogleWeather(lat: number, lon: number) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;
  
  try {
    const res = await fetch(`https://weather.googleapis.com/v1/forecast/hours:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lon}&hours=48&languageCode=nl`, {
      next: { revalidate: 300 }
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.warn("Google Weather API Error", res.status, body?.error?.status ?? body?.error?.message ?? "");
        return null;
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Google Weather API catch:", err);
    return null;
  }
}

export function mapGoogleWeatherConditionToWMO(type: string): number {
    const map: Record<string, number> = {
        "CLEAR": 0,
        "MOSTLY_CLEAR": 1,
        "PARTLY_CLOUDY": 2,
        "MOSTLY_CLOUDY": 3,
        "CLOUDY": 3,
        "HAZE": 5,
        "FOG": 45,
        "DRIZZLE": 51,
        "LIGHT_RAIN": 61,
        "RAIN": 63,
        "HEAVY_RAIN": 65,
        "SHOWERS": 80,
        "RAIN_SHOWERS": 80,
        "SCATTERED_SHOWERS": 80,
        "SNOW_SHOWERS": 85,
        "SNOW": 71,
        "HEAVY_SNOW": 75,
        "SLEET": 68,
        "FREEZING_RAIN": 66,
        "FREEZING_DRIZZLE": 56,
        "THUNDERSTORM": 95,
        "SEVERE_THUNDERSTORM": 95,
        "BLIZZARD": 75,
        "DUST": 8,
        "SMOKE": 5,
        "TORNADO": 95,
        "WINDY": 0
    };
    return map[type] ?? 0;
}
