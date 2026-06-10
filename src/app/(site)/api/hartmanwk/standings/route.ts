import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  HARTMANWK_MEMBERS_TABLE,
  HARTMANWK_PREDICTIONS_TABLE,
  HARTMANWK_RESULTS_TABLE,
  HARTMANWK_PLAYER_STATS_TABLE,
  HARTMANWK_KO_TEAMS_TABLE,
  fantasyPoints,
  normalizePlayerKey,
  scoreMatch,
} from "@/lib/hartmanwk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MemberRow = { id: string; name: string; photo: string | null; joined_at: string; player_pick: string | null; player_pick_id: string | null };
type PredRow = { member_id: string; match_id: string; home: number; away: number };
type ResultRow = { match_id: string; home: number; away: number };
type StatRow = { player_key: string; goals: number; assists: number; minutes: number; yellow: number; red: number };

/**
 * De berekende ranglijst: per deelnemer de echte punten uit voorspellingen +
 * uitslagen + fantasypunten van de gekozen sterspeler. Bevat geen contactgegevens.
 */
/** Alle voorspellingen in pagina's van 1000 (Supabase kapt anders af op 1000). */
async function allPredictions(admin: ReturnType<typeof createSupabaseAdminClient>): Promise<PredRow[]> {
  const PAGE = 1000;
  const out: PredRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from(HARTMANWK_PREDICTIONS_TABLE)
      .select("member_id, match_id, home, away")
      .range(from, from + PAGE - 1);
    if (error) { console.error("Hartman WK predictions read error:", error.message); break; }
    out.push(...((data ?? []) as PredRow[]));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

export async function GET() {
  const admin = createSupabaseAdminClient();

  const [members, predRows, results, stats, koTeamRows] = await Promise.all([
    admin.from(HARTMANWK_MEMBERS_TABLE).select("id, name, photo, joined_at, player_pick, player_pick_id").order("joined_at", { ascending: true }),
    allPredictions(admin),
    admin.from(HARTMANWK_RESULTS_TABLE).select("match_id, home, away"),
    admin.from(HARTMANWK_PLAYER_STATS_TABLE).select("player_key, goals, assists, minutes, yellow, red"),
    // Tabel bestaat pas na migratie 20260610 — een fout hier mag de ranglijst niet breken.
    admin.from(HARTMANWK_KO_TEAMS_TABLE).select("match_id, home, away"),
  ]);

  if (members.error) {
    console.error("Hartman WK standings read error:", members.error.message);
    return NextResponse.json({ error: "Kon de ranglijst niet laden." }, { status: 500 });
  }

  const memberRows = (members.data ?? []) as MemberRow[];
  const resultById = new Map<string, ResultRow>(((results.data ?? []) as ResultRow[]).map((r) => [r.match_id, r]));
  const statByKey = new Map<string, StatRow>(((stats.data ?? []) as StatRow[]).map((s) => [s.player_key, s]));

  const predsByMember = new Map<string, PredRow[]>();
  for (const p of predRows) {
    const list = predsByMember.get(p.member_id) ?? [];
    list.push(p);
    predsByMember.set(p.member_id, list);
  }

  const standings = memberRows.map((m) => {
    let points = 0;
    let exact = 0;
    let toto = 0;
    for (const pred of predsByMember.get(m.id) ?? []) {
      const result = resultById.get(pred.match_id);
      if (!result) continue;
      const score = scoreMatch(pred, result);
      points += score.points;
      if (score.hit === "exact") exact += 1;
      else if (score.hit === "toto") toto += 1;
    }
    const matchPoints = points;
    const statKey = m.player_pick_id || (m.player_pick ? normalizePlayerKey(m.player_pick) : null);
    const fantasy = statKey ? fantasyPoints(statByKey.get(statKey)) : 0;

    return {
      id: m.id,
      name: m.name,
      photo: m.photo ?? "",
      joinedAt: m.joined_at,
      player: m.player_pick ?? null,
      pts: matchPoints + fantasy,
      matchPoints,
      fantasyPoints: fantasy,
      exact,
      toto,
      rond: 0,
    };
  });

  standings.sort((a, b) => b.pts - a.pts
    || String(a.name).localeCompare(String(b.name), "nl", { sensitivity: "base" }));

  // Echte uitslagen meesturen zodat de client de groepstanden + wedstrijdkaarten bijwerkt.
  const realResults = ((results.data ?? []) as ResultRow[]).map((r) => ({
    matchId: r.match_id,
    home: r.home,
    away: r.away,
  }));

  // Knock-out-teams (gevuld door de FIFA-sync) zodat de bracket zichzelf invult.
  const koTeams = ((koTeamRows.data ?? []) as { match_id: string; home: string; away: string }[]).map((r) => ({
    matchId: r.match_id,
    home: r.home,
    away: r.away,
  }));

  return NextResponse.json({ members: standings, results: realResults, koTeams, scoredAt: new Date().toISOString() });
}
