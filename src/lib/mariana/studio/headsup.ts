/**
 * Mariana Studio — beslist of slide 4 (heads-up) vandaag gepost wordt.
 *
 * Slide 4 bestaat ALLEEN als Tesla — de severe-weather-laag — daadwerkelijk
 * zwaar weer (onweer/zware regen/storm) op komst ziet voor MORGEN. Oracle's
 * convectieve gate is geen trigger: die betekent alleen "Tesla mag draaien",
 * niet "er komt iets aan" (op 3 juli gaf de gate een onweer-slide terwijl alle
 * Tesla-runs signal 1 + ABORT zeiden: klassiek non-event). Hitte/kou/algemene
 * KNMI-codes zijn bewust géén trigger meer.
 *
 * Geen bron- of modelnamen in de output (Global Constraints).
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hermesChat } from "@/lib/hermes";
import type { HeadsUp } from "./types";

/** Wat de trigger van een Tesla-run nodig heeft (platte kolommen uit mariana_tesla). */
export interface TeslaHeadsUpRow {
  region_slug: string;
  region_name: string;
  run_at: string;
  valid_from: string;
  valid_until: string;
  tesla_signal: number;
  reed_action: string;
}

/** Runs ouder dan dit zijn geen actueel signaal meer. */
const MAX_RUN_AGE_MS = 36 * 3600_000;

async function loadLatestTeslaRows(): Promise<TeslaHeadsUpRow[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin: any = createSupabaseAdminClient();
    const { data } = await admin
      .from("mariana_tesla")
      .select("region_slug, region_name, run_at, valid_from, valid_until, tesla_signal, reed_action")
      .order("run_at", { ascending: false })
      .limit(30);
    const seen = new Set<string>();
    const out: TeslaHeadsUpRow[] = [];
    for (const r of (data ?? []) as TeslaHeadsUpRow[]) {
      if (!r.region_slug || seen.has(r.region_slug)) continue;
      seen.add(r.region_slug);
      out.push(r);
    }
    return out;
  } catch {
    return [];
  }
}

/** True als [validFrom, validUntil] (deels) op de kalenderdag van morgen valt. */
function overlapsTomorrow(validFrom: string, validUntil: string): boolean {
  const start = new Date(Date.now() + 86400000); start.setHours(0, 0, 0, 0);
  const end = new Date(Date.now() + 86400000); end.setHours(23, 59, 59, 999);
  const from = new Date(validFrom).getTime();
  const until = new Date(validUntil).getTime();
  if (Number.isNaN(from) || Number.isNaN(until)) return false;
  return from <= end.getTime() && until >= start.getTime();
}

/**
 * Ziet deze run echt zwaar weer? Niveau 2/3 = georganiseerd tot outbreak-
 * potentieel. Niveau 1 telt alleen mét reed_action COMMIT (laag maar zeker);
 * 1 met HOLD/OBSERVE/ABORT is per definitie geen aankondiging waard.
 */
function isSevere(r: TeslaHeadsUpRow): boolean {
  if (r.tesla_signal >= 2) return true;
  return r.tesla_signal === 1 && r.reed_action === "COMMIT";
}

function morgenLabel(): string {
  return new Date(Date.now() + 86400000).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
}

/** Korte, menselijke heads-up-copy. LLM-verfijning optioneel; preset is altijd correct. */
async function headsUpCopy(): Promise<{ titel: string; intro: string; advies: string }> {
  const base = {
    titel: "Onweer trekt binnen",
    intro: "Na een warme dag wordt de lucht onstabiel. Vanuit het zuidwesten trekken stevige buien het land binnen, met kans op onweer en korte felle regen.",
    advies: "Zet tuinmeubels vast en plan je rit vóór de buien arriveren.",
  };
  try {
    const gen = (await hermesChat(
      [
        { role: "system", content: "Je bent Mariana van Weerzone. Herschrijf deze heads-up-intro in 2 korte, menselijke zinnen. 100% correct Nederlands, geen vakjargon, geen modelnamen, geen Engels, geen emoji. Het gaat over MORGEN, niet vanavond." },
        { role: "user", content: base.intro },
      ],
      { model: "persona", temperature: 0.7, maxTokens: 150, nlGuard: true },
    )).trim();
    const ok = gen.length > 20 && !/subsidentie|convect|hpa|850|model|regime/i.test(gen);
    if (ok) return { ...base, intro: gen };
  } catch { /* preset blijft */ }
  return base;
}

export async function decideHeadsUp(opts: { teslaRows?: TeslaHeadsUpRow[] } = {}): Promise<HeadsUp | null> {
  const rows = opts.teslaRows ?? (await loadLatestTeslaRows());
  const severe = rows.filter(
    (r) =>
      Date.now() - new Date(r.run_at).getTime() < MAX_RUN_AGE_MS &&
      overlapsTomorrow(r.valid_from, r.valid_until) &&
      isSevere(r)
  );
  if (!severe.length) return null;

  const namen = [...new Set(severe.map((r) => r.region_name).filter(Boolean))];
  const waar = namen.length && namen.length <= 3 ? namen.join(", ") : "Groot deel van het land";

  const copy = await headsUpCopy();
  return {
    type: "onweer",
    badge: "Heads-up · morgen",
    titel: copy.titel,
    intro: copy.intro,
    rijen: {
      wanneer: `Morgen, ${morgenLabel().split(" ").slice(0, 2).join(" ")}`,
      waar,
      verwacht: "Onweer, windstoten, felle regen",
    },
    advies: copy.advies,
  };
}
