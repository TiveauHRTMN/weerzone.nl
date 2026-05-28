import type { PersonaTier } from "@/lib/personas";

/**
 * Founder-bypass: eigenaren/architects die altijd de hoogste tier
 * krijgen, ongeacht of er een agent-toegang in de DB staat.
 *
 * Eén bron van waarheid — gebruikt door:
 * - lib/session-context (client-side tier)
 * - app/app/page (server-rendered dashboard)
 * - andere server-routes waar een tier-check nodig is
 */
export const FOUNDER_EMAILS: ReadonlySet<string> = new Set([
  "rwnhrtmn@gmail.com",
  "iamrowanonl@gmail.com",
  "info@weerzone.nl",
]);

export const FOUNDER_TIER: PersonaTier = "steve";

export function isFounderEmail(email: string | null | undefined): boolean {
  return !!email && FOUNDER_EMAILS.has(email.toLowerCase());
}
