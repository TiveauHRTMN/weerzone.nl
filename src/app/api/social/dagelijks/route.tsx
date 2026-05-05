import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REGIONS = [
  { label: "Midden", lat: 52.1066, lon: 5.1797 },
  { label: "Noord",  lat: 53.2194, lon: 6.5665 },
  { label: "Oost",   lat: 52.2215, lon: 6.8937 },
  { label: "West",   lat: 51.9244, lon: 4.4777 },
  { label: "Zuid",   lat: 51.4416, lon: 5.4697 },
];

async function fetchRegion(lat: number, lon: number) {
  const r = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=Europe/Amsterdam`,
    { cache: "no-store" }
  );
  const d = await r.json();
  return { temp: Math.round(d.current.temperature_2m) as number, code: d.current.weather_code as number };
}

async function fetchCentral() {
  const r = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=52.1066&longitude=5.1797` +
    `&hourly=temperature_2m,precipitation,wind_speed_10m` +
    `&daily=weather_code,sunshine_duration,uv_index_max,temperature_2m_max,temperature_2m_min` +
    `&timezone=Europe/Amsterdam&forecast_days=1`,
    { cache: "no-store" }
  );
  return r.json();
}

function codeToScene(c: number): "zonnig" | "bewolkt" | "regen" | "storm" | "sneeuw" {
  if (c >= 95) return "storm";
  if (c >= 71 && c <= 77) return "sneeuw";
  if (c >= 51) return "regen";
  if (c >= 3) return "bewolkt";
  return "zonnig";
}

function sceneColors(s: string) {
  if (s === "zonnig") return { top: "#4aa3ff", bot: "#2b6ed6", dark: false };
  if (s === "bewolkt") return { top: "#7c94b6", bot: "#4c6588", dark: false };
  if (s === "storm")  return { top: "#2b2f46", bot: "#0f1220", dark: false };
  if (s === "sneeuw") return { top: "#cfe1f4", bot: "#7a9dc7", dark: true };
  return { top: "#3b7ff0", bot: "#1f3f78", dark: false }; // regen / default
}

function codeToEmoji(c: number) {
  if (c === 0)          return "☀️";
  if (c <= 3)           return "🌤️";
  if (c <= 48)          return "☁️";
  if (c >= 95)          return "⛈️";
  if (c >= 71 && c <= 77) return "❄️";
  if (c >= 51)          return "🌧️";
  return "🌤️";
}

function kmhToBft(kmh: number) {
  if (kmh <  1) return 0; if (kmh <  6) return 1; if (kmh < 12) return 2;
  if (kmh < 20) return 3; if (kmh < 29) return 4; if (kmh < 39) return 5;
  if (kmh < 50) return 6; if (kmh < 62) return 7; if (kmh < 75) return 8;
  if (kmh < 89) return 9; if (kmh < 103) return 10; return 11;
}

function avg(arr: number[]) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
function sum(arr: number[]) { return arr.reduce((a, b) => a + b, 0); }

function computeDagdelen(h: { temperature_2m: number[]; precipitation: number[]; wind_speed_10m: number[] }) {
  const slices = [
    { label: "Nacht",   start: 0,  end: 6  },
    { label: "Ochtend", start: 6,  end: 12 },
    { label: "Middag",  start: 12, end: 18 },
    { label: "Avond",   start: 18, end: 24 },
  ];
  return slices.map(({ label, start, end }) => {
    const temps  = h.temperature_2m.slice(start, end);
    const precip = h.precipitation.slice(start, end);
    const wind   = h.wind_speed_10m.slice(start, end);
    return {
      label,
      temp:   `${Math.round(avg(temps))}°C`,
      precip: `${sum(precip).toFixed(1)}mm`,
      wind:   `${kmhToBft(avg(wind))} Bft`,
    };
  });
}

