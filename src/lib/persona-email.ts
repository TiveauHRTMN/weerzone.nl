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
      pageBg: "#0f172a",
      cardBg: "#1e293b",
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
    pageBg: "#3b7ff0",
    cardBg: "rgba(0,0,0,0.14)",
    cardBorder: "rgba(255,255,255,0.12)",
    accent: "#38bdf8",
    accentText: "#0f172a",
    textPrimary: "#ffffff",
    textMuted: "rgba(255,255,255,0.75)",
    textLabel: "rgba(255,255,255,0.4)",
    narrativeBorder: "#38bdf8",
    ctaBg: "rgba(0,0,0,0.25)",
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
<div style="background:${t.cardBg};border:1px solid ${t.cardBorder};border-radius:20px;padding:28px 28px 24px;margin-bottom:14px;">
  <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:${t.textLabel};margin-bottom:12px;">Nu in ${esc(city)}</div>
  <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
    <td style="vertical-align:bottom;">
      <div style="font-size:80px;font-weight:900;color:${t.textPrimary};line-height:1;letter-spacing:-0.03em;">${esc(wd.current.temperature)}°</div>
      <div style="font-size:14px;font-weight:700;color:${t.textMuted};margin-top:6px;">${esc(desc)}${esc(feelsLine)}</div>
    </td>
    <td style="vertical-align:bottom;text-align:right;padding-bottom:4px;">
      <div style="font-size:56px;line-height:1;">${emoji}</div>
    </td>
  </tr></table>

  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:20px;padding-top:20px;border-top:1px solid ${t.cardBorder};">
    <tr>
      <td style="width:50%;padding-right:12px;padding-bottom:14px;vertical-align:top;">
        <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:${t.textLabel};margin-bottom:5px;">Wind</div>
        <div style="font-size:15px;font-weight:700;color:${t.textPrimary};">${esc(wd.current.windSpeed)} km/h</div>
        <div style="font-size:11px;color:${t.textLabel};">${esc(bft.scale)} bft · ${esc(bft.label.toLowerCase())}</div>
      </td>
      <td style="width:50%;padding-bottom:14px;vertical-align:top;">
        <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:${t.textLabel};margin-bottom:5px;">Neerslag</div>
        <div style="font-size:15px;font-weight:700;color:${t.textPrimary};">${wd.current.precipitation > 0 ? `${wd.current.precipitation.toFixed(1)} mm` : "Droog"}</div>
      </td>
    </tr>
    <tr>
      <td style="padding-right:12px;padding-bottom:${showSunRow ? "14px" : "0"};vertical-align:top;">
        <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:${t.textLabel};margin-bottom:5px;">Dag max / min</div>
        <div style="font-size:15px;font-weight:700;color:${t.textPrimary};">${esc(wd.daily.tempMax)}° <span style="color:${t.textLabel};font-size:13px;">/ ${esc(wd.daily.tempMin)}°</span></div>
      </td>
      <td style="padding-bottom:${showSunRow ? "14px" : "0"};vertical-align:top;">
        <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:${t.textLabel};margin-bottom:5px;">Vochtigheid</div>
        <div style="font-size:15px;font-weight:700;color:${t.textPrimary};">${esc(wd.current.humidity)}%</div>
      </td>
    </tr>
    ${
      showSunRow
        ? `<tr>
      <td style="padding-right:12px;vertical-align:top;">
        ${
          wd.sunrise
            ? `<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:${t.textLabel};margin-bottom:5px;">Zon op / onder</div>
        <div style="font-size:15px;font-weight:700;color:${t.textPrimary};">${fmtTime(wd.sunrise)}${wd.sunset ? ` / ${fmtTime(wd.sunset)}` : ""}</div>`
            : ""
        }
      </td>
      <td style="vertical-align:top;">
        ${
          typeof wd.uvIndex === "number" && wd.uvIndex > 0
            ? `<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:${t.textLabel};margin-bottom:5px;">UV</div>
        <div style="font-size:15px;font-weight:700;color:${t.textPrimary};">UV ${esc(Math.round(wd.uvIndex))}</div>`
            : ""
        }
      </td>
    </tr>`
        : ""
    }
  </table>
</div>`;
  }

  // ---- NARRATIVE ----
  const verdictHtml = brief.verdict
    .split(/\n+/)
    .filter(Boolean)
    .map(
      (line) =>
        `<p style="margin:0 0 10px 0;font-size:16px;line-height:1.7;color:${t.textMuted};">${esc(line)}</p>`,
    )
    .join("");

  const bulletsHtml =
    brief.details.length > 0
      ? `<div style="margin-top:18px;">` +
        brief.details
          .map(
            (detail) => `
      <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;"><tr>
        <td style="vertical-align:top;padding-right:10px;padding-top:7px;">
          <div style="width:6px;height:6px;border-radius:50%;background:${t.accent};"></div>
        </td>
        <td><div style="font-size:14px;line-height:1.55;color:${t.textMuted};">${esc(detail)}</div></td>
      </tr></table>`,
          )
          .join("") +
        `</div>`
      : "";

  const narrativeHtml = `
<div style="background:${t.cardBg};border:1px solid ${t.cardBorder};border-left:4px solid ${t.narrativeBorder};border-radius:20px;padding:28px;margin-bottom:14px;">
  <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:${t.textLabel};margin-bottom:12px;">Het weerverhaal</div>
  <div style="font-size:18px;font-weight:800;color:${t.textPrimary};margin-bottom:16px;line-height:1.3;">${esc(brief.greeting)}</div>
  ${verdictHtml}
  ${bulletsHtml}
  <div style="margin-top:20px;padding-top:16px;border-top:1px solid ${t.cardBorder};">
    <div style="font-size:13px;color:${t.textLabel};font-style:italic;">${esc(brief.closing)}</div>
  </div>
