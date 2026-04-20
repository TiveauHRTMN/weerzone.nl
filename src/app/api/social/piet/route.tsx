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
  const logoUrl = (await fetchLogoDataUrl(origin)) ?? `${origin}/logo-full.png`;

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
  const w = await fetchWeather(city.lat, city.lon);
  const temp = Math.round(w.current.temperature_2m);
  const code = w.current.weather_code;
  const desc = getWeatherDescription(code);
  const emoji = getWeatherEmoji(code, true);
  const theme = getPremiumTheme(code);

  const periods = [
    { label: "Ochtend", idx: 8, isDay: true },
    { label: "Middag", idx: 13, isDay: true },
    { label: "Avond", idx: 19, isDay: true },
    { label: "Nacht", idx: 25, isDay: false },
  ].map((p) => ({
    label: p.label,
    temp: Math.round(w.hourly.temperature_2m[p.idx]),
    code: w.hourly.weather_code[p.idx],
    rain: w.hourly.precipitation_probability[p.idx],
    isDay: p.isDay
  }));

  const brief = pietBrief({
    ochtendTemp: periods[0].temp,
    middagTemp: periods[1].temp,
    avondTemp: periods[2].temp,
    rainDay: w.daily.precipitation_sum[0],
    windMax: w.current.wind_speed_10m,
    tomorrowMax: w.daily.temperature_2m_max[1],
    todayMax: w.daily.temperature_2m_max[0],
    code,
    uvIndex: w.daily.uv_index_max[0]
  });

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        background: theme.bg, color: theme.text, padding: "80px 72px",
        fontFamily: "Inter, system-ui, sans-serif", position: "relative"
      }}>
        {/* Glow accent */}
        <div style={{
          position: "absolute", top: "-150px", right: "-150px", width: "500px", height: "500px",
          borderRadius: "50%", background: `radial-gradient(circle, ${theme.accent}20 0%, transparent 70%)`
        }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ 
              background: theme.glass, padding: "8px 16px", borderRadius: "99px",
              display: "flex", alignItems: "center", gap: "8px", border: "1px solid rgba(255,255,255,0.1)"
            }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "2px" }}>LANDELIJK WEERBERICHT</span>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 500, marginTop: "20px", display: "flex", textTransform: "capitalize", opacity: 0.7 }}>
              {dateStr}
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="WEERZONE" style={{ height: "48px", width: "auto" }} />
        </div>

        {/* Main Part */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexGrow: 1, justifyContent: "center" }}>
          <div style={{ fontSize: "120px", display: "flex" }}>{emoji}</div>
          <div style={{ fontSize: "320px", fontWeight: 900, lineHeight: 0.8, letterSpacing: "-15px", display: "flex" }}>
            {temp}°
          </div>
          <div style={{ fontSize: "40px", fontWeight: 700, marginTop: "20px", display: "flex" }}>
            NL: {desc}
          </div>
        </div>

        {/* Piet Commentary */}
        <div style={{ 
          background: "rgba(0,0,0,0.2)", padding: "32px 40px", borderRadius: "32px",
          border: "1px solid rgba(255,255,255,0.1)", marginBottom: "40px", display: "flex"
        }}>
          <div style={{ fontSize: "32px", fontWeight: 600, fontStyle: "italic", textAlign: "center", width: "100%", lineHeight: 1.2 }}>
            "{brief}"
          </div>
        </div>

        {/* Periods */}
        <div style={{ display: "flex", gap: "16px" }}>
          {periods.map(p => (
            <div key={p.label} style={{
              flex: 1, background: theme.glass, padding: "24px 12px", borderRadius: "24px",
              display: "flex", flexDirection: "column", alignItems: "center", border: "1px solid rgba(255,255,255,0.05)"
            }}>
              <span style={{ fontSize: "16px", fontWeight: 800, opacity: 0.6, textTransform: "uppercase", letterSpacing: "2px" }}>{p.label}</span>
              <span style={{ fontSize: "60px", margin: "12px 0", display: "flex" }}>{getWeatherEmoji(p.code, p.isDay)}</span>
              <span style={{ fontSize: "44px", fontWeight: 800 }}>{p.temp}°</span>
              <span style={{ fontSize: "14px", fontWeight: 700, marginTop: "4px", color: theme.accent }}>{p.rain}% 🌧️</span>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div style={{ marginTop: "40px", display: "flex", justifyContent: "center", opacity: 0.4, fontSize: "14px", fontWeight: 500 }}>
          DATA: KNMI HARMONIE · VOORSPELLING VOOR DE BILT (REFERENTIE NL)
        </div>
      </div>
    ),
    { ...SIZE }
  );
}
