import "server-only";

import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Web push (Reed, blok b van de agents-handoff). VAPID-sleutels in env:
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY (ook client-side), VAPID_PRIVATE_KEY,
 * VAPID_SUBJECT. Apparaat-registraties staan in push_devices; het abonnement
 * (agent + plaats) in agent_subscriptions met channel='push'.
 */

export const PUSH_DEVICES_TABLE = "push_devices";

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  /** Notificaties met dezelfde tag vervangen elkaar op het apparaat. */
  tag?: string;
}

export interface PushDevice {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

let vapidConfigured = false;

export function pushConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function ensureVapid(): boolean {
  if (!pushConfigured()) return false;
  if (!vapidConfigured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:info@weerzone.nl",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );
    vapidConfigured = true;
  }
  return true;
}

/** Actieve apparaten per gebruiker, voor een set user-ids. */
export async function activePushDevices(
  admin: SupabaseClient,
  userIds: string[],
): Promise<Map<string, PushDevice[]>> {
  const byUser = new Map<string, PushDevice[]>();
  if (!userIds.length) return byUser;
  const { data, error } = await admin
    .from(PUSH_DEVICES_TABLE)
    .select("id, user_id, endpoint, p256dh, auth")
    .in("user_id", userIds)
    .is("disabled_at", null);
  if (error) {
    console.error("[push] push_devices niet leesbaar:", error.message);
    return byUser;
  }
  for (const device of (data ?? []) as PushDevice[]) {
    if (!byUser.has(device.user_id)) byUser.set(device.user_id, []);
    byUser.get(device.user_id)!.push(device);
  }
  return byUser;
}

/**
 * Stuur één notificatie naar één apparaat. Bij 404/410 (abonnement vervallen)
 * wordt het apparaat uitgezet zodat we het niet blijven proberen.
 */
export async function sendPushToDevice(
  admin: SupabaseClient,
  device: PushDevice,
  payload: PushPayload,
): Promise<{ ok: boolean; gone?: boolean; reason?: string }> {
  if (!ensureVapid()) return { ok: false, reason: "VAPID-sleutels ontbreken" };
  try {
    await webpush.sendNotification(
      { endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } },
      JSON.stringify(payload),
      { TTL: 3 * 3600 }, // een weeralarm van >3 uur oud hoeft niet meer bezorgd
    );
    return { ok: true };
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      await admin
        .from(PUSH_DEVICES_TABLE)
        .update({ disabled_at: new Date().toISOString() })
        .eq("id", device.id);
      return { ok: false, gone: true };
    }
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}
