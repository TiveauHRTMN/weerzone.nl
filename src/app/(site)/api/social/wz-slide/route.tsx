import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const W = 1080;
const H = 1920;

// ---- Weather helpers ----
function wxEmoji(code: number, isDay = true): string {
  if (code === 0) return isDay ? "☀️" : "🌕";
  if (code <= 3) return "🌤️";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  if (code >= 95) return "⛈️";
  return "☁️";
}

function wxLabel(code: number): string {
  if (code === 0) return "Zonnig";
  if (code <= 3) return "Licht bewolkt";
  if (code <= 48) return "Mist";
  if (code <= 67) return "Regen";
  if (code <= 77) return "Sneeuw";
  if (code <= 82) return "Buien";
  if (code >= 95) return "Onweer";
  return "Bewolkt";
}

function uvLabel(uv: number): string {
  if (uv <= 2) return "Laag";
  if (uv <= 5) return "Matig";
  if (uv <= 7) return "Hoog";
  if (uv <= 10) return "Zeer hoog";
  return "Extreem";
}

function pollenLevel(month: number, tempMax: number, code: number): string {
  const isRainy = code >= 51 && code <= 82;
  if (isRainy) return "Laag";
  // Berken: april-mei. Gras: mei-aug
  const highSeason = (month >= 4 && month <= 8);
  if (!highSeason) return "Laag";
  if (tempMax >= 17) return "Hoog";
  if (tempMax >= 12) return "Matig";
  return "Laag";
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

// ---- Open-Meteo fetch ----
async function fetchSlideWeather(lat: number, lon: number) {
  const daily = "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum";
  const hourly = "temperature_2m,weather_code,precipitation";
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=${daily}&hourly=${hourly}&current=temperature_2m,weather_code,is_day&timezone=Europe%2FAmsterdam&forecast_days=2`;
  const res = await fetch(url, { cache: "no-store" });
  return res.json();
}

// ---- Daypart ----
interface Daypart {
  label: string;
  emoji: string;
  temps: string;
  rain: string;
}

function computeDayparts(
  times: string[],
  temps: number[],
  codes: number[],
  precips: number[]
): Daypart[] {
  const now = Date.now();
  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const slots = [
    { label: "Ochtend", date: todayStr, from: 6, to: 12, isDay: true },
    { label: "Middag", date: todayStr, from: 12, to: 18, isDay: true },
    { label: "Avond", date: todayStr, from: 18, to: 23, isDay: false },
    { label: "Nacht", date: tomorrowStr, from: 0, to: 6, isDay: false },
  ];

  return slots.map((s) => {
    const indices = times
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => {
        const d = new Date(t);
        if (t.slice(0, 10) !== s.date) return false;
        const h = d.getHours();
        return h >= s.from && h < s.to && d.getTime() >= now - 3600000;
      })
      .map(({ i }) => i);

    if (indices.length === 0) {
      return { label: s.label, emoji: s.isDay ? "☀️" : "🌙", temps: "–", rain: "–" };
    }

    const slotTemps = indices.map((i) => temps[i]);
    const slotCodes = indices.map((i) => codes[i]);
    const slotRain = indices.reduce((a, i) => a + (precips[i] ?? 0), 0);
    const tempMin = Math.round(Math.min(...slotTemps));
    const tempMax = Math.round(Math.max(...slotTemps));

    // Heaviest code wins
    const dominated = slotCodes.reduce((a, b) => (b >= 95 ? b : b > 50 && b > a ? b : a), slotCodes[0]);
    const emoji = wxEmoji(dominated, s.isDay);

    const rainStr = slotRain < 0.2 ? "Droog" : slotRain < 2 ? `${slotRain.toFixed(1)} mm` : `${slotRain.toFixed(0)} mm regen`;
    const tempsStr = tempMin === tempMax ? `${tempMin}°` : `${tempMin}–${tempMax}°`;

    return { label: s.label, emoji, temps: tempsStr, rain: rainStr };
  });
}

// ---- Slide 1: Cover ----
function slide1(
  tagline: string,
  tempMin: number,
  tempMax: number,
  code: number,
  isDay: boolean,
  dateStr: string,
) {
  const emoji = wxEmoji(code, isDay);
  const desc = wxLabel(code);
  const isBad = code >= 51;

  return (
    <div
      style={{
        width: W,
        height: H,
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, #0ea5e9 0%, #075985 60%, #0c4a6e 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "white",
        position: "relative",
      }}
    >
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "80px 80px 0" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: "-1px", color: "white" }}>WEERZONE</div>
          <div style={{ fontSize: 26, fontWeight: 600, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>{dateStr}</div>
        </div>
        <div style={{
          display: "flex",
          background: "rgba(255,255,255,0.15)",
          borderRadius: 16,
          padding: "10px 24px",
          border: "1px solid rgba(255,255,255,0.25)",
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#10b981" }}>●</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginLeft: 10 }}>LIVE</div>
        </div>
      </div>

      {/* Center: emoji + temp */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
        <div style={{ fontSize: 320, lineHeight: 1, display: "flex" }}>{emoji}</div>
        <div style={{ fontSize: 260, fontWeight: 900, letterSpacing: "-12px", lineHeight: 0.85, display: "flex", color: "white" }}>
          {tempMax}°
        </div>
        <div style={{ fontSize: 56, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginTop: 24, display: "flex" }}>
          {tempMin}° – {tempMax}° · {desc}
        </div>
      </div>

      {/* Tagline badge */}
      <div style={{ display: "flex", justifyContent: "center", padding: "0 80px 80px" }}>
        <div style={{
          background: isBad ? "#ef4444" : "#10b981",
          borderRadius: 24,
          padding: "28px 60px",
          fontSize: 52,
          fontWeight: 900,
          letterSpacing: "-0.5px",
          textAlign: "center",
        }}>
          {tagline}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "0 80px 80px", fontSize: 28, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
        weerzone.nl · @weerzonenl
      </div>
    </div>
  );
}

// ---- Slide 2: Dagverloop + extras ----
function slide2(
  dayparts: Daypart[],
  sunriseStr: string,
  sunsetStr: string,
  uv: number,
  pollen: string,
  warmestRegion: string,
  warmestTemp: number,
  coldestRegion: string,
  coldestTemp: number,
) {
  const uvStr = `${uv} — ${uvLabel(uv)}`;
  const accent = "#10b981";

  return (
    <div
      style={{
        width: W,
        height: H,
        display: "flex",
        flexDirection: "column",
        background: "#0f172a",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "white",
        padding: "80px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 60 }}>
        <div style={{ fontSize: 44, fontWeight: 900, color: "white" }}>WEERZONE</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>Dagverloop</div>
      </div>

      {/* Dayparts */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {dayparts.map((dp, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "38px 0",
              borderBottom: i < dayparts.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
            }}
          >
            <div style={{ fontSize: 64, width: 100, display: "flex" }}>{dp.emoji}</div>
            <div style={{ display: "flex", flexDirection: "column", flex: 1, marginLeft: 32 }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: "white" }}>{dp.label}</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{dp.rain}</div>
            </div>
            <div style={{ fontSize: 52, fontWeight: 900, color: accent }}>{dp.temps}</div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: 2, background: "rgba(255,255,255,0.06)", margin: "48px 0" }} />

      {/* Extras */}
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 2 }}>Zon op</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: "white", marginTop: 8 }}>🌅 {sunriseStr}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", textAlign: "right" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 2 }}>Zon onder</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: "white", marginTop: 8 }}>🌇 {sunsetStr}</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 2 }}>UV index</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: uv >= 6 ? "#f59e0b" : accent, marginTop: 8 }}>☀️ {uvStr}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", textAlign: "right" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 2 }}>Hooikoorts</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: pollen === "Hoog" ? "#f59e0b" : pollen === "Matig" ? "#fbbf24" : accent, marginTop: 8 }}>🌿 {pollen}</div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 2, background: "rgba(255,255,255,0.06)", margin: "48px 0" }} />

      {/* Regio's */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 2 }}>Regionale verschillen</div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 24, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>Warmst</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: "#f59e0b", marginTop: 6 }}>🔥 {warmestRegion} {warmestTemp}°</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", textAlign: "right" }}>
            <div style={{ fontSize: 24, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>Koelst</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: "#60a5fa", marginTop: 6 }}>❄️ {coldestRegion} {coldestTemp}°</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Slide 3: CTA ----
function slide3(dateStr: string) {
  return (
    <div
      style={{
        width: W,
        height: H,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #0f172a 0%, #0c4a6e 60%, #0ea5e9 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "white",
        padding: "80px",
        textAlign: "center",
      }}
    >
      {/* Logo */}
      <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: "-4px", marginBottom: 32, display: "flex" }}>
        WEERZONE
      </div>
      <div style={{
        width: 120,
        height: 4,
        background: "#10b981",
        borderRadius: 2,
        marginBottom: 80,
        display: "flex",
      }} />

      {/* Tagline */}
      <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1.1, letterSpacing: "-2px", marginBottom: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span>Hyperlokaal weer.</span>
        <span style={{ color: "#10b981" }}>Vandaag en morgen.</span>
      </div>

      <div style={{ fontSize: 36, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 120, display: "flex" }}>
        {dateStr}
      </div>

      {/* CTA */}
      <div style={{
        background: "#10b981",
        borderRadius: 28,
        padding: "44px 100px",
        fontSize: 52,
        fontWeight: 900,
        letterSpacing: "-0.5px",
        display: "flex",
      }}>
        Gratis op weerzone.nl →
      </div>

      <div style={{ marginTop: 60, fontSize: 32, fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "flex" }}>
        @weerzonenl · TikTok
      </div>
    </div>
  );
}

// ---- Route handler ----
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slide = parseInt(searchParams.get("slide") ?? "1");
    const lat = parseFloat(searchParams.get("lat") ?? "52.11");
    const lon = parseFloat(searchParams.get("lon") ?? "5.18");
    const tagline = searchParams.get("tagline") ?? "Weer in Nederland";
    const warmestRegion = searchParams.get("warmest") ?? "Zuid";
    const warmestTemp = parseInt(searchParams.get("wt") ?? "17");
    const coldestRegion = searchParams.get("coldest") ?? "Noord";
    const coldestTemp = parseInt(searchParams.get("ct") ?? "12");

    const w = await fetchSlideWeather(lat, lon);

    const todayCode = w.daily?.weather_code?.[0] ?? 0;
    const tempMax = Math.round(w.daily?.temperature_2m_max?.[0] ?? 15);
    const tempMin = Math.round(w.daily?.temperature_2m_min?.[0] ?? 8);
    const isDay = w.current?.is_day === 1;
    const uv = Math.round(w.daily?.uv_index_max?.[0] ?? 0);
    const sunrise = w.daily?.sunrise?.[0] ? fmtTime(w.daily.sunrise[0]) : "–";
    const sunset = w.daily?.sunset?.[0] ? fmtTime(w.daily.sunset[0]) : "–";

    const now = new Date();
    const dateStr = now.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
    const month = now.getMonth() + 1;
    const pollen = pollenLevel(month, tempMax, todayCode);

    const hourlyTimes: string[] = w.hourly?.time ?? [];
    const hourlyTemps: number[] = w.hourly?.temperature_2m ?? [];
    const hourlyCodes: number[] = w.hourly?.weather_code ?? [];
    const hourlyPrecip: number[] = w.hourly?.precipitation ?? [];

    const dayparts = computeDayparts(hourlyTimes, hourlyTemps, hourlyCodes, hourlyPrecip);

    let element: React.ReactElement;
    if (slide === 2) {
      element = slide2(dayparts, sunrise, sunset, uv, pollen, warmestRegion, warmestTemp, coldestRegion, coldestTemp);
    } else if (slide === 3) {
      element = slide3(dateStr);
    } else {
      element = slide1(tagline, tempMin, tempMax, todayCode, isDay, dateStr);
    }

    return new ImageResponse(element, { width: W, height: H });
  } catch (e: any) {
    return new Response(`Slide error: ${e.message}`, { status: 500 });
  }
}
