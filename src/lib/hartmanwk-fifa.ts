// Hartman WK 2026 — automatische sync uit FIFA's eigen data-API (api.fifa.com, gratis).
// Haalt echte uitslagen + speler-statjes op en schrijft ze naar de poule-tabellen,
// zodat ranglijst + poules vanzelf meebewegen. Geen API-sleutel nodig.
//
// FIFA Wereldkampioenschap (mannen) = idCompetition 17, seizoen 2026 = idSeason 285023.
// Landcodes van FIFA (Home.IdCountry = "MEX") matchen 1-op-1 met onze wedstrijdcodes.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  HARTMANWK_RESULTS_TABLE,
  HARTMANWK_PLAYER_STATS_TABLE,
  HARTMANWK_MEMBERS_TABLE,
  normalizePlayerKey,
} from "@/lib/hartmanwk";
import { HARTMANWK_GROUP_MATCHES } from "@/lib/hartmanwk-matches";

const FIFA_BASE = "https://api.fifa.com/api/v3";
const ID_COMPETITION = "17";
const ID_SEASON = "285023"; // FIFA World Cup 2026

const localByPair = new Map(HARTMANWK_GROUP_MATCHES.map((m) => [`${m.home}|${m.away}`, m.id]));

type LocaleText = { Locale?: string; Description?: string }[] | null | undefined;
function localeText(arr: LocaleText): string | null {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const en = arr.find((x) => /^en/i.test(x.Locale || ""));
  return (en?.Description ?? arr[0]?.Description) ?? null;
}

