/**
 * REED ALERT EMAIL
 *
 * Mailt Reed-tier abonnees zodra het KNMI een waarschuwing uitgeeft voor hun
 * provincie. Eén mail per uitgifte (dedup via `reed_warning_alerts.warning_key`).
 *
 * - Bron van de waarheid: KNMI (provincie-pagina HTML, gescraped in lib/knmi-warnings).
 * - Detail-data (CAPE, neerslag-piek, wind-piek) komt uit Open-Meteo voor het
 *   tijdvenster en de coördinaten van de gebruiker.
 *
 * Vercel cron: elk uur (zie vercel.json).
 */

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  fetchKNMIWarnings,
  warningsForProvince,
  enrichWarning,
  nearestProvinceSlug,
  formatWindowLabel,
  SEVERITY_LABEL,
  type KNMIWarningEnriched,
  type KNMISeverity,
} from "@/lib/knmi-warnings";
import {
  fetchEstofexBeneluxSummary,
  type EstofexBeneluxSummary,
} from "@/lib/estofex";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface SubRow {
  user_id: string;
  user_profile: {
    email: string;
    full_name: string | null;
    primary_lat: number | null;
    primary_lon: number | null;
  };
}

const SEVERITY_STYLE: Record<KNMISeverity, { bg: string; border: string; emoji: string; label: string }> = {
  GREEN: { bg: "#ecfdf5", border: "#10b981", emoji: "✅", label: "Geen waarschuwing" },
  YELLOW: { bg: "#fffbeb", border: "#fbbf24", emoji: "⚠️", label: "Code Geel" },
  ORANGE: { bg: "#fff7ed", border: "#f97316", emoji: "🟠", label: "Code Oranje" },
  RED: { bg: "#fef2f2", border: "#ef4444", emoji: "🚨", label: "Code Rood" },
};

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("nl-NL", { weekday: "short", hour: "2-digit", minute: "2-digit" });
}

function adviceFor(type: string): string[] {
  const t = type.toLowerCase();
  if (t.includes("onweer")) return [
    "⚡ Blijf uit het open veld, weg van bomen en water tijdens onweer.",
    "🔌 Trek gevoelige apparaten los of gebruik een overspanningsbeveiliging.",
    "📱 Laad je telefoon op vóór het onweer begint.",
  ];
  if (t.includes("wind") || t.includes("storm")) return [
    "🏠 Tuinmeubels, vuilnisbakken en losse objecten binnenzetten.",
    "🚲 Fiets stallen in een schuur of garage.",
    "🚗 Pas je rij-snelheid aan, vooral op viaducten en open polders.",
  ];
  if (t.includes("regen") || t.includes("neerslag")) return [
    "🌊 Controleer kelderafvoer en dakgoten op verstopping.",
    "🚗 Vermijd laaggelegen wegen en onderdoorgangen.",
  ];
  if (t.includes("sneeuw")) return [
    "⛄ Reken op file en vertraging. Vertrek eerder of werk thuis.",
  ];
  if (t.includes("ijzel") || t.includes("gladheid")) return [
    "🧊 Strooi zout of zand op looppaden.",
    "🚗 Als je moet rijden: gebruik winterbanden, rij langzaam.",
  ];
  if (t.includes("hagel")) return [
    "🚗 Parkeer de auto in een garage of onder een afdak.",
  ];
  if (t.includes("hitte")) return [
    "💧 Drink genoeg water, vermijd inspanning in de volle middagzon.",
  ];
  if (t.includes("kou") || t.includes("vorst")) return [
    "🌡️ Bescherm leidingen, planten en huisdieren tegen de vorst.",
  ];
  return ["📍 Volg de situatie en handel met voorzichtigheid."];
}

function estofexBlockHtml(est: EstofexBeneluxSummary | null): string {
  if (!est || (!est.mentionsBenelux && est.maxLevel < 2)) return "";
  const lvlBadge = est.maxLevel >= 3 ? "🔴 Level 3" : est.maxLevel >= 2 ? "🟠 Level 2" : "🟡 Level 1";
  return `
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);border-radius:16px;padding:18px 20px;margin-bottom:16px;">
      <p style="margin:0 0 8px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.5);">
        Europees onweer-vooruitzicht · \${lvlBadge}
      </p>
      \${est.beneluxText ? \`<p style="margin:0;font-size:13px;color:rgba(255,255,255,0.85);line-height:1.6;">\${est.beneluxText}</p>\` : ""}
    </div>`;
}

