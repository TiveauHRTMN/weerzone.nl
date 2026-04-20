import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { DUTCH_CITIES } from "@/lib/types";
import { getWeatherDescription, getWeatherEmoji } from "@/lib/weather";

export const runtime = "edge";

type Format = "ig" | "tiktok" | "x";
const SIZES: Record<Format, { width: number; height: number }> = {
  ig: { width: 1080, height: 1350 },
  tiktok: { width: 1080, height: 1920 },
  x: { width: 1600, height: 900 },
};

function getPremiumTheme(code: number): { bg: string; accent: string; glass: string; text: string } {
  // Rain/Stormy
  if (code >= 51) return {
    bg: "linear-gradient(160deg, #1e293b 0%, #0f172a 100%)",
    accent: "#38bdf8",
    glass: "rgba(255, 255, 255, 0.05)",
    text: "#f8fafc"
  };
  // Good weather
  return {
    bg: "linear-gradient(160deg, #0ea5e9 0%, #0284c7 100%)",
    accent: "#ffd60a",
    glass: "rgba(255, 255, 255, 0.15)",
    text: "#ffffff"
  };
}

function pietBrief(args: {
  ochtendTemp: number; middagTemp: number; avondTemp: number;
  rainDay: number; windMax: number; tomorrowMax: number; todayMax: number;
  code: number;
  uvIndex?: number;
}): string {
  const { ochtendTemp, middagTemp, rainDay, windMax, code, uvIndex } = args;
  
  if (code >= 95) return "Zwaar onweer op komst. Zoek tijdig de veiligheid van een gebouw op.";
  if (uvIndex && uvIndex >= 8) return "Extreem hoge zonkracht vandaag. Bescherming is cruciaal tussen 12:00 en 15:00.";
  if (rainDay > 10) return `Forse neerslag verwacht (${rainDay.toFixed(0)}mm). Houd rekening met wateroverlast en beperkt zicht.`;
  if (windMax > 60) return "Code geel: Zware windstoten gemeten. Wees uiterst alert in het verkeer.";
  if (middagTemp > 28) return `Tropische temperaturen van ${middagTemp}°. Pas je tempo aan en blijf gehydrateerd.`;
  if (code <= 1) return `Optimale condities. Van ${ochtendTemp}° naar ${middagTemp}° met ononderbroken zonnige perioden.`;
  
  return `Ochtend ${ochtendTemp}°, middag ${middagTemp}°. Stabiel weerbeeld met een scherp en helder Hollands karakter.`;
}

async function fetchWeather(lat: number, lon: number) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code,wind_speed_10m,precipitation,apparent_temperature` +
      `&hourly=temperature_2m,weather_code,precipitation_probability` +
      `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,uv_index_max` +
      `&timezone=Europe/Amsterdam&forecast_days=2&models=knmi_seamless`,
    { cache: "no-store" },
  );
  return res.json();
}

async function fetchLogoDataUrl(origin: string): Promise<string | null> {
  try {
    // Gebruik een betere methode voor base64 in Edge runtime
    const res = await fetch(`${origin}/logo-full.png`, { cache: "force-cache" });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const base64 = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
    return `data:image/png;base64,${base64}`;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slide = searchParams.get("slide") === "2" ? 2 : 1;
  const formatParam = (searchParams.get("format") || "ig").toLowerCase() as Format;
  const format: Format = SIZES[formatParam] ? formatParam : "ig";
  const SIZE = SIZES[format];
  
  const city = { name: "Landelijk", lat: 52.11, lon: 5.18 };
  const dateStr = new Date().toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
  const origin = req.nextUrl.origin.startsWith("http://localhost") ? req.nextUrl.origin : "https://weerzone.nl";
  // const logoUrl = (await fetchLogoDataUrl(origin)) ?? `${origin}/logo-full.png`;
  const logoUrl = ""; // Disabled for debug

  if (slide === 2) {
    // CTA SLIDE
    return new ImageResponse(
      (
        <div style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", background: "#0ea5e9",
          padding: "100px", color: "white", fontFamily: "Inter, system-ui, sans-serif"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "60px" }}>
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img src={logoUrl} alt="WEERZONE" style={{ height: "120px", width: "auto" }} />
             <span style={{ fontSize: "60px", fontWeight: 900 }}>.nl</span>
          </div>
          <div style={{ fontSize: "50px", fontWeight: 800, textAlign: "center", lineHeight: 1.2, marginBottom: "40px" }}>
            Vergeet de rest.<br/>Wij zijn er tot op de millimeter.
          </div>
          <div style={{ 
            background: "#ffd60a", color: "black", padding: "30px 60px", 
            borderRadius: "99px", fontSize: "40px", fontWeight: 900,
            border: "4px solid black" // Vervang shadow door border voor visuele impact
          }}>
            MELD JE NU GRATIS AAN
          </div>
          <div style={{ marginTop: "60px", fontSize: "24px", opacity: 0.8, letterSpacing: "4px" }}>
            48 UUR. DE REST IS RUIS.
          </div>
        </div>
      ),
      { ...SIZE }
    );
  }

  // WEATHER SLIDE
  // const w = await fetchWeather(city.lat, city.lon);
  const w = {
    current: { temperature_2m: 12, weather_code: 1, wind_speed_10m: 15 },
    hourly: { 
      temperature_2m: new Array(48).fill(12), 
      weather_code: new Array(48).fill(1),
      precipitation_probability: new Array(48).fill(0)
    },
    daily: {
      temperature_2m_max: [15, 16],
      temperature_2m_min: [8, 9],
      weather_code: [1, 1],
      precipitation_sum: [0, 0],
      uv_index_max: [5, 6]
    }
  };
  const temp = Math.round(w.current.temperature_2m);
  const code = w.current.weather_code;
  const desc = "Licht Bewolkt";
  const emoji = "🌤️";
  const theme = getPremiumTheme(code);

  const periods = [
    { label: "Ochtend", idx: 8, isDay: true },
    { label: "Middag", idx: 13, isDay: true },
    { label: "Avond", idx: 19, isDay: true },
    { label: "Nacht", idx: 25, isDay: false },
  ].map((p) => ({
    label: p.label,
    temp: 12,
    code: 1,
    rain: 0,
    isDay: p.isDay
  }));

  const brief = "Test render met mock data. Als je dit ziet, werkt de layout-engine.";

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        background: "#0284c7", color: "white", padding: "80px 72px",
      }}>
        {/* Simple Header */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "20px", fontWeight: 800 }}>LANDELIJK WEERBERICHT</span>
            <span style={{ fontSize: "30px", opacity: 0.8 }}>{dateStr}</span>
          </div>
          <span style={{ fontSize: "30px", fontWeight: 900 }}>WEERZONE</span>
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

        {/* Simple Footer */}
        <div style={{ display: "flex", justifyContent: "center", opacity: 0.5, fontSize: "20px" }}>
          48 UUR VOORUIT · DE REST IS RUIS
        </div>
      </div>
    ),
    { ...SIZE }
  );
}
