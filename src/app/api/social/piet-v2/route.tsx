import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

import { PersonaTier } from "@/lib/personas";
import { matchProducts } from "@/lib/amazon-matcher";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type Format = "tiktok" | "x";
const SIZES: Record<Format, { width: number; height: number }> = {
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
    { cache: "no-store" }
  );
  return res.json();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const formatParam = (searchParams.get("format") || "x").toLowerCase() as Format;
    const format: Format = SIZES[formatParam] ? formatParam : "x";
    const SIZE = SIZES[format];
    
    const personaParam = (searchParams.get("persona") || "piet").toLowerCase() as PersonaTier;
    const theme = PERSONA_THEMES[personaParam] || PERSONA_THEMES.piet;

    const cityName = searchParams.get("city") || "Nederland";
    const lat = parseFloat(searchParams.get("lat") || "52.11");
    const lon = parseFloat(searchParams.get("lon") || "5.18");

    const w = await fetchWeather(lat, lon);
    const temp = Math.round(w.current.temperature_2m);
    const code = w.current.weather_code;
    const desc = getDesc(code).toUpperCase();
    const emoji = getEmoji(code);

    const isLandscape = format === "x";
    const scale = isLandscape ? 0.7 : 1;

    // Minimal weatherData for matcher
    const weatherData = {
      current: { temperature: temp, weatherCode: code, precipitation: w.current.precipitation },
      daily: w.daily.time.map((_: any, i: number) => ({ tempMax: w.daily.temperature_2m_max[i] }))
    };
    const { products } = matchProducts(weatherData as any, 1, new Date(), personaParam);
    const deal = products[0];

    return new ImageResponse(
      (
        <div style={{
          height: "100%", width: "100%", display: "flex", flexDirection: "column",
          background: theme.bg, color: theme.text, padding: isLandscape ? "40px 60px" : "80px 72px",
          fontFamily: "sans-serif"
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 32 * scale, fontWeight: 900, color: theme.accent }}>{cityName.toUpperCase()}</span>
              <span style={{ fontSize: 24 * scale, fontWeight: 800, opacity: 0.8 }}>WEERZONE OFFICIAL</span>
            </div>
            <div style={{ fontSize: 40 * scale, fontWeight: 900 }}>WEERZONE</div>
          </div>

          {/* Main */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexGrow: 1, justifyContent: "center" }}>
            <div style={{ fontSize: 250 * scale, marginBottom: -20 * scale }}>{emoji}</div>
            <div style={{ fontSize: 300 * scale, fontWeight: 900, letterSpacing: -10 * scale }}>{temp}°</div>
            <div style={{ 
              fontSize: 80 * scale, fontWeight: 900, background: "black", color: "white", 
              padding: "10px 40px", transform: "rotate(-1deg)" 
            }}>{desc}</div>
          </div>

          {/* Deal */}
          {deal && (
            <div style={{ 
              background: "white", color: "black", padding: 30 * scale, border: "6px solid black",
              boxShadow: "15px 15px 0px rgba(0,0,0,0.2)", display: "flex", alignItems: "center"
            }}>
              <div style={{ fontSize: 70 * scale, marginRight: 30 * scale }}>🛒</div>
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <span style={{ fontSize: 20 * scale, fontWeight: 800, color: "#666" }}>PIET'S KEUZE — {deal.badge}</span>
                <span style={{ fontSize: 36 * scale, fontWeight: 900 }}>{deal.title}</span>
              </div>
              <div style={{ fontSize: 40 * scale, fontWeight: 900, marginLeft: 20 * scale }}>NL</div>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 40 * scale, opacity: 0.7, fontSize: 24 * scale, fontWeight: 800 }}>
            DE REST IS RUIS · WWW.WEERZONE.NL
          </div>
        </div>
      ),
      { ...SIZE }
    );
  } catch (e: any) {
    return new Response(`Error: ${e.message}`, { status: 500 });
  }
}


