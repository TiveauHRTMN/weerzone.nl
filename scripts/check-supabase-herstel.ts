/**
 * Herstelcheck voor Supabase — bedoeld om te draaien op het moment dat het
 * project weer online komt na de storing van september 2026.
 *
 * De site draait sindsdien in een noodstand die er *gezond* uitziet: elke
 * pagina geeft 200, ook als de verrijking en de accounts er niet zijn. Je kunt
 * dus niet aan de buitenkant zien of Supabase echt terug is. Dit script kijkt
 * er rechtstreeks naar en geeft per laag een harde ja/nee.
 *
 *   npx tsx scripts/check-supabase-herstel.ts
 *
 * Alles groen? Dan nog een keer deployen, want NEXT_PUBLIC_SUPABASE_URL en
 * NEXT_PUBLIC_SUPABASE_ANON_KEY worden in de build ingebakken: een nieuwe
 * waarde in Vercel doet pas iets na een nieuwe build.
 */
import * as dotenv from "dotenv";
import { lookup } from "node:dns/promises";

// .env.local eerst: daar staan de sleutels waar de rest van scripts/ ook op
// leunt. .env vult alleen aan wat daar nog niet in stond.
dotenv.config({ path: ".env.local" });
dotenv.config();

type Check = { naam: string; ok: boolean; detail: string };
const resultaten: Check[] = [];

function meld(naam: string, ok: boolean, detail: string) {
  resultaten.push({ naam, ok, detail });
  console.log(`${ok ? "OK  " : "FOUT"}  ${naam.padEnd(34)} ${detail}`);
}

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("\nSupabase-herstelcheck\n" + "=".repeat(60));

  if (!url) {
    meld("env SUPABASE_URL", false, "niet gezet — verder testen heeft geen zin");
    return afronden();
  }
  const host = new URL(url).host;
  meld("env SUPABASE_URL", true, host);
  meld("env service-role key", Boolean(serviceKey), serviceKey ? "aanwezig" : "ONTBREEKT");
  meld("env anon key", Boolean(anonKey), anonKey ? "aanwezig" : "ONTBREEKT");

  // 1. DNS. Een verwijderd project geeft NXDOMAIN; een gepauzeerd project blijft
  //    gewoon resolven. Dit is de check die de storing destijds ontmaskerde.
  try {
    const { address } = await lookup(host);
    meld("DNS", true, address);
  } catch (err) {
    meld("DNS", false, `${err instanceof Error ? err.message : String(err)} — project nog weg`);
    return afronden();
  }

  // 2. Kale HTTP-bereikbaarheid, buiten supabase-js om. Die client doet eigen
  //    retries en verbergt daarmee hoe traag de host echt is.
  const t0 = Date.now();
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: anonKey ? { apikey: anonKey } : undefined,
      signal: AbortSignal.timeout(8000),
    });
    meld("REST-endpoint", res.status < 500, `HTTP ${res.status} in ${Date.now() - t0} ms`);
  } catch (err) {
    meld("REST-endpoint", false, `${err instanceof Error ? err.message : String(err)} na ${Date.now() - t0} ms`);
    return afronden();
  }

  if (!serviceKey) return afronden();

  // 3. De tabellen waar de site echt op leunt. Een lege tabel is geen fout —
  //    een ontbrekende tabel wel, want dan zijn de migraties niet gedraaid.
  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(url, serviceKey, { auth: { persistSession: false } });

  const tabellen = [
    "mariana_location_memory",
    "mariana_regions",
    "agent_subscriptions",
    "user_profile",
    "system_state",
  ];

  for (const tabel of tabellen) {
    const t = Date.now();
    const { count, error } = await db.from(tabel).select("*", { count: "exact", head: true });
    const ms = Date.now() - t;
    if (error) {
      meld(`tabel ${tabel}`, false, `${error.message} (${ms} ms)`);
    } else {
      meld(`tabel ${tabel}`, true, `${count ?? 0} rijen in ${ms} ms`);
    }
  }

  // 4. Latency versus de deadline in weather.ts. Staat de opslag er wel, maar
  //    trager dan ENRICHMENT_DEADLINE_MS, dan wordt de verrijking stil
  //    overgeslagen en zie je alsnog onverrijkte cijfers op een 200-pagina.
  const t1 = Date.now();
  await db.from("mariana_location_memory").select("*").limit(1);
  const latency = Date.now() - t1;
  meld(
    "latency vs deadline (1200 ms)",
    latency < 1200,
    latency < 1200
      ? `${latency} ms — ruim binnen`
      : `${latency} ms — verrijking wordt overgeslagen, zet ENRICHMENT_DEADLINE_MS hoger`,
  );

  afronden();
}

function afronden() {
  const stuk = resultaten.filter((r) => !r.ok);
  console.log("=".repeat(60));
  if (stuk.length === 0) {
    console.log("Alles groen. Nu opnieuw deployen zodat de NEXT_PUBLIC_-waarden");
    console.log("in de build terechtkomen, en daarna de crons in vercel.json nalopen.\n");
  } else {
    console.log(`${stuk.length} check(s) stuk:`);
    for (const r of stuk) console.log(`  - ${r.naam}: ${r.detail}`);
    console.log();
  }
  process.exit(stuk.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("check-supabase-herstel crashte:", err);
  process.exit(1);
});
