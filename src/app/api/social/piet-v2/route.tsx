import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { PersonaTier } from "@/lib/personas";
import { matchProducts } from "@/lib/amazon-matcher";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Format = "ig" | "tiktok" | "x";
const SIZES: Record<Format, { width: number; height: number }> = {
  ig: { width: 1080, height: 1350 },
  tiktok: { width: 1080, height: 1920 },
  x: { width: 1600, height: 900 },
};

const getEmoji = (code: number) => {
  if (code === 0) return "☀️";
  if (code <= 3) return "🌤️";
  if (code >= 95) return "⛈️";
  if (code >= 71) return "❄️";
  if (code >= 51) return "🌧️";
  return "☁️";
};

const getDesc = (code: number) => {
  if (code === 0) return "Heerlijk Zonnig";
  if (code <= 3) return "Licht Bewolkt";
  if (code >= 51) return "Regenachtig";
  if (code >= 95) return "Zwaar Onweer";
  return "Bewolkt";
};

const PERSONA_THEMES: Record<string, { bg: string, accent: string, text: string, name: string }> = {
  piet: { bg: "#0ea5e9", accent: "#ffd60a", text: "#ffffff", name: "PIET REPORTER" },
  reed: { bg: "#b91c1c", accent: "#000000", text: "#ffffff", name: "REED STORMCHASER" },
  steve: { bg: "#1e3a8a", accent: "#3b82f6", text: "#ffffff", name: "STEVE PRO" },
};

async function fetchWeather(lat: number, lon: number) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code,wind_speed_10m,precipitation` +
      `&hourly=temperature_2m,weather_code,precipitation` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
      `&timezone=Europe/Amsterdam&forecast_days=2`,
    { cache: "no-store" },
  );
  return res.json();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slide = searchParams.get("slide") === "2" ? 2 : 1;
  const formatParam = (searchParams.get("format") || "ig").toLowerCase() as Format;
  const format: Format = SIZES[formatParam] ? formatParam : "ig";
  const SIZE = SIZES[format];
  
  const personaParam = (searchParams.get("persona") || "piet").toLowerCase() as PersonaTier;
  const theme = PERSONA_THEMES[personaParam] || PERSONA_THEMES.piet;

  const cityName = searchParams.get("city") || "Landelijk";
  const lat = parseFloat(searchParams.get("lat") || "52.11");
  const lon = parseFloat(searchParams.get("lon") || "5.18");

  const dateStr = new Date().toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();

  if (slide === 2) {
    return new ImageResponse(
      (
        <div style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", background: theme.bg,
          padding: "100px", color: theme.text, fontFamily: "sans-serif"
        }}>
          <div style={{ display: "flex", fontSize: "100px", fontWeight: 900, marginBottom: "40px", letterSpacing: "-2px" }}>WEERZONE.NL</div>
          <div style={{ fontSize: "50px", fontWeight: 800, textAlign: "center", lineHeight: 1.2, marginBottom: "60px", opacity: 0.9 }}>
            DE REST IS RUIS.<br/>WIJ ZIJN DE BRON.
          </div>
          <div style={{ 
            background: theme.accent, color: theme.accent === "#000000" ? "#ffffff" : "#000000", padding: "40px 80px", 
            borderRadius: "0px", fontSize: "40px", fontWeight: 900,
            border: "6px solid black",
            boxShadow: "20px 20px 0px rgba(0,0,0,0.3)"
          }}>
            MELD JE NU GRATIS AAN
          </div>
          <div style={{ marginTop: "60px", fontSize: "24px", fontWeight: 700, opacity: 0.7 }}>{theme.name} · WEERZONE OFFICIAL</div>
        </div>
      ),
      { ...SIZE }
    );
  }

  // Real weather fetch
  try {
    const w = await fetchWeather(lat, lon);
    const temp = Math.round(w.current.temperature_2m);
    const code = w.current.weather_code;
    const desc = getDesc(code).toUpperCase();
    const emoji = getEmoji(code);

    // Weather data format for matcher
    const weatherData = {
      current: { 
        temperature: w.current.temperature_2m, 
        weatherCode: w.current.weather_code,
        windSpeed: w.current.wind_speed_10m,
        precipitation: w.current.precipitation,
        humidity: 70, // fallback
        feelsLike: w.current.temperature_2m // fallback
      },
      daily: w.daily.time.map((_: any, i: number) => ({
        tempMax: w.daily.temperature_2m_max[i],
        tempMin: w.daily.temperature_2m_min[i],
        precipitationSum: w.daily.precipitation_sum[i],
        windSpeedMax: 20 // fallback
      })),
    };

    // 3. Simple Render
    return new ImageResponse(
      (
        <div style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          background: theme.bg, color: theme.text, padding: "80px",
          fontFamily: "sans-serif", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ fontSize: "60px", fontWeight: 900, marginBottom: "20px" }}>WEERZONE</div>
          <div style={{ fontSize: "160px", fontWeight: 900 }}>{temp}°</div>
          <div style={{ fontSize: "60px", background: "black", color: "white", padding: "10px 40px" }}>
             {cityName.toUpperCase()}
          </div>
          <div style={{ marginTop: "40px", fontSize: "100px" }}>{emoji}</div>
          <div style={{ marginTop: "40px", fontSize: "30px", fontWeight: 700 }}>{desc}</div>
        </div>
      ),
      { ...SIZE }
    );
  } catch (err: any) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", background: "#4a9ee8", color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
           <h1 style={{ fontSize: "60px" }}>OEPS!</h1>
           <p style={{ fontSize: "30px" }}>{err.message || 'Onbekende fout'}</p>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }
}