function buildAlertEmailHtml(
  city: string,
  warning: KNMIWarningEnriched,
  email: string,
  estofex: EstofexBeneluxSummary | null,
): string {
  const style = SEVERITY_STYLE[warning.severity];
  const unsubUrl = `https://weerzone.nl/api/unsubscribe?email=\${encodeURIComponent(email)}`;
  const detailsUrl = "https://weerzone.nl/waarschuwingen";
  const window = formatWindowLabel(warning);
  const enriched = warning.enriched;

  const detailRows = enriched ? `
    <table style="width:100%;border-collapse:collapse;margin-top:16px;">
      <tr>
        <td style="padding:10px 12px;background:#f8fafc;border-radius:8px;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">CAPE-piek</td>
        <td style="padding:10px 12px;font-size:14px;color:#0f172a;font-weight:800;">\${enriched.capeMaxJkg} J/kg</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;background:#f8fafc;border-radius:8px;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Regen totaal</td>
        <td style="padding:10px 12px;font-size:14px;color:#0f172a;font-weight:800;">\${enriched.precipitationTotalMm} mm</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;background:#f8fafc;border-radius:8px;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Regen-piek</td>
        <td style="padding:10px 12px;font-size:14px;color:#0f172a;font-weight:800;">\${enriched.precipitationPeakMm} mm <span style="font-weight:500;color:#64748b;">(\${fmtDateTime(enriched.precipitationPeakHour)})</span></td>
      </tr>
      <tr>
        <td style="padding:10px 12px;background:#f8fafc;border-radius:8px;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Wind-piek</td>
        <td style="padding:10px 12px;font-size:14px;color:#0f172a;font-weight:800;">\${enriched.windPeakKmh} km/h <span style="font-weight:500;color:#64748b;">(\${fmtDateTime(enriched.windPeakHour)})</span></td>
      </tr>
    </table>` : "";

  const adviceItems = adviceFor(warning.type)
    .map((a) => `<p style="margin:0 0 10px;font-size:14px;color:rgba(255,255,255,0.85);line-height:1.5;">\${a}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>\${style.label} \${warning.type} — Reed | Weerzone</title>
</head>
<body style="margin:0;padding:0;background:#1e293b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:540px;margin:0 auto;padding:32px 20px 48px;">
    <div style="text-align:center;padding-bottom:24px;">
      <img src="https://weerzone.nl/weerzone-logo.png" alt="Weerzone" style="height:40px;width:auto;" />
      <p style="margin:8px 0 0;font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:1.5px;text-transform:uppercase;font-weight:700;">Reed · Officiële KNMI-waarschuwing</p>
    </div>

    <div style="background:\${style.bg};border:2px solid \${style.border};border-radius:20px;overflow:hidden;margin-bottom:16px;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
      <div style="background:\${style.border};padding:20px 24px;">
        <p style="margin:0 0 4px;font-size:13px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:1px;">\${style.label} · \${warning.type}</p>
        <h1 style="margin:0;font-size:22px;font-weight:900;color:#fff;line-height:1.2;">\${warning.province} — \${city}</h1>
        \${window ? \`<p style="margin:8px 0 0;font-size:13px;font-weight:700;color:rgba(255,255,255,0.9);">\${window}</p>\` : ""}
      </div>
      <div style="padding:24px;">
        <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;white-space:pre-line;">\${warning.description}</p>
        \${detailRows}
      </div>
    </div>

    \${estofexBlockHtml(estofex)}

    <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:24px;margin-bottom:16px;">
      <p style="margin:0 0 16px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.5);">Reed adviseert</p>
      \${adviceItems}
    </div>

    <div style="text-align:center;padding:8px 0 24px;">
      <a href="\${detailsUrl}" style="display:inline-block;padding:16px 40px;background:\${style.border};color:#fff;font-weight:800;font-size:14px;border-radius:14px;text-decoration:none;letter-spacing:0.5px;box-shadow:0 4px 24px rgba(0,0,0,0.25);">
        Bekijk volledig dossier →
      </a>
    </div>

    <p style="text-align:center;font-size:11px;color:rgba(255,255,255,0.35);line-height:1.6;">
      Reed | Weerzone — Bron: KNMI · detail-data uit Open-Meteo.<br>
      <a href="\${unsubUrl}" style="color:rgba(255,255,255,0.5);text-decoration:underline;">Afmelden voor weeralarmen</a>
    </p>
  </div>
</body>
</html>`;
}

async function alreadySent(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  warningKey: string,
): Promise<boolean> {
  const { data } = await admin
    .from("reed_warning_alerts")
    .select("id")
    .eq("user_id", userId)
    .eq("warning_key", warningKey)
    .limit(1);
  return !!(data && data.length);
}

async function logSent(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  email: string,
  warning: KNMIWarningEnriched,
  resendId: string | null,
): Promise<void> {
  await admin.from("reed_warning_alerts").insert({
    user_id: userId,
    email,
    warning_key: warning.key,
    province_slug: warning.provinceSlug,
    severity: warning.severity,
    type: warning.type,
    resend_id: resendId,
  });
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=\${lat}&longitude=\${lon}&language=nl`,
    );
    const d = await res.json();
    return d?.results?.[0]?.name ?? `\${lat.toFixed(2)}, \${lon.toFixed(2)}`;
  } catch {
    return `\${lat.toFixed(2)}, \${lon.toFixed(2)}`;
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  if (
    process.env.NODE_ENV === "production" &&
    !isVercelCron &&
    process.env.CRON_SECRET &&
    authHeader !== `Bearer \${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ error: "RESEND_API_KEY missing" }, { status: 500 });

  const resend = new Resend(resendKey);
  const admin = createSupabaseAdminClient();

  // 1. Alle actieve KNMI-waarschuwingen + Estofex Benelux-context parallel.
  const [allWarnings, estofex] = await Promise.all([
    fetchKNMIWarnings(),
    fetchEstofexBeneluxSummary(2).catch(() => null),
  ]);
  if (allWarnings.length === 0) {
    return NextResponse.json({ sent: 0, reason: "Geen actieve KNMI-waarschuwingen" });
  }

  // 2. Reed-abonnees ophalen.
  const { data: subs, error } = await admin
    .from("subscriptions")
    .select("user_id, user_profile!inner(email, full_name, primary_lat, primary_lon)")
    .in("status", ["trialing", "active"])
    .eq("tier", "reed");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!subs?.length) return NextResponse.json({ sent: 0, reason: "Geen Reed-abonnees" });

  const validSubs = (subs as unknown as SubRow[]).filter(
    (s) => s.user_profile?.primary_lat != null && s.user_profile?.primary_lon != null,
  );

  let sent = 0;
  const errors: string[] = [];

  const results = await Promise.allSettled(
    validSubs.map(async (sub) => {
      const lat = sub.user_profile.primary_lat as number;
      const lon = sub.user_profile.primary_lon as number;
      const email = sub.user_profile.email;

      const provinceSlug = await nearestProvinceSlug(lat, lon);
      if (!provinceSlug) return [];

      const userWarnings = warningsForProvince(allWarnings, provinceSlug);
      if (userWarnings.length === 0) return [];

      const cityLabel = await reverseGeocode(lat, lon);
      const generatedAlerts = [];

      for (const w of userWarnings) {
        if (await alreadySent(admin, sub.user_id, w.key)) {
          continue;
        }

        const enriched = await enrichWarning(w, lat, lon);
        const style = SEVERITY_STYLE[enriched.severity];
        const html = buildAlertEmailHtml(cityLabel, enriched, email, estofex);
        const subject = `\${style.emoji} \${SEVERITY_LABEL[enriched.severity]}: \${enriched.type} (\${cityLabel})`;

        generatedAlerts.push({
          payload: {
            from: "Reed van Weerzone <reed@weerzone.nl>",
            to: email,
            subject,
            html,
          },
          meta: { sub, enriched }
        });
      }

      return generatedAlerts;
    })
  );

  const pendingAlerts: any[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      pendingAlerts.push(...result.value);
    } else if (result.status === "rejected") {
      errors.push(`Sub processing failed: \${result.reason}`);
    }
  }

  for (let i = 0; i < pendingAlerts.length; i += 100) {
    const chunk = pendingAlerts.slice(i, i + 100);
    const payloads = chunk.map(c => c.payload);
    try {
      const { data: mailData, error: sendErr } = await resend.batch.send(payloads);
      
      if (sendErr) {
        errors.push(`Batch send error: \${sendErr.message}`);
        continue;
      }

      const typedMailData = mailData as any;
      
      await Promise.allSettled(chunk.map(async (item, idx) => {
        const resendId = typedMailData?.data?.[idx]?.id ?? null;
        await logSent(admin, item.meta.sub.user_id, item.payload.to, item.meta.enriched, resendId);
        sent++;
      }));
    } catch (e) {
      errors.push(`Batch send exception: \${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({
    sent,
    activeWarnings: allWarnings.length,
    reedSubs: validSubs.length,
    errors: errors.slice(0, 10),
  });
}
