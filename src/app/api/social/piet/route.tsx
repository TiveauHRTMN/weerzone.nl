import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { DUTCH_CITIES } from "@/lib/types";
import { getWeatherDescription, getWeatherEmoji } from "@/lib/weather";

export const runtime = "edge";

// Formaten:
// - ig (default): Instagram portret 4:5 = 1080x1350
// - tiktok: TikTok 9:16 = 1080x1920
// - x: Twitter/X landscape 16:9 = 1600x900
type Format = "ig" | "tiktok" | "x";
const SIZES: Record<Format, { width: number; height: number }> = {
  ig: { width: 1080, height: 1350 },
  tiktok: { width: 1080, height: 1920 },
  x: { width: 1600, height: 900 },
};

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

/**
 * Piets beknopte 48-uurs update — deterministisch, data-gedreven.
 * Max ~14 woorden, één zin, Piet-stem.
 */
function pietBrief(args: {
  ochtendTemp: number; middagTemp: number; avondTemp: number;
  rainDay: number; windMax: number; tomorrowMax: number; todayMax: number;
  code: number;
}): string {
  const { ochtendTemp, middagTemp, avondTemp, rainDay, windMax, tomorrowMax, todayMax, code } = args;
  const tempDelta = tomorrowMax - todayMax;

  if (code >= 95) return "Onweer op komst — binnen blijven is vandaag een carrièremove.";
  if (rainDay > 10) return `${rainDay.toFixed(0)}mm regen vandaag. Droog blijven is een illusie.`;
  if (rainDay > 3) return "Wisselvallig — tussen de buien door een sprintje maken.";
  if (windMax > 40) return "Harde wind — zet alles vast wat niet van jou is.";
  if (windMax > 25) return "Stevig doorwaaien, maar droog. Jas dicht en door.";
  if (middagTemp > 25) return `Warm rond middag (${middagTemp}°). Drinken en smeren.`;
  if (middagTemp > 20) return `Lekker dagje — middag naar ${middagTemp}°, avond nog ${avondTemp}°.`;
  if (ochtendTemp < 0) return `Start onder nul (${ochtendTemp}°). Krabber uit de schuur.`;
  if (ochtendTemp < 5) return `Frisse start (${ochtendTemp}°), middag loopt naar ${middagTemp}°.`;
  if (code <= 1) return `Zon van ochtend tot avond, ${ochtendTemp}° → ${middagTemp}° → ${avondTemp}°.`;
  if (Math.abs(tempDelta) >= 4) {
    return tempDelta > 0
      ? `Stijgend — ${middagTemp}° nu, morgen naar ${tomorrowMax}°.`
      : `Kouder morgen (${tomorrowMax}°), geniet dus van vandaag.`;
  }
  return `Gewoon Nederlands weer: ${ochtendTemp}° → ${middagTemp}° → ${avondTemp}°.`;
}

function morgenLabel(code: number): string {
  if (code >= 95) return "onweer";
  if (code >= 80) return "buien";
  if (code >= 61) return "regen";
  if (code >= 51) return "motregen";
  if (code >= 71) return "sneeuw";
  if (code >= 45) return "mist";
  if (code >= 2) return "wisselend bewolkt";
  if (code >= 1) return "vrijwel onbewolkt";
  return "zonnig";
}

