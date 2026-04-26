import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

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
  if (code >= 95) return "Zwaar Onweer";
  if (code >= 71) return "Sneeuw";
  if (code >= 51) return "Regenachtig";
  if (code === 0) return "Heerlijk Zonnig";
  if (code <= 3) return "Licht Bewolkt";
  return "Bewolkt";
};

async function fetchWeather(lat: number, lon: number) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=Europe/Amsterdam`,
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
    const cityName = searchParams.get("city") || "Nederland";
    
    const lat = parseFloat(searchParams.get("lat") || "52.11");
    const lon = parseFloat(searchParams.get("lon") || "5.18");

    const w = await fetchWeather(lat, lon);
    const temp = Math.round(w.current.temperature_2m);
    const code = w.current.weather_code;
    const emoji = getEmoji(code);
    const desc = getDesc(code);

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "linear-gradient(135deg, #0ea5e9 0%, #000000 100%)",
            fontFamily: "system-ui, sans-serif",
            color: "white",
            padding: "80px",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "80px", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "40px", fontWeight: 900, color: "#ffd60a" }}>{cityName.toUpperCase()}</div>
              <div style={{ fontSize: "24px", fontWeight: 700, opacity: 0.8 }}>WEERZONE OFFICIAL</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ fontSize: "60px", fontWeight: 900 }}>WEERZONE</div>
              <div style={{ background: "#ffd60a", color: "black", padding: "4px 12px", borderRadius: "8px", fontWeight: 900, fontSize: "20px" }}>PRO</div>
            </div>
          </div>

          {/* Main Weather Display */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center" }}>
            <div style={{ fontSize: "300px", display: "flex", marginBottom: "-40px" }}>{emoji}</div>
            <div style={{ fontSize: "380px", fontWeight: 900, letterSpacing: "-15px", display: "flex" }}>{temp}°</div>
            <div style={{ 
              fontSize: "80px", fontWeight: 900, background: "#ffd60a", color: "black", 
              padding: "10px 60px", borderRadius: "20px", display: "flex", transform: "rotate(-1deg)"
            }}>{desc.toUpperCase()}</div>
          </div>

          {/* Slogan & Verification */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "80px" }}>
            <div style={{ fontSize: "40px", fontWeight: 800, marginBottom: "10px" }}>48 UUR. DE REST IS RUIS.</div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", opacity: 0.6 }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "2px" }}>HYPERLOKAAL · LIVE DATA</span>
            </div>
          </div>

          {/* Footer URL */}
          <div style={{ marginTop: "60px", textAlign: "center", fontSize: "28px", opacity: 0.4, fontWeight: 700 }}>
            WWW.WEERZONE.NL
          </div>
        </div>
      ),
      { ...SIZE }
    );
  } catch (e: any) {
    return new Response(`ERROR: ${e.message}`, { status: 500 });
  }
}
