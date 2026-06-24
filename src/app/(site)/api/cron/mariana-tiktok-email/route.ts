/**
 * MARIANA — DAGELIJKSE TIKTOK-BRIEF
 * Elke ochtend (Vercel cron 0 4 * * * = 06:00 CEST) mailt Mariana naar
 * info@weerzone.nl één post-klare update + haar volledige dagrapport, zodat de
 * landelijke TikTok-post direct gemaakt kan worden.
 *
 * Mail bevat:
 *  A. POST-KLAAR — weerbericht (menselijk, via Hermes), 5 regio's, warmste/koelste
 *     ranglijst (live per-plek), details (Bft/pollen/UV/zon), CTA.
 *  B. MARIANA ORACLE — landelijk regime (48-96u).
 *  C. MARIANA REGIONS — per-regio prognose.
 *  D. MARIANA TESLA — alleen als er onweer/storm-kansen zijn.
 *
 * Bron temperaturen: live Open-Meteo per plek (vers om 6:00). Mariana-context uit
 * Supabase (gevuld door /api/cron/mariana-nl, dat hiervóór draait).
 */

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { hermesChat } from "@/lib/hermes";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWindBeaufort } from "@/lib/weather";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const RECIPIENT = "info@weerzone.nl";

type Region = "Noord" | "Oost" | "Midden" | "West" | "Zuid";
// naam, lat, lon, regio
const PLACES: Array<[string, number, number, Region]> = [
  ["Den Helder", 52.96, 4.76, "West"], ["Texel", 53.15, 4.88, "Noord"], ["IJmuiden", 52.46, 4.61, "West"],
  ["Petten", 52.77, 4.66, "West"], ["Zandvoort", 52.37, 4.53, "West"], ["Hoek van Holland", 51.98, 4.13, "West"],
  ["Vlieland", 53.30, 5.07, "Noord"], ["Terschelling", 53.36, 5.34, "Noord"], ["Ameland", 53.45, 5.74, "Noord"],
  ["Schiermonnikoog", 53.48, 6.16, "Noord"], ["Lauwersoog", 53.41, 6.21, "Noord"], ["Harlingen", 53.17, 5.42, "Noord"],
  ["Vlissingen", 51.44, 3.57, "Zuid"], ["Middelburg", 51.50, 3.61, "Zuid"], ["Terneuzen", 51.34, 3.83, "Zuid"], ["Goes", 51.50, 3.89, "Zuid"],
  ["Maastricht", 50.85, 5.69, "Zuid"], ["Heerlen", 50.89, 5.98, "Zuid"], ["Roermond", 51.19, 5.99, "Zuid"], ["Venlo", 51.37, 6.17, "Zuid"],
  ["Eindhoven", 51.44, 5.48, "Zuid"], ["Tilburg", 51.56, 5.09, "Zuid"], ["Breda", 51.59, 4.78, "Zuid"], ["Roosendaal", 51.53, 4.46, "Zuid"],
  ["Den Bosch", 51.70, 5.30, "Zuid"], ["Nijmegen", 51.84, 5.86, "Oost"], ["Arnhem", 51.98, 5.91, "Oost"],
  ["Utrecht", 52.09, 5.12, "Midden"], ["Amersfoort", 52.16, 5.39, "Midden"], ["Apeldoorn", 52.21, 5.97, "Oost"], ["Enschede", 52.22, 6.90, "Oost"],
  ["Zwolle", 52.51, 6.09, "Oost"], ["Assen", 52.99, 6.56, "Noord"], ["Emmen", 52.78, 6.90, "Oost"], ["Groningen", 53.22, 6.57, "Noord"],
  ["Leeuwarden", 53.20, 5.79, "Noord"], ["De Bilt", 52.10, 5.18, "Midden"],
  ["Amsterdam", 52.37, 4.90, "West"], ["Rotterdam", 51.92, 4.48, "West"], ["Den Haag", 52.08, 4.31, "West"], ["Alkmaar", 52.63, 4.75, "West"],
];

interface Ranked { name: string; max: number; region: Region }

// Open-Meteo serveert kale modeloutput. Voor NL kiest 'best_match' HARMONIE
// (knmi_seamless), en die loopt in hitte 2-3° boven de gecorrigeerde verwachting
// van KNMI/Weerplaza. De mediaan over meerdere modellen negeert die ene hete
// uitschieter en landt op het niveau dat de profs publiceren — zonder eigen
// correctie-model. Zie docs/superpowers/specs/2026-06-24-tiktok-brief-multimodel-temp-design.md
const BLEND_MODELS = ["knmi_seamless", "ecmwf_ifs025", "icon_eu", "gfs_seamless", "ukmo_seamless"];

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

