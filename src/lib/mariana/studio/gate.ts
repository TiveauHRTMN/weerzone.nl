/**
 * Mariana Studio — toegang. Twee paden:
 *  1) secret-gate via STUDIO_SECRET (?key=… of cookie) — voor automatisering;
 *  2) founder-sessie — eigenaren zien Studio gewoon op hun ingelogde account.
 * Lokaal (dev) altijd open.
 */

import { timingSafeEqual } from "crypto";
import { isFounderEmail } from "@/lib/founders";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const STUDIO_COOKIE = "studio_key";

function secretsMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function studioGateOk(req: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.STUDIO_SECRET;
  if (!secret) return false; // dichtgetimmerd als er geen secret gezet is
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (key && secretsMatch(key, secret)) return true;
  const cookie = req.headers.get("cookie") ?? "";
  const cookieValue = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${STUDIO_COOKIE}=`))
    ?.slice(STUDIO_COOKIE.length + 1);
  return cookieValue ? secretsMatch(cookieValue, secret) : false;
}

/**
 * Volledige toegangscheck: secret-gate OF ingelogde founder.
 * Founders hoeven dus geen ?key= mee te slepen — sessie-gebaseerd, blijft
 * werken bij navigeren binnen de app.
 */
export async function studioAccessOk(req: Request): Promise<boolean> {
  if (studioGateOk(req)) return true;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    return isFounderEmail(data.user?.email);
  } catch {
    return false;
  }
}
