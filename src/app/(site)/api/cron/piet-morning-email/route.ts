/**
 * PIET MORNING EMAIL
 * Dagelijkse 48-uurs weerupdate voor Piet-abonnees.
 * Vercel cron: 0 6 * * *  (06:00 UTC = 07:00/08:00 NL)
 *
 * Schaalprincipe (handoff 2026-07-10): LLM-duiding per régio (1x/dag via de
 * Mariana-cascade), wiskunde per plaats/abonnee — NUL LLM-calls in deze cron.
 *
 * Volgorde:
 *  1. Abonnementen-per-plaats uit agent_subscriptions (subscription-first);
 *     account-toggles + primary_lat/lon blijven de fallback zonder plaats.
 *  2. Per unieke plaats/locatie: weersdata (wiskunde) + de opgeslagen
 *     regio-duiding uit mariana_regions (agent_outputs.piet.text).
 *  3. HTML-mail per abonnee via Resend, met per-abonnement uitschrijflink.
 */

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { activeAgentPlaceSubscriptions, enabledAgentAccounts } from "@/lib/agents/email-recipients";
import { findPlace } from "@/lib/places-data";
import { nearestTeslaRegion } from "@/lib/mariana/regions/nearest-region";
import { loadRegionRow } from "@/lib/mariana/regions/storage";
import type { MarianaSignal } from "@/lib/mariana/regions/types";
import { getWeatherEmoji, getWeatherDescription, getWindBeaufort } from "@/lib/weather";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function gridKey(lat: number, lon: number) {
  // Groepeer op ~1km-blokken zodat buren maar één API-call triggeren
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

interface HourlySlice {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  weather_code: number[];
  precipitation: number[];
  wind_speed_10m: number[];
  wind_gusts_10m: number[];
}

async function fetchWeather48h(lat: number, lon: number) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code,wind_speed_10m,apparent_temperature,precipitation` +
    `&hourly=temperature_2m,apparent_temperature,weather_code,precipitation,wind_speed_10m,wind_gusts_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,sunrise,sunset` +
    `&timezone=Europe/Amsterdam&forecast_days=2`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  return res.json();
}

/** Vers genoeg = van vandaag(achtig); de Regions-run draait 1x/dag (03:30 UTC). */
const REGION_FRESH_MS = 20 * 3600 * 1000;

interface RegionDuiding {
  signal: MarianaSignal | null;
  runAt: string | null;
}

/**
 * Piets verhaal — pure samenstelling, geen LLM. De regio-duiding komt uit de
 * dagelijkse Mariana Regions-run (al in Piets stem, jargonvrij); de lokale
 * openingszin is wiskunde over de plaats zelf.
 */
function buildNarrative(city: string, data: Record<string, unknown>, region: RegionDuiding | null): string {
  const daily = data.daily as Record<string, number[]>;
  const maxToday = Math.round(daily.temperature_2m_max[0]);
  const rainToday = daily.precipitation_sum[0];

  const parts: string[] = [];
  parts.push(
    rainToday > 0.1
      ? `Vandaag in ${city}: maximaal ${maxToday}°, met bij elkaar zo'n ${rainToday.toFixed(1)} mm regen. In de dagdelen hieronder zie je precies wanneer je droog blijft.`
      : `Vandaag in ${city}: droog, met maximaal ${maxToday}°. De dagdelen hieronder laten zien hoe de dag precies loopt.`,
  );

  const fresh =
    region?.runAt != null && Date.now() - new Date(region.runAt).getTime() < REGION_FRESH_MS;
  const piet = fresh ? region?.signal?.agent_outputs?.piet : null;
  const regionText = piet?.text?.trim();
  if (regionText) parts.push(regionText);
  if (piet?.refer_to_reed && piet.referral_reason) {
    parts.push(`Nog even dit: ${piet.referral_reason}. Reed houdt het voor je in de gaten op weerzone.nl/reed.`);
  }

  if (!parts.some((part) => part.includes("— Piet"))) parts.push("— Piet, voor Weerzone");
  return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// E-mail HTML opbouw
// ---------------------------------------------------------------------------

