import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const [oracle, regions] = await Promise.all([
    sb.from("mariana_oracle").select("*").order("run_at", { ascending: false }).limit(1).maybeSingle(),
    sb.from("mariana_regions").select("*").order("run_at", { ascending: false }).limit(40),
  ]);

  const o = oracle.data as Record<string, unknown> | null;
  console.log("=== ORACLE (landelijk regime, 48–96u) ===");
  console.log("run_at:", o?.run_at, "| valid:", o?.valid_from, "→", o?.valid_until);
  console.log("regime:", o?.dominant_regime, "| convective_gate:", o?.convective_gate);
  const sig = o?.signal as Record<string, unknown> | undefined;
  if (sig) {
    console.log("850hPa:", sig["850hpa_trend"]);
    console.log("regime_summary:", sig["regime_summary"]);
    console.log("national_outlook:", sig["national_outlook"] ?? sig["summary"] ?? sig["mariana_summary"]);
    console.log("scenario_tree:", JSON.stringify(sig["scenario_tree"]));
  }

  const regs = (regions.data ?? []) as Record<string, unknown>[];
  const seen = new Set<string>();
  console.log("\n=== REGIO'S (nieuwste run, piet-tekst + risico) ===");
  for (const r of regs) {
    const slug = String(r.region_slug ?? "?");
    if (seen.has(slug)) continue;
    seen.add(slug);
    const s = r.signal as Record<string, unknown> | undefined;
    const ao = s?.agent_outputs as Record<string, Record<string, unknown>> | undefined;
    const risk = s?.risk_summary as Record<string, unknown> | undefined;
    console.log(`\n• ${r.region_name} [${slug}]`);
    console.log(`  temp: ${risk?.temperature ?? "?"} | comfort: ${risk?.comfort ?? "?"} | thunder: ${risk?.thunder ?? "?"} | pollen: ${risk?.pollen ?? "?"}`);
    console.log(`  piet: ${ao?.piet?.text ?? "?"}`);
  }
}
main().catch((e) => console.error(e));
