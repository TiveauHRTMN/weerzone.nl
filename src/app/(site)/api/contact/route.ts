import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getContactConfirmationHtml } from "@/lib/contact-email";

export const runtime = "nodejs";

const VALID_TOPICS = new Set(["vraag", "partnership", "pers", "technisch", "anders"]);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      message,
      // Nieuwe velden uit Weerzone v2 ContactForm (fase 4). topic/subject
      // zijn optional zodat een cached oude client niet meteen breekt.
      topic,
      topicLabel,
      subject,
    } = body as {
      name?: string;
      email?: string;
      message?: string;
      topic?: string;
      topicLabel?: string;
      subject?: string;
    };

    if (!email || !message || message.length < 5) {
      return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Mail not configured" }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const safeName    = String(name || "Onbekend").slice(0, 100);
    const safeEmail   = String(email).slice(0, 200);
    const safeMsg     = String(message).slice(0, 5000);
    const safeSubject = subject ? String(subject).slice(0, 200).trim() : "";
    const safeTopic   = topic && VALID_TOPICS.has(topic) ? topic : "";
    const safeTopicLabel =
      topicLabel && safeTopic ? String(topicLabel).slice(0, 50) : "";

    // Email subject: prefix met topic-label + onderwerp als beide aanwezig.
    // Anders fallback op de oude "Contact via weerzone.nl - <naam>" vorm.
    const subjectPrefix = safeTopicLabel ? `[${safeTopicLabel}] ` : "";
    const subjectTitle  = safeSubject || `Contact via weerzone.nl`;
    const mailSubject   = `${subjectPrefix}${subjectTitle} - ${safeName}`;

    const intro = safeTopicLabel
      ? `Type bericht: ${safeTopicLabel}${safeSubject ? `\nOnderwerp: ${safeSubject}` : ""}\n\n`
      : "";

    await resend.emails.send({
      from: "WEERZONE Contact <info@weerzone.nl>",
      to: "info@weerzone.nl",
      replyTo: safeEmail,
      subject: mailSubject,
      text: `Van: ${safeName} <${safeEmail}>\n${intro}${safeMsg}`,
    });

    try {
      await resend.emails.send({
        from: "WEERZONE <info@weerzone.nl>",
        to: safeEmail,
        subject: "Bedankt voor je bericht — WEERZONE",
        html: getContactConfirmationHtml(safeName),
      });
    } catch (autoReplyError) {
      console.error("Auto-reply error:", autoReplyError);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("contact route error", e);
    return NextResponse.json({ ok: false, error: "server error" }, { status: 500 });
  }
}
