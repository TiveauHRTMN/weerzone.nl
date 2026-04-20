import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

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
  return "Bewolkt";
};

async function fetchWeather(lat: number, lon: number) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code` +
      `&hourly=temperature_2m,weather_code` +
      `&timezone=Europe/Amsterdam&forecast_days=1`,
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
  
  const city = { name: "Landelijk", lat: 52.11, lon: 5.18 };
  const dateStr = new Date().toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });

  if (slide === 2) {
    return new ImageResponse(
      (
        <div style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", background: "#0ea5e9",
          padding: "100px", color: "white"
        }}>
          <div style={{ display: "flex", fontSize: "80px", fontWeight: 900, marginBottom: "40px" }}>WEERZONE.NL</div>
          <div style={{ fontSize: "50px", fontWeight: 800, textAlign: "center", lineHeight: 1.2, marginBottom: "40px" }}>
            Vergeet de rest.<br/>Wij zijn er tot op de millimeter.
          </div>
          <div style={{ 
            background: "#ffd60a", color: "black", padding: "30px 60px", 
            borderRadius: "99px", fontSize: "40px", fontWeight: 900,
            border: "4px solid black"
          }}>
            MELD JE NU GRATIS AAN
          </div>
        </div>
      ),
      { ...SIZE }
    );
  }

  // Real weather fetch
  try {
    const w = await fetchWeather(city.lat, city.lon);
    const temp = Math.round(w.current.temperature_2m);
    const code = w.current.weather_code;
    const desc = getDesc(code);
    const emoji = getEmoji(code);

    const brief = `Ochtend ${Math.round(w.hourly.temperature_2m[8])}°, middag ${Math.round(w.hourly.temperature_2m[13])}°. Authentiek Hollands weerbeeld.`;

    return new ImageResponse(
      (
        <div style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          background: "#0284c7", color: "white", padding: "80px 72px",
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "20px", fontWeight: 800 }}>LANDELIJK WEERBERICHT</span>
              <span style={{ fontSize: "30px", opacity: 0.8 }}>{dateStr}</span>
            </div>
            <span style={{ fontSize: "30px", fontWeight: 900 }}>WEERZONE.NL</span>
          </div>

          {/* Main Content */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexGrow: 1, justifyContent: "center" }}>
            <div style={{ fontSize: "150px" }}>{emoji}</div>
            <div style={{ fontSize: "250px", fontWeight: 900, lineHeight: 1 }}>{temp}°</div>
            <div style={{ fontSize: "50px", fontWeight: 700 }}>{desc}</div>
          </div>

          {/* Piet Commentary */}
          <div style={{ 
            background: "rgba(255,255,255,0.1)", padding: "40px", borderRadius: "30px",
            marginBottom: "40px", display: "flex"
          }}>
            <div style={{ fontSize: "35px", fontWeight: 600, textAlign: "center", width: "100%" }}>
              "{brief}"
            </div>
          </div>

          {/* Table-like Periods */}
          <div style={{ display: "flex", gap: "20px", marginBottom: "40px" }}>
            {[8, 13, 19, 23].map((hour, i) => {
              const labels = ["Ochtend", "Middag", "Avond", "Nacht"];
              const hTemp = Math.round(w.hourly.temperature_2m[hour]);
              const hCode = w.hourly.weather_code[hour];
              return (
                <div key={hour} style={{ 
                  flex: 1, background: "rgba(255,255,255,0.05)", padding: "20px", 
                  borderRadius: "20px", display: "flex", flexDirection: "column", alignItems: "center" 
                }}>
                  <span style={{ fontSize: "16px", opacity: 0.7 }}>{labels[i]}</span>
                  <span style={{ fontSize: "40px", margin: "10px 0" }}>{getEmoji(hCode)}</span>
                  <span style={{ fontSize: "30px", fontWeight: 800 }}>{hTemp}°</span>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "center", opacity: 0.5, fontSize: "20px" }}>
            48 UUR VOORUIT · DE REST IS RUIS
          </div>
        </div>
      ),
      { ...SIZE }
    );
  } catch (err) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", background: "#0284c7", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
           <h1>Weerzone — Laden...</h1>
        </div>
      ),
      { ...SIZE }
    );
  }
}