</div>`;

  // ---- DAYPARTS ----
  let daypartsHtml = "";
  if (dayparts.length > 0) {
    daypartsHtml = `
<div style="background:${t.cardBg};border:1px solid ${t.cardBorder};border-radius:20px;overflow:hidden;margin-bottom:14px;">
  <div style="padding:20px 24px 12px;">
    <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:${t.textLabel};">De dagdelen</div>
  </div>
  ${dayparts
    .map(
      (dp, i) => `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="${i > 0 ? `border-top:1px solid ${t.cardBorder};` : ""}">
    <tr>
      <td style="width:56px;text-align:center;vertical-align:middle;padding:14px 8px;">
        <div style="font-size:28px;line-height:1;">${dp.emoji}</div>
      </td>
      <td style="vertical-align:middle;padding:14px 0;">
        <div style="font-size:14px;font-weight:800;color:${t.textPrimary};">${esc(dp.label)}</div>
        <div style="font-size:12px;color:${t.textLabel};margin-top:2px;">${esc(dp.window)} · ${esc(dp.rainLine)}</div>
      </td>
      <td style="vertical-align:middle;padding:14px 20px 14px 8px;text-align:right;">
        <div style="font-size:14px;font-weight:700;color:${t.textMuted};">${esc(dp.tempLine)}</div>
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
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
  <tr>
    <td style="text-align:center;padding:4px 0 16px;">
      <a href="${esc(ctaUrl)}" style="display:inline-block;background:${t.ctaBg};color:#ffffff;text-decoration:none;font-weight:800;padding:16px 32px;border-radius:14px;font-size:15px;border:1px solid ${t.cardBorder};">
        Bekijk de volledige 48-uurs analyse &#8594;
      </a>
    </td>
  </tr>
</table>`;

  // ---- AMAZON TIP ----
  let amazonHtml = "";
  if (amazonTip) {
    const tipBg = amazonTip.color
      ? `${amazonTip.color}22`
      : "rgba(245,158,11,0.15)";
    const tipBorder = amazonTip.color
      ? `${amazonTip.color}55`
      : "rgba(245,158,11,0.4)";
    amazonHtml = `
<div style="margin-bottom:16px;">
  <a href="${esc(amazonTip.url)}" target="_blank" rel="noopener sponsored" style="display:block;text-decoration:none;color:inherit;border:1px solid ${tipBorder};background:${tipBg};border-radius:16px;padding:16px 18px;">
    <div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(245,158,11,0.9);font-weight:800;margin-bottom:8px;">${esc(p.name)}'s tip · Amazon</div>
    <table cellpadding="0" cellspacing="0" border="0"><tr>
      ${amazonTip.emoji ? `<td style="padding-right:14px;vertical-align:middle;font-size:36px;line-height:1;">${amazonTip.emoji}</td>` : ""}
      <td style="vertical-align:middle;">
        <div style="font-size:14px;font-weight:800;color:${t.textPrimary};line-height:1.3;">${esc(amazonTip.title)}</div>
        ${amazonTip.subtitle ? `<div style="font-size:12px;color:${t.textMuted};margin-top:3px;">${esc(amazonTip.subtitle)}</div>` : ""}
        <div style="font-size:13px;font-weight:800;color:rgba(245,158,11,0.9);margin-top:6px;">${amazonTip.price ? esc(amazonTip.price) + " · " : ""}Bekijk op Amazon &#8594;</div>
      </td>
    </tr></table>
  </a>
  <div style="font-size:10px;color:rgba(255,255,255,0.25);margin-top:6px;text-align:center;">Als je hier iets koopt, krijgt WEERZONE een kleine commissie. Prijs blijft gelijk.</div>
</div>`;
  }

  // ---- FULL TEMPLATE ----
  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="dark"/>
<title>${esc(brief.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${t.pageBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;">
<div style="max-width:600px;margin:0 auto;padding:20px 16px 32px;">

  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;"><tr>
    <td style="vertical-align:middle;">
      <div style="font-size:13px;font-weight:900;color:rgba(255,255,255,0.9);letter-spacing:0.05em;">WEERZONE</div>
    </td>
    <td style="text-align:right;vertical-align:middle;">
      <div style="font-size:11px;font-weight:700;color:${t.textLabel};">${esc(city)} · ${esc(date)}</div>
    </td>
  </tr></table>

  <div style="margin-bottom:18px;">
    <span style="display:inline-block;background:${t.accent};color:${t.accentText};font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;padding:4px 12px;border-radius:100px;">${esc(p.name)} · ${esc(p.label)}</span>
  </div>

  ${heroHtml}

  ${narrativeHtml}

  ${daypartsHtml}

  ${ctaHtml}

  ${amazonHtml}

  <div style="padding:8px 0;text-align:center;font-size:11px;color:rgba(255,255,255,0.25);">
    Je dagelijkse ${esc(p.label.toLowerCase())} brief. 48 uur vooruit. De rest is ruis.<br/>
    <a href="${esc(unsubscribeUrl)}" style="color:rgba(255,255,255,0.25);text-decoration:underline;">Uitschrijven</a>
  </div>

</div>
</body>
</html>`;
}
