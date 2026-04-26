/**
 * REED ALERT EMAIL
 * Stuurt waarschuwingsmail naar Reed-abonnees bij extreme weersomstandigheden.
 * Vercel cron: elke 3 uur  — 0 SLASH3 STAR STAR STAR
 *
 * Extremiteiten (WMO codes + drempelwaarden):
 *   GEEL  : regen >5mm/u | wind ≥40 km/h | sneeuw/ijzel | onweer
 *   ORANJE: regen >10mm/u | wind ≥60 km/h | zware sneeuw | zwaar onweer
 *   ROOD  : regen >20mm/u | wind ≥75 km/h | extreme hagel/onweer
 *
 * Deduplicatie: max 1 alert per severity per user per 12 uur,
 * bijgehouden in de `reed_alert_log` tabel.
 */

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWeatherEmoji, getWeatherDescription, getWindBeaufort } from "@/lib/weather";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// ---------------------------------------------------------------------------
// Extremiteiten-detectie
// ---------------------------------------------------------------------------

export type AlertLevel = "GEEL" | "ORANJE" | "ROOD";

export type AlertType =
  | "ONWEER"
  | "ZWARE_REGEN"
  | "STORM"
  | "SNEEUW"
  | "IJZEL"
  | "HAGEL";

export interface WeatherAlert {
  type: AlertType;
  level: AlertLevel;
  time: string;         // ISO van het eerste treffer-uur
  value: string;        // leesbare waarde, bv. "72 km/h"
  description: string;  // Nederlandse zin
}

interface HourlyForecastRaw {
  time: string;
  precipitation: number;
  wind_speed: number;
  weather_code: number;
  temperature: number;
}

function detectAlerts(hours: HourlyForecastRaw[]): WeatherAlert[] {
  const found: WeatherAlert[] = [];
  const seen = new Set<string>(); // dedup binnen deze run per type+level

  for (const h of hours) {
    const code = h.weather_code;
    const wind = h.wind_speed;
    const rain = h.precipitation;
    const temp = h.temperature;

    const add = (type: AlertType, level: AlertLevel, value: string, desc: string) => {
      const key = `${type}-${level}`;
      if (!seen.has(key)) {
        seen.add(key);
        found.push({ type, level, time: h.time, value, description: desc });
      }
    };

    // ONWEER (WMO 95–99)
    if (code >= 95 && code <= 99) {
      const level: AlertLevel = code >= 99 ? "ROOD" : code >= 96 ? "ORANJE" : "GEEL";
      add("ONWEER", level, getWeatherDescription(code), `Onweer verwacht rond ${new Date(h.time).getHours()}:00 u.`);
      if (code >= 96) {
        add("HAGEL", level, getWeatherDescription(code), `Hagel mogelijk rond ${new Date(h.time).getHours()}:00 u.`);
      }
    }

    // IJZEL / BEVRIEZENDE NEERSLAG (WMO 56, 57, 66, 67)
    if ([56, 57, 66, 67].includes(code)) {
      const level: AlertLevel = code === 57 || code === 67 ? "ORANJE" : "GEEL";
      add("IJZEL", level, getWeatherDescription(code), `IJzel verwacht rond ${new Date(h.time).getHours()}:00 u. Gladheid!`);
    }

    // SNEEUW (WMO 71–77, 85–86)
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
      const level: AlertLevel = code === 75 || code === 77 || code === 86 ? "ORANJE" : "GEEL";
      add("SNEEUW", level, getWeatherDescription(code), `Sneeuwval verwacht rond ${new Date(h.time).getHours()}:00 u.`);
    }

    // ZWARE REGEN
    if (rain > 20) {
      add("ZWARE_REGEN", "ROOD",  `${rain.toFixed(1)} mm/u`, `Extreme neerslag (${rain.toFixed(1)} mm/u) rond ${new Date(h.time).getHours()}:00 u.`);
    } else if (rain > 10) {
      add("ZWARE_REGEN", "ORANJE", `${rain.toFixed(1)} mm/u`, `Hevige neerslag (${rain.toFixed(1)} mm/u) rond ${new Date(h.time).getHours()}:00 u.`);
    } else if (rain > 5) {
      add("ZWARE_REGEN", "GEEL",   `${rain.toFixed(1)} mm/u`, `Forse neerslag (${rain.toFixed(1)} mm/u) rond ${new Date(h.time).getHours()}:00 u.`);
    }

    // STORM / ZWARE WIND
    if (wind >= 75) {
      add("STORM", "ROOD",   `${wind} km/h`, `Orkaankracht wind (${wind} km/h) rond ${new Date(h.time).getHours()}:00 u.`);
    } else if (wind >= 60) {
      add("STORM", "ORANJE", `${wind} km/h`, `Zware storm (${wind} km/h) rond ${new Date(h.time).getHours()}:00 u.`);
    } else if (wind >= 40) {
      add("STORM", "GEEL",   `${wind} km/h`, `Stormachtig (${wind} km/h) rond ${new Date(h.time).getHours()}:00 u.`);
    }
  }

  return found;
}