function dagdeelRows(hourly: HourlySlice): string {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const slices = [
    { label: "Ochtend",  dateStr: todayStr,    from: 6,  to: 12 },
    { label: "Middag",   dateStr: todayStr,    from: 12, to: 18 },
    { label: "Avond",    dateStr: todayStr,    from: 18, to: 24 },
    { label: "Nacht",    dateStr: tomorrowStr, from: 0,  to: 6  },
    { label: "Morgen",   dateStr: tomorrowStr, from: 6,  to: 24 },
  ];

  return slices
    .map(({ label, dateStr, from, to }) => {
      const idxs = hourly.time
        .map((t, i) => ({ t, i }))
        .filter(({ t }) => t.slice(0, 10) === dateStr && new Date(t).getHours() >= from && new Date(t).getHours() < to)
        .map(({ i }) => i);

      if (!idxs.length) return "";

      const temps = idxs.map((i) => hourly.temperature_2m[i]);
      const codes = idxs.map((i) => hourly.weather_code[i]);
      const precips = idxs.map((i) => hourly.precipitation[i]);
      const winds = idxs.map((i) => hourly.wind_speed_10m[i]);

      const tempMin = Math.round(Math.min(...temps));
      const tempMax = Math.round(Math.max(...temps));
      const rainSum = precips.reduce((a, b) => a + b, 0);
      const maxWind = Math.max(...winds);
      const midCode = codes[Math.floor(codes.length / 2)];
      const emoji = getWeatherEmoji(midCode, from >= 6 && from < 20);
      const bft = getWindBeaufort(maxWind);

      const rainCell =
        rainSum < 0.1
          ? `<span style="color:#64748b;">Droog</span>`
          : `<span style="color:#2563eb;font-weight:700;">${rainSum.toFixed(1)} mm</span>`;

      return `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 12px;font-size:13px;font-weight:700;color:#334155;">
            ${emoji} ${label}
          </td>
          <td style="padding:10px 6px;font-size:13px;color:#334155;text-align:right;">
            ${tempMin}°–${tempMax}°
          </td>
          <td style="padding:10px 6px;font-size:13px;text-align:right;">${rainCell}</td>
          <td style="padding:10px 12px;font-size:13px;color:#64748b;text-align:right;">
            ${bft.scale} bft
          </td>
        </tr>`;
    })
    .join("");
}

