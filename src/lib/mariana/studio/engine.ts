/**
 * Mariana Studio — engine. Bouwt één StudioDay uit de cascade + temps + copy.
 * Draait dagelijks (laatste stap van mariana-nl). Cijfers uit de pipeline; tekst via narrative.
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadLatestOracleRun } from "@/lib/mariana/oracle/storage";
import { forecastRanking, regionAverages, details, daypartTemps } from "./temps";
import { dagIntro, morgenAlinea } from "./narrative";
import { decideHeadsUp } from "./headsup";
import type { StudioDay, Region } from "./types";

function capDate(offset: number): string {
  return new Date(Date.now() + offset * 86400000).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
}
function isoDate(offset: number): string {
  return new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
}
function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

/** Leest de nieuwste regions-rijen om pollen + onweer-hazard af te leiden. */
async function readRegionsSignal(): Promise<{ pollenHoog: boolean; thunder: boolean }> {
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.from("mariana_regions").select("*").order("run_at", { ascending: false }).limit(30);
    const rows = (data ?? []) as Record<string, any>[];
    const seen = new Set<string>();
    const regions: Record<string, any>[] = [];
    for (const r of rows) {
      const slug = String(r.region_slug ?? "");
      if (slug && !seen.has(slug)) { seen.add(slug); regions.push(r); }
    }
    const pollenHoog = regions.some((r) => /hoog/i.test(String(r.signal?.risk_summary?.pollen ?? "")));
    const thunder = regions.some((r) => {
      const flags = (r.local_feed?.hazardFlags ?? []) as string[];
      return flags.includes("thunder") || flags.includes("storm");
    });
    return { pollenHoog, thunder };
  } catch {
    return { pollenHoog: false, thunder: false };
  }
}

export async function runStudio(opts: { dayOffset?: number } = {}): Promise<StudioDay> {
  const dayOffset = opts.dayOffset ?? 0;

  const [todayRanked, tomorrowRanked, det, oracle, regionsSig, realDayparts] = await Promise.all([
    forecastRanking(dayOffset),
    forecastRanking(dayOffset + 1),
    details(dayOffset),
    loadLatestOracleRun().catch(() => null),
    readRegionsSignal(),
    daypartTemps(dayOffset),
  ]);

  if (!todayRanked.length) throw new Error("Studio: geen temperatuurdata");

  const warmst = todayRanked[0];
  const koelst = todayRanked[todayRanked.length - 1];
  const spread = Math.round(warmst.value - koelst.value);
  const regAvg = regionAverages(todayRanked);
  const pollen = regionsSig.pollenHoog ? "Hoog (gras)" : "Laag tot matig";
  const regime = oracle?.signal?.dominant_regime ?? "wisselvallig";
  const morgenMax = tomorrowRanked[0]?.value ?? warmst.value;
  const tendens = morgenMax < warmst.value - 1 ? "iets koeler" : morgenMax > warmst.value + 1 ? "iets warmer" : "vergelijkbaar";

  // Dagdelen: echte De Bilt-uurcurve; bij fetch-falen terugval op de oude benadering uit regio-gemiddelde.
  const middagFallback = Math.round(warmst.value);
  const dayparts = realDayparts ?? {
    ochtend: Math.max(0, middagFallback - 9),
    middag: middagFallback,
    avond: Math.max(0, middagFallback - 4),
    nacht: Math.round(koelst.value) - 2,
  };

  const intro = await dagIntro({ warmst, koelst, spread, pollen, regime });
  const morgenTekst = await morgenAlinea({ morgenMax, tendens, regime });
  const headsUp = await decideHeadsUp({
    morgenRanked: tomorrowRanked,
    oracleGateActive: oracle?.signal?.convective_gate === "ACTIVATE" || oracle?.signal?.run_tesla === true,
    regionThunder: regionsSig.thunder,
  });

  const fietsweer = det.windBft >= 6 ? "Matig" : warmst.value >= 30 ? "Warm" : "Goed";
  const hooikoorts = pollen.startsWith("Hoog") ? "Hoog" : "Laag";

  return {
    forecastDate: isoDate(dayOffset),
    runAt: new Date().toISOString(),
    slide1: {
      badge: `${cap(capDate(dayOffset))} · 08:00`,
      titel: "Vandaag",
      intro,
      regionTemps: regAvg,
      dayparts,
      metrics: { uvIndex: det.uv, hooikoorts, windBft: det.windBft, fietsweer },
      tagline: "Lokale verschillen kunnen groot zijn — bekijk het weer op jouw locatie.",
    },
    slide2: {
      badge: "Nu · 14:00",
      titel: "Actueel weer",
      subtitel: "Zo staat het er nu voor in het land",
      regionTempsNow: null,   // pagina vult live
      warmstePlek: null,      // pagina vult live
    },
    slide3: {
      badge: `Avond · ${capDate(dayOffset).split(" ").slice(1, 3).join(" ")}`,
      titel: "Vandaag & Morgen",
      vandaag: {
        hoogste: { temp: Math.round(warmst.value), plaats: warmst.name },
        laagste: { temp: dayparts.nacht, label: "vannacht" },
        weerfeit: spread >= 10 ? `${spread} graden verschil in het land` : humanWeerfeit(warmst.value),
      },
      morgen: { temp: Math.round(morgenMax), alinea: morgenTekst },
    },
    slide4: headsUp,
  };
}

function humanWeerfeit(max: number): string {
  if (max >= 30) return "Eerste tropische dag";
  if (max >= 25) return "Een echte zomerse dag";
  if (max <= 0) return "IJzige dag";
  return "Wisselvallig weerbeeld";
}
