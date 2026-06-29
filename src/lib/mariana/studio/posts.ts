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