// Hoogste severity
function highestLevel(alerts: WeatherAlert[]): AlertLevel {
  if (alerts.some((a) => a.level === "ROOD")) return "ROOD";
  if (alerts.some((a) => a.level === "ORANJE")) return "ORANJE";
  return "GEEL";
}

// ---------------------------------------------------------------------------
// Open-Meteo fetch (licht — alleen komende 12 uur)
// ---------------------------------------------------------------------------

async function fetchForecast12h(lat: number, lon: number) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,precipitation,wind_speed_10m,weather_code` +
    `&forecast_hours=12&timezone=Europe/Amsterdam`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const d = await res.json();

  return (d.hourly.time as string[]).map((t: string, i: number): HourlyForecastRaw => ({
    time: t,
    precipitation: d.hourly.precipitation[i] ?? 0,
    wind_speed: d.hourly.wind_speed_10m[i] ?? 0,
    weather_code: d.hourly.weather_code[i] ?? 0,
    temperature: d.hourly.temperature_2m[i] ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// E-mail HTML
// ---------------------------------------------------------------------------

const LEVEL_STYLE: Record<AlertLevel, { bg: string; border: string; badge: string; badgeText: string; label: string; emoji: string }> = {
  GEEL: {
    bg: "#fffbeb",
    border: "#fbbf24",
    badge: "#fef3c7",
    badgeText: "#92400e",
    label: "Code Geel",
    emoji: "⚠️",
  },
  ORANJE: {
    bg: "#fff7ed",
    border: "#f97316",
    badge: "#ffedd5",
    badgeText: "#9a3412",
    label: "Code Oranje",
    emoji: "🟠",
  },
  ROOD: {
    bg: "#fef2f2",
    border: "#ef4444",
    badge: "#fee2e2",
    badgeText: "#991b1b",
    label: "Code Rood",
    emoji: "🚨",
  },
};

const ALERT_LABEL: Record<AlertType, string> = {
  ONWEER: "Onweer",
  ZWARE_REGEN: "Zware neerslag",
  STORM: "Zware wind",
  SNEEUW: "Sneeuwval",
  IJZEL: "IJzel / gladheid",
  HAGEL: "Hagelbuien",
};

function buildAlertEmailHtml(
  city: string,
  alerts: WeatherAlert[],
  level: AlertLevel,
  subscriberEmail: string
): string {
  const style = LEVEL_STYLE[level];
  const unsubUrl = `https://weerzone.nl/api/unsubscribe?email=${encodeURIComponent(subscriberEmail)}`;
  const pietUrl = "https://weerzone.nl/piet";

  const alertRows = alerts
    .map(
      (a) => `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#1e293b;">
        ${getWeatherEmoji(
          a.type === "ONWEER" ? 95 : a.type === "SNEEUW" ? 73 : a.type === "IJZEL" ? 66 : a.type === "ZWARE_REGEN" ? 82 : 0,
          false
        )} ${ALERT_LABEL[a.type]}
      </td>
      <td style="padding:12px 8px;font-size:13px;color:#475569;">${a.value}</td>
      <td style="padding:12px 16px;font-size:13px;color:#475569;">${a.description}</td>
    </tr>`
    )
    .join("");

  const badegeHtml = `
    <span style="display:inline-block;padding:4px 12px;background:${style.badge};color:${style.badgeText};font-size:12px;font-weight:800;border-radius:100px;letter-spacing:0.5px;">
      ${style.emoji} ${style.label}
    </span>`;

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Weerwaarschuwing ${city} — Reed | Weerzone</title>
</head>
<body style="margin:0;padding:0;background:#1e293b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px 48px;">

    <!-- HEADER -->
    <div style="text-align:center;padding-bottom:24px;">
      <img src="https://weerzone.nl/weerzone-logo.png" alt="Weerzone" style="height:40px;width:auto;" />
      <p style="margin:8px 0 0;font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:1.5px;text-transform:uppercase;font-weight:700;">Reed · Extreme weermelding</p>
    </div>

    <!-- ALERT KAART -->
    <div style="background:${style.bg};border:2px solid ${style.border};border-radius:20px;overflow:hidden;margin-bottom:16px;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
      <div style="background:${style.border};padding:20px 24px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <p style="margin:0 0 4px;font-size:13px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:1px;">${style.label}</p>
          <h1 style="margin:0;font-size:22px;font-weight:900;color:#fff;line-height:1.2;">
            Extreme condities voor ${city}
          </h1>
        </div>
        <div style="font-size:48px;line-height:1;">${style.emoji}</div>
      </div>

      <div style="padding:24px;">
        <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">
          Reed heeft extreme weersomstandigheden gedetecteerd in de komende 12 uur voor jouw locatie. Onderneem tijdig actie.
        </p>

        <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <thead>
            <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
              <th style="padding:10px 16px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;text-align:left;">Type</th>
              <th style="padding:10px 8px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;text-align:left;">Waarde</th>
              <th style="padding:10px 16px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;text-align:left;">Verwacht</th>
            </tr>
          </thead>
          <tbody>${alertRows}</tbody>
        </table>
      </div>
    </div>

    <!-- AANBEVOLEN ACTIES -->
    <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:24px;margin-bottom:16px;">
      <p style="margin:0 0 16px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.5);">Reed adviseert</p>
      ${buildReedAdvice(alerts)}
    </div>

    <!-- CTA -->
    <div style="text-align:center;padding:8px 0 24px;">
      <a href="${pietUrl}"
         style="display:inline-block;padding:16px 40px;background:${style.border};color:#fff;font-weight:800;font-size:14px;border-radius:14px;text-decoration:none;letter-spacing:0.5px;box-shadow:0 4px 24px rgba(0,0,0,0.25);">
        Bekijk volledige 48-uurs prognose →
      </a>
    </div>

    <!-- FOOTER -->
    <p style="text-align:center;font-size:11px;color:rgba(255,255,255,0.35);line-height:1.6;">
      Reed | Weerzone — Extreme weermelding voor jouw locatie.<br>
      <a href="${unsubUrl}" style="color:rgba(255,255,255,0.5);text-decoration:underline;">Afmelden voor weeralarmen</a>
    </p>

  </div>