async function generateNarrative(code: number, tMax: number, tMin: number, sunH: number, uv: number) {
  try {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (!key) throw new Error("no key");
    const prompt =
      `Je bent Piet van Weerzone. Schrijf precies 4 losse zinnen (elk max 85 tekens) ` +
      `als dagelijks weerbericht voor Nederland in formele weerstijl. Geen intro, geen nummering. ` +
      `Weercode ${code}, max ${tMax}°C, min ${tMin}°C, zon ${sunH.toFixed(1)}u, UV ${uv.toFixed(1)}.`;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 220, temperature: 0.75 },
        }),
        signal: AbortSignal.timeout(9000),
      }
    );
    const d = await res.json();
    const text: string = d.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const lines = text.split("\n").map((l: string) => l.trim()).filter(Boolean).slice(0, 4);
    if (lines.length >= 2) return lines;
    throw new Error("too short");
  } catch {
    return [
      "Wisselvallig weer met perioden van bewolking en soms zon.",
      "De temperatuur blijft nabij het seizoensgemiddelde voor deze periode.",
      "Een matige wind zorgt voor enige gevoelskoeling in open gebieden.",
      "Regionale verschillen tussen kust en binnenland blijven beperkt.",
    ];
  }
}

function toNlDate(d: Date) {
  const s = d.toLocaleDateString("nl-NL", {
    weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Amsterdam",
  });
  const [day, ...rest] = s.replace(",", "").split(" ");
  return `${day.charAt(0).toUpperCase() + day.slice(1)} · ${rest.join(" ")}`;
}

