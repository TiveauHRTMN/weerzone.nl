import { NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

// Test endpoint: GET /api/test-email?to=je@email.nl
// Stuurt een test-email om te verifiëren dat Resend werkt
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const to = searchParams.get("to");

  if (!to) {
    return NextResponse.json({
      error: "Gebruik: /api/test-email?to=je@email.nl",
      env: {
        RESEND_API_KEY: process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.slice(0, 8)}...` : "NIET INGESTELD",
      },
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      error: "RESEND_API_KEY niet gevonden in environment variables",
      fix: "Ga naar Vercel → Settings → Environment Variables → voeg RESEND_API_KEY toe",
    }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  try {
    // Probeer eerst met eigen domein
    const { data, error } = await resend.emails.send({
      from: "WeerZone <info@weerzone.nl>",
      to,
      subject: "WeerZone Test E-mail ✅",
      html: `
        <div style="font-family:system-ui;padding:40px;max-width:480px;margin:0 auto;background:#4a9ee8;border-radius:18px;">
          <div style="background:white;border-radius:18px;padding:32px;text-align:center;">
            <h1 style="color:#1e293b;margin:0 0 16px;">✅ Resend werkt!</h1>
            <p style="color:#475569;font-size:16px;line-height:1.6;">
              Dit is een test-email van WeerZone.nl via Resend.
            </p>
            <p style="color:#94a3b8;font-size:12px;margin-top:24px;">
              Verstuurd op: ${new Date().toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" })}
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      // Als eigen domein faalt, probeer met Resend's standaard domein
      if (error.message?.includes("not verified") || error.message?.includes("domain")) {
        const fallback = await resend.emails.send({
          from: "WeerZone <onboarding@resend.dev>",
          to,
          subject: "WeerZone Test (via resend.dev) ✅",
          html: `
            <div style="font-family:system-ui;padding:40px;text-align:center;">
              <h1>⚠️ Domein niet geverifieerd</h1>
              <p>De email is verstuurd via resend.dev omdat weerzone.nl nog niet geverifieerd is in Resend.</p>
              <p><strong>Fix:</strong> Ga naar <a href="https://resend.com/domains">resend.com/domains</a> en voeg weerzone.nl toe.</p>
            </div>
          `,
        });

        return NextResponse.json({
          warning: "Domein weerzone.nl niet geverifieerd in Resend!",
          fallback_sent: !fallback.error,
          fallback_error: fallback.error,
          fix: [
            "1. Ga naar https://resend.com/domains",
            "2. Klik 'Add domain' → voer 'weerzone.nl' in",
            "3. Voeg de DNS records (DKIM, SPF, DMARC) toe in je Google Workspace DNS",
            "4. Wacht tot verificatie groen is (meestal 5-30 min)",
          ],
          original_error: error,
        });
      }

      return NextResponse.json({ error: error.message, raw: error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Test-email verstuurd naar ${to}`,
      id: data?.id,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
