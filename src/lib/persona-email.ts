import { PERSONAS, type PersonaTier } from "@/lib/personas";
import {
  getWeatherEmoji,
  getWeatherDescription,
  getWindBeaufort,
} from "@/lib/weather";
import type { PersonaBrief } from "@/lib/persona-brief";

export interface EmailAmazonTip {
  title: string;
  subtitle?: string;
  price?: string;
  url: string;
  emoji?: string;
  color?: string;
}

export interface EmailWeatherData {
  current: {
    temperature: number;
    feelsLike: number;
    windSpeed: number;
    windDirection?: string;
    precipitation: number;
    humidity: number;
    cloudCover?: number;
    weatherCode: number;
    isDay?: boolean;
  };
  daily: {
    tempMax: number;
    tempMin: number;
    precipitationSum: number;
    weatherCode: number;
    windSpeedMax: number;
    sunHours?: number;
  };
  sunrise?: string;
  sunset?: string;
  uvIndex?: number;
  hourly?: {
    time: string;
    temperature: number;
    precipitation: number;
    windSpeed: number;
    weatherCode: number;
    cape?: number;
  }[];
}

function esc(s: string | number): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function fmtHour(iso: string): string {
  return `${new Date(iso).getHours().toString().padStart(2, "0")}:00`;
}

interface DaypartRow {
  emoji: string;
  label: string;
  window: string;
  tempLine: string;
  rainLine: string;
}

function computeDayparts(
  hourly: NonNullable<EmailWeatherData["hourly"]>,
): DaypartRow[] {
  const now = Date.now();
  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const inRange = (
    h: (typeof hourly)[0],
    dateStr: string,
    from: number,
    to: number,
  ) => {
    if (h.time.slice(0, 10) !== dateStr) return false;
    const hr = new Date(h.time).getHours();
    return hr >= from && hr < to;
  };
  const future = (h: (typeof hourly)[0]) =>
    new Date(h.time).getTime() >= now - 1800000;

  const defs = [
    {
      label: "Ochtend",
      window: "06–12 u",
      hrs: hourly.filter((h) => inRange(h, todayStr, 6, 12) && future(h)),
      day: true,
    },
    {
      label: "Middag",
      window: "12–18 u",
      hrs: hourly.filter((h) => inRange(h, todayStr, 12, 18) && future(h)),
      day: true,
    },
    {
      label: "Avond",
      window: "18–00 u",
      hrs: hourly.filter((h) => inRange(h, todayStr, 18, 24) && future(h)),
      day: false,
    },
    {
      label: "Nacht",
      window: "00–06 u",
      hrs: hourly.filter((h) => inRange(h, tomorrowStr, 0, 6)),
      day: false,
    },
    {
      label: "Morgen",
      window: "hele dag",
      hrs: hourly.filter((h) => inRange(h, tomorrowStr, 6, 24)),
      day: true,
    },
  ];

  return defs
    .filter((d) => d.hrs.length > 0)
    .map((d) => {
      const temps = d.hrs.map((h) => h.temperature);
      const tempMin = Math.min(...temps);
      const tempMax = Math.max(...temps);
      const rainSum = d.hrs.reduce((a, h) => a + h.precipitation, 0);

      const heaviest = d.hrs.reduce(
        (a, h) => (h.precipitation > a.precipitation ? h : a),
        d.hrs[0],
      );
      const codeHour =
        heaviest.precipitation > 0.2
          ? heaviest
          : d.hrs[Math.floor(d.hrs.length / 2)];
      const emoji = getWeatherEmoji(codeHour.weatherCode, d.day);

      const onweer = d.hrs.find(
        (h) =>
          (h.cape ?? 0) > 1000 ||
          (h.weatherCode >= 95 && h.weatherCode <= 99),
      );

      let rainLine: string;
      if (onweer) rainLine = `Onweer ~${fmtHour(onweer.time)}`;
      else if (rainSum < 0.1) rainLine = "Droog";
      else if (rainSum < 2) rainLine = `${rainSum.toFixed(1)} mm`;
      else rainLine = `${rainSum.toFixed(1)} mm regen`;

      const tempLine =
        tempMin === tempMax ? `${tempMin}°` : `${tempMin}–${tempMax}°`;

      return { emoji, label: d.label, window: d.window, tempLine, rainLine };
    });
}

interface Theme {
  pageBg: string;
  headerBg: string;
  cardBg: string;
  cardBorder: string;
  accent: string;
  accentText: string;
  textPrimary: string;
  textMuted: string;
  textLabel: string;
  narrativeBorder: string;
  ctaBg: string;
}

