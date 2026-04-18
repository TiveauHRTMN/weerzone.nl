import { NextResponse } from "next/server";
import { Resend } from "resend";

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

    await resend.emails.send({
      from: "WEERZONE Contact <info@weerzone.nl>",
      to: "info@weerzone.nl",
      replyTo: safeEmail,
      subject: `Contact via weerzone.nl — ${safeName}`,
      text: `Van: ${safeName} <${safeEmail}>\n\n${safeMsg}`,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("contact route error", e);
    return NextResponse.json({ ok: false, error: "server error" }, { status: 500 });
  }
}
