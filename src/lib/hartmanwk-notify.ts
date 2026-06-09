import { Resend } from "resend";

// Hartman WK 2026 — eigenaar-notificaties (bv. nieuwe deelnemer).
// Stuurt naar HARTMANWK_NOTIFY_EMAIL (val terug op Rowan's adres). Stil als
// RESEND_API_KEY ontbreekt — een notificatie mag een aanmelding nooit blokkeren.

const FROM = "Hartman WK 2026 <info@weerzone.nl>";
const DEFAULT_TO = "info@weerzone.nl";

export async function notifyHartmanWkOwner(subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const to = process.env.HARTMANWK_NOTIFY_EMAIL || DEFAULT_TO;
  try {
    await new Resend(apiKey).emails.send({ from: FROM, to, subject, html });
  } catch (error) {
    console.error("Hartman WK notify error:", error);
  }
}
