/**
 * Mariana Studio — toegang. Twee paden:
 *  1) secret-gate via STUDIO_SECRET (?key=… of cookie) — voor automatisering;
 *  2) founder-sessie — eigenaren zien Studio gewoon op hun ingelogde account.
 * Lokaal (dev) altijd open.
 */

import { isFounderEmail } from "@/lib/founders";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const STUDIO_COOKIE = "studio_key";

export function studioGateOk(req: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.STUDIO_SECRET;
  if (!secret) return false; // dichtgetimmerd als er geen secret gezet is
  const url = new URL(req.url);
  if (url.searchParams.get("key") === secret) return true;
  const cookie = req.headers.get("cookie") ?? "";
  return cookie.split(";").some((c) => c.trim() === `${STUDIO_COOKIE}=${secret}`);
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
