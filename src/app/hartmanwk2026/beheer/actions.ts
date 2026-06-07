"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  HARTMANWK_RESULTS_TABLE,
  HARTMANWK_PLAYER_STATS_TABLE,
  cleanPlayerName,
  normalizePlayerKey,
} from "@/lib/hartmanwk";

function tokenOk(token: string): boolean {
  const expected = process.env.HARTMANWK_ADMIN_TOKEN;
  return Boolean(expected) && token === expected;
}

function intField(form: FormData, name: string): number {
  const n = Math.trunc(Number(form.get(name)));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export async function saveResultAction(form: FormData): Promise<void> {
  const token = String(form.get("token") ?? "");
  if (!tokenOk(token)) throw new Error("Geen toegang.");

  const matchId = String(form.get("matchId") ?? "");
  if (!matchId) throw new Error("Geen wedstrijd.");

  const home = intField(form, "home");
  const away = intField(form, "away");

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from(HARTMANWK_RESULTS_TABLE)
    .upsert({ match_id: matchId, home, away, updated_at: new Date().toISOString() }, { onConflict: "match_id" });

  if (error) throw new Error(error.message);
  revalidatePath("/hartmanwk2026/beheer");
}

export async function savePlayerStatAction(form: FormData): Promise<void> {
  const token = String(form.get("token") ?? "");
  if (!tokenOk(token)) throw new Error("Geen toegang.");

  const player = cleanPlayerName(String(form.get("player") ?? ""));
  if (player.length < 2) throw new Error("Geen speler.");

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from(HARTMANWK_PLAYER_STATS_TABLE)
    .upsert(
      {
        player_key: normalizePlayerKey(player),
        display_name: player,
        goals: intField(form, "goals"),
        assists: intField(form, "assists"),
        minutes: intField(form, "minutes"),
        yellow: intField(form, "yellow"),
        red: intField(form, "red"),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "player_key" },
    );

  if (error) throw new Error(error.message);
  revalidatePath("/hartmanwk2026/beheer");
}
