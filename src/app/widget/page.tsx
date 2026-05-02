import { fetchWeatherData } from "@/lib/weather";
import { getWeatherEmoji, getWeatherDescription } from "@/lib/weather";
import { DUTCH_CITIES } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WEERZONE Widget",
  robots: { index: false, follow: false },
};

// Force dynamic rendering for live weather data
export const dynamic = "force-dynamic";

export default async function WidgetPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city: cityParam } = await searchParams;
  const cityName = cityParam || "Amsterdam";
  const cityObj = DUTCH_CITIES.find(
    (c) => c.name.toLowerCase() === cityName.toLowerCase()
  ) || DUTCH_CITIES[0];

  const weather = await fetchWeatherData(cityObj.lat, cityObj.lon);
  if (!weather) return <html><body><div style={{ padding: "16px", color: "#666" }}>Weerdata tijdelijk niet beschikbaar.</div></body></html>;
  const emoji = getWeatherEmoji(weather.current.weatherCode, weather.current.isDay);
  const desc = getWeatherDescription(weather.current.weatherCode);

  return (
    <html lang="nl">
      <body style={{ margin: 0, padding: 0, fontFamily: "system-ui, -apple-system, sans-serif", background: "transparent" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #4a9ee8, #2980b9)",
            borderRadius: "16px",
            padding: "16px 20px",
            color: "white",
            maxWidth: "320px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, opacity: 0.6, textTransform: "uppercase", letterSpacing: "1px" }}>
                {cityObj.name}
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", marginTop: "4px" }}>
                <span style={{ fontSize: "40px", fontWeight: 900, lineHeight: 1 }}>{weather.current.temperature}</span>
                <span style={{ fontSize: "18px", fontWeight: 600, opacity: 0.8, marginBottom: "4px" }}>°C</span>
              </div>
              <div style={{ fontSize: "12px", fontWeight: 600, opacity: 0.75, marginTop: "4px" }}>
                {desc} · Voelt als {weather.current.feelsLike}°
              </div>
            </div>
            <div style={{ fontSize: "48px", lineHeight: 1 }}>{emoji}</div>
          </div>

          <div style={{
            display: "flex",
            gap: "12px",
            marginTop: "12px",
            paddingTop: "12px",
            borderTop: "1px solid rgba(255,255,255,0.2)",
            fontSize: "11px",
            fontWeight: 600,
            opacity: 0.7,
          }}>
            <span>💨 {weather.current.windSpeed} km/h</span>
            <span>💧 {weather.current.humidity}%</span>
            {weather.current.precipitation > 0 && <span>🌧️ {weather.current.precipitation}mm</span>}
          </div>

          <a
            href={`https://weerzone.nl/weer/${cityObj.name.toLowerCase().replace(/\s+/g, "-")}`}
            target="_blank"
            rel="noopener"
            style={{
              display: "block",
              textAlign: "center",
              fontSize: "9px",
              fontWeight: 700,
              color: "rgba(255,255,255,0.4)",
              textDecoration: "none",
              marginTop: "10px",
              letterSpacing: "0.5px",
            }}
          >
            Powered by WEERZONE
          </a>
        </div>
      </body>
    </html>
  );
}
