import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getContactConfirmationHtml } from "@/lib/contact-email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!email || !message || message.length < 5) {
      return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Mail not configured" }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const safeName = String(name || "Onbekend").slice(0, 100);
    const safeEmail = String(email).slice(0, 200);
    const safeMsg = String(message).slice(0, 5000);

    // 1. Stuur mail naar info@weerzone.nl (interne melding)
    await resend.emails.send({
      from: "WEERZONE Contact <info@weerzone.nl>",
      to: "info@weerzone.nl",
      replyTo: safeEmail,
      subject: `Contact via weerzone.nl — ${safeName}`,
      text: `Van: ${safeName} <${safeEmail}>\n\n${safeMsg}`,
    });

    // 2. Stuur automatische bevestiging naar de gebruiker
    try {
      await resend.emails.send({
        from: "WEERZONE <info@weerzone.nl>",
        to: safeEmail,
        subject: "Bedankt voor je bericht — WEERZONE",
        html: getContactConfirmationHtml(safeName),
      });
    } catch (autoReplyError) {
      // Als de auto-reply faalt, willen we niet de hele route laten crashen, 
      // zolang de interne mail maar verstuurd is.
      console.error("Auto-reply error:", autoReplyError);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("contact route error", e);
    return NextResponse.json({ ok: false, error: "server error" }, { status: 500 });
  }
}
