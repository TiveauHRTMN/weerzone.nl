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