export async function GET(_req: NextRequest) {
  const [central, ...regionResults] = await Promise.all([
    fetchCentral(),
    ...REGIONS.map(r => fetchRegion(r.lat, r.lon)),
  ]);

  const daily = central.daily;
  const weatherCode = daily.weather_code[0] as number;
  const sunHours    = ((daily.sunshine_duration[0] as number) / 3600);
  const uvMax       = daily.uv_index_max[0] as number;
  const tMax        = Math.round(daily.temperature_2m_max[0] as number);
  const tMin        = Math.round(daily.temperature_2m_min[0] as number);

  const scene    = codeToScene(weatherCode);
  const colors   = sceneColors(scene);
  const dagdelen = computeDagdelen(central.hourly);
  const regions  = REGIONS.map((r, i) => ({
    label: r.label,
    emoji: codeToEmoji(regionResults[i].code),
    temp:  `${regionResults[i].temp}°C`,
  }));
  const narrative = await generateNarrative(weatherCode, tMax, tMin, sunHours, uvMax);
  const dateStr   = toNlDate(new Date());

  const tc   = colors.dark ? "#0f1a2c" : "#ffffff";
  const tm   = colors.dark ? "rgba(15,26,44,.72)" : "rgba(255,255,255,.78)";
  const card = "#eef1f4";
  const ink  = "#0f1a2c";
  const soft = "#394a66";
  const mute = "#6a7a93";
  const W = 1080, H = 1350, P = 48;

  return new ImageResponse(
    (
      <div style={{
        width: W, height: H, display: "flex", flexDirection: "column",
        background: `radial-gradient(110% 55% at 50% -5%, rgba(160,200,255,.45) 0%, transparent 55%), linear-gradient(180deg, ${colors.top} 0%, ${colors.bot} 100%)`,
        padding: `${P}px ${P}px ${P}px`,
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: tc, boxSizing: "border-box",
      }}>

        {/* Header badges */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
          <Badge text={dateStr} muted={tm} />
          <Badge text="Dagelijks Weerbericht" muted={tm} />
        </div>

        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://weerzone.nl/logo-white.png"
            alt="Weerzone"
            style={{ height: 64, width: "auto" }}
          />
        </div>

        {/* Tagline */}
        <div style={{
          display: "flex", justifyContent: "center",
          fontSize: 22, fontWeight: 700, letterSpacing: "0.22em",
          textTransform: "uppercase", color: tm, marginBottom: 32,
        }}>
          Nederland · Landelijk overzicht
        </div>

        {/* Row 1: Sun/UV + Regions */}
        <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
          <div style={{
            display: "flex", flexDirection: "column", justifyContent: "center", gap: 28,
            background: card, borderRadius: 40, padding: "36px 30px", flex: "0 0 290px",
          }}>
            <Stat label="Zonuren" value={`${sunHours.toFixed(1)}u`} ink={ink} soft={soft} />
            <Stat label="UV Index" value={uvMax.toFixed(1)}        ink={ink} soft={soft} />
          </div>

          <div style={{
            display: "flex", flex: 1, background: card, borderRadius: 40,
            padding: "28px 36px", flexDirection: "column", justifyContent: "center", gap: 12,
          }}>
            {regions.map(r => (
              <div key={r.label} style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 30, fontWeight: 800, color: ink, flex: "0 0 160px" }}>{r.label}:</span>
                <span style={{ fontSize: 32, flex: "0 0 50px" }}>{r.emoji}</span>
                <span style={{ fontSize: 30, fontWeight: 800, color: ink }}>{r.temp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Dagdelen */}
        <div style={{
          display: "flex", flexDirection: "column",
          background: card, borderRadius: 40, padding: "28px 36px", marginBottom: 24,
        }}>
          <div style={{ display: "flex", marginBottom: 14 }}>
            {["Dagdeel", "Temp", "Neerslag", "Wind"].map((h, i) => (
              <div key={h} style={{
                flex: i === 0 ? "1.3 0 0" : "1 0 0",
                fontSize: 17, fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", color: mute,
              }}>{h}</div>
            ))}
          </div>
          {dagdelen.map((d, i) => (
            <div key={d.label} style={{
              display: "flex", paddingTop: 12, paddingBottom: 12,
              borderTop: i > 0 ? "1px solid rgba(0,0,0,.09)" : "none",
            }}>
              <div style={{ flex: "1.3 0 0", fontSize: 32, fontWeight: 800, color: ink }}>{d.label}</div>
              <div style={{ flex: "1 0 0",   fontSize: 32, fontWeight: 800, color: ink }}>{d.temp}</div>
              <div style={{ flex: "1 0 0",   fontSize: 32, fontWeight: 800, color: ink }}>{d.precip}</div>
              <div style={{ flex: "1 0 0",   fontSize: 32, fontWeight: 800, color: ink }}>{d.wind}</div>
            </div>
          ))}
        </div>

        {/* Row 3: Piet's Update */}
        <div style={{
          display: "flex", flexDirection: "column",
          background: card, borderRadius: 40, padding: "32px 36px", marginBottom: 36,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
            <span style={{ fontSize: 40 }}>💬</span>
            <span style={{ fontSize: 36, fontWeight: 800, color: ink }}>{"Piet's Update"}</span>
          </div>
          {narrative.map((line, i) => (
            <div key={i} style={{
              fontSize: 25, lineHeight: 1.55, color: soft,
              marginBottom: i < narrative.length - 1 ? 14 : 0,
            }}>{line}</div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          display: "flex", justifyContent: "center", marginTop: "auto",
          fontSize: 26, fontWeight: 600, color: tm,
        }}>
          {"Ga naar "}
          <span style={{ color: "#ffd21a", fontWeight: 800, marginLeft: 6, marginRight: 6 }}>weerzone.nl</span>
          {" voor het volledige weer"}
        </div>
      </div>
    ),
    { width: W, height: H }
  );
}

function Badge({ text, muted }: { text: string; muted: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      fontSize: 19, letterSpacing: "0.12em", textTransform: "uppercase",
      fontWeight: 700, color: muted,
      background: "rgba(255,255,255,.12)",
      border: "1px solid rgba(255,255,255,.2)",
      padding: "10px 22px", borderRadius: 999,
    }}>{text}</div>
  );
}

function Stat({ label, value, ink, soft }: { label: string; value: string; ink: string; soft: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 24, fontWeight: 600, color: soft, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 54, fontWeight: 800, letterSpacing: "-0.02em", color: ink }}>{value}</div>
    </div>
  );
}