async function fetchRanking(dayOffset = 0): Promise<Ranked[]> {
  const lat = PLACES.map((p) => p[1]).join(",");
  const lon = PLACES.map((p) => p[2]).join(",");
  const base = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max&timezone=Europe%2FAmsterdam&forecast_days=${dayOffset + 1}`;

  // Primair: multi-model-mediaan (1 batch-call, alle plekken).
  try {
    const res = await fetch(`${base}&models=${BLEND_MODELS.join(",")}`, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const data = await res.json();
    const rows = (Array.isArray(data) ? data : [data]) as Array<{ daily?: Record<string, (number | null)[]> }>;
    const ranked = PLACES
      .map((p, i) => {
        const vals = BLEND_MODELS
          .map((mdl) => rows[i]?.daily?.[`temperature_2m_max_${mdl}`]?.[dayOffset])
          .filter((v): v is number => typeof v === "number");
        return { name: p[0], region: p[3], max: vals.length ? median(vals) : undefined };
      })
      .filter((r): r is Ranked => typeof r.max === "number")
      .sort((a, b) => b.max - a.max);
    if (ranked.length) return ranked;
    throw new Error("multi-model leverde geen bruikbare temperaturen");
  } catch {
    // Terugval: enkele (HARMONIE-)max, zodat de brief nooit stilvalt.
    const res = await fetch(base, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const data = await res.json();
    const rows = (Array.isArray(data) ? data : [data]) as Array<{ daily?: { temperature_2m_max?: number[] } }>;
    return PLACES
      .map((p, i) => ({ name: p[0], region: p[3], max: rows[i]?.daily?.temperature_2m_max?.[dayOffset] }))
      .filter((r): r is Ranked => typeof r.max === "number")
      .sort((a, b) => b.max - a.max);
  }
}

async function fetchDetails(dayOffset = 0): Promise<{ uv: number; sunHours: number; windBft: number }> {
  // De Bilt als landelijke referentie.
  const url = `https://api.open-meteo.com/v1/forecast?latitude=52.10&longitude=5.18&daily=uv_index_max,sunshine_duration,wind_speed_10m_max&timezone=Europe%2FAmsterdam&forecast_days=${dayOffset + 1}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  const d = await res.json().catch(() => null);
  const day = d?.daily ?? {};
  return {
    uv: Math.round(day.uv_index_max?.[dayOffset] ?? 0),
    sunHours: Math.round((day.sunshine_duration?.[dayOffset] ?? 0) / 3600),
    windBft: getWindBeaufort(day.wind_speed_10m_max?.[dayOffset] ?? 0).scale,
  };
}

function regionAverages(ranked: Ranked[]): Record<Region, number> {
  const order: Region[] = ["Noord", "Oost", "Midden", "West", "Zuid"];
  const out = {} as Record<Region, number>;
  for (const region of order) {
    const vals = ranked.filter((r) => r.region === region).map((r) => r.max);
    out[region] = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  }
  return out;
}

/** Mariana-regimecode → gewone mensentaal (geen vakjargon in de post). */
function humanRegime(regime: string): string {
  const r = (regime || "").toLowerCase();
  if (/hitte|hittekoepel/.test(r)) return "een hittekoepel boven Nederland";
  if (/azoren|hogedruk|subsident/.test(r)) return "een stabiel hogedrukgebied";
  if (/storm|zwaar.?weer/.test(r)) return "een stormachtig weertype";
  if (/onweer|convect/.test(r)) return "een onweersgevoelige dag";
  if (/regen|nat|front|laag/.test(r)) return "wisselvallig, nat weer";
  return "wisselvallig weer";
}