function buildMorningEmailHtml(
  city: string,
  narrative: string,
  data: Record<string, unknown>,
  voorkeurenUrl: string
): string {
  const current = data.current as Record<string, number>;
  const daily = (data.daily as Record<string, number[]>);
  const hourly = data.hourly as HourlySlice;

  const temp = Math.round(current.temperature_2m);
  const feelsLike = Math.round(current.apparent_temperature);
  const code = current.weather_code;
  const emoji = getWeatherEmoji(code, true);
  const desc = getWeatherDescription(code);
  const wind = Math.round(current.wind_speed_10m);
  const bft = getWindBeaufort(wind);

  const maxToday = Math.round(daily.temperature_2m_max[0]);
  const minToday = Math.round(daily.temperature_2m_min[0]);
  const rainToday = daily.precipitation_sum[0].toFixed(1);
  const sunrise = daily.sunrise?.[0] ? new Date(daily.sunrise[0]).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }) : "—";
  const sunset = daily.sunset?.[0]  ? new Date(daily.sunset[0]).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }) : "—";

  const rows = dagdeelRows(hourly);
  const unsubUrl = voorkeurenUrl;
  const pietUrl = `https://weerzone.nl/vandaag#piet`;

  // Piet-stem tekst: markeer **vetgedrukt** → <strong>
  const narrativeHtml = narrative
    .split("\n\n")
    .map((para) =>
      `<p style="margin:0 0 14px;font-size:15px;color:#1e293b;line-height:1.65;">
        ${para.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}
      </p>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Jouw 48-uurs weerbericht — Weerzone</title>
</head>
<body style="margin:0;padding:0;background:#3b7ff0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px 48px;">

    <!-- HEADER -->
    <div style="text-align:center;padding-bottom:28px;">
      <img src="https://weerzone.nl/weerzone-logo.png" alt="Weerzone" style="height:48px;width:auto;" />
      <p style="margin:8px 0 0;font-size:11px;color:rgba(255,255,255,0.65);letter-spacing:1.5px;text-transform:uppercase;font-weight:700;">
        Dagelijks 48-uurs weerbericht
      </p>
    </div>

    <!-- NU-KAART -->
    <div style="background:rgba(255,255,255,0.22);border:1px solid rgba(255,255,255,0.35);border-radius:20px;padding:28px;margin-bottom:16px;backdrop-filter:blur(16px);">
      <p style="margin:0 0 4px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.6);">Nu in ${city}</p>
      <div style="display:flex;align-items:center;gap:16px;margin:12px 0 20px;">
        <span style="font-size:56px;line-height:1;">${emoji}</span>
        <div>
          <p style="margin:0;font-size:52px;font-weight:900;color:#fff;line-height:1;letter-spacing:-2px;">${temp}°</p>
          <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.8);font-weight:600;">${desc}${feelsLike !== temp ? ` · voelt als ${feelsLike}°` : ""}</p>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.2);">
        <div style="text-align:center;">
          <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.5);font-weight:700;text-transform:uppercase;letter-spacing:1px;">Max</p>
          <p style="margin:4px 0 0;font-size:16px;font-weight:900;color:#fff;">${maxToday}°</p>
        </div>
        <div style="text-align:center;">
          <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.5);font-weight:700;text-transform:uppercase;letter-spacing:1px;">Min</p>
          <p style="margin:4px 0 0;font-size:16px;font-weight:900;color:#fff;">${minToday}°</p>
        </div>
        <div style="text-align:center;">
          <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.5);font-weight:700;text-transform:uppercase;letter-spacing:1px;">Regen</p>
          <p style="margin:4px 0 0;font-size:16px;font-weight:900;color:${parseFloat(rainToday) > 0.1 ? "#93c5fd" : "#fff"};">${parseFloat(rainToday) > 0.1 ? rainToday + "mm" : "Droog"}</p>
        </div>
        <div style="text-align:center;">
          <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.5);font-weight:700;text-transform:uppercase;letter-spacing:1px;">Wind</p>
          <p style="margin:4px 0 0;font-size:16px;font-weight:900;color:#fff;">${bft.scale} bft</p>
        </div>
      </div>
    </div>

    <!-- PIET'S VERHAAL -->
    <div style="background:rgba(255,255,255,0.22);border:1px solid rgba(255,255,255,0.35);border-left:4px solid #38bdf8;border-radius:20px;padding:28px;margin-bottom:16px;">
      <p style="margin:0 0 16px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:#38bdf8;">Het volledige weerverhaal · ${new Date().toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}</p>
      ${narrativeHtml}
    </div>

    <!-- DAGDELEN TABEL -->
    <div style="background:rgba(255,255,255,0.22);border:1px solid rgba(255,255,255,0.35);border-radius:20px;overflow:hidden;margin-bottom:16px;">
      <div style="padding:16px 20px 8px;">
        <p style="margin:0;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.6);">Ochtend → Morgen in één blik</p>
      </div>
      <table style="width:100%;border-collapse:collapse;background:rgba(255,255,255,0.95);">
        <thead>
          <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
            <th style="padding:8px 12px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;text-align:left;">Dagdeel</th>
            <th style="padding:8px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;text-align:right;">Temp</th>
            <th style="padding:8px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;text-align:right;">Regen</th>
            <th style="padding:8px 12px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;text-align:right;">Wind</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="padding:12px 20px;background:rgba(255,255,255,0.85);">
        <p style="margin:0;font-size:10px;color:#64748b;">
          ☀️ Zon op ${sunrise} · 🌇 onder ${sunset}
        </p>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align:center;padding:8px 0 24px;">
      <a href="${pietUrl}"
         style="display:inline-block;padding:16px 40px;background:#fff;color:#3b7ff0;font-weight:800;font-size:14px;border-radius:14px;text-decoration:none;letter-spacing:0.5px;box-shadow:0 4px 24px rgba(0,0,0,0.15);">
        Open volledige prognose →
      </a>
    </div>

    <!-- FOOTER -->
    <div style="text-align:center;padding-top:8px;">
      <p style="font-size:11px;color:rgba(255,255,255,0.55);line-height:1.6;">
        Weerzone · 48 uur vooruit, niet verder.<br>
        <a href="${unsubUrl}" style="color:rgba(255,255,255,0.7);text-decoration:underline;">Voorkeuren aanpassen of uitschrijven</a>
      </p>
    </div>

  </div>
</body>
</html>`;
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

  // 1. Subscription-first: abonnementen-per-plaats uit agent_subscriptions.
  //    De account-toggles (user_profile/auth-metadata) blijven de fallback
  //    zonder plaats — die abonnees draaien op hun primary_lat/lon, behalve
  //    als ze inmiddels óók een plaats-abonnement hebben (dat wint).
  const placeSubs = await activeAgentPlaceSubscriptions(admin, "piet");
  const subscribedUserIds = new Set(placeSubs.map((sub) => sub.userId));

  const pietAccounts = await enabledAgentAccounts(admin, "piet");
  const { data: profilesRaw } = await admin
    .from("user_profile")
    .select("id, email, primary_lat, primary_lon")
    .not("primary_lat", "is", null)
    .not("primary_lon", "is", null);
  const legacySubs = ((profilesRaw ?? []) as { id: string; email: string | null; primary_lat: number; primary_lon: number }[])
    .filter((profile) => pietAccounts.has(profile.id) && !subscribedUserIds.has(profile.id))
    .map((profile) => ({ ...profile, email: profile.email ?? pietAccounts.get(profile.id) ?? null }));

  // 2. Verzendeenheden per unieke locatie: plaats-abonnementen per plaats,
  //    fallback-accounts per ~1km-grid (bestaand gedrag).
  interface Recipient { email: string; unsubUrl: string }
  interface SendUnit { label: string | null; lat: number; lon: number; recipients: Recipient[] }
  const units = new Map<string, SendUnit>();

  for (const sub of placeSubs) {
    if (!sub.email) continue;
    const place = findPlace(sub.province, sub.placeSlug);
    if (!place) continue; // plaats bestaat niet meer (opschoning) — overslaan
    const key = `place:${sub.province}/${sub.placeSlug}`;
    if (!units.has(key)) units.set(key, { label: place.name, lat: place.lat, lon: place.lon, recipients: [] });
    units.get(key)!.recipients.push({
      email: sub.email,
      unsubUrl: `https://weerzone.nl/api/agents/unsubscribe?id=${sub.subscriptionId}`,
    });
  }

  for (const sub of legacySubs) {
    if (!sub.email) continue;
    const key = `grid:${gridKey(sub.primary_lat, sub.primary_lon)}`;
    if (!units.has(key)) units.set(key, { label: null, lat: sub.primary_lat, lon: sub.primary_lon, recipients: [] });
    units.get(key)!.recipients.push({ email: sub.email, unsubUrl: "https://weerzone.nl/mijn-weerzone" });
  }

  const totalRecipients = [...units.values()].reduce((count, unit) => count + unit.recipients.length, 0);
  if (!totalRecipients) return NextResponse.json({ sent: 0, reason: "Geen ontvangers" });

  let sent = 0;
  const errors: string[] = [];

  // Regio-duiding per mesoschaalregio maar één keer laden (max 11 regio's).
  const regionCache = new Map<string, Promise<RegionDuiding | null>>();
  const regionDuiding = (lat: number, lon: number): Promise<RegionDuiding | null> => {
    const slug = nearestTeslaRegion(lat, lon).slug;
    if (!regionCache.has(slug)) regionCache.set(slug, loadRegionRow(slug).catch(() => null));
    return regionCache.get(slug)!;
  };

  const results = await Promise.allSettled(
    Array.from(units.values()).map(async (unit) => {
      const { lat, lon } = unit;
      const [data, region] = await Promise.all([fetchWeather48h(lat, lon), regionDuiding(lat, lon)]);

      // Plaats-abonnementen hebben hun plaatsnaam; fallback probeert geocode.
      let cityLabel = unit.label ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      if (!unit.label) {
        try {
          const geo = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=1&language=nl`
          );
          const geoData = await geo.json();
          if (geoData.results?.[0]?.name) cityLabel = geoData.results[0].name;
        } catch {}
      }

      const narrative = buildNarrative(cityLabel, data, region);
      const subjectEmoji = getWeatherEmoji(data.current.weather_code, true);
      const subjectTemp = Math.round(data.current.temperature_2m);
      const subject = `${subjectEmoji} ${subjectTemp}° in ${cityLabel} — jouw 48-uurs update`;

      return unit.recipients.map((recipient) => ({
        from: "Piet van Weerzone <piet@weerzone.nl>",
        to: recipient.email,
        subject,
        html: buildMorningEmailHtml(cityLabel, narrative, data, recipient.unsubUrl),
      }));
    })
  );

  const payloads: any[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      payloads.push(...result.value);
    } else if (result.status === "rejected") {
      errors.push(`Group processing failed: ${result.reason}`);
    }
  }

  for (let i = 0; i < payloads.length; i += 100) {
    const chunk = payloads.slice(i, i + 100);
    try {
      const { error: sendErr } = await resend.batch.send(chunk);
      if (sendErr) errors.push(sendErr.message);
      else sent += chunk.length;
    } catch (e) {
      errors.push(`Batch send failed: ${e}`);
    }
  }

  return NextResponse.json({
    sent,
    total: totalRecipients,
    perPlace: placeSubs.filter((sub) => sub.email).length,
    fallback: legacySubs.filter((sub) => sub.email).length,
    errors: errors.slice(0, 10),
  });
}
