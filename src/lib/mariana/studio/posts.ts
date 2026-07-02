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
  png: Blob
): Promise<string | null> {
  if (!hasServiceRole()) return null;
  try {
    const path = `${forecastDate}/${slot}.png`;
    const db = adminDb();
    const { error } = await db.storage
      .from(BUCKET)
      .upload(path, png, { contentType: "image/png", upsert: true });
    if (error) return null;
    // Publiek via weerzone.nl (proxy-route), niet de rauwe *.supabase.co-URL:
    // TikTok's PULL_FROM_URL vereist een bron-domein dat bij Buffer's TikTok-app
    // geverifieerd is — dat is weerzone.nl (bewezen door een oudere, wél werkende
    // Buffer-pipeline), *.supabase.co niet.
    const base = process.env.NEXT_PUBLIC_BASE_URL || "https://weerzone.nl";
    return `${base}/api/studio/image?date=${forecastDate}&slot=${slot}`;
  } catch {
    return null;
  }
}