async function fifaGet(path: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${FIFA_BASE}${path}`, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`FIFA ${path} -> ${res.status}`);
  return res.json();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type PlayerAcc = { names: Set<string>; goals: number; assists: number; yellow: number; red: number; minutes: number };

function accFor(acc: Map<string, PlayerAcc>, id: string): PlayerAcc {
  let e = acc.get(id);
  if (!e) { e = { names: new Set(), goals: 0, assists: 0, yellow: 0, red: 0, minutes: 0 }; acc.set(id, e); }
  return e;
}

/* Verzamel per FIFA-speler de statjes uit één team van één wedstrijddetail. */
function accumulateTeam(team: Record<string, unknown>, acc: Map<string, PlayerAcc>) {
  const players = (team.Players as Record<string, unknown>[]) || [];
  for (const pl of players) {
    const id = pl.IdPlayer as string;
    if (!id) continue;
    const e = accFor(acc, id);
    const nm = localeText(pl.PlayerName as LocaleText) || localeText(pl.ShortName as LocaleText);
    if (nm) e.names.add(nm);
    if (pl.Status === 1) e.minutes += 90; // basisspeler = meegespeeld
  }
  const subs = (team.Substitutions as Record<string, unknown>[]) || [];
  for (const s of subs) {
    if (s.IdPlayerOn) {
      const e = accFor(acc, s.IdPlayerOn as string);
      e.minutes += 30; // ingevallen = meegespeeld
      const nm = localeText(s.PlayerOnName as LocaleText);
      if (nm) e.names.add(nm);
    }
  }
  const goals = (team.Goals as Record<string, unknown>[]) || [];
  for (const g of goals) {
    const type = g.Type as number;
    if (g.IdPlayer && (type === 1 || type === 2)) accFor(acc, g.IdPlayer as string).goals += 1; // 1=goal,2=penalty (3=eigen goal: niet meetellen)
    if (g.IdAssistPlayer) accFor(acc, g.IdAssistPlayer as string).assists += 1;
  }
  const bookings = (team.Bookings as Record<string, unknown>[]) || [];
  for (const b of bookings) {
    if (!b.IdPlayer) continue;
    const e = accFor(acc, b.IdPlayer as string);
    if (b.Card === 1) e.yellow += 1; else e.red += 1; // 2/3 = (tweede geel/)rood
  }
}

export type HartmanWkSyncResult = { results: number; players: number; finished: number };

/**
 * Volledige sync: uitslagen + (voor de gekozen sterspelers) statjes.
 * Idempotent — herberekent uit FIFA en upsert. Onmatchbare spelers worden NIET
 * overschreven, zodat een handmatige correctie in /beheer blijft staan.
 */
export async function runHartmanWkFifaSync(): Promise<HartmanWkSyncResult> {
  const admin = createSupabaseAdminClient();

  const data = await fifaGet(`/calendar/matches?idCompetition=${ID_COMPETITION}&idSeason=${ID_SEASON}&count=200&language=en`);
  const all = (data.Results as Record<string, unknown>[]) || [];
  const finished = all.filter((m) => {
    const grp = m.GroupName as unknown[] | undefined;
    return Array.isArray(grp) && grp.length > 0 && m.MatchStatus === 0 && m.HomeTeamScore != null && m.AwayTeamScore != null;
  });

  // 1) Uitslagen → onze 72 groepswedstrijden via landcodes.
  const now = new Date().toISOString();
  const resultRows: { match_id: string; home: number; away: number; updated_at: string }[] = [];
  for (const m of finished) {
    const home = (m.Home as Record<string, unknown>)?.IdCountry as string;
    const away = (m.Away as Record<string, unknown>)?.IdCountry as string;
    let id = localByPair.get(`${home}|${away}`);
    let h = m.HomeTeamScore as number;
    let a = m.AwayTeamScore as number;
    if (!id) {
      id = localByPair.get(`${away}|${home}`);
      if (id) { h = m.AwayTeamScore as number; a = m.HomeTeamScore as number; }
    }
    if (id) resultRows.push({ match_id: id, home: h, away: a, updated_at: now });
  }
  if (resultRows.length) {
    await admin.from(HARTMANWK_RESULTS_TABLE).upsert(resultRows, { onConflict: "match_id" });
  }

  // 2) Statjes — alleen voor spelers die deelnemers gekozen hebben.
  const { data: members } = await admin.from(HARTMANWK_MEMBERS_TABLE).select("player_pick");
  const pickedKeys = new Set(
    ((members ?? []) as { player_pick: string | null }[])
      .map((m) => m.player_pick)
      .filter((p): p is string => Boolean(p))
      .map(normalizePlayerKey),
  );

  let playerRows: Record<string, unknown>[] = [];
  if (pickedKeys.size > 0) {
    const acc = new Map<string, PlayerAcc>();
    for (const m of finished) {
      const detail = await fifaGet(`/live/football/${ID_COMPETITION}/${ID_SEASON}/${m.IdStage}/${m.IdMatch}?language=en`);
      const home = detail.HomeTeam as Record<string, unknown> | undefined;
      const away = detail.AwayTeam as Record<string, unknown> | undefined;
      if (home) accumulateTeam(home, acc);
      if (away) accumulateTeam(away, acc);
      await sleep(150); // beleefd tegen de FIFA-API
    }

    // naam → FIFA-speler-id index, zodat een vrij ingetypte keuze matcht
    const idByName = new Map<string, string>();
    for (const [id, p] of acc) for (const nm of p.names) idByName.set(normalizePlayerKey(nm), id);

    playerRows = [...pickedKeys]
      .map((key) => {
        const id = idByName.get(key);
        if (!id) return null; // niet gevonden in FIFA-data → handmatige waarde laten staan
        const p = acc.get(id)!;
        return {
          player_key: key,
          display_name: [...p.names][0] || key,
          goals: p.goals, assists: p.assists, minutes: p.minutes, yellow: p.yellow, red: p.red,
          updated_at: now,
        };
      })
      .filter((r): r is Record<string, unknown> => r !== null);

    if (playerRows.length) {
      await admin.from(HARTMANWK_PLAYER_STATS_TABLE).upsert(playerRows, { onConflict: "player_key" });
    }
  }

  return { results: resultRows.length, players: playerRows.length, finished: finished.length };
}
