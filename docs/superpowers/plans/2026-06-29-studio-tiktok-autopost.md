# Studio → TikTok auto-post (via Buffer) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Mariana Studio publish each slide to TikTok via Buffer the moment the owner ticks a per-slide "Bekeken & akkoord" box — browser renders the PNG, server uploads it and calls Buffer, with a hard per-slot lock so nothing double-posts and nothing posts unattended.

**Architecture:** The existing client-side `html-to-image` render stays the source of the PNG (captures `contentEditable` edits, no visual drift). Ticking approve POSTs the PNG + caption to a new `/api/studio/publish` route, which uploads the image to a public Supabase Storage bucket, calls the Buffer API to publish to the TikTok channel "now", and records the result in a new `studio_posts` table (which is both the audit log and the dedupe lock). A nudge cron emails the owner ~15 min before each slot.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase (admin/service-role client + Storage), Resend, Buffer classic API v1, `html-to-image` (already a dep).

## Global Constraints

- **NL-only product.** All user-facing copy is Dutch. Do not add locales or i18n. (CLAUDE.md)
- **No source names in product UI.** No "KNMI"/"DWD"/"Mariana" in captions or hashtags. Avoid `#knmi`. (memory `feedback_no_source_names_in_ui`)
- **No unit-test runner exists and you must not add one.** The repo has Playwright (one example spec) and nothing else — no jest/vitest/lint/formatter. (CLAUDE.md) Verification in this plan uses: `npx tsc --noEmit` (the repo's real type signal, because `next.config.ts` sets `typescript.ignoreBuildErrors: true`), small `npx tsx scripts/*.ts` smoke scripts for pure logic, and manual `npm run dev` checks for UI/routes.
- **Crons must be registered in `vercel.json` `crons[]`** or they never fire. (CLAUDE.md)
- **DB migrations in the repo are NOT live.** There is no Supabase CLI wired; the owner runs new SQL by hand in the Supabase SQL editor. (memory `feedback_prod_db_migrations`) The plan only writes the migration file; running it is a manual deploy step.
- **Soft-fail without service role.** Storage/DB helpers must return empty/`{ok:false}` (never throw) when `SUPABASE_SERVICE_ROLE_KEY` is absent, matching `src/lib/mariana/studio/storage.ts`.
- **Slot keys are exactly:** `slide1` (08:00 Dagverwachting), `slide2` (14:00 Actueel), `slide3` (20:00 Vandaag & Morgen), `slide4` (22:00 Heads-up, optional).
- **Spec:** `docs/superpowers/specs/2026-06-29-studio-tiktok-autopost-design.md`.

---

## File Structure

**Create:**
- `src/lib/mariana/studio/slots.ts` — `StudioSlot` union + `STUDIO_SLOTS` metadata (label, time, deeplink id). Shared by client, caption builder, nudge cron.
- `src/lib/mariana/studio/caption.ts` — `defaultCaption(day, slot)` pure builder.
- `src/lib/mariana/studio/buffer.ts` — `postToTikTok(...)` Buffer API client (injectable `fetch` for testing).
- `src/lib/mariana/studio/posts.ts` — `getPostedSlots`, `recordPost`, `uploadSlidePng` (Supabase Storage + `studio_posts` table). Soft-fail.
- `src/app/(site)/api/studio/publish/route.ts` — `POST` (render→upload→buffer→record) + `GET` (posted slots for today).
- `src/app/(site)/api/cron/studio-nudge/route.ts` — `GET` nudge email per slot.
- `supabase/migrations/20260629_studio_posts.sql` — `studio_posts` table.
- `scripts/test-studio-caption.ts`, `scripts/test-studio-buffer.ts`, `scripts/test-studio-posts.ts` — tsx smoke scripts.

**Modify:**
- `src/app/(site)/admin/studio/StudioClient.tsx` — per-slide caption box, approve button, posted-state, lock badge, `?slot=` deeplink.
- `vercel.json` — 4 `studio-nudge` cron entries.

---

## Task 1: Foundation — slot metadata, migration, posts storage

**Files:**
- Create: `src/lib/mariana/studio/slots.ts`
- Create: `supabase/migrations/20260629_studio_posts.sql`
- Create: `src/lib/mariana/studio/posts.ts`
- Create: `scripts/test-studio-posts.ts`

**Interfaces:**
- Consumes: `createSupabaseAdminClient` from `@/lib/supabase/admin`; `StudioDay` (not needed here).
- Produces:
  - `type StudioSlot = "slide1" | "slide2" | "slide3" | "slide4"`
  - `const STUDIO_SLOTS: { key: StudioSlot; label: string; time: string }[]`
  - `function isStudioSlot(v: string): v is StudioSlot`
  - `type PostedSlot = { posted_at: string; image_url: string; buffer_id: string | null }`
  - `async function getPostedSlots(forecastDate: string): Promise<Record<StudioSlot, PostedSlot | undefined>>`
  - `async function recordPost(rec: { forecastDate: string; slot: StudioSlot; status: "posted" | "failed"; bufferId: string | null; imageUrl: string; caption: string }): Promise<{ ok: boolean }>`
  - `async function uploadSlidePng(forecastDate: string, slot: StudioSlot, pngDataUrl: string): Promise<string | null>` (returns public URL or null)

- [ ] **Step 1: Create slot metadata**

`src/lib/mariana/studio/slots.ts`:
```ts
/** Mariana Studio — slot-metadata, gedeeld door client, caption-builder en nudge-cron. */
export type StudioSlot = "slide1" | "slide2" | "slide3" | "slide4";

export const STUDIO_SLOTS: { key: StudioSlot; label: string; time: string }[] = [
  { key: "slide1", label: "Dagverwachting", time: "08:00" },
  { key: "slide2", label: "Actueel", time: "14:00" },
  { key: "slide3", label: "Vandaag & Morgen", time: "20:00" },
  { key: "slide4", label: "Heads-up", time: "22:00" },
];

export function isStudioSlot(v: string): v is StudioSlot {
  return v === "slide1" || v === "slide2" || v === "slide3" || v === "slide4";
}
```

- [ ] **Step 2: Create the migration**

`supabase/migrations/20260629_studio_posts.sql` (mirrors the style of `20260625_mariana_studio.sql`):
```sql
-- Mariana Studio — TikTok-post log + dedupe-lock (1 rij per geslaagde slot-post per dag).
create table if not exists public.studio_posts (
  id uuid primary key default gen_random_uuid(),
  forecast_date date not null,
  slot text not null,                 -- slide1 | slide2 | slide3 | slide4
  status text not null,               -- posted | failed
  buffer_id text,
  image_url text,
  caption text,
  posted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Harde lock: max één GESLAAGDE post per (dag, slot). Mislukte pogingen mogen blijven.
create unique index if not exists studio_posts_posted_unique
  on public.studio_posts (forecast_date, slot)
  where status = 'posted';

create index if not exists studio_posts_date_idx on public.studio_posts (forecast_date desc);
```

- [ ] **Step 3: Create posts storage helper**

`src/lib/mariana/studio/posts.ts`:
```ts
/**
 * Mariana Studio — TikTok-post-log + PNG-upload.
 * Soft-fail zonder service-role (zoals storage.ts), zodat dev/build niet crasht.
 */
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { StudioSlot } from "./slots";

const TABLE = "studio_posts";
const BUCKET = "studio-posts";

function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminDb(): any {
  return createSupabaseAdminClient();
}

export type PostedSlot = { posted_at: string; image_url: string; buffer_id: string | null };

export async function getPostedSlots(
  forecastDate: string
): Promise<Record<StudioSlot, PostedSlot | undefined>> {
  const empty = {} as Record<StudioSlot, PostedSlot | undefined>;
  if (!hasServiceRole()) return empty;
  try {
    const { data } = await adminDb()
      .from(TABLE)
      .select("slot, posted_at, image_url, buffer_id")
      .eq("forecast_date", forecastDate)
      .eq("status", "posted");
    const out = { ...empty };
    for (const row of (data ?? []) as Array<{ slot: StudioSlot; posted_at: string; image_url: string; buffer_id: string | null }>) {
      out[row.slot] = { posted_at: row.posted_at, image_url: row.image_url, buffer_id: row.buffer_id };
    }
    return out;
  } catch {
    return empty;
  }
}

export async function recordPost(rec: {
  forecastDate: string;
  slot: StudioSlot;
  status: "posted" | "failed";
  bufferId: string | null;
  imageUrl: string;
  caption: string;
}): Promise<{ ok: boolean }> {
  if (!hasServiceRole()) return { ok: false };
  try {
    const { error } = await adminDb().from(TABLE).insert({
      forecast_date: rec.forecastDate,
      slot: rec.slot,
      status: rec.status,
      buffer_id: rec.bufferId,
      image_url: rec.imageUrl,
      caption: rec.caption,
    });
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

export async function uploadSlidePng(
  forecastDate: string,
  slot: StudioSlot,
  pngDataUrl: string
): Promise<string | null> {
  if (!hasServiceRole()) return null;
  try {
    const base64 = pngDataUrl.replace(/^data:image\/png;base64,/, "");
    const bytes = Buffer.from(base64, "base64");
    const path = `${forecastDate}/${slot}.png`;
    const db = adminDb();
    const { error } = await db.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: "image/png", upsert: true });
    if (error) return null;
    const { data } = db.storage.from(BUCKET).getPublicUrl(path);
    return data?.publicUrl ?? null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Write the soft-fail smoke script**

`scripts/test-studio-posts.ts`:
```ts
/* Verifieert de soft-fail-contracten van posts.ts zonder DB-creds. */
import { getPostedSlots, recordPost, uploadSlidePng } from "../src/lib/mariana/studio/posts";

function assert(cond: boolean, msg: string) {
  if (!cond) { console.error("FAIL:", msg); process.exit(1); }
  console.log("ok:", msg);
}

(async () => {
  delete process.env.SUPABASE_SERVICE_ROLE_KEY; // forceer "geen service role"
  const posted = await getPostedSlots("2026-06-29");
  assert(Object.keys(posted).length === 0, "getPostedSlots → leeg zonder service role");

  const rec = await recordPost({ forecastDate: "2026-06-29", slot: "slide1", status: "posted", bufferId: "x", imageUrl: "u", caption: "c" });
  assert(rec.ok === false, "recordPost → {ok:false} zonder service role");

  const url = await uploadSlidePng("2026-06-29", "slide1", "data:image/png;base64,AAAA");
  assert(url === null, "uploadSlidePng → null zonder service role");

  console.log("ALL PASS");
})();
```

- [ ] **Step 5: Run the smoke script (expect PASS) and typecheck**

Run: `npx tsx scripts/test-studio-posts.ts`
Expected: three `ok:` lines then `ALL PASS`.

Run: `npx tsc --noEmit`
Expected: no new errors referencing `slots.ts` / `posts.ts`. (Pre-existing repo errors elsewhere may remain — confirm none mention the new files.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/mariana/studio/slots.ts src/lib/mariana/studio/posts.ts supabase/migrations/20260629_studio_posts.sql scripts/test-studio-posts.ts
git commit -m "feat(studio): studio_posts schema + post-log/upload helpers (soft-fail)"
```

---

## Task 2: Caption builder

**Files:**
- Create: `src/lib/mariana/studio/caption.ts`
- Create: `scripts/test-studio-caption.ts`

**Interfaces:**
- Consumes: `StudioDay` from `./types`; `StudioSlot` from `./slots`.
- Produces: `function defaultCaption(day: StudioDay, slot: StudioSlot): string`

- [ ] **Step 1: Write the failing smoke script first**

`scripts/test-studio-caption.ts`:
```ts
import { defaultCaption } from "../src/lib/mariana/studio/caption";
import type { StudioDay } from "../src/lib/mariana/studio/types";

function assert(cond: boolean, msg: string) {
  if (!cond) { console.error("FAIL:", msg); process.exit(1); }
  console.log("ok:", msg);
}

const day: StudioDay = {
  forecastDate: "2026-06-29",
  runAt: "2026-06-29T03:30:00.000Z",
  slide1: { badge: "Maandag 29 juni · 08:00", titel: "Vandaag", intro: "Zonnig en warm.", regionTemps: { noord: 25, oost: 30, midden: 31, west: 29, zuid: 32 }, dayparts: { ochtend: 22, middag: 31, avond: 27, nacht: 19 }, metrics: { uvIndex: 7, hooikoorts: "Hoog", windBft: 3, fietsweer: "Goed" }, tagline: "x" },
  slide2: { badge: "Nu · 14:00", titel: "Actueel weer", subtitel: "Zo staat het er nu voor", regionTempsNow: null, warmstePlek: null },
  slide3: { badge: "Avond · 29 juni", titel: "Vandaag & Morgen", vandaag: { hoogste: { temp: 34, plaats: "Maastricht" }, laagste: { temp: 12, label: "vannacht" }, weerfeit: "Warm" }, morgen: { temp: 29, alinea: "Iets koeler morgen." } },
  slide4: { type: "onweer", badge: "Heads-up · vanavond", titel: "Onweer trekt binnen", intro: "Pas op voor onweer.", rijen: { wanneer: "20-23u", waar: "Zuidoosten", verwacht: "Felle buien" }, advies: "Blijf binnen." },
};

const HASH = "#weer #weerzone #weerbericht #nederland";

const c1 = defaultCaption(day, "slide1");
assert(c1.includes("Zonnig en warm.") && c1.endsWith(HASH), "slide1 bevat intro + eindigt op hashtags");

const c2 = defaultCaption(day, "slide2");
assert(c2.includes("Zo staat het er nu voor") && c2.endsWith(HASH), "slide2 bevat subtitel + hashtags");

const c3 = defaultCaption(day, "slide3");
assert(c3.includes("Iets koeler morgen.") && c3.endsWith(HASH), "slide3 bevat morgen-alinea + hashtags");

const c4 = defaultCaption(day, "slide4");
assert(c4.includes("Onweer trekt binnen") && c4.endsWith(HASH), "slide4 bevat titel + hashtags");

assert(!/KNMI|DWD|Mariana/i.test(c1 + c2 + c3 + c4), "geen bronnamen in captions");

console.log("ALL PASS");
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx tsx scripts/test-studio-caption.ts`
Expected: FAIL — `Cannot find module ... caption` (file not created yet).

- [ ] **Step 3: Implement the caption builder**

`src/lib/mariana/studio/caption.ts`:
```ts
/** Mariana Studio — standaard TikTok-caption per slide (bewerkbaar in de UI). */
import type { StudioDay } from "./types";
import type { StudioSlot } from "./slots";

const HASHTAGS = "#weer #weerzone #weerbericht #nederland";

export function defaultCaption(day: StudioDay, slot: StudioSlot): string {
  let body: string;
  switch (slot) {
    case "slide1":
      body = `Dagverwachting. ${day.slide1.intro}`;
      break;
    case "slide2":
      body = `Actueel weer — ${day.slide2.subtitel}.`;
      break;
    case "slide3":
      body = `Vandaag & morgen. ${day.slide3.morgen.alinea}`;
      break;
    case "slide4":
      body = day.slide4 ? `${day.slide4.titel}. ${day.slide4.intro}` : "Heads-up.";
      break;
  }
  return `${body.trim()}\n\n${HASHTAGS}`;
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `npx tsx scripts/test-studio-caption.ts`
Expected: five `ok:` lines then `ALL PASS`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/mariana/studio/caption.ts scripts/test-studio-caption.ts
git commit -m "feat(studio): default TikTok caption builder per slide"
```

---

## Task 3: Buffer API client

**Files:**
- Create: `src/lib/mariana/studio/buffer.ts`
- Create: `scripts/test-studio-buffer.ts`

**Interfaces:**
- Consumes: env `BUFFER_ACCESS_TOKEN`, `BUFFER_TIKTOK_PROFILE_ID`.
- Produces:
  - `type BufferResult = { ok: true; bufferId: string | null } | { ok: false; error: string }`
  - `async function postToTikTok(args: { imageUrl: string; caption: string; mode?: "now" | "draft"; fetchImpl?: typeof fetch }): Promise<BufferResult>`

**Note on the external unknown:** Buffer's classic API (`https://api.bufferapp.com/1/updates/create.json`) is the path we code to. Whether the token can publish a **photo** to a TikTok channel is verified manually in Task 6's deploy step. The `mode: "draft"` branch (sets `now=false`) is the documented fallback if direct publish is rejected — same client, one flag.

- [ ] **Step 1: Write the failing smoke script first**

`scripts/test-studio-buffer.ts`:
```ts
import { postToTikTok } from "../src/lib/mariana/studio/buffer";

function assert(cond: boolean, msg: string) {
  if (!cond) { console.error("FAIL:", msg); process.exit(1); }
  console.log("ok:", msg);
}

(async () => {
  process.env.BUFFER_ACCESS_TOKEN = "tok123";
  process.env.BUFFER_TIKTOK_PROFILE_ID = "prof456";

  let captured: { url: string; body: string; auth: string | null } | null = null;
  const fakeFetch = (async (url: any, init: any) => {
    captured = { url: String(url), body: String(init?.body ?? ""), auth: init?.headers?.Authorization ?? null };
    return { ok: true, status: 200, json: async () => ({ success: true, updates: [{ id: "upd789" }] }) } as any;
  }) as unknown as typeof fetch;

  const res = await postToTikTok({ imageUrl: "https://x/y.png", caption: "Hallo", mode: "now", fetchImpl: fakeFetch });
  assert(res.ok === true && (res as any).bufferId === "upd789", "succes → bufferId uit updates[0].id");
  assert(captured!.url.includes("api.bufferapp.com/1/updates/create.json"), "juiste endpoint");
  assert(captured!.body.includes("profile_ids%5B%5D=prof456"), "profile_ids[] form-encoded");
  assert(captured!.body.includes("text=Hallo"), "caption als text");
  assert(decodeURIComponent(captured!.body).includes("media[photo]=https://x/y.png"), "media[photo]=imageUrl");
  assert(captured!.body.includes("now=true"), "now=true bij mode now");

  // foutpad
  const errFetch = (async () => ({ ok: false, status: 403, json: async () => ({ success: false, message: "denied" }) } as any)) as unknown as typeof fetch;
  const res2 = await postToTikTok({ imageUrl: "u", caption: "c", fetchImpl: errFetch });
  assert(res2.ok === false && (res2 as any).error.includes("denied"), "HTTP-fout → {ok:false,error}");

  // ontbrekende env
  delete process.env.BUFFER_ACCESS_TOKEN;
  const res3 = await postToTikTok({ imageUrl: "u", caption: "c", fetchImpl: fakeFetch });
  assert(res3.ok === false, "ontbrekend token → {ok:false}");

  console.log("ALL PASS");
})();
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx tsx scripts/test-studio-buffer.ts`
Expected: FAIL — `Cannot find module ... buffer`.

- [ ] **Step 3: Implement the Buffer client**

`src/lib/mariana/studio/buffer.ts`:
```ts
/**
 * Mariana Studio — Buffer-client (classic API v1) om een foto naar het
 * TikTok-kanaal te publiceren. `fetchImpl` injecteerbaar voor tests.
 */
const ENDPOINT = "https://api.bufferapp.com/1/updates/create.json";

export type BufferResult = { ok: true; bufferId: string | null } | { ok: false; error: string };

export async function postToTikTok(args: {
  imageUrl: string;
  caption: string;
  mode?: "now" | "draft";
  fetchImpl?: typeof fetch;
}): Promise<BufferResult> {
  const token = process.env.BUFFER_ACCESS_TOKEN;
  const profileId = process.env.BUFFER_TIKTOK_PROFILE_ID;
  if (!token) return { ok: false, error: "BUFFER_ACCESS_TOKEN ontbreekt" };
  if (!profileId) return { ok: false, error: "BUFFER_TIKTOK_PROFILE_ID ontbreekt" };

  const f = args.fetchImpl ?? fetch;
  const params = new URLSearchParams();
  params.append("profile_ids[]", profileId);
  params.append("text", args.caption);
  params.append("media[photo]", args.imageUrl);
  params.append("media[thumbnail]", args.imageUrl);
  params.append("now", args.mode === "draft" ? "false" : "true");

  try {
    const resp = await f(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const json: any = await resp.json().catch(() => ({}));
    if (!resp.ok || json?.success === false) {
      return { ok: false, error: json?.message || `Buffer HTTP ${resp.status}` };
    }
    const bufferId: string | null = json?.updates?.[0]?.id ?? null;
    return { ok: true, bufferId };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `npx tsx scripts/test-studio-buffer.ts`
Expected: all `ok:` lines then `ALL PASS`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/mariana/studio/buffer.ts scripts/test-studio-buffer.ts
git commit -m "feat(studio): Buffer API client for TikTok photo publish"
```

---

## Task 4: Publish endpoint

**Files:**
- Create: `src/app/(site)/api/studio/publish/route.ts`

**Interfaces:**
- Consumes: `studioAccessOk` from `@/lib/mariana/studio/gate`; `loadLatestStudioDay` from `@/lib/mariana/studio/storage`; `getPostedSlots`, `recordPost`, `uploadSlidePng` from `@/lib/mariana/studio/posts`; `postToTikTok` from `@/lib/mariana/studio/buffer`; `isStudioSlot` from `@/lib/mariana/studio/slots`.
- Produces:
  - `GET /api/studio/publish` → `{ forecastDate: string | null, posted: Record<StudioSlot, PostedSlot|undefined> }`
  - `POST /api/studio/publish` body `{ slot, pngDataUrl, caption }` → `{ ok: true, postedAt }` | error JSON.

- [ ] **Step 1: Implement the route**

`src/app/(site)/api/studio/publish/route.ts`:
```ts
import { NextResponse } from "next/server";
import { studioAccessOk } from "@/lib/mariana/studio/gate";
import { loadLatestStudioDay } from "@/lib/mariana/studio/storage";
import { getPostedSlots, recordPost, uploadSlidePng } from "@/lib/mariana/studio/posts";
import { postToTikTok } from "@/lib/mariana/studio/buffer";
import { isStudioSlot } from "@/lib/mariana/studio/slots";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!(await studioAccessOk(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const day = await loadLatestStudioDay();
  const forecastDate = day?.forecastDate ?? null;
  const posted = forecastDate ? await getPostedSlots(forecastDate) : {};
  return NextResponse.json({ forecastDate, posted });
}

export async function POST(req: Request) {
  if (!(await studioAccessOk(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { slot?: string; pngDataUrl?: string; caption?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige body" }, { status: 400 });
  }
  const { slot, pngDataUrl, caption } = body;
  if (!slot || !isStudioSlot(slot)) return NextResponse.json({ error: "Onbekend slot" }, { status: 400 });
  if (!pngDataUrl || !pngDataUrl.startsWith("data:image/png;base64,")) return NextResponse.json({ error: "Geen PNG" }, { status: 400 });
  if (!caption || !caption.trim()) return NextResponse.json({ error: "Geen caption" }, { status: 400 });

  const day = await loadLatestStudioDay();
  if (!day) return NextResponse.json({ error: "Geen Studio-dag opgeslagen" }, { status: 409 });
  const forecastDate = day.forecastDate;

  // Lock: al geplaatst vandaag?
  const posted = await getPostedSlots(forecastDate);
  if (posted[slot]) return NextResponse.json({ error: "Al geplaatst", postedAt: posted[slot]!.posted_at }, { status: 409 });

  // Upload PNG → publieke URL
  const imageUrl = await uploadSlidePng(forecastDate, slot, pngDataUrl);
  if (!imageUrl) return NextResponse.json({ error: "Upload mislukt (service-role/bucket?)" }, { status: 500 });

  // Publiceer via Buffer
  const result = await postToTikTok({ imageUrl, caption });
  if (!result.ok) {
    await recordPost({ forecastDate, slot, status: "failed", bufferId: null, imageUrl, caption });
    return NextResponse.json({ error: `Buffer: ${result.error}` }, { status: 502 });
  }

  const rec = await recordPost({ forecastDate, slot, status: "posted", bufferId: result.bufferId, imageUrl, caption });
  if (!rec.ok) {
    // Post is geplaatst maar lock niet geschreven — meld het zodat de UI niet stilletjes dubbelpost.
    return NextResponse.json({ ok: true, postedAt: new Date().toISOString(), warning: "Geplaatst, maar log niet opgeslagen" });
  }
  return NextResponse.json({ ok: true, postedAt: new Date().toISOString() });
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors referencing `api/studio/publish/route.ts`.

- [ ] **Step 3: Manual route check (dev, auth open locally)**

`gate.ts` returns `true` when `NODE_ENV !== "production"`, so local calls are unauthenticated by design.

Run (in one terminal): `npm run dev`
Run (in another):
```bash
curl -s -X POST http://localhost:3000/api/studio/publish -H "Content-Type: application/json" -d '{"slot":"bogus","pngDataUrl":"x","caption":"y"}'
```
Expected: `{"error":"Onbekend slot"}` (HTTP 400).

```bash
curl -s -X POST http://localhost:3000/api/studio/publish -H "Content-Type: application/json" -d '{"slot":"slide1","pngDataUrl":"data:image/png;base64,AAAA","caption":"hi"}'
```
Expected (no service-role locally): `{"error":"Geen Studio-dag opgeslagen"}` (409) — confirms validation passes and it fails safely before any Buffer call.

```bash
curl -s http://localhost:3000/api/studio/publish
```
Expected: `{"forecastDate":null,"posted":{}}`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(site)/api/studio/publish/route.ts"
git commit -m "feat(studio): /api/studio/publish — upload+Buffer publish with per-slot lock"
```

---

## Task 5: Nudge cron + vercel.json

**Files:**
- Create: `src/app/(site)/api/cron/studio-nudge/route.ts`
- Modify: `vercel.json`

**Interfaces:**
- Consumes: `loadLatestStudioDay` from `@/lib/mariana/studio/storage`; `isStudioSlot`, `STUDIO_SLOTS` from `@/lib/mariana/studio/slots`; `Resend` from `resend`.
- Produces: `GET /api/cron/studio-nudge?slot=slideN` → `{ sent: boolean, skipped?: boolean }`.

- [ ] **Step 1: Implement the nudge route**

`src/app/(site)/api/cron/studio-nudge/route.ts`:
```ts
/**
 * STUDIO NUDGE — mailt de eigenaar ~15 min vóór een slot met een deeplink naar
 * /admin/studio?slot=slideN om te reviewen en goed te keuren. Geen post zonder mens.
 * Crons in vercel.json (UTC = CEST−2 in de zomer).
 */
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { loadLatestStudioDay } from "@/lib/mariana/studio/storage";
import { isStudioSlot, STUDIO_SLOTS } from "@/lib/mariana/studio/slots";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slot = new URL(req.url).searchParams.get("slot") ?? "";
  if (!isStudioSlot(slot)) return NextResponse.json({ error: "Onbekend slot" }, { status: 400 });

  const meta = STUDIO_SLOTS.find((s) => s.key === slot)!;
  const day = await loadLatestStudioDay();

  // Slide 4 alleen nudgen als er vandaag een heads-up is.
  if (slot === "slide4" && !day?.slide4) {
    return NextResponse.json({ sent: false, skipped: true, reason: "geen heads-up" });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ error: "RESEND_API_KEY missing" }, { status: 500 });
  const resend = new Resend(resendKey);

  const link = `https://weerzone.nl/admin/studio?slot=${slot}`;
  const html = `<!DOCTYPE html><html lang="nl"><body style="margin:0;background:#0c1838;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
    <div style="max-width:480px;margin:0 auto;padding:40px 24px;color:#fff;text-align:center;">
      <p style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#ffd21a;font-weight:800;margin:0 0 8px;">Weerzone Studio</p>
      <h1 style="font-size:26px;margin:0 0 8px;">Slot van ${meta.time} klaar om te reviewen</h1>
      <p style="font-size:15px;color:rgba(255,255,255,.78);line-height:1.5;margin:0 0 28px;">${meta.label} — open Studio, controleer de slide en zet het vinkje om naar TikTok te plaatsen.</p>
      <a href="${link}" style="display:inline-block;padding:16px 36px;background:#ffd21a;color:#0a111e;font-weight:800;font-size:15px;border-radius:14px;text-decoration:none;">Review ${meta.label} →</a>
    </div></body></html>`;

  try {
    const { error } = await resend.emails.send({
      from: "Weerzone Studio <mariana@weerzone.nl>",
      to: "info@weerzone.nl",
      subject: `Studio ${meta.time} · ${meta.label} klaar om te plaatsen`,
      html,
    });
    if (error) return NextResponse.json({ sent: false, error: error.message }, { status: 502 });
  } catch (e) {
    return NextResponse.json({ sent: false, error: (e as Error).message }, { status: 502 });
  }
  return NextResponse.json({ sent: true, slot });
}
```

- [ ] **Step 2: Register the crons in `vercel.json`**

Add these four objects to the `crons` array (UTC; June/CEST = UTC+2, so 15 min before each slot). Note the DST caveat: in winter (CET) these fire one hour earlier in local time — acceptable, the nudge is just a reminder.
```json
    {
      "path": "/api/cron/studio-nudge?slot=slide1",
      "schedule": "45 5 * * *"
    },
    {
      "path": "/api/cron/studio-nudge?slot=slide2",
      "schedule": "45 11 * * *"
    },
    {
      "path": "/api/cron/studio-nudge?slot=slide3",
      "schedule": "45 17 * * *"
    },
    {
      "path": "/api/cron/studio-nudge?slot=slide4",
      "schedule": "45 19 * * *"
    }
