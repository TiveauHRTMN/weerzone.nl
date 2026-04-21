import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { PersonaTier } from "@/lib/personas";
import { matchProducts } from "@/lib/amazon-matcher";



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
      hourly: w.hourly.time.map((_: any, i: number) => ({
        temperature: w.hourly.temperature_2m[i],
        weatherCode: w.hourly.weather_code[i],
        precipitation: w.hourly.precipitation[i]
      })),
      uvIndex: 5 // fallback
    };

    const { products } = matchProducts(weatherData as any, 1, new Date(), personaParam);
    const deal = products[0];

    const isLandscape = format === "x";
    const scale = isLandscape ? 0.65 : 1; // Schaal alles af voor landscape

    return new ImageResponse(
      (
        <div style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          background: theme.bg, color: theme.text, padding: isLandscape ? "40px 60px" : "80px 72px",
          fontFamily: "sans-serif"
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: `${40 * scale}px`, alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: `${24 * scale}px`, fontWeight: 900, letterSpacing: "2px", color: theme.accent }}>{cityName.toUpperCase()}</span>
              <span style={{ fontSize: `${36 * scale}px`, fontWeight: 800 }}>{dateStr}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ fontSize: `${32 * scale}px`, fontWeight: 900 }}>WEERZONE</span>
              <span style={{ fontSize: `${16 * scale}px`, fontWeight: 700, opacity: 0.7 }}>{theme.name}</span>
            </div>
          </div>

          {/* Main Content */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexGrow: 1, justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: `${40 * scale}px` }}>
              <div style={{ fontSize: `${180 * scale}px` }}>{emoji}</div>
              <div style={{ fontSize: `${280 * scale}px`, fontWeight: 900, lineHeight: 1, letterSpacing: "-10px" }}>{temp}°</div>
            </div>
            <div style={{ 
              fontSize: `${60 * scale}px`, fontWeight: 900, background: "black", color: "white", 
              padding: `${10 * scale}px ${40 * scale}px`, marginTop: `-${20 * scale}px`, transform: "rotate(-1deg)" 
            }}>{desc}</div>
          </div>

          {/* Deal Sniper Integration */}
          {deal && (
            <div style={{ 
              background: "white", color: "black", padding: `${30 * scale}px`, borderRadius: "0px",
              marginBottom: `${30 * scale}px`, display: "flex", alignItems: "center", border: "5px solid black",
              boxShadow: "15px 15px 0px rgba(0,0,0,0.2)"
            }}>
              <div style={{ fontSize: `${60 * scale}px`, marginRight: `${30 * scale}px` }}>🛒</div>
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <span style={{ fontSize: `${18 * scale}px`, fontWeight: 800, color: "#666" }}>TIP VAN {personaParam.toUpperCase()} — {deal.badge || 'DEAL'}</span>
                <span style={{ fontSize: `${32 * scale}px`, fontWeight: 900 }}>{deal.title}</span>
                <span style={{ fontSize: `${20 * scale}px`, fontWeight: 700 }}>{deal.subtitle}</span>
              </div>
              <div style={{ fontSize: `${40 * scale}px`, fontWeight: 900, marginLeft: `${20 * scale}px` }}>{deal.priceHint}</div>
            </div>
          )}

          {/* Forecast Grid */}
          <div style={{ display: "flex", gap: `${20 * scale}px`, marginBottom: `${30 * scale}px` }}>
            {[8, 13, 19, 23].map((hour, i) => {
              const labels = ["OCHTEND", "MIDDAG", "AVOND", "NACHT"];
              const hTemp = Math.round(w.hourly.temperature_2m[hour]);
              const hCode = w.hourly.weather_code[hour];
              return (
                <div key={hour} style={{ 
                  flex: 1, background: "rgba(0,0,0,0.2)", padding: `${20 * scale}px`, 
                  borderRadius: "0px", display: "flex", flexDirection: "column", alignItems: "center",
                  border: "2px solid rgba(255,255,255,0.2)"
                }}>
                  <span style={{ fontSize: `${18 * scale}px`, fontWeight: 800, opacity: 0.8 }}>{labels[i]}</span>
                  <span style={{ fontSize: `${60 * scale}px`, margin: `${15 * scale}px 0` }}>{getEmoji(hCode)}</span>
                  <span style={{ fontSize: `${40 * scale}px`, fontWeight: 900 }}>{hTemp}°</span>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "center", opacity: 0.6, fontSize: `${24 * scale}px`, fontWeight: 800, letterSpacing: "4px" }}>
            WEERZONE.NL · DE REST IS RUIS
          </div>
        </div>
      ),
      { ...SIZE }
    );
  } catch (err) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", background: theme.bg, color: theme.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
           <div style={{ fontSize: "40px", fontWeight: "bold" }}>Weerzone — Laden...</div>
        </div>
      ),
      { ...SIZE }
    );
  }
}

