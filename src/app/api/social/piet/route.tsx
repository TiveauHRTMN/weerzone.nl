import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { DUTCH_CITIES } from "@/lib/types";
import { getWeatherDescription, getWeatherEmoji } from "@/lib/weather";

export const runtime = "edge";

// Instagram portret (4:5) = 1080x1350, ook goed voor TikTok foto-carrousel
const SIZE = { width: 1080, height: 1350 } as const;

function getGradient(code: number): { bg: string; text: string } {
  if (code >= 95) return { bg: "linear-gradient(160deg,#1e1b4b 0%,#312e81 55%,#4c1d95 100%)", text: "#ffffff" };
  if (code >= 80) return { bg: "linear-gradient(160deg,#1e3a5f 0%,#2d4a7a 55%,#3b5998 100%)", text: "#ffffff" };
  if (code >= 61) return { bg: "linear-gradient(160deg,#374151 0%,#4b5563 55%,#6b7280 100%)", text: "#ffffff" };
  if (code >= 51) return { bg: "linear-gradient(160deg,#475569 0%,#64748b 55%,#78909c 100%)", text: "#ffffff" };
  if (code >= 71) return { bg: "linear-gradient(160deg,#cbd5e1 0%,#94a3b8 55%,#64748b 100%)", text: "#0f172a" };
  if (code >= 45) return { bg: "linear-gradient(160deg,#64748b 0%,#94a3b8 55%,#cbd5e1 100%)", text: "#0f172a" };
  if (code >= 2) return { bg: "linear-gradient(160deg,#3b82f6 0%,#60a5fa 55%,#93c5fd 100%)", text: "#ffffff" };
  return { bg: "linear-gradient(160deg,#2563eb 0%,#4a9ee8 55%,#7ec0f0 100%)", text: "#ffffff" };
}

function oneLiner(temp: number, rain: number, wind: number, code: number): string {
  if (code >= 95) return "Bliksem, donder, drama. Netflix kan inpakken.";
  if (rain > 15) return "Noach bouwde voor minder een boot. Succes.";
  if (rain > 5) return "Pak je paraplu of zwem naar je werk.";
  if (wind > 40) return "Kapsel? Vergeet het. Draag een helm.";
  if (wind > 25) return "Stevig doorwaaien vandaag.";
  if (temp > 30) return "Zelfs je airco heeft het warm.";
  if (temp > 25) return "Barbecue-weer. Je buren ruiken het al.";
  if (temp < 0) return "Je adem bevriest. Net als je motivatie.";
  if (temp < 5) return "Trek een extra trui aan, watje.";
  if (code <= 1 && temp > 15) return "Perfecte dag. Maar morgen is het weer voorbij.";
  if (code <= 1) return "Zon! Niet wennen, het is Nederland.";
  if (code >= 45) return "Stille mist. Mysterieus, vooral koud.";
  return "Gewoon Nederlands weer. Niet zeuren, gewoon gaan.";
}