async function generateWeerbericht(input: {
  warmst: Ranked; koelst: Ranked; spread: number; pollen: string; regime: string; when: string;
}): Promise<string> {
  const tw = Math.round(input.warmst.max);
  const tk = Math.round(input.koelst.max);
  const system = `Je bent Mariana, het weergezicht van Weerzone. Schrijf een KORT, pakkend landelijk weerbericht voor ${input.when}, voor een virale TikTok-post.
DOEL: mensen moeten meteen blijven hangen en het willen delen — open met een sterke hook (een verrassend contrast of een gewaagde uitspraak).
STIJL: menselijk, energiek, spreektaal met een vleugje lef. 100% correct Nederlands — gewone mensentaal, géén Engelse woorden, géén vaktermen (zoals 'subsidentie'), geen modelnamen.
LENGTE: 3 tot 4 korte zinnen.
TEMPERATUUR schrijf je als "het wordt X graden" of gewoon "X graden" — nooit "het waait X graden" (waaien gaat over wind, niet over temperatuur).
HARDE REGELS: gebruik de gegeven getallen en plaatsnamen EXACT — verander geen enkel cijfer en verzin geen extra plaatsen, dagen of harde weersclaims. Geen emoji, geen aanhef, geen ondertekening.`;
  const user = `Cijfers van ${input.when} (exact overnemen):
• Warmste plek: ${input.warmst.name} ${tw} graden
• Koelste plek: ${input.koelst.name} ${tk} graden
• Verschil: ${input.spread} graden
• Graspollen: ${input.pollen}
• Weertype: ${humanRegime(input.regime)}`;
  return (await hermesChat(
    [{ role: "system", content: system }, { role: "user", content: user }],
    { model: "persona", temperature: 0.75, maxTokens: 260, nlGuard: true },
  )).trim();
}

/** Pakkende, gegarandeerd-correcte terugval als de LLM faalt of cijfers verbouwt.
 *  Plaatsnamen als onderwerp (geen in/op-voorzetsel → altijd correct, ook bij
 *  eilanden), en werkwoord/hook passen zich aan de temperatuur en het seizoen aan. */
function catchyFallback(w: Ranked, k: Ranked, spread: number, pollen: string): string {
  const tw = Math.round(w.max), tk = Math.round(k.max);
  const pollenLine = /hoog/i.test(pollen) ? " Ga je naar buiten? De graspollen vliegen je om de oren." : "";
  const hook = spread >= 10
    ? `${spread} graden verschil — in hetzelfde land, op dezelfde dag.`
    : tw >= 25
      ? `Nederland zit in de zon, maar niet overal even fel.`
      : `Nederland laat zich vandaag van twee kanten zien.`;
  const warmVerb = tw >= 28 ? "kookt op" : tw >= 20 ? "warmt op tot" : "komt tot";
  return `${hook} Terwijl ${w.name} ${warmVerb} ${tw} graden, blijft ${k.name} steken op ${tk}°.${pollenLine}`;
}

function esc(s: unknown): string {
  return String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));
}

