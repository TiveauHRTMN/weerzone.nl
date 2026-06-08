import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { HARTMANWK_PLAYERS_TABLE } from "@/lib/hartmanwk";
import { syncSquads } from "@/lib/hartmanwk-fifa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const COLUMNS = "id_player, name, team_code, team_name, position, jersey";
const PAGE = 1000;

type Row = { id_player: string; name: string; team_code: string | null; team_name: string | null; position: number | null; jersey: number | null };

/** Haal álle spelers op, in pagina's van 1000 (Supabase kapt anders af op 1000). */
async function selectAllPlayers(admin: ReturnType<typeof createSupabaseAdminClient>) {
  const out: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from(HARTMANWK_PLAYERS_TABLE)
      .select(COLUMNS)
      .order("name", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) return { data: out, error };
    out.push(...((data ?? []) as Row[]));
    if (!data || data.length < PAGE) break;
  }
  return { data: out, error: null };
}

/**
 * De WK-selecties voor de sterspeler-kieslijst. Leest uit hartmanwk_players;
 * is die nog leeg, dan worden de squads eenmalig bij FIFA opgehaald en gecachet.
 */
export async function GET() {
  const admin = createSupabaseAdminClient();

  let { data, error } = await selectAllPlayers(admin);

  if (!error && data.length === 0) {
    try {
      await syncSquads(admin);
      ({ data, error } = await selectAllPlayers(admin));
    } catch (e) {
      console.error("Hartman WK squad sync error:", e);
    }
  }

  if (error) {
    console.error("Hartman WK players read error:", error.message);
    return NextResponse.json({ players: [] });
  }

  const players = data.map((p) => ({
    id: p.id_player,
    name: p.name,
    team: p.team_name || "",
    code: p.team_code || "",
    pos: p.position ?? null,
    num: p.jersey ?? null,
  }));

  return NextResponse.json({ players });
}