</body>
</html>`;
}

function buildReedAdvice(alerts: WeatherAlert[]): string {
  const items: string[] = [];
  const types = new Set(alerts.map((a) => a.type));

  if (types.has("STORM")) items.push("🏠 Tuinmeubels, vuilnisbakken en losse objecten binnenzetten of vastzetten.");
  if (types.has("STORM")) items.push("🚲 Fiets stallen in een schuur of garderobe — niet buiten laten staan.");
  if (types.has("ZWARE_REGEN")) items.push("🌊 Controleer kelderafvoer en dakgoten op verstopping.");
  if (types.has("ZWARE_REGEN")) items.push("🚗 Vermijd laaggelegen wegen en onderdoorgangen.");
  if (types.has("ONWEER")) items.push("⚡ Blijf uit het open veld, weg van bomen en water tijdens onweer.");
  if (types.has("ONWEER")) items.push("📱 Laad je telefoon op vóór het onweer begint.");
  if (types.has("IJZEL")) items.push("🧊 Strooi zout of zand op looppaden. Vermijd rijden als mogelijk.");
  if (types.has("IJZEL")) items.push("🚗 Als je moet rijden: gebruik winterbanden, rij langzaam.");
  if (types.has("SNEEUW")) items.push("⛄ Reken op file en vertraging. Vertrek eerder of werk thuis.");
  if (types.has("HAGEL")) items.push("🚗 Parkeer de auto in een garage of onder een afdak.");

  if (!items.length) items.push("📍 Volg de situatie en handle met voorzichtigheid.");

  return items
    .map(
      (item) =>
        `<p style="margin:0 0 10px;font-size:14px;color:rgba(255,255,255,0.85);line-height:1.5;">${item}</p>`
    )
    .join("");
}

// ---------------------------------------------------------------------------
// Deduplicatie
// ---------------------------------------------------------------------------

async function hasRecentAlert(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  level: AlertLevel
): Promise<boolean> {
  try {
    const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const { data } = await admin
      .from("reed_alert_log")
      .select("id")
      .eq("user_id", userId)
      .eq("alert_level", level)
      .gte("sent_at", cutoff)
      .limit(1);
    return !!(data?.length);
  } catch {
    // Tabel bestaat nog niet — eerste keer, dus geen recente alert
    return false;
  }
}

async function logAlert(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  level: AlertLevel,
  city: string
): Promise<void> {
  try {
    await admin.from("reed_alert_log").insert({
      user_id: userId,
      alert_level: level,
      city,
      sent_at: new Date().toISOString(),
    });
  } catch {
    // Tabel bestaat nog niet — negeer silently
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ error: "RESEND_API_KEY missing" }, { status: 500 });

  const resend = new Resend(resendKey);
  const admin = createSupabaseAdminClient();

  // 1. Haal Reed-abonnees op
  const { data: subs, error } = await admin
    .from("subscriptions")
    .select(`
      user_id,
      tier,
      user_profile!inner(email, full_name, primary_lat, primary_lon)
    `)
    .in("status", ["trialing", "active"])
    .eq("tier", "reed");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!subs?.length) return NextResponse.json({ sent: 0, reason: "Geen Reed-abonnees" });

  type SubRow = {
    user_id: string;
    tier: string;
    user_profile: { email: string; full_name: string | null; primary_lat: number | null; primary_lon: number | null };
  };

  const validSubs = (subs as unknown as SubRow[]).filter(
    (s) => s.user_profile?.primary_lat != null && s.user_profile?.primary_lon != null
  );

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const sub of validSubs) {
    const lat = sub.user_profile.primary_lat!;
    const lon = sub.user_profile.primary_lon!;
    const email = sub.user_profile.email;

    try {
      // 2. Haal komende 12 uur forecast op
      const hours = await fetchForecast12h(lat, lon);

      // 3. Detecteer extremiteiten
      const alerts = detectAlerts(hours);
      if (!alerts.length) {
        skipped++;
        continue;
      }

      const level = highestLevel(alerts);

      // 4. Deduplicatie — stuur niet opnieuw als al verstuurd in de afgelopen 12 uur
      const alreadySent = await hasRecentAlert(admin, sub.user_id, level);
      if (alreadySent) {
        skipped++;
        continue;
      }

      // 5. Stads-naam
      let cityLabel = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      try {
        const geo = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=1&language=nl`
        );
        const geoData = await geo.json();
        if (geoData.results?.[0]?.name) cityLabel = geoData.results[0].name;
      } catch {}

      // 6. Stuur e-mail
      const html = buildAlertEmailHtml(cityLabel, alerts, level, email);
      const style = LEVEL_STYLE[level];
      const subject = `${style.emoji} ${style.label}: ${alerts[0].description} (${cityLabel})`;

      const { error: sendErr } = await resend.emails.send({
        from: "Reed | Weerzone <reed@weerzone.nl>",
        to: email,
        subject,
        html,
      });

      if (sendErr) {
        errors.push(sendErr.message);
      } else {
        sent++;
        await logAlert(admin, sub.user_id, level, cityLabel);
      }
    } catch (e) {
      errors.push(`User ${sub.user_id}: ${e}`);
    }
  }

  return NextResponse.json({
    sent,
    skipped,
    total: validSubs.length,
    errors: errors.slice(0, 10),
  });
}