export async function GET(req: Request) {
  // ?dry=1 → render de mail maar verstuur niet (voor preview/afstemmen). Auth
  // geldt óók voor dry in productie; lokaal (dev) is geen secret nodig.
  const params = new URL(req.url).searchParams;
  const dry = params.get("dry") === "1";
  const dayOffset = params.get("day") === "1" ? 1 : 0; // 0 = vandaag (cron), 1 = morgen (test)
  const when = dayOffset === 1 ? "morgen" : "vandaag";
  const authHeader = req.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ error: "RESEND_API_KEY missing" }, { status: 500 });

  const admin = createSupabaseAdminClient();

  // 1. Mariana-context uit Supabase (gevuld door mariana-nl).
  const [oracleRes, regionsRes, teslaRes] = await Promise.all([
    admin.from("mariana_oracle").select("*").order("run_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("mariana_regions").select("*").order("run_at", { ascending: false }).limit(30),
    admin.from("mariana_tesla").select("*").order("run_at", { ascending: false }).limit(12),
  ]);
  const oracle = oracleRes.data as Record<string, any> | null;
  const allRegions = (regionsRes.data ?? []) as Record<string, any>[];
  // dedupe op region_slug (nieuwste eerst)
  const regions: Record<string, any>[] = [];
  const seen = new Set<string>();
  for (const r of allRegions) {
    const slug = String(r.region_slug ?? "");
    if (slug && !seen.has(slug)) { seen.add(slug); regions.push(r); }
  }

  // Onweer/storm-relevantie → Tesla meenemen?
  const regionHazards = regions.some((r) => {
    const flags = (r.local_feed?.hazardFlags ?? []) as string[];
    return flags.includes("thunder") || flags.includes("storm");
  });
  const teslaRelevant = oracle?.run_tesla === true || oracle?.convective_gate === "ON" || regionHazards;
  const tesla = teslaRelevant ? ((teslaRes.data ?? []) as Record<string, any>[]) : [];

  // 2. Live temperaturen + details.
  let ranked: Ranked[] = [];
  let details = { uv: 0, sunHours: 0, windBft: 0 };
  try {
    [ranked, details] = await Promise.all([fetchRanking(dayOffset), fetchDetails(dayOffset)]);
  } catch (e) {
    return NextResponse.json({ error: `weatherfetch: ${e}` }, { status: 502 });
  }
  if (!ranked.length) return NextResponse.json({ error: "geen temperatuurdata" }, { status: 502 });

  const warmst = ranked[0];
  const koelst = ranked[ranked.length - 1];
  const spread = Math.round(warmst.max - koelst.max);
  const regAvg = regionAverages(ranked);
  const top5 = ranked.slice(0, 5);
  const bottom5 = ranked.slice(-5).reverse();

  const pollen = regions.some((r) => /hoog/i.test(String(r.signal?.risk_summary?.pollen ?? ""))) ? "Hoog (gras)" : "Laag tot matig";
  const regime = oracle?.dominant_regime ?? "wisselvallig";

  // 3. Pakkend weerbericht (Hermes), met harde cijfer-validatie + terugval.
  let weerbericht = catchyFallback(warmst, koelst, spread, pollen);
  try {
    const gen = await generateWeerbericht({ warmst, koelst, spread, pollen, regime, when });
    const tw = String(Math.round(warmst.max));
    const tk = String(Math.round(koelst.max));
    // Alleen overnemen als de LLM de exacte cijfers gebruikte (consistent met de
    // ranglijst) én geen vakjargon of modelnaam lekte.
    const cleanLang = !/subsidentie|convect|hpa|850|model|gateway|regime/i.test(gen)
      && !/waait[^.!?]*graden/i.test(gen) // "het waait X graden" is fout (waaien = wind)
      && !/het graspollen/i.test(gen);   // "de graspollen" (de-woord)
    if (gen.length > 20 && gen.includes(tw) && gen.includes(tk) && cleanLang) weerbericht = gen;
  } catch { /* terugval blijft staan */ }

  // 4. E-mail HTML.
  const dateLabel = new Date(Date.now() + dayOffset * 86400000).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const rankRow = (r: Ranked, i: number) => `<tr><td style="padding:3px 10px;color:#475569;">${i + 1}.</td><td style="padding:3px 10px;color:#0f172a;font-weight:600;">${esc(r.name)}</td><td style="padding:3px 10px;text-align:right;font-weight:800;color:#0f172a;">${Math.round(r.max)}°</td></tr>`;
  const regionRow = `${(["Zuid", "Oost", "Midden", "West", "Noord"] as Region[]).map((r) => `${r} ${regAvg[r]}°`).join("  ·  ")}`;

  const oracleSig = oracle?.signal ?? {};
  const teslaHtml = tesla.length
    ? `<h3 style="margin:24px 0 8px;font-size:13px;color:#b45309;">⚡ MARIANA TESLA — onweer/storm</h3>` +
      tesla.slice(0, 8).map((t) => {
        const s = t.signal ?? {};
        return `<p style="margin:0 0 6px;font-size:13px;color:#334155;"><strong>${esc(t.region_name ?? t.region_slug)}</strong>: signaal ${esc(t.tesla_signal ?? s.tesla_signal ?? "?")}, actie ${esc(t.reed_action ?? s.reed_action ?? "—")} · venster ${esc(t.timing_window ?? s.timing_window ?? "—")}</p>`;
      }).join("")
    : `<p style="margin:8px 0 0;font-size:13px;color:#64748b;">Geen onweer- of storm­kansen vandaag — Tesla rust.</p>`;

  const html = `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#0e1f4d;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;">
<div style="max-width:600px;margin:0 auto;padding:28px 18px 40px;">
  <div style="text-align:center;padding-bottom:18px;">
    <p style="margin:0;font-size:20px;font-weight:900;color:#ffd21a;letter-spacing:-0.5px;">WEERZONE</p>
    <p style="margin:6px 0 0;font-size:11px;color:rgba(255,255,255,.65);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Mariana · dagelijkse TikTok-brief</p>
    <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,.5);">${esc(dateLabel)}</p>
  </div>

  <!-- A. POST-KLAAR -->
  <div style="background:#fff;border-radius:18px;padding:22px;margin-bottom:14px;">
    <p style="margin:0 0 10px;font-size:11px;font-weight:800;color:#2f6bed;text-transform:uppercase;letter-spacing:1.5px;">Slide 1 · weerbericht + temperaturen + details</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1e293b;">${esc(weerbericht)}</p>
    <p style="margin:0 0 4px;font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Temperatuur per regio</p>
    <p style="margin:0 0 14px;font-size:14px;font-weight:700;color:#0f172a;">${regionRow}</p>
    <p style="margin:0 0 4px;font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Details</p>
    <p style="margin:0;font-size:14px;color:#0f172a;">🍃 Wind ${details.windBft} Bft  ·  🌿 Pollen ${esc(pollen)}  ·  ☀️ UV ${details.uv}  ·  🌞 Zon ${details.sunHours} uur</p>
  </div>

  <!-- Ranglijst -->
  <div style="background:#fff;border-radius:18px;padding:22px;margin-bottom:14px;">
    <p style="margin:0 0 12px;font-size:11px;font-weight:800;color:#2f6bed;text-transform:uppercase;letter-spacing:1.5px;">Slide 2 · ranglijst + CTA</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;"><tr>
      <td style="vertical-align:top;width:50%;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:800;color:#e8632c;text-transform:uppercase;letter-spacing:1px;">🔥 Warmste plekken</p>
        <table style="border-collapse:collapse;">${top5.map(rankRow).join("")}</table>
      </td>
      <td style="vertical-align:top;width:50%;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:800;color:#2f6bed;text-transform:uppercase;letter-spacing:1px;">💨 Koelste plekken</p>
        <table style="border-collapse:collapse;">${bottom5.map(rankRow).join("")}</table>
      </td>
    </tr></table>
    <p style="margin:14px 0 0;font-size:13px;font-weight:700;color:#0f172a;text-align:center;">${spread} graden verschil — zelfde land, zelfde dag.</p>
  </div>

  <!-- CTA-tekst -->
  <div style="background:#fff;border-radius:18px;padding:18px 22px;margin-bottom:22px;">
    <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;"><strong>CTA (onder de ranglijst):</strong> Het weer op jouw locatie — vandaag en morgen. Wat is het weer bij JOU? → weerzone.nl</p>
  </div>

  <!-- B/C/D. MARIANA RAPPORT -->
  <div style="background:rgba(255,255,255,.95);border-radius:18px;padding:22px;">
    <h3 style="margin:0 0 8px;font-size:13px;color:#0f172a;">🌊 MARIANA ORACLE — landelijk regime (48–96u)</h3>
    <p style="margin:0 0 4px;font-size:13px;color:#334155;"><strong>Regime:</strong> ${esc(regime)} · onweerpoort ${esc(oracle?.convective_gate ?? "?")}</p>
    <p style="margin:0 0 4px;font-size:13px;color:#334155;"><strong>850hPa:</strong> ${esc(oracleSig["850hpa_trend"] ?? "—")}</p>
    <p style="margin:0 0 0;font-size:13px;color:#334155;"><strong>Samenvatting:</strong> ${esc(oracleSig.regime_summary ?? "—")}</p>

    <h3 style="margin:24px 0 8px;font-size:13px;color:#0f172a;">📍 MARIANA REGIONS — per regio</h3>
    ${regions.map((r) => `<p style="margin:0 0 8px;font-size:13px;color:#334155;line-height:1.5;"><strong>${esc(r.region_name ?? r.region_slug)}:</strong> ${esc(r.signal?.agent_outputs?.piet?.text ?? r.signal?.risk_summary?.temperature ?? "—")}</p>`).join("")}

    ${teslaHtml}
  </div>

  <p style="text-align:center;margin:24px 0 0;font-size:11px;color:rgba(255,255,255,.5);">Mariana · Weerzone — automatisch elke ochtend</p>
</div></body></html>`;

  const subject = `🌤️ TikTok-brief ${dateLabel.split(" ").slice(0, 3).join(" ")} — ${warmst.name} ${Math.round(warmst.max)}° / ${koelst.name} ${Math.round(koelst.max)}°`;

  if (dry) {
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  const resend = new Resend(resendKey);
  const { error: sendErr } = await resend.emails.send({
    from: "Mariana van Weerzone <mariana@weerzone.nl>",
    to: RECIPIENT,
    subject,
    html,
  });
  if (sendErr) return NextResponse.json({ error: sendErr.message }, { status: 500 });

  return NextResponse.json({
    sent: true, to: RECIPIENT, warmst: `${warmst.name} ${Math.round(warmst.max)}`,
    koelst: `${koelst.name} ${Math.round(koelst.max)}`, spread, teslaIncluded: tesla.length > 0,
    regions: regions.length, oracleRun: oracle?.run_at ?? null,
  });
}
