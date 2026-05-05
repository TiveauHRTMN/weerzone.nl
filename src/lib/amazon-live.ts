// ============================================================
// Live-cache voor Amazon PA-API data.
//
// Strategie:
// - Supabase tabel `amazon_products_cache` met per ASIN: data JSON + refreshed_at
// - In-memory mirror in serverless function (warm restart = hit)
// - TTL 12u — geen noodzaak vaker (PA-API heeft rate limits)
// - Fallback: als Supabase faalt → alleen in-memory → alleen static catalog
// - Refresh via /api/cron/amazon-refresh (dagelijks via Vercel cron)
// ============================================================

import { getSupabase } from "./supabase";
import { paapiGetItems, paapiSearchItems, type LivePAAPIItem } from "./amazon-paapi";
import { CATALOG, type CatalogProduct } from "./amazon-catalog";

const TTL_MS = 12 * 60 * 60 * 1000; // 12u
const AMAZON_CACHE_TABLE = "amazon_products_cache";

type MemEntry = { item: LivePAAPIItem; ts: number };
const memory = new Map<string, MemEntry>(); // key = ASIN of "search:KEYWORDS"
let cacheTableMissing = false;

function keyFor(p: CatalogProduct): string {
  if (p.asin) return p.asin;
  if (p.searchQuery) return `search:${p.searchQuery}`;
  return p.id;
}

function isMissingCacheTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: string; message?: string };
  return (
    maybeError.code === "PGRST205" ||
    maybeError.message?.includes(`Could not find the table 'public.${AMAZON_CACHE_TABLE}'`) === true
  );
}

// ============================================================
// Supabase persistence
// ============================================================

async function readDB(keys: string[]): Promise<Map<string, LivePAAPIItem>> {
  const sb = getSupabase();
  const out = new Map<string, LivePAAPIItem>();
  if (!sb || keys.length === 0 || cacheTableMissing) return out;

  try {
    const { data, error } = await sb
      .from(AMAZON_CACHE_TABLE)
      .select("cache_key, data, refreshed_at")
      .in("cache_key", keys);
    if (error) {
      if (isMissingCacheTable(error)) {
        cacheTableMissing = true;
        return out;
      }
      console.warn("[amazon-live] Supabase read:", error.message);
      return out;
    }
    const now = Date.now();
    for (const row of data ?? []) {
      const ts = new Date(row.refreshed_at).getTime();
      if (now - ts < TTL_MS) {
        out.set(row.cache_key, row.data as LivePAAPIItem);
      }
    }
  } catch (e) {
    console.warn("[amazon-live] DB read failed:", e);
  }
  return out;
}

async function writeDB(key: string, item: LivePAAPIItem) {
  const sb = getSupabase();
  if (!sb || cacheTableMissing) return;
  try {
    await sb
      .from(AMAZON_CACHE_TABLE)
      .upsert({
        cache_key: key,
        asin: item.asin,
        data: item,
        refreshed_at: new Date().toISOString(),
      }, { onConflict: "cache_key" });
  } catch (e) {
    if (isMissingCacheTable(e)) {
      cacheTableMissing = true;
      return;
    }
    console.warn("[amazon-live] DB write failed:", e);
  }
}

// ============================================================
// Public: hydrate catalog met live data
// ============================================================

export async function hydrateWithLive(
  products: CatalogProduct[],
): Promise<Array<CatalogProduct & { live?: LivePAAPIItem }>> {
  const now = Date.now();
  const needFetch: CatalogProduct[] = [];
  const hit = new Map<string, LivePAAPIItem>();

  // 1. in-memory hit
  for (const p of products) {
    const key = keyFor(p);
    const mem = memory.get(key);
    if (mem && now - mem.ts < TTL_MS) {
      hit.set(key, mem.item);
    } else {
      needFetch.push(p);
    }
  }

  // 2. Supabase hit
  if (needFetch.length > 0) {
    const dbHits = await readDB(needFetch.map(keyFor));
    for (const [key, item] of dbHits) {
      hit.set(key, item);
      memory.set(key, { item, ts: now });
    }
  }

  // 3. Resultaat samenstellen (geen on-the-fly PA-API calls om te voorkomen
  //    dat page loads PA-API hitten — dat doet de cron).
  return products.map(p => ({ ...p, live: hit.get(keyFor(p)) }));
}

// ============================================================
// Refresh — door cron aangeroepen
// ============================================================

export async function refreshAll(): Promise<{ ok: number; fail: number }> {
  let ok = 0;
  let fail = 0;

  // ASIN-based batch-fetch
  const asins = CATALOG.filter(p => !!p.asin).map(p => p.asin!);
  try {
    const items = await paapiGetItems(asins);
    for (const item of items) {
      memory.set(item.asin, { item, ts: Date.now() });
      await writeDB(item.asin, item);
      ok++;
    }
    fail += asins.length - items.length;
  } catch (e) {
    console.error("[amazon-live] refreshAll getItems failed:", e);
    fail += asins.length;
  }

  // Search-based: één per product, pak het top-1
  const searchProducts = CATALOG.filter(p => !!p.searchQuery);
  for (const p of searchProducts) {
    try {
      const results = await paapiSearchItems(p.searchQuery!, 1);
      if (results[0]) {
        const key = keyFor(p);
        memory.set(key, { item: results[0], ts: Date.now() });
        await writeDB(key, results[0]);
        ok++;
      } else {
        fail++;
      }
      // throttle: PA-API = 1 req/sec op nieuwe accounts
      await new Promise(r => setTimeout(r, 1100));
    } catch (e) {
      console.error(`[amazon-live] search failed for ${p.id}:`, e);
      fail++;
    }
  }

  return { ok, fail };
}
