import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { enabledAgentAccounts } from "@/lib/agents/email-recipients";
import { koosWeekendDayIndex, shouldSendKoosNudge } from "@/lib/agents/koos-nudge";
import { findGetawayPicks, koosTemplateLine } from "@/lib/koos-getaway";
import { koosVoice } from "@/lib/koos-voice";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface ProfileRow {
  id: string;
  email: string | null;
  primary_lat: number | null;
  primary_lon: number | null;
  koos_last_nudge_at: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function emailHtml(voice: string, picks: Awaited<ReturnType<typeof findGetawayPicks>>["picks"]): string {
  const rows = picks.slice(0, 3).map((pick) => {
    const opportunity = pick.opportunity;
    return `<tr><td style="padding:14px 0;border-top:1px solid #e2e8f0"><strong style="color:#0f172a">${escapeHtml(opportunity.targetName)}</strong><br><span style="color:#475569">${Math.round(pick.tempMax)}&deg; · ${Math.round(pick.sunshineHours)} uur zon · ${Math.round(opportunity.distanceKm ?? 0)} km</span></td></tr>`;
  }).join("");

  return `<!doctype html><html lang="nl"><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:560px;margin:0 auto;padding:32px 20px"><div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:28px"><p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#059669">Koos · zaterdag vooruit</p><h1 style="margin:0 0 18px;font-size:26px;line-height:1.2">Er is beter weer binnen bereik</h1><p style="margin:0 0 20px;color:#334155;line-height:1.65">${escapeHtml(voice)}</p><table style="width:100%;border-collapse:collapse">${rows}</table><p style="margin:24px 0 0"><a href="https://weerzone.nl/koos" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;font-weight:700;padding:12px 16px;border-radius:8px">Bekijk Koos</a></p><p style="margin:24px 0 0;font-size:12px;color:#64748b">Koos mailt alleen wanneer ergens aantoonbaar beter weer is. Pas dit aan in <a href="https://weerzone.nl/mijn-weerzone" style="color:#475569">Mijn Weerzone</a>.</p></div></div></body></html>`;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dayIndex = koosWeekendDayIndex();
  if (dayIndex === null) return NextResponse.json({ sent: 0, reason: "Geen Koos-moment" });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ error: "RESEND_API_KEY missing" }, { status: 500 });

  const admin = createSupabaseAdminClient();
  const koosAccounts = await enabledAgentAccounts(admin, "koos");
  const { data, error } = await admin
    .from("user_profile")
    .select("id, email, primary_lat, primary_lon, koos_last_nudge_at")
    .not("primary_lat", "is", null)
    .not("primary_lon", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const profiles = ((data ?? []) as ProfileRow[]).filter(
    (profile) => koosAccounts.has(profile.id) && shouldSendKoosNudge(profile.koos_last_nudge_at),
  );
  if (profiles.length === 0) return NextResponse.json({ sent: 0, reason: "Geen Koos-ontvangers" });

  const resend = new Resend(resendKey);
  let sent = 0;
  const errors: string[] = [];
  const groups = new Map<string, ProfileRow[]>();

  for (const profile of profiles) {
    if (profile.primary_lat == null || profile.primary_lon == null) continue;
    const key = `${profile.primary_lat.toFixed(1)},${profile.primary_lon.toFixed(1)}`;
    const group = groups.get(key) ?? [];
    group.push(profile);
    groups.set(key, group);
  }

  for (const group of groups.values()) {
    const first = group[0];
    const origin = { name: "jouw plek", lat: first.primary_lat!, lon: first.primary_lon! };
    try {
      const { picks } = await findGetawayPicks(origin, { dayIndex, limit: 3 });
      if (picks.length === 0) continue;
      const opportunities = picks.map((pick) => pick.opportunity);
      const voice = await koosVoice(origin, opportunities, { dayFlavour: "zaterdag" })
        .catch(() => null) ?? opportunities.map(koosTemplateLine).join(" ");
      const topPick = opportunities[0];
      for (const profile of group) {
        const email = profile.email ?? koosAccounts.get(profile.id);
        if (!email) continue;
        const { error: sendError } = await resend.emails.send({
          from: "Koos van Weerzone <info@weerzone.nl>",
          to: email,
          subject: `Koos tipt voor zaterdag: ${topPick.targetName}`,
          html: emailHtml(voice, picks),
        });
        if (sendError) {
          errors.push(`${email}: ${sendError.message}`);
          continue;
        }
        await admin
          .from("user_profile")
          .update({ koos_last_nudge_at: new Date().toISOString() })
          .eq("id", profile.id);
        sent += 1;
      }
    } catch (err) {
      errors.push(`${origin.lat},${origin.lon}: ${err instanceof Error ? err.message : "onbekende fout"}`);
    }
  }

  return NextResponse.json({ sent, eligible: profiles.length, errors: errors.slice(0, 10) });
}