async function fetchWeather(lat: number, lon: number) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code,wind_speed_10m,precipitation,apparent_temperature` +
      `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum` +
      `&timezone=Europe/Amsterdam&forecast_days=2`,
    { cache: "no-store" },
  );
  return res.json() as Promise<{
    current: { temperature_2m: number; weather_code: number; wind_speed_10m: number; precipitation: number; apparent_temperature: number };
    daily: { temperature_2m_max: number[]; temperature_2m_min: number[]; weather_code: number[]; precipitation_sum: number[] };
  }>;
}

async function fetchLogoDataUrl(origin: string): Promise<string | null> {
  try {
    const res = await fetch(`${origin}/logo-full.png`, { cache: "force-cache" });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    // btoa in edge runtime verwacht binary string
    let binary = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return `data:image/png;base64,${btoa(binary)}`;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slide = searchParams.get("slide") === "2" ? 2 : 1;
  const cityParam = (searchParams.get("city") || "amsterdam").toLowerCase();
  const city =
    DUTCH_CITIES.find((c) => c.name.toLowerCase() === cityParam) ??
    DUTCH_CITIES.find((c) => c.name === "Amsterdam")!;

  const dateStr = new Date().toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Amsterdam",
  });

  const origin = req.nextUrl.origin.startsWith("http://localhost")
    ? req.nextUrl.origin
    : "https://weerzone.nl";
  const logoUrl = (await fetchLogoDataUrl(origin)) ?? `${origin}/logo-full.png`;

  // ----- SLIDE 2: logo + CTA (geen weerdata nodig) -----
  if (slide === 2) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "linear-gradient(160deg,#2563eb 0%,#4a9ee8 55%,#1e5a8a 100%)",
            fontFamily: "system-ui, sans-serif",
            position: "relative",
            padding: "80px 72px",
          }}
        >
          {/* Logo groot bovenaan — zon zit rechts in het logo-canvas */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="WEERZONE"
            width={936}
            height={260}
            style={{
              width: "936px",
              height: "auto",
              objectFit: "contain",
              filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.25))",
            }}
          />

          {/* Strong CTA headline */}
          <div
            style={{
              marginTop: "90px",
              fontSize: "96px",
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-3px",
              lineHeight: 1.05,
              textAlign: "center",
              display: "flex",
              textShadow: "0 4px 16px rgba(0,0,0,0.25)",
            }}
          >
            Stop met Buienradar.
          </div>

          <div
            style={{
              marginTop: "28px",
              fontSize: "44px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.92)",
              textAlign: "center",
              display: "flex",
              lineHeight: 1.25,
              maxWidth: "900px",
            }}
          >
            48 uur. Eén mail. Geen reclame.
          </div>

          {/* URL block */}
          <div
            style={{
              marginTop: "80px",
              background: "rgba(255,255,255,0.97)",
              borderRadius: "36px",
              padding: "44px 72px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
            }}
          >
            <div
              style={{
                fontSize: "26px",
                color: "#64748b",
                fontWeight: 700,
                letterSpacing: "3px",
                textTransform: "uppercase",
                display: "flex",
              }}
            >
              Meld je aan op
            </div>
            <div
              style={{
                fontSize: "96px",
                color: "#0f172a",
                fontWeight: 900,
                marginTop: "8px",
                letterSpacing: "-2px",
                display: "flex",
              }}
            >
              weerzone.nl
            </div>
          </div>

          {/* Badge */}
          <div
            style={{
              marginTop: "40px",
              background: "#FFB400",
              color: "#0f172a",
              fontSize: "30px",
              fontWeight: 900,
              padding: "16px 44px",
              borderRadius: "999px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              display: "flex",
              boxShadow: "0 10px 30px rgba(0,0,0,0.28)",
            }}
          >
            Tijdelijk gratis
          </div>
        </div>
      ),
      { ...SIZE },
    );
  }

  // ----- SLIDE 1: weer-update -----
  const w = await fetchWeather(city.lat, city.lon);
  const temp = Math.round(w.current.temperature_2m);
  const feels = Math.round(w.current.apparent_temperature);
  const code = w.current.weather_code;
  const wind = Math.round(w.current.wind_speed_10m);
  const rain = w.current.precipitation;
  const tMax = Math.round(w.daily.temperature_2m_max[0]);
  const tMin = Math.round(w.daily.temperature_2m_min[0]);
  const rainSum = w.daily.precipitation_sum[0] ?? 0;
  const emoji = getWeatherEmoji(code, true);
  const desc = getWeatherDescription(code);
  const { bg, text } = getGradient(code);
  const line = oneLiner(temp, rainSum, wind, code);
  const muted = text === "#ffffff" ? "rgba(255,255,255,0.75)" : "rgba(15,23,42,0.7)";
  const panel = text === "#ffffff" ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.08)";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: bg,
          fontFamily: "system-ui, sans-serif",
          color: text,
          padding: "80px 72px",
          position: "relative",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "3px", textTransform: "uppercase", opacity: 0.8, display: "flex" }}>
              {city.name}
            </div>
            <div style={{ fontSize: "22px", fontWeight: 500, opacity: 0.7, marginTop: "6px", display: "flex", textTransform: "capitalize" }}>
              {dateStr}
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="WEERZONE"
            width={260}
            height={72}
            style={{
              width: "260px",
              height: "auto",
              objectFit: "contain",
              filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.25))",
            }}
          />
        </div>

        {/* Centerpiece */}
        <div
          style={{
            marginTop: "40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flexGrow: 1,
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: "220px", lineHeight: 1, display: "flex" }}>{emoji}</div>
          <div style={{ fontSize: "280px", fontWeight: 900, lineHeight: 1, letterSpacing: "-8px", marginTop: "12px", display: "flex" }}>
            {temp}°
          </div>
          <div style={{ fontSize: "32px", fontWeight: 600, marginTop: "12px", opacity: 0.9, display: "flex" }}>
            {desc} · voelt als {feels}°
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, marginTop: "6px", color: muted, display: "flex" }}>
            {tMin}° / {tMax}° vandaag
          </div>
        </div>

        {/* One-liner */}
        <div
          style={{
            background: panel,
            borderRadius: "24px",
            padding: "28px 36px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: "34px", fontWeight: 700, fontStyle: "italic", textAlign: "center", display: "flex", lineHeight: 1.25 }}>
            &ldquo;{line}&rdquo;
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px", gap: "20px" }}>
          {[
            { label: "Wind", value: `${wind}`, unit: "km/u" },
            { label: "Regen", value: `${rain}`, unit: "mm" },
            { label: "Max", value: `${tMax}`, unit: "°" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: panel,
                borderRadius: "20px",
                padding: "22px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
              }}
            >
              <div style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", opacity: 0.7, display: "flex" }}>
                {s.label}
              </div>
              <div style={{ fontSize: "50px", fontWeight: 900, marginTop: "4px", display: "flex" }}>
                {s.value}
                <span style={{ fontSize: "22px", fontWeight: 600, marginLeft: "4px", alignSelf: "flex-end", paddingBottom: "10px", display: "flex" }}>
                  {s.unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...SIZE },
  );
}
