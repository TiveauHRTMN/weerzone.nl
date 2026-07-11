/**
 * AGENT HEADS-UP PUSH — de motor (spec 2026-07-10 §3A, plan 1).
 * Elke 30 min: per plaats met een actief Piet/Koos-push-abonnement de pure
 * agents draaien, kandidaten matchen op persoonlijke momenten, budget/venster/
 * dedup toepassen en pushen. Nul LLM. Reed heeft zijn eigen cron (veiligheid).
 *
 * ?dry=1 → kandidaten teruggeven zonder te versturen of te loggen.
 */

import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { activeAgentPlaceSubscriptions } from "@/lib/agents/email-recipients";
import { buildAgentContext } from "@/lib/agents/context";
import { koosAgent } from "@/lib/agents/koos-agent";
import { loadMomentsForUsers, momentWindowsForDay } from "@/lib/agents/moments";
import {
  pietPushCandidates,
  koosPushCandidates,
  selectWithinBudget,
  inDeliveryWindow,
  nlWeekday,
  KOOS_DAYS,
  type PushCandidate,
} from "@/lib/agents/headsup-push";
import { loadPushState, logPushed, nlDayStart } from "@/lib/agents/headsup-log";
import { findPlace } from "@/lib/places-data";
import { activePushDevices, pushConfigured, sendPushToDevice } from "@/lib/push";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  if (
    process.env.NODE_ENV === "production" &&
    !isVercelCron &&
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dry = new URL(req.url).searchParams.get("dry") === "1";
  const now = new Date();
  if (!inDeliveryWindow(now) && !dry) {
    return NextResponse.json({ sent: 0, reason: "buiten bezorgvenster (07:00-22:00 NL)" });
  }
  if (!pushConfigured() && !dry) {
    return NextResponse.json({ sent: 0, reason: "VAPID niet geconfigureerd" });
  }

  const admin = createSupabaseAdminClient();
  const koosDay = KOOS_DAYS.includes(nlWeekday(now));

  const [pietSubs, koosSubs] = await Promise.all([
    activeAgentPlaceSubscriptions(admin, "piet", "push"),
    koosDay ? activeAgentPlaceSubscriptions(admin, "koos", "push") : Promise.resolve([]),
  ]);
  if (!pietSubs.length && !koosSubs.length) {
    return NextResponse.json({ sent: 0, reason: "geen push-abonnementen" });
  }

  // Per plaats één context; per plaats bijhouden welke agents er abonnees hebben.
  interface PlaceJob {
    province: string; placeSlug: string; placeName: string; lat: number; lon: number;
    pietUsers: string[]; koosUsers: string[];
  }
  const jobs = new Map<string, PlaceJob>();
  const addSub = (sub: { province: string; placeSlug: string; userId: string }, agent: "piet" | "koos") => {
    const place = findPlace(sub.province, sub.placeSlug);
    if (!place) return;
    const key = `${sub.province}/${sub.placeSlug}`;
    if (!jobs.has(key)) {
      jobs.set(key, {
        province: sub.province, placeSlug: sub.placeSlug,
        placeName: place.name, lat: place.lat, lon: place.lon,
        pietUsers: [], koosUsers: [],
      });
    }
    (agent === "piet" ? jobs.get(key)!.pietUsers : jobs.get(key)!.koosUsers).push(sub.userId);
  };
  for (const sub of pietSubs) addSub(sub, "piet");
  for (const sub of koosSubs) addSub(sub, "koos");

  const allUserIds = [...new Set([...pietSubs, ...koosSubs].map((s) => s.userId))];
  const [momentsByUser, stateByUser, devicesByUser] = await Promise.all([
    loadMomentsForUsers(admin, allUserIds),
    loadPushState(admin, allUserIds, nlDayStart(now)),
    dry ? Promise.resolve(new Map()) : activePushDevices(admin, allUserIds),
  ]);

  let sent = 0;
  const errors: string[] = [];
  const dryReport: Record<string, unknown>[] = [];

  for (const job of jobs.values()) {
    try {
      const ctx = await buildAgentContext(
        { name: job.placeName, lat: job.lat, lon: job.lon },
        now,
        { fast: true },
      );
      if (!ctx) continue;

      // Gevaar-handoff: bij een zware actieve waarschuwing (Code Oranje/Rood)
      // zwijgen Piet en Koos hier — Reed leidt via zijn eigen cron.
      const danger = ctx.knmi.some((w) => w.severity === "ORANGE" || w.severity === "RED");
      if (danger) continue;

      // Koos-kandidaten per plaats één keer (gebruiker-onafhankelijk).
      const koosCands: PushCandidate[] =
        koosDay && job.koosUsers.length
          ? koosPushCandidates(
              (await koosAgent(ctx, { includeVoice: false, timeoutMs: 4000 })).headsUps,
              job.province, job.placeSlug, now,
            )
          : [];

      const perUserTargets = new Map<string, PushCandidate[]>();
      for (const userId of new Set([...job.pietUsers, ...job.koosUsers])) {
        const windows = momentWindowsForDay(momentsByUser.get(userId) ?? [], now);
        const cands: PushCandidate[] = [];
        if (job.pietUsers.includes(userId)) {
          cands.push(...pietPushCandidates(job.placeName, ctx.weather.hourly, windows, now));
        }
        if (job.koosUsers.includes(userId)) cands.push(...koosCands);
        // Default-state in de map zetten zodat het in-run-budget ook voor
        // nieuwe gebruikers meetelt (de map wordt hieronder bijgewerkt).
        if (!stateByUser.has(userId)) {
          stateByUser.set(userId, { sentKeys: new Set<string>(), countsByAgent: new Map<string, number>() });
        }
        const state = stateByUser.get(userId)!;
        const picked = selectWithinBudget(cands, state.sentKeys, state.countsByAgent);
        if (picked.length) perUserTargets.set(userId, picked);
      }

      if (dry) {
        dryReport.push({
          place: `${job.province}/${job.placeSlug}`,
          users: Object.fromEntries(
            [...perUserTargets].map(([u, c]) => [u, c.map((x) => `${x.matchedMoment ? "★" : "·"}${x.title}`)]),
          ),
        });
        continue;
      }

      for (const [userId, picked] of perUserTargets) {
        const devices = devicesByUser.get(userId) ?? [];
        if (!devices.length) continue;
        for (const candidate of picked) {
          let delivered = false;
          for (const device of devices) {
            const result = await sendPushToDevice(admin, device, {
              title: candidate.title,
              body: candidate.body,
              url: `https://weerzone.nl/vandaag#${candidate.agent}`,
              tag: `${candidate.agent}:${job.province}/${job.placeSlug}`,
            });
            if (result.ok) delivered = true;
            else if (result.reason) errors.push(`push ${userId}: ${result.reason}`);
          }
          if (delivered) {
            sent += 1;
            // Direct loggen én de in-memory state bijwerken zodat dezelfde
            // gebruiker binnen deze run niet over budget gaat.
            await logPushed(admin, [{
              userId, agent: candidate.agent, province: job.province,
              placeSlug: job.placeSlug, key: candidate.key,
              category: candidate.category, severity: "useful",
            }]);
            const state = stateByUser.get(userId);
            if (state) {
              state.sentKeys.add(candidate.key);
              state.countsByAgent.set(candidate.agent, (state.countsByAgent.get(candidate.agent) ?? 0) + 1);
            }
          }
        }
      }
    } catch (err) {
      errors.push(`${job.province}/${job.placeSlug}: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (dry) return NextResponse.json({ dry: true, places: jobs.size, report: dryReport });
  return NextResponse.json({ sent, places: jobs.size, users: allUserIds.length, errors: errors.slice(0, 10) });
}
