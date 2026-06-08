import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { HARTMANWK_PLAYERS_TABLE } from "@/lib/hartmanwk";
import { syncSquads } from "@/lib/hartmanwk-fifa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const COLUMNS = "id_player, name, team_code, team_name, position, jersey";

/**
 * De WK-selecties voor de sterspeler-kieslijst. Leest uit hartmanwk_players;
 * is die nog leeg, dan worden de squads eenmalig bij FIFA opgehaald en gecachet.
 */
export async function GET() {
  const admin = createSupabaseAdminClient();

  let { data, error } = await admin.from(HARTMANWK_PLAYERS_TABLE).select(COLUMNS).order("name", { ascending: true });

  if (!error && (!data || data.length === 0)) {
    try {
      await syncSquads(admin);
      ({ data, error } = await admin.from(HARTMANWK_PLAYERS_TABLE).select(COLUMNS).order("name", { ascending: true }));
    } catch (e) {
      console.error("Hartman WK squad sync error:", e);
    }
  }

  if (error) {
    console.error("Hartman WK players read error:", error.message);
    return NextResponse.json({ players: [] });
  }

  const players = (data ?? []).map((p) => ({
    id: p.id_player as string,
    name: p.name as string,
    team: (p.team_name as string) || "",
    code: (p.team_code as string) || "",
    pos: (p.position as number) ?? null,
    num: (p.jersey as number) ?? null,
  }));

  return NextResponse.json({ players });
}