```

- [ ] **Step 3: Validate JSON + typecheck**

Run: `npx tsc --noEmit` (no errors referencing `studio-nudge/route.ts`)
Run: `node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8')); console.log('vercel.json OK')"`
Expected: `vercel.json OK`.

- [ ] **Step 4: Manual route check (dev)**

With `npm run dev` running:
```bash
curl -s "http://localhost:3000/api/cron/studio-nudge?slot=bogus"
```
Expected: `{"error":"Onbekend slot"}` (400).
```bash
curl -s "http://localhost:3000/api/cron/studio-nudge?slot=slide4"
```
Expected (no Studio day locally): `{"sent":false,"skipped":true,"reason":"geen heads-up"}`.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(site)/api/cron/studio-nudge/route.ts" vercel.json
git commit -m "feat(studio): per-slot nudge email cron + vercel.json registration"
```

---

## Task 6: Studio UI — caption box, approve gate, lock badge, deeplink

**Files:**
- Modify: `src/app/(site)/admin/studio/StudioClient.tsx`

**Interfaces:**
- Consumes: `defaultCaption` from `@/lib/mariana/studio/caption`; `StudioSlot`, `STUDIO_SLOTS` from `@/lib/mariana/studio/slots`; `GET`/`POST /api/studio/publish`.
- Produces: UI only.

**Context:** The current file renders 4 slides each inside `<div className="slot">…<div className="scaler"><div className="slide" id="slideN">…</div></div></div>`. The export logic (`exportSlide`/`toPng`) already produces the PNG for an `id`. We add an actions row under each slide's `.scaler`.

- [ ] **Step 1: Add imports and state**

At the top of `StudioClient.tsx`, add to the existing imports:
```tsx
import { defaultCaption } from "@/lib/mariana/studio/caption";
import { STUDIO_SLOTS, type StudioSlot } from "@/lib/mariana/studio/slots";
```
Inside the component, after the existing `const [busy, setBusy] = useState(false);`, add:
```tsx
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [posted, setPosted] = useState<Record<string, { posted_at: string } | undefined>>({});
  const [postingSlot, setPostingSlot] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
