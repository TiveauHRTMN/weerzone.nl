/**
 * Mariana Studio — lichte secret-gate. /admin is niet afgeschermd; deze gate
 * beschermt de Studio-pagina + endpoints met een cookie tegen STUDIO_SECRET.
 * Lokaal (dev) altijd open.
 */

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