async function fetchWeather(lat: number, lon: number) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code,wind_speed_10m,precipitation,apparent_temperature` +
      `&hourly=temperature_2m,weather_code,precipitation_probability` +
      `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum` +
      `&timezone=Europe/Amsterdam&forecast_days=2`,
    { cache: "no-store" },
  );
  return res.json() as Promise<{
    current: { temperature_2m: number; weather_code: number; wind_speed_10m: number; precipitation: number; apparent_temperature: number };
    hourly: { temperature_2m: number[]; weather_code: number[]; precipitation_probability: number[] };
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
  const formatParam = (searchParams.get("format") || "ig").toLowerCase();
  const format: Format =
    formatParam === "tiktok" ? "tiktok" : formatParam === "x" ? "x" : "ig";
  const SIZE = SIZES[format];
  // Default: landelijk weerbericht (De Bilt = KNMI-referentie).
  // ?city=… blijft optioneel voor debugging / specials.
  const cityParam = searchParams.get("city")?.toLowerCase();
  const cityMatch = cityParam
    ? DUTCH_CITIES.find((c) => c.name.toLowerCase() === cityParam)
    : undefined;
  const city = cityMatch ?? { name: "Nederland", lat: 52.11, lon: 5.18 };

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

  // ----- SLIDE 2: CTA-template (per mockup) -----
  if (slide === 2) {
    // X landscape variant: logo links, CTA-stack rechts
    if (format === "x") {
      return new ImageResponse(
        (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#4a9ee8",
              fontFamily: "system-ui, sans-serif",
              padding: "70px 90px",
            }}
          >
            {/* Links: logo + .nl */}
            <div style={{ display: "flex", alignItems: "center", flex: 1, justifyContent: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="weerzone"
                width={620}
                height={172}
                style={{
                  width: "620px",
                  height: "auto",
                  objectFit: "contain",
                  filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.25))",
                }}
              />
              <div
                style={{
                  color: "#ffffff",
                  fontSize: "56px",
                  fontWeight: 900,
                  marginLeft: "-10px",
                  letterSpacing: "-2px",
                  display: "flex",
                  textShadow: "0 4px 12px rgba(0,0,0,0.2)",
                }}
              >
                .nl
              </div>
            </div>

            {/* Rechts: copy-stack */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                alignItems: "center",
                textAlign: "center",
                gap: "30px",
              }}
            >
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: 500,
                  color: "#ffffff",
                  lineHeight: 1.35,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex" }}>Vergeet Buienradar, Weerplaza,</div>
                <div style={{ display: "flex" }}>of welke andere site dan ook!</div>
              </div>
              <div
                style={{
                  fontSize: "46px",
                  fontWeight: 900,
                  color: "#FFD60A",
                  letterSpacing: "-1px",
                  display: "flex",
                  textAlign: "center",
                  textShadow: "0 3px 10px rgba(0,0,0,0.18)",
                }}
              >
                Meld je nu aan. Tijdelijk gratis!
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 500,
                  color: "#ffffff",
                  lineHeight: 1.35,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex" }}>Of je nu particulier bent, of bedrijf —</div>
                <div style={{ display: "flex" }}>
                  <span style={{ fontWeight: 900, display: "flex" }}>Weerzone</span>
                  &nbsp;is er voor jou.
                </div>
              </div>
            </div>
          </div>
        ),
        { ...SIZE },
      );
    }

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#4a9ee8",
            fontFamily: "system-ui, sans-serif",
            padding: format === "tiktok" ? "160px 80px" : "110px 80px",
          }}
        >
          {/* Top copy */}
          <div
            style={{
              fontSize: "40px",
              fontWeight: 500,
              color: "#ffffff",
              textAlign: "center",
              lineHeight: 1.35,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex" }}>Vergeet Buienradar, Weerplaza,</div>
            <div style={{ display: "flex" }}>of welke andere site dan ook!</div>
            <div style={{ display: "flex", marginTop: "4px" }}>
              Er is geen website nauwkeuriger dan&nbsp;
              <span style={{ fontWeight: 900, display: "flex" }}>Weerzone</span>
              .
            </div>
          </div>

          {/* Middle: logo + .nl */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: "-20px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt="weerzone"
              width={820}
              height={228}
              style={{
                width: "820px",
                height: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.25))",
              }}
            />
            <div
              style={{
                color: "#ffffff",
                fontSize: "72px",
                fontWeight: 900,
                marginLeft: "-14px",
                letterSpacing: "-2px",
                display: "flex",
                textShadow: "0 4px 12px rgba(0,0,0,0.2)",
              }}
            >
              .nl
            </div>
          </div>

          {/* Yellow CTA */}
          <div
            style={{
              fontSize: "58px",
              fontWeight: 900,
              color: "#FFD60A",
              letterSpacing: "-1px",
              display: "flex",
              textShadow: "0 3px 10px rgba(0,0,0,0.18)",
            }}
          >
            Meld je nu aan. Tijdelijk gratis!
          </div>

          {/* Bottom copy */}
          <div
            style={{
              fontSize: "38px",
              fontWeight: 500,
              color: "#ffffff",
              textAlign: "center",
              lineHeight: 1.35,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex" }}>Of je nu een particulier bent, of een bedrijf.</div>
            <div style={{ display: "flex", marginTop: "4px" }}>
              <span style={{ fontWeight: 900, display: "flex" }}>Weerzone</span>
              &nbsp;is er voor jou, tot op de millimeter.
            </div>
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
  const tMax = Math.round(w.daily.temperature_2m_max[0]);
  const tMin = Math.round(w.daily.temperature_2m_min[0]);
  const rainSum = w.daily.precipitation_sum[0] ?? 0;
  const emoji = getWeatherEmoji(code, true);
  const desc = getWeatherDescription(code);
  const { bg, text } = getGradient(code);
  const muted = text === "#ffffff" ? "rgba(255,255,255,0.75)" : "rgba(15,23,42,0.7)";
  const panel = text === "#ffffff" ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.08)";

  // 4 perioden: ochtend (08), middag (13), avond (19), nacht (01 morgen)
  // Open-Meteo hourly met timezone=Europe/Amsterdam start op 00:00 vandaag, 48u lang
  const periods = [
    { key: "Ochtend", idx: 8, isDay: true },
    { key: "Middag", idx: 13, isDay: true },
    { key: "Avond", idx: 19, isDay: true },
    { key: "Nacht", idx: 25, isDay: false },
  ].map((p) => ({
    label: p.key,
    temp: Math.round(w.hourly.temperature_2m[p.idx] ?? temp),
    code: w.hourly.weather_code[p.idx] ?? code,
    rainPct: Math.round(w.hourly.precipitation_probability?.[p.idx] ?? 0),
    isDay: p.isDay,
  }));

  // Piet's 48u update + morgen-heads-up
  const tomorrowMax = Math.round(w.daily.temperature_2m_max[1] ?? tMax);
  const tomorrowMin = Math.round(w.daily.temperature_2m_min[1] ?? tMin);
  const tomorrowCode = w.daily.weather_code[1] ?? code;
  const windMaxApprox = wind;
  const brief = pietBrief({
    ochtendTemp: periods[0].temp,
    middagTemp: periods[1].temp,
    avondTemp: periods[2].temp,
    rainDay: rainSum,
    windMax: windMaxApprox,
    tomorrowMax,
    todayMax: tMax,
    code,
  });
  const morgenEmoji = getWeatherEmoji(tomorrowCode, true);

  // ----- SLIDE 1 — X landscape variant -----
  if (format === "x") {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "row",
            background: bg,
            fontFamily: "system-ui, sans-serif",
            color: text,
            padding: "50px 60px",
            position: "relative",
          }}
        >
          {/* Links: temp-centerpiece */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "3px", textTransform: "uppercase", opacity: 0.8, display: "flex" }}>
                {city.name}
              </div>
              <div style={{ fontSize: "18px", fontWeight: 500, opacity: 0.7, marginTop: "4px", display: "flex", textTransform: "capitalize" }}>
                {dateStr}
              </div>
            </div>
            <div style={{ fontSize: "140px", lineHeight: 1, marginTop: "14px", display: "flex" }}>{emoji}</div>
            <div
              style={{
                fontSize: "260px",
                fontWeight: 200,
                lineHeight: 1,
                letterSpacing: "-10px",
                marginTop: "4px",
                display: "flex",
              }}
            >
              {temp}°
            </div>
            <div style={{ fontSize: "26px", fontWeight: 500, marginTop: "10px", opacity: 0.9, display: "flex" }}>
              {desc} · voelt als {feels}°
            </div>
            <div style={{ fontSize: "22px", fontWeight: 500, marginTop: "2px", color: muted, display: "flex" }}>
              {tMin}° / {tMax}° vandaag
            </div>
          </div>

          {/* Rechts: logo + strip + brief + morgen */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "space-between",
              paddingLeft: "30px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="WEERZONE"
                width={220}
                height={61}
                style={{
                  width: "220px",
                  height: "auto",
                  objectFit: "contain",
                  filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.25))",
                }}
              />
            </div>

            {/* Periode strip */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
              {periods.map((p) => {
                const pEmoji = getWeatherEmoji(p.code, p.isDay);
                return (
                  <div
                    key={p.label}
                    style={{
                      background: panel,
                      borderRadius: "18px",
                      padding: "14px 8px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <div style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", opacity: 0.75, display: "flex" }}>
                      {p.label}
                    </div>
                    <div style={{ fontSize: "42px", lineHeight: 1, marginTop: "6px", display: "flex" }}>{pEmoji}</div>
                    <div style={{ fontSize: "32px", fontWeight: 300, marginTop: "4px", letterSpacing: "-1px", display: "flex" }}>
                      {p.temp}°
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "2px", opacity: 0.7, display: "flex" }}>
                      {p.rainPct}%
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Piet brief */}
            <div
              style={{
                background: panel,
                borderRadius: "20px",
                padding: "18px 24px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div style={{ fontSize: "22px", fontWeight: 600, fontStyle: "italic", textAlign: "center", display: "flex", lineHeight: 1.3 }}>
                &ldquo;{brief}&rdquo;
              </div>
            </div>

            {/* Morgen */}
            <div
              style={{
                background: panel,
                borderRadius: "18px",
                padding: "12px 22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "3px", textTransform: "uppercase", opacity: 0.75, display: "flex" }}>
                Morgen →
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ fontSize: "34px", display: "flex" }}>{morgenEmoji}</div>
                <div style={{ fontSize: "24px", fontWeight: 600, display: "flex" }}>
                  {tomorrowMin}° / {tomorrowMax}°
                </div>
                <div style={{ fontSize: "18px", fontWeight: 500, opacity: 0.8, display: "flex", textTransform: "capitalize" }}>
                  · {morgenLabel(tomorrowCode)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      { ...SIZE },
    );
  }

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
            marginTop: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flexGrow: 1,
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: "200px", lineHeight: 1, display: "flex" }}>{emoji}</div>
          <div
            style={{
              fontSize: "300px",
              fontWeight: 200,
              lineHeight: 1,
              letterSpacing: "-10px",
              marginTop: "8px",
              display: "flex",
            }}
          >
            {temp}°
          </div>
          <div style={{ fontSize: "32px", fontWeight: 500, marginTop: "16px", opacity: 0.9, display: "flex" }}>
            {desc} · voelt als {feels}°
          </div>
          <div style={{ fontSize: "26px", fontWeight: 500, marginTop: "4px", color: muted, display: "flex" }}>
            {tMin}° / {tMax}° vandaag
          </div>
        </div>

        {/* Piets beknopte 48u update */}
        <div
          style={{
            background: panel,
            borderRadius: "24px",
            padding: "26px 36px",
            display: "flex",
            justifyContent: "center",
            marginTop: "8px",
          }}
        >
          <div
            style={{
              fontSize: "30px",
              fontWeight: 600,
              fontStyle: "italic",
              textAlign: "center",
              display: "flex",
              lineHeight: 1.3,
            }}
          >
            &ldquo;{brief}&rdquo;
          </div>
        </div>

        {/* 4-periode strip: ochtend/middag/avond/nacht */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", gap: "14px" }}>
          {periods.map((p) => {
            const pEmoji = getWeatherEmoji(p.code, p.isDay);
            return (
              <div
                key={p.label}
                style={{
                  background: panel,
                  borderRadius: "20px",
                  padding: "18px 10px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontSize: "19px",
                    fontWeight: 700,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    opacity: 0.75,
                    display: "flex",
                  }}
                >
                  {p.label}
                </div>
                <div style={{ fontSize: "62px", lineHeight: 1, marginTop: "8px", display: "flex" }}>{pEmoji}</div>
                <div style={{ fontSize: "46px", fontWeight: 300, marginTop: "6px", letterSpacing: "-1px", display: "flex" }}>
                  {p.temp}°
                </div>
                <div style={{ fontSize: "16px", fontWeight: 600, marginTop: "2px", opacity: 0.7, display: "flex" }}>
                  {p.rainPct}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Morgen heads-up */}
        <div
          style={{
            marginTop: "18px",
            background: panel,
            borderRadius: "20px",
            padding: "16px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: "20px",
              fontWeight: 800,
              letterSpacing: "3px",
              textTransform: "uppercase",
              opacity: 0.75,
              display: "flex",
            }}
          >
            Morgen →
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{ fontSize: "44px", display: "flex" }}>{morgenEmoji}</div>
            <div style={{ fontSize: "30px", fontWeight: 600, display: "flex" }}>
              {tomorrowMin}° / {tomorrowMax}°
            </div>
            <div style={{ fontSize: "22px", fontWeight: 500, opacity: 0.8, display: "flex", textTransform: "capitalize" }}>
              · {morgenLabel(tomorrowCode)}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...SIZE },
  );
}