```

- [ ] **Step 2: Load posted-state, pre-fill captions, handle `?slot=` deeplink**

Replace the existing `useEffect(() => { … }, [unlockKey]);` block with:
```tsx
  useEffect(() => {
    if (unlockKey) document.cookie = `studio_key=${unlockKey}; path=/; max-age=86400`;
    fetch("/api/studio/today").then((r) => r.json()).then((d) => setDay(d.day ?? null)).catch(() => {});
    fetch("/api/studio/live").then((r) => r.json()).then(setLive).catch(() => {});
    fetch("/api/studio/publish").then((r) => r.json()).then((d) => setPosted(d.posted ?? {})).catch(() => {});
  }, [unlockKey]);

  // Pre-fill captions zodra de Studio-dag binnen is (alleen lege velden).
  useEffect(() => {
    if (!day) return;
    setCaptions((prev) => {
      const next = { ...prev };
      for (const { key } of STUDIO_SLOTS) {
        if (next[key] === undefined && (key !== "slide4" || day.slide4)) {
          next[key] = defaultCaption(day, key as StudioSlot);
        }
      }
      return next;
    });
  }, [day]);

  // Deeplink ?slot=slideN → scroll naar de kaart.
  useEffect(() => {
    const slot = new URLSearchParams(window.location.search).get("slot");
    if (slot && day) {
      const el = document.getElementById(`slot-${slot}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [day]);
```

- [ ] **Step 3: Add the approve/publish handler**

Add this function inside the component (next to `download`):
```tsx
  async function approveAndPost(slot: StudioSlot, slideId: string) {
    setPostError(null);
    setPostingSlot(slot);
    try {
      const node = document.getElementById(slideId);
      if (!node) throw new Error("slide niet gevonden");
      const pngDataUrl = await toPng(node, { width: 1080, height: 1920, pixelRatio: 2, cacheBust: true, style: { transform: "none" } });
      const resp = await fetch("/api/studio/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot, pngDataUrl, caption: captions[slot] ?? "" }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? `HTTP ${resp.status}`);
      setPosted((p) => ({ ...p, [slot]: { posted_at: json.postedAt } }));
    } catch (e) {
      setPostError(`${slot}: ${(e as Error).message}`);
    } finally {
      setPostingSlot(null);
    }
  }
```

- [ ] **Step 4: Add a reusable actions component**

Add this component in the same file, above `export default function StudioClient`:
```tsx
function SlideActions({
  slot, slideId, caption, onCaption, posted, posting, onApprove,
}: {
  slot: StudioSlot; slideId: string; caption: string;
  onCaption: (v: string) => void; posted?: { posted_at: string };
  posting: boolean; onApprove: () => void;
}) {
  const time = posted ? new Date(posted.posted_at).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }) : null;
  return (
    <div style={{ width: "min(420px, 90vw)", display: "flex", flexDirection: "column", gap: 12 }}>
      <textarea
        value={caption}
        onChange={(e) => onCaption(e.target.value)}
        disabled={Boolean(posted)}
        rows={4}
        placeholder="TikTok-caption…"
        style={{ width: "100%", resize: "vertical", borderRadius: 12, border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.06)", color: "#fff", fontSize: 14, lineHeight: 1.5, padding: "12px 14px", fontFamily: "inherit" }}
      />
      {posted ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px 18px", borderRadius: 999, background: "rgba(46,204,113,.16)", border: "1px solid rgba(46,204,113,.5)", color: "#7Cf5a8", fontWeight: 800, fontSize: 14 }}>
          ✓ Geplaatst om {time}
        </div>
      ) : (
        <button
          onClick={onApprove}
          disabled={posting || !caption.trim()}
          style={{ padding: "14px 18px", borderRadius: 999, border: "none", cursor: posting ? "wait" : "pointer", fontWeight: 800, fontSize: 15, background: "#ffd21a", color: "#0a111e", opacity: posting || !caption.trim() ? 0.55 : 1 }}
        >
          {posting ? "Bezig met plaatsen…" : "✓ Bekeken & akkoord — plaats op TikTok"}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Add an `id` to each slot wrapper and render the actions**

For each of the four `<div className="slot">` wrappers, add an id matching the slot key and place `<SlideActions/>` after the `.scaler` div. Example for slide 1 — change:
```tsx
        <div className="slot">
          <div className="cap">08:00 — Dagverwachting</div>
          <div className="scaler">
            <div className="slide" id="slide1">
```
to:
```tsx
        <div className="slot" id="slot-slide1">
          <div className="cap">08:00 — Dagverwachting</div>
          <div className="scaler">
            <div className="slide" id="slide1">
```
and, immediately before that slot's closing `</div>` (the one closing `className="slot"`), insert:
```tsx
            <SlideActions
              slot="slide1" slideId="slide1"
              caption={captions.slide1 ?? ""} onCaption={(v) => setCaptions((c) => ({ ...c, slide1: v }))}
              posted={posted.slide1} posting={postingSlot === "slide1"}
              onApprove={() => approveAndPost("slide1", "slide1")}
            />
```
Repeat for `slot-slide2`/`slide2`, `slot-slide3`/`slide3`, and (inside the existing `{s4 ? (…) : null}` block) `slot-slide4`/`slide4`. Use the matching caption/posted/slot keys for each.

- [ ] **Step 6: Surface post errors in the toolbar**

In the `.bar` toolbar JSX, after the existing `<span className="hint">…</span>`, add:
```tsx
        {postError ? <span style={{ color: "#ff8a80", fontSize: 13, fontWeight: 700, flexBasis: "100%" }}>⚠ {postError}</span> : null}
```

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors referencing `StudioClient.tsx`.

- [ ] **Step 8: Manual visual check**

With `npm run dev` running, open `http://localhost:3000/admin/studio`.
Expected: under each slide, a caption textarea (pre-filled once a Studio day exists; empty locally is fine) and a yellow "✓ Bekeken & akkoord — plaats op TikTok" button. Open `http://localhost:3000/admin/studio?slot=slide3` → page scrolls to the slide 3 card. Clicking approve locally returns the "Geen Studio-dag opgeslagen" path → shows `⚠ slideN: Geen Studio-dag opgeslagen` in the toolbar (proves the wiring; real posting needs prod data + secrets).

- [ ] **Step 9: Commit**

```bash
git add "src/app/(site)/admin/studio/StudioClient.tsx"
git commit -m "feat(studio): per-slide caption + approve-to-TikTok gate with lock badge"
```

---

## Manual deploy / verification steps (owner — after all tasks)

These are **not** code tasks; they gate go-live and require the owner (per memory `feedback_prod_db_migrations`, `feedback_vercel_promote_required`, `feedback_cli_deploy_dirty_tree`).

1. **Run the migration** `supabase/migrations/20260629_studio_posts.sql` in the Supabase SQL editor.
2. **Create the Storage bucket** `studio-posts` in Supabase, set to **public**.
3. **Set Vercel prod env**: `BUFFER_ACCESS_TOKEN`, `BUFFER_TIKTOK_PROFILE_ID` (also confirm `RESEND_API_KEY`, `CRON_SECRET`, `STUDIO_SECRET` exist).
4. **Verify Buffer + TikTok photo publish** (the one external unknown): from the deployed app, approve one slide and confirm it lands on TikTok. If Buffer rejects the photo post (reminder-only tier / TikTok publish approval), switch `postToTikTok`'s default to `mode: "draft"` in `publish/route.ts` (one-line change) so it queues a Buffer draft the owner taps to publish — then redeploy.
5. **Deploy from a clean tree** (`git archive HEAD` → temp dir) and **promote** to weerzone.nl; verify a nudge cron fires (check Vercel cron logs) and `/api/studio/publish` GET returns the day.

---

## Self-Review

- **Spec coverage:** browser-render (Task 6) ✓; nudge email per slot (Task 5) ✓; tick-to-publish flow (Tasks 3,4,6) ✓; editable pre-filled caption (Tasks 2,6) ✓; Supabase Storage public URL + Buffer now-publish (Tasks 1,3,4) ✓; `studio_posts` lock + audit (Tasks 1,4) ✓; secrets/bucket/migration manual steps ✓; human-gated + idempotency + failure-surfacing safety (Task 4 + Task 6 toolbar) ✓; build-time Buffer/TikTok verification + draft fallback (Task 3 note + deploy step 4) ✓.
- **Placeholder scan:** no TBD/TODO; every code step has complete code.
- **Type consistency:** `StudioSlot`, `getPostedSlots`/`recordPost`/`uploadSlidePng`, `postToTikTok`→`{ok,bufferId|error}`, `defaultCaption(day,slot)`, `isStudioSlot`, `STUDIO_SLOTS` names match across Tasks 1–6. Publish route GET shape `{forecastDate,posted}` matches the UI loader in Task 6 Step 2.