function getTheme(tier: PersonaTier): Theme {
  if (tier === "reed") {
    return {
      pageBg: "#020617",
      headerBg: "linear-gradient(180deg, #1e1b4b 0%, #020617 100%)",
      cardBg: "#0f172a",
      cardBorder: "rgba(239,68,68,0.25)",
      accent: "#ef4444",
      accentText: "#ffffff",
      textPrimary: "#ffffff",
      textMuted: "rgba(255,255,255,0.7)",
      textLabel: "rgba(255,255,255,0.35)",
      narrativeBorder: "#ef4444",
      ctaBg: "#ef4444",
    };
  }
  return {
    pageBg: "#f8fafc",
    headerBg: "linear-gradient(180deg, #3b7ff0 0%, #2a5fc4 100%)",
    cardBg: "#ffffff",
    cardBorder: "rgba(0,0,0,0.06)",
    accent: "#3b7ff0",
    accentText: "#ffffff",
    textPrimary: "#0f172a",
    textMuted: "#475569",
    textLabel: "#94a3b8",
    narrativeBorder: "#3b7ff0",
    ctaBg: "#3b7ff0",
  };
}

export function buildPersonaEmailHtml(
  tier: PersonaTier,
  brief: PersonaBrief,
  city: string,
  unsubscribeUrl: string,
  amazonTip?: EmailAmazonTip,
  weatherData?: EmailWeatherData,
): string {
  const p = PERSONAS[tier];
  const t = getTheme(tier);
  const wd = weatherData;

  const date = new Date().toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const dayparts = wd?.hourly ? computeDayparts(wd.hourly) : [];

  // ---- HERO ----
  let heroHtml = "";
  if (wd) {
    const emoji = getWeatherEmoji(
      wd.current.weatherCode,
      wd.current.isDay ?? true,
    );
    const desc = getWeatherDescription(wd.current.weatherCode);
    const bft = getWindBeaufort(wd.current.windSpeed);
    const feelsLine =
      wd.current.feelsLike !== wd.current.temperature
        ? ` · voelt als ${wd.current.feelsLike}°`
        : "";

    const showSunRow =
      wd.sunrise || (typeof wd.uvIndex === "number" && wd.uvIndex > 0);

    heroHtml = `
<div style="background:${t.cardBg};border:1px solid ${t.cardBorder};border-radius:24px;padding:32px;margin-bottom:20px;box-shadow:0 4px 20px rgba(0,0,0,0.03);">
  <div style="display:table;width:100%;margin-bottom:20px;">
    <div style="display:table-cell;vertical-align:middle;">
        <div style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;color:${t.textLabel};margin-bottom:4px;">Micro-voorspelling</div>
        <div style="font-size:24px;font-weight:900;color:${t.textPrimary};letter-spacing:-0.02em;">${esc(city)}</div>
    </div>
    <div style="display:table-cell;vertical-align:middle;text-align:right;">
        <div style="display:inline-block;background:rgba(16,185,129,0.1);color:#10b981;font-size:10px;font-weight:900;padding:4px 10px;border-radius:6px;text-transform:uppercase;letter-spacing:1px;">1x1km Grid Precisie</div>
    </div>
  </div>

  <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
    <td style="vertical-align:bottom;">
      <div style="font-size:88px;font-weight:900;color:${t.textPrimary};line-height:0.9;letter-spacing:-0.05em;">${esc(wd.current.temperature)}<span style="color:${t.accent};">°</span></div>
      <div style="font-size:16px;font-weight:700;color:${t.textMuted};margin-top:12px;">${esc(desc)}${esc(feelsLine)}</div>
    </td>
    <td style="vertical-align:bottom;text-align:right;padding-bottom:4px;">
      <div style="font-size:72px;line-height:1;filter:drop-shadow(0 10px 15px rgba(0,0,0,0.1));">${emoji}</div>
    </td>
  </tr></table>

  <div style="margin-top:32px;padding-top:24px;border-top:1px solid ${t.cardBorder};">
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
            <td style="width:33%;padding-right:10px;">
                <div style="font-size:10px;font-weight:800;color:${t.textLabel};text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Wind</div>
                <div style="font-size:15px;font-weight:900;color:${t.textPrimary};">${esc(wd.current.windSpeed)}<span style="font-size:10px;font-weight:700;margin-left:2px;">KM/H</span></div>
                <div style="font-size:10px;color:${t.textLabel};font-weight:700;">${esc(bft.scale)} BFT</div>
            </td>
            <td style="width:33%;padding-right:10px;">
                <div style="font-size:10px;font-weight:800;color:${t.textLabel};text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Regen</div>
                <div style="font-size:15px;font-weight:900;color:${t.textPrimary};">${wd.current.precipitation > 0 ? `${wd.current.precipitation.toFixed(1)}` : "0.0"}<span style="font-size:10px;font-weight:700;margin-left:2px;">MM</span></div>
                <div style="font-size:10px;color:${t.textLabel};font-weight:700;">ACTUEEL</div>
            </td>
            <td style="width:33%;">
                <div style="font-size:10px;font-weight:800;color:${t.textLabel};text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Lucht</div>
                <div style="font-size:15px;font-weight:900;color:${t.textPrimary};">${esc(wd.current.humidity)}<span style="font-size:10px;font-weight:700;margin-left:2px;">%</span></div>
                <div style="font-size:10px;color:${t.textLabel};font-weight:700;">VOCHT</div>
            </td>
        </tr>
    </table>
  </div>
</div>`;
  }

  // ---- NARRATIVE ----
  const verdictHtml = brief.verdict
    .split(/\n+/)
    .filter(Boolean)
    .map(
      (line) =>
        `<p style="margin:0 0 16px 0;font-size:17px;line-height:1.6;color:${t.textMuted};font-weight:500;">${esc(line)}</p>`,
    )
    .join("");

  const bulletsHtml =
    brief.details.length > 0
      ? `<div style="margin-top:24px;padding:24px;background:rgba(0,0,0,0.02);border-radius:16px;">` +
        brief.details
          .map(
            (detail) => `
      <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;"><tr>
        <td style="vertical-align:top;padding-right:12px;padding-top:6px;">
          <div style="width:8px;height:8px;border-radius:2px;background:${t.accent};"></div>
        </td>
        <td><div style="font-size:15px;line-height:1.5;color:${t.textPrimary};font-weight:600;">${esc(detail)}</div></td>
      </tr></table>`,
          )
          .join("") +
        `</div>`
      : "";

  const narrativeHtml = `
<div style="background:${t.cardBg};border:1px solid ${t.cardBorder};border-radius:24px;padding:32px;margin-bottom:20px;box-shadow:0 4px 20px rgba(0,0,0,0.03);">
  <div style="display:table;width:100%;margin-bottom:20px;">
    <div style="display:table-cell;vertical-align:middle;">
        <div style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;color:${t.textLabel};margin-bottom:4px;">Briefing van ${esc(p.name)}</div>
        <div style="font-size:22px;font-weight:900;color:${t.textPrimary};line-height:1.2;letter-spacing:-0.02em;">${esc(brief.greeting)}</div>
    </div>
  </div>
  
  ${verdictHtml}
  ${bulletsHtml}
  
  <div style="margin-top:24px;padding-top:20px;border-top:1px solid ${t.cardBorder};text-align:right;">
    <div style="font-size:14px;color:${t.textPrimary};font-weight:800;font-style:italic;">— ${esc(brief.closing)}</div>
  </div>
</div>`;

  // ---- DAYPARTS ----
  let daypartsHtml = "";
  if (dayparts.length > 0) {
    daypartsHtml = `
<div style="background:${t.cardBg};border:1px solid ${t.cardBorder};border-radius:24px;overflow:hidden;margin-bottom:20px;box-shadow:0 4px 20px rgba(0,0,0,0.03);">
  <div style="padding:24px 32px 12px;">
    <div style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:${t.textLabel};">De komende uren</div>
  </div>
  ${dayparts
    .map(
      (dp, i) => `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="${i > 0 ? `border-top:1px solid ${t.cardBorder};` : ""}">
    <tr>
      <td style="width:72px;text-align:center;vertical-align:middle;padding:20px 0;">
        <div style="font-size:32px;line-height:1;">${dp.emoji}</div>
      </td>
      <td style="vertical-align:middle;padding:20px 0;">
        <div style="font-size:16px;font-weight:900;color:${t.textPrimary};letter-spacing:-0.01em;">${esc(dp.label)}</div>
        <div style="font-size:13px;color:${t.textLabel};margin-top:2px;font-weight:600;">${esc(dp.window)} · <span style="color:${dp.rainLine === 'Droog' ? '#10b981' : t.accent};">${esc(dp.rainLine)}</span></div>
      </td>
      <td style="vertical-align:middle;padding:20px 32px 20px 8px;text-align:right;">
        <div style="font-size:18px;font-weight:900;color:${t.textPrimary};letter-spacing:-0.02em;">${esc(dp.tempLine)}</div>
      </td>
    </tr>
  </table>`,
    )
    .join("")}
</div>`;
  }

  // ---- CTA ----
  const ctaUrl =
    tier === "reed" ? "https://weerzone.nl/reed" : "https://weerzone.nl/piet";
  const ctaHtml = `
<div style="margin-bottom:32px;text-align:center;">
    <a href="${esc(ctaUrl)}" style="display:inline-block;background:${t.ctaBg};color:#ffffff;text-decoration:none;font-weight:900;padding:20px 40px;border-radius:16px;font-size:16px;text-transform:uppercase;letter-spacing:1px;box-shadow:0 10px 25px ${tier === 'reed' ? 'rgba(239,68,68,0.3)' : 'rgba(59,127,240,0.3)'};">
        Volledige 48-uurs Analyse &#8594;
    </a>
</div>`;

  // ---- AMAZON TIP ----
  let amazonHtml = "";
  if (amazonTip) {
    const tipBg = amazonTip.color
      ? `${amazonTip.color}15`
      : "rgba(245,158,11,0.08)";
    const tipBorder = amazonTip.color
      ? `${amazonTip.color}44`
      : "rgba(245,158,11,0.2)";
    amazonHtml = `
<div style="margin-bottom:24px;">
  <a href="${esc(amazonTip.url)}" target="_blank" rel="noopener sponsored" style="display:block;text-decoration:none;color:inherit;border:1.5px dashed ${tipBorder};background:${tipBg};border-radius:20px;padding:24px;">
    <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#f59e0b;font-weight:900;margin-bottom:12px;">${esc(p.name)}'s Essential · Amazon</div>
    <table cellpadding="0" cellspacing="0" border="0"><tr>
      ${amazonTip.emoji ? `<td style="padding-right:20px;vertical-align:middle;font-size:44px;line-height:1;">${amazonTip.emoji}</td>` : ""}
      <td style="vertical-align:middle;">
        <div style="font-size:16px;font-weight:900;color:${t.textPrimary};line-height:1.2;margin-bottom:4px;">${esc(amazonTip.title)}</div>
        ${amazonTip.subtitle ? `<div style="font-size:13px;color:${t.textMuted};font-weight:500;">${esc(amazonTip.subtitle)}</div>` : ""}
        <div style="font-size:14px;font-weight:900;color:#f59e0b;margin-top:10px;">${amazonTip.price ? esc(amazonTip.price) + " · " : ""}Bekijk op Amazon &#8594;</div>
      </td>
    </tr></table>
  </a>
  <div style="font-size:10px;color:${t.textLabel};margin-top:10px;text-align:center;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Powered by WEERZONE Affiliate Engine</div>
</div>`;
  }

  // ---- FULL TEMPLATE ----
  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="${tier === 'reed' ? 'dark' : 'light'}"/>
<title>${esc(brief.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${t.pageBg};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;">
<div style="max-width:600px;margin:0 auto;">

  <!-- HEADER BRANDING -->
  <div style="background:${t.headerBg};padding:40px 32px 60px;text-align:center;">
    <img src="https://weerzone.nl/logo-white.png" alt="WEERZONE" style="height:28px;width:auto;margin-bottom:20px;display:inline-block;" />
    <div style="font-size:10px;font-weight:900;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:3px;">48 UUR VOORUIT · DE REST IS RUIS</div>
  </div>

  <div style="padding:0 20px;margin-top:-30px;">
    
    <div style="margin-bottom:20px;text-align:center;">
        <span style="display:inline-block;background:${t.accent};color:${t.accentText};font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px;padding:6px 16px;border-radius:100px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">${esc(p.name)} · ${esc(p.label)}</span>
    </div>

    ${heroHtml}

    ${narrativeHtml}

    ${daypartsHtml}

    ${ctaHtml}

    ${amazonHtml}

    <!-- FOOTER -->
    <div style="padding:40px 32px;text-align:center;border-top:1px solid ${t.cardBorder};">
      <div style="font-size:12px;font-weight:800;color:${t.textPrimary};margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">WEERZONE INTEL</div>
      <div style="font-size:13px;color:${t.textLabel};line-height:1.6;max-width:300px;margin:0 auto 20px;">
        Je ontvangt deze dagelijkse briefing omdat je bent aangemeld als Founder voor de regio ${esc(city)}.
      </div>
      <div style="display:table;width:100%;max-width:240px;margin:0 auto;">
        <div style="display:table-cell;padding:0 10px;">
            <a href="https://weerzone.nl/app" style="font-size:11px;font-weight:900;color:${t.accent};text-decoration:none;text-transform:uppercase;letter-spacing:1px;">Dashboard</a>
        </div>
        <div style="display:table-cell;padding:0 10px;border-left:1px solid ${t.cardBorder};">
            <a href="${esc(unsubscribeUrl)}" style="font-size:11px;font-weight:900;color:${t.textLabel};text-decoration:none;text-transform:uppercase;letter-spacing:1px;">Uitschrijven</a>
        </div>
      </div>
      <div style="margin-top:32px;font-size:10px;font-weight:700;color:${t.textLabel};text-transform:uppercase;letter-spacing:2px;">
        &copy; ${new Date().getFullYear()} Tiveau & Google Intelligence
      </div>
    </div>

  </div>
</div>
</body>
</html>`;
}
